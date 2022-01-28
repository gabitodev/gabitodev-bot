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

const calcScholarFee = (daysSinceLastClaim, freeDays, dailyFee) => {
  let fee = dailyFee * (daysSinceLastClaim - freeDays);
  fee = Math.max(0, fee);
  return fee;
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

const calcAverageSLP = (slp, daysSinceLastClaim) => {
  if (daysSinceLastClaim === 0) {
    return 0;
  } else {
    let average = (slp / daysSinceLastClaim);
    average = Math.round(average);
    return average;
  }
};

const getScholar = async (discordID) => {
  const text = `
  SELECT scholars.scholar_address, teams.team_id, teams.team_address, teams.daily_fee, teams.free_days FROM Teams
  INNER JOIN scholars 
  ON scholars.discord_id = teams.discord_id
  WHERE scholars.discord_id = $1
  ORDER BY teams.team_id`;
  const values = [`${discordID}`];
  const { rows } = await query(text, values);
  return rows;
};

const updateScholar = async ({ lastClaim, nextClaim, unclaimedSLP, managerSLP, scholarSLP, mmr, averageSLP, teamID }) => {
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

const calcTeamStats = (scholarData, roninData) => {
  const { free_days: freeDays, team_id: teamID, daily_fee: dailyFee } = scholarData;
  const { last_claim: lastClaimUnix, next_claim: nextClaimUnix, in_game_slp: unclaimedSLP, mmr } = roninData;
  const lastClaim = formatDate(lastClaimUnix);
  const nextClaim = formatDate(nextClaimUnix);
  const daysSinceLastClaim = calcDaysSinceLastClaim(lastClaim);
  const managerSLP = calcScholarFee(daysSinceLastClaim, freeDays, dailyFee);
  const scholarSLP = calcScholarSLP(unclaimedSLP, managerSLP);
  const averageSLP = calcAverageSLP(unclaimedSLP, daysSinceLastClaim);
  const teamStats = {
    teamID,
    lastClaim,
    nextClaim,
    unclaimedSLP,
    managerSLP,
    scholarSLP,
    mmr,
    averageSLP,
  };
  return teamStats;
};

const createScholarEmbed = (scholarTeams, interaction) => {
  const slpEmoji = interaction.guild.emojis.cache.find(emoji => emoji.name === 'slp');
  const scholarEmbed = scholarTeams.map(({
    teamID,
    nextClaim,
    unclaimedSLP,
    managerSLP,
    scholarSLP,
    averageSLP,
    mmr }) => {
    const embed = new MessageEmbed()
      .setColor('#eec300')
      .setTitle(`Team #${teamID}`)
      .setDescription('')
      .addFields(
        { name: '🗓 Next Claim', value: `${nextClaim}`, inline: true },
        { name:  `${slpEmoji} Unclaimed SLP`, value: `${unclaimedSLP}`, inline: true },
        { name: '🛑 Accrued fees', value: `${managerSLP}`, inline: true },
        { name: '✅ Scholar SLP', value: `${scholarSLP}`, inline: true },
        { name: '📈 MMR', value: `${mmr}`, inline: true },
        { name: '📊 Average SLP', value: `${averageSLP}`, inline: true },
      );
    return embed;
  });
  return scholarEmbed;
};

const getScholarTeams = async (scholar) => {
  const teams = [];
  for (const data of scholar) {
    const { team_address: teamAddress } = data;
    const roninData = await getRoninData(teamAddress);
    const teamStats = calcTeamStats(data, roninData);
    updateScholar(teamStats);
    teams.push(teamStats);
  }
  return teams;
};

const getScholarInfo = async (interaction) => {
  await interaction.reply('Loading scholar information...');
  // 1. We obtain the information of the scholar
  const discordID = interaction.options.getString('discord-id');
  const scholar = await getScholar(discordID);
  // 2. We verify that the scholar exists in the database
  if (scholar.length === 0) return interaction.editReply({ content: 'The scholar does not own a team!' });
  // 3. We calc the stats of the team and update the database
  const scholarTeams = await getScholarTeams(scholar);
  // 4. We get the scholar address
  const { scholar_address: scholarAddress } = scholar[0];
  // 5. Display the response to the user
  await interaction.editReply({
    content: stripIndents`
    Scholar: <@${discordID}>
    Ronin Address: ${inlineCode(`${scholarAddress}`)}`,
    embeds: createScholarEmbed(scholarTeams, interaction),
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('get-scholar')
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