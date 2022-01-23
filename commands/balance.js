const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { DateTime, Interval } = require('luxon');
const QuickChart = require('quickchart-js');
const axios = require('axios').default;
const { query } = require('../db');

const getRoninData = async (roninAddress) => {
  try {
    const { data } = await axios.get(`https://game-api.axie.technology/api/v1/${roninAddress}`);
    return data;
  } catch (error) {
    console.error(error);
  }
};

const formatDate = (unixDate) => {
  const date = DateTime.fromSeconds(unixDate);
  const ISODate = date.toISODate();
  return ISODate;
};

const calcScholarFee = (date, isNewPlayer, freeDays, hasDoubleEnergy, isSpecial) => {
  const daysSinceLastClaim = calcDaysSinceLastClaim(date);
  if (isNewPlayer) {
    let newPlayerFee = 80 * (daysSinceLastClaim - 5 - freeDays);
    newPlayerFee = Math.max(0, newPlayerFee);
    return newPlayerFee;
  } else if (hasDoubleEnergy) {
    let doubleEnergyFee = 140 * (daysSinceLastClaim - freeDays);
    doubleEnergyFee = Math.max(0, doubleEnergyFee);
    return doubleEnergyFee;
  } else if (isSpecial) {
    let specialFee = 55 * (daysSinceLastClaim - freeDays);
    specialFee = Math.max(0, specialFee);
    return specialFee;
  } else {
    let fee = 70 * (daysSinceLastClaim - freeDays);
    fee = Math.max(0, fee);
    return fee;
  }
};

const calcHoursPassed = (updatedAt) => {
  const now = DateTime.now();
  const updatedAtDate = DateTime.fromJSDate(updatedAt);
  const difference = Interval.fromDateTimes(updatedAtDate, now);
  const hours = difference.length('hour');
  return hours;
};

const calcDaysSinceLastClaim = (date) => {
  const now = DateTime.now();
  const lastClaimDate = DateTime.fromISO(date);
  const difference = Interval.fromDateTimes(lastClaimDate, now);
  const days = Math.floor(difference.length('days'));
  return days;
};

const calcScholarSLP = (total, manager) => {
  const scholarSLP = total - manager;
  return scholarSLP;
};

const calcAverageSLP = (slp, date) => {
  const daysSinceLastClaim = calcDaysSinceLastClaim(date);
  if (daysSinceLastClaim === 0) {
    const average = 0;
    return average;
  } else {
    const average = (slp / daysSinceLastClaim);
    return Math.round(average);
  }
};

const makeChart = (scholar, manager) => {
  const chart = new QuickChart()
    .setWidth(500)
    .setHeight(300)
    .setBackgroundColor('transparent')
    .setConfig({
      type: 'pie',
      data: {
        datasets: [
          {
            data: [Math.max(0, scholar), manager],
            backgroundColor: [
              'rgb(118, 210, 117)',
              'rgb(255, 134, 124)',
            ],
            label: 'SLP TOTAL',
          },
        ],
        labels: ['Becado', 'Fees'],
      },
      options: {
        legend: {
          labels: {
            fontColor: 'white',
          },
        },
      },
    });
  const pieChart = chart.getUrl();
  return pieChart;
};

const getScholarTeam = async (teamID) => {
  const text = `
  SELECT * FROM Teams
  WHERE team_id = $1`;
  const values = [`${teamID}`];
  const { rows } = await query(text, values);
  return rows[0];
};

const updateScholarTeam = async ({ lastClaim, nextClaim, unclaimedSLP, managerSLP, scholarSLP, mmr, averageSLP, teamID }) => {
  const text = `
  UPDATE Teams
  SET last_claim = $1,
    next_claim = $2,
    unclaimed_slp = $3,
    manager_slp = $4,
    scholar_slp = $5,
    mmr = $6,
    average_slp = $7 
  WHERE team_id = $8`;
  const values = [
    `${lastClaim}`,
    `${nextClaim}`,
    `${unclaimedSLP}`,
    `${managerSLP}`,
    `${scholarSLP}`,
    `${mmr}`,
    `${averageSLP}`,
    `${teamID}`,
  ];
  const res = await query(text, values);
  return res;
};

const calcTeamStats = (teamData, roninData) => {
  const { new_team: newTeam, free_days: freeDays, double_energy: doubleEnergy, team_id: teamID, discord_id: discordID, special } = teamData;
  const { last_claim: lastClaimUnix, next_claim: nextClaimUnix, in_game_slp: unclaimedSLP, mmr } = roninData;
  const lastClaim = formatDate(lastClaimUnix);
  const nextClaim = formatDate(nextClaimUnix);
  const managerSLP = calcScholarFee(lastClaim, newTeam, freeDays, doubleEnergy, special);
  const scholarSLP = calcScholarSLP(unclaimedSLP, managerSLP);
  const averageSLP = calcAverageSLP(unclaimedSLP, lastClaim);
  const pieChart = makeChart(scholarSLP, managerSLP);
  const team = {
    teamID,
    discordID,
    lastClaim,
    nextClaim,
    unclaimedSLP,
    managerSLP,
    scholarSLP,
    mmr,
    averageSLP,
    pieChart,
  };
  return team;
};

const createTeamEmbedUpdated = (teamStats, interaction) => {
  const slpEmoji = interaction.guild.emojis.cache.find(emoji => emoji.name === 'slp');
  const { teamID, discordID, nextClaim, unclaimedSLP, managerSLP, scholarSLP, averageSLP, pieChart } = teamStats;
  const teamEmbed = new MessageEmbed()
    .setColor('#eec300')
    .setTitle('Estadísticas')
    .setDescription(`<@${discordID}>`)
    .addFields(
      { name: '📖 Equipo', value: `#${teamID}`, inline: true },
      { name: '🗓 Fecha de Cobro', value: `${nextClaim}`, inline: true },
      { name: `${slpEmoji} SLP Farmeado`, value: `${unclaimedSLP}`, inline: true },
      { name: '🛑 Fees Acumulados', value: `${managerSLP}`, inline: true },
      { name: '✅ SLP Becado', value: `${scholarSLP}`, inline: true },
      { name: '📊 Promedio SLP', value: `${averageSLP}`, inline: true })
    .setImage(`${pieChart}`);
  return teamEmbed;
};

const createTeamEmbed = (scholar, interaction) => {
  const slpEmoji = interaction.guild.emojis.cache.find(emoji => emoji.name === 'slp');
  const {
    team_id: teamID,
    next_claim: nextClaim,
    unclaimed_slp: unclaimedSLP,
    manager_slp: managerSLP,
    scholar_slp: scholarSLP,
    average_slp: averageSLP,
    discord_id: discordID } = scholar;
  const teamEmbed = new MessageEmbed ()
    .setColor('#eec300')
    .setTitle('Estadísticas')
    .setDescription(`<@${discordID}>`)
    .addFields(
      { name: '📖 Equipo', value: `#${teamID}`, inline: true },
      { name: '🗓 Fecha de Cobro', value: `${nextClaim.toISOString().substring(0, 10)}`, inline: true },
      { name: `${slpEmoji} SLP Farmeado`, value: `${unclaimedSLP}`, inline: true },
      { name: '🛑 Fees Acumulados', value: `${managerSLP}`, inline: true },
      { name: '✅ SLP Becado', value: `${scholarSLP}`, inline: true },
      { name: '📊 Promedio SLP', value: `${averageSLP}`, inline: true })
    .setImage(`${makeChart(unclaimedSLP, managerSLP)}`);
  return teamEmbed;
};

const getBalance = async (interaction) => {
  await interaction.reply('Cargando el balance de tu equipo...');
  // 1. We get the scholar team in the database
  const teamID = interaction.options.getNumber('team-id');
  const team = await getScholarTeam(teamID);
  // 2.1 We verify that the scholar exist in the database
  if (team === undefined) return interaction.editReply({ content: '¡Este equipo no existe!' });
  const { gabitodev_address: gabitodevAddress, updated_at: updatedAt, discord_id: discordID } = team;
  // 2.2 We verify that the scholar who runs the command is the owner of the team
  if (interaction.user.id !== discordID) return interaction.editReply({ content: '¡Este equipo no es tu equipo!' });
  // 3. We verify that 3 hours have not passed since the last update of the database
  const hoursSinceLastUpdate = calcHoursPassed(updatedAt);
  if (hoursSinceLastUpdate <= 3) {
    await interaction.editReply({
      embeds: [createTeamEmbed(team, interaction)],
      ephemeral: false,
    });
  } else {
    // 4. We use the ronin address to get the SLP data on the scholar account.
    const roninData = await getRoninData(gabitodevAddress);
    // 5. We use the data to do the calculations
    const teamStats = calcTeamStats(team, roninData);
    // 6. We update the database
    await updateScholarTeam(teamStats);
    // 7. Display the response to the user
    await interaction.editReply({
      content: '¡Cargado el balance correctamente!',
      embeds: [createTeamEmbedUpdated(teamStats, interaction)],
      ephemeral: false,
    });
    // Log
    console.log(`The ${interaction.commandName} command has been executed successfully by the shcolar ${interaction.user.username}`);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Muestra el balance de tu equipo')
    .addNumberOption(option =>
      option
        .setName('team-id')
        .setDescription('El número de tu equipo')
        .setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has('863179537324048414')) return;
    await getBalance(interaction);
  },
};