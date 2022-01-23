const axios = require('axios').default;
const { SlashCommandBuilder, inlineCode } = require('@discordjs/builders');
const { DateTime, Interval } = require('luxon');
const { MessageEmbed } = require('discord.js');
const { stripIndents } = require('common-tags');
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

const getScholar = async (discordID) => {
  const text = `
  SELECT * FROM Teams
  INNER JOIN Scholars 
  ON Scholars.discord_id = Teams.discord_id
  WHERE Scholars.discord_id = $1
  ORDER BY Teams.team_id`;
  const values = [`${discordID}`];
  const { rows } = await query(text, values);
  return rows;
};

const updateScholar = async ({ lastClaim, nextClaim, unclaimedSLP, managerSLP, scholarSLP, mmr, averageSLP, teamID }) => {
  const text = `
  UPDATE Teams
  SET 
    last_claim = $1,
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

const calcTeamStats = (scholarData, roninData) => {
  const { new_team: newTeam, free_days: freeDays, double_energy: doubleEnergy, team_id: teamID, special } = scholarData;
  const { last_claim: lastClaimUnix, next_claim: nextClaimUnix, in_game_slp: unclaimedSLP, mmr } = roninData;
  const lastClaim = formatDate(lastClaimUnix);
  const nextClaim = formatDate(nextClaimUnix);
  const managerSLP = calcScholarFee(lastClaim, newTeam, freeDays, doubleEnergy, special);
  const scholarSLP = calcScholarSLP(unclaimedSLP, managerSLP);
  const averageSLP = calcAverageSLP(unclaimedSLP, lastClaim);
  const team = {
    teamID,
    lastClaim,
    nextClaim,
    unclaimedSLP,
    managerSLP,
    scholarSLP,
    mmr,
    averageSLP,
  };
  return team;
};

const createScholarEmbed = (scholarUpdated, interaction) => {
  const slpEmoji = interaction.guild.emojis.cache.find(emoji => emoji.name === 'slp');
  const scholarEmbed = scholarUpdated.map(({
    team_id: teamID,
    next_claim: nextClaim,
    unclaimed_slp: unclaimedSLP,
    manager_slp: managerSLP,
    scholar_slp: scholarSLP,
    average_slp: averageSLP,
    mmr }) => {
    const embed = new MessageEmbed()
      .setColor('#eec300')
      .setTitle(`Informacion del equipo #${teamID}`)
      .setDescription('')
      .addFields(
        { name: '🗓 Fecha de Cobro', value: `${nextClaim.toISOString().substring(0, 10)}`, inline: true },
        { name:  `${slpEmoji} SLP Farmeado`, value: `${unclaimedSLP}`, inline: true },
        { name: '🛑 Fees Acumulados', value: `${managerSLP}`, inline: true },
        { name: '✅ SLP del Becado', value: `${scholarSLP}`, inline: true },
        { name: '📈 MMR', value: `${mmr}`, inline: true },
        { name: '📊 Promedio SLP Diario', value: `${averageSLP}`, inline: true },
      );
    return embed;
  });
  return scholarEmbed;
};

const getScholarInfo = async (interaction) => {
  await interaction.reply('Intentando mostrar informacion del becado...');
  // 1. We obtain the information of the scholar
  const discordID = interaction.options.getString('discord-id');
  const scholar = await getScholar(discordID);
  // 2. We verify that the scholar exists in the database
  if (scholar.length === 0) return interaction.editReply({ content: 'El becado no posee equipos!' });
  // 3. We calc the stats of the team and update the database
  for (const data of scholar) {
    const { gabitodev_address: gabitodevAddress } = data;
    const roninData = await getRoninData(gabitodevAddress);
    const teamStats = calcTeamStats(data, roninData);
    updateScholar(teamStats);
  }
  // 4. We get the information from the updated scholar
  const scholarUpdated = await getScholar(discordID);
  const { ronin_address: scholarRoninAddress } = scholarUpdated[0];
  // 5. Display the response to the user
  await interaction.editReply({
    content: stripIndents`
    Informacion del becado: <@${discordID}>
    Dirección Ronin: ${inlineCode(`${scholarRoninAddress}`)}`,
    embeds: createScholarEmbed(scholarUpdated, interaction),
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scholar-info')
    .setDescription('Shows the information of the scholar')
    .addStringOption(option =>
      option
        .setName('discord-id')
        .setDescription('Scholar Discord ID')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await getScholarInfo(interaction);
  },
};