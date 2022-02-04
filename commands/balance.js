const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { DateTime, Interval } = require('luxon');
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

const calcScholarFee = (date, freeDays, dailyFee) => {
  const daysSinceLastClaim = calcDaysSinceLastClaim(date);
  let fee = dailyFee * (daysSinceLastClaim - freeDays);
  fee = Math.max(0, fee);
  return fee;
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

const makeBalanceChart = (scholarSLP, managerSLP) => {
  const chart = {
    type: 'pie',
    data: {
      datasets: [
        {
          data: [Math.max(0, scholarSLP), managerSLP],
          backgroundColor: [
            'rgb(118, 210, 117)',
            'rgb(255, 134, 124)',
          ],
          label: 'SLP TOTAL',
        },
      ],
      labels: ['Scholar', 'Fees'],
    },
    options: {
      legend: {
        labels: {
          fontColor: 'white',
        },
      },
    },
  };
  const encodedChart = encodeURIComponent(JSON.stringify(chart));
  const chartUrl = `https://quickchart.io/chart?c=${encodedChart}`;
  return chartUrl;
};

const getScholarTeam = async (teamID) => {
  const text = `
  SELECT * FROM teams
  WHERE team_id = $1`;
  const values = [`${teamID}`];
  const { rows } = await query(text, values);
  return rows[0];
};

const updateScholarTeam = async ({ lastClaim, nextClaim, unclaimedSLP, managerSLP, scholarSLP, mmr, averageSLP, teamID }) => {
  const text = `
  UPDATE teams
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

const calcTeamStats = (teamData, roninData) => {
  const { free_days: freeDays, team_id: teamID, daily_fee: dailyFee } = teamData;
  const { last_claim: lastClaimUnix, next_claim: nextClaimUnix, in_game_slp: unclaimedSLP, mmr } = roninData;
  const lastClaim = formatDate(lastClaimUnix);
  const nextClaim = formatDate(nextClaimUnix);
  const managerSLP = calcScholarFee(lastClaim, freeDays, dailyFee);
  const scholarSLP = calcScholarSLP(unclaimedSLP, managerSLP);
  const averageSLP = calcAverageSLP(unclaimedSLP, lastClaim);
  const balanceChart = makeBalanceChart(scholarSLP, managerSLP);
  const team = {
    teamID,
    lastClaim,
    nextClaim,
    unclaimedSLP,
    managerSLP,
    scholarSLP,
    mmr,
    averageSLP,
    balanceChart,
  };
  return team;
};

const createTeamEmbedUpdated = (teamStats, interaction) => {
  const slpEmoji = interaction.guild.emojis.cache.find(emoji => emoji.name === 'slp');
  const { teamID, nextClaim, unclaimedSLP, managerSLP, scholarSLP, averageSLP, balanceChart } = teamStats;
  const teamEmbed = new MessageEmbed()
    .setColor('#eec300')
    .setTitle('Scholar Balance')
    .setDescription(`Balance for scholar <@${interaction.user.id}>`)
    .addFields(
      { name: '📖 Team', value: `#${teamID}`, inline: true },
      { name: '🗓 Next Claim', value: `${nextClaim}`, inline: true },
      { name: `${slpEmoji} Unclaimed SLP`, value: `${unclaimedSLP}`, inline: true },
      { name: '🛑 Accrued fees', value: `${managerSLP}`, inline: true },
      { name: '✅ Scholar SLP', value: `${scholarSLP}`, inline: true },
      { name: '📊 Average SLP', value: `${averageSLP}`, inline: true })
    .setImage(`${balanceChart}`);
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
    average_slp: averageSLP } = scholar;
  const teamEmbed = new MessageEmbed ()
    .setColor('#eec300')
    .setTitle('Scholar Balance')
    .setDescription(`Balance for scholar <@${interaction.user.id}>`)
    .addFields(
      { name: '📖 Team', value: `#${teamID}`, inline: true },
      { name: '🗓 Next Claim', value: `${nextClaim.toISOString().substring(0, 10)}`, inline: true },
      { name: `${slpEmoji} Unclaimed SLP`, value: `${unclaimedSLP}`, inline: true },
      { name: '🛑 Accrued fees', value: `${managerSLP}`, inline: true },
      { name: '✅ Scholar SLP', value: `${scholarSLP}`, inline: true },
      { name: '📊 Average SLP', value: `${averageSLP}`, inline: true })
    .setImage(`${makeBalanceChart(scholarSLP, managerSLP)}`);
  return teamEmbed;
};

const getBalance = async (interaction) => {
  await interaction.reply('Loading the balance of your team...');
  // 1. We get the scholar team in the database
  const teamID = interaction.options.getNumber('team-id');
  const team = await getScholarTeam(teamID);
  // 2.1 We verify that the scholar exist in the database
  if (team === undefined) return interaction.editReply({ content: 'This team does not exist!' });
  const { team_address: teamRoninAddress, updated_at: updatedAt, discord_id: discordID } = team;
  // 2.2 We verify that the scholar who runs the command is the owner of the team
  if (interaction.user.id !== discordID) return interaction.editReply({ content: 'This is not your team!' });
  // 3. We verify that 3 hours have not passed since the last update of the database
  const hoursSinceLastUpdate = calcHoursPassed(updatedAt);
  if (hoursSinceLastUpdate <= 3) {
    await interaction.editReply({
      content: 'Loaded the balance correctly!',
      embeds: [createTeamEmbed(team, interaction)],
    });
    // Log
    console.log(`The ${interaction.commandName} command has been executed successfully by the shcolar ${interaction.user.username}`);
  } else {
    // 4. We use the ronin address to get the SLP data on the scholar account.
    const roninData = await getRoninData(teamRoninAddress);
    // 5. We use the data to do the calculations
    const teamStats = calcTeamStats(team, roninData);
    // 6. We update the database
    await updateScholarTeam(teamStats);
    // 7. Display the response to the user
    await interaction.editReply({
      content: 'Loaded the balance correctly!',
      embeds: [createTeamEmbedUpdated(teamStats, interaction)],
    });
    // Log
    console.log(`The ${interaction.commandName} command has been executed successfully by the shcolar ${interaction.user.username}`);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Show your team balance')
    .addNumberOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number')
        .setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has('863179537324048414')) return;
    await getBalance(interaction);
  },
};