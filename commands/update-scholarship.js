const axios = require('axios').default;
const { DateTime, Interval } = require('luxon');
const { SlashCommandBuilder } = require('@discordjs/builders');
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

const getScholars = async () => {
  const text = `
  SELECT * FROM Teams
  INNER JOIN Scholars 
  ON Scholars.discord_id = Teams.discord_id
  ORDER BY Teams.team_id`;
  const { rows } = await query(text);
  return rows;
};

const updateScholar = async ({ lastClaim, nextClaim, unclaimedSLP, managerSLP, scholarSLP, mmr, averageSLP, teamID, todaySLP }) => {
  const text = `
  UPDATE Teams
  SET 
    last_claim = $1,
    next_claim = $2,
    unclaimed_slp = $3,
    manager_slp = $4,
    scholar_slp = $5,
    mmr = $6,
    average_slp = $7,
    today_slp = $8
  WHERE team_id = $9`;
  const values = [
    `${lastClaim}`,
    `${nextClaim}`,
    `${unclaimedSLP}`,
    `${managerSLP}`,
    `${scholarSLP}`,
    `${mmr}`,
    `${averageSLP}`,
    `${todaySLP}`,
    `${teamID}`,
  ];
  const res = await query(text, values);
  return res;
};

const calcTeamStats = (scholarData, roninData) => {
  const { new_team: newTeam, free_days: freeDays, double_energy: doubleEnergy, team_id: teamID, yesterday_slp: yesterdaySlp, gabitodev_address: scholarRoninAddress, special } = scholarData;
  const { last_claim: lastClaimUnix, next_claim: nextClaimUnix, in_game_slp: unclaimedSLP, mmr } = roninData[scholarRoninAddress];
  const lastClaim = formatDate(lastClaimUnix);
  const nextClaim = formatDate(nextClaimUnix);
  const managerSLP = calcScholarFee(lastClaim, newTeam, freeDays, doubleEnergy, special);
  const scholarSLP = calcScholarSLP(unclaimedSLP, managerSLP);
  const averageSLP = calcAverageSLP(unclaimedSLP, lastClaim);
  const todaySLP = unclaimedSLP - yesterdaySlp;
  const team = {
    teamID,
    lastClaim,
    nextClaim,
    unclaimedSLP,
    managerSLP,
    scholarSLP,
    mmr,
    averageSLP,
    todaySLP,
  };
  return team;
};

const updateScholarship = async (interaction) => {
  await interaction.reply('Actualizando base de datos...');
  // 1. We obtain all the shcolars
  const scholars = await getScholars();
  // 2. We obtain each ronin address
  const roninsAddresses = scholars.map(({ gabitodev_address: teamRoninAddress }) => {
    const ronins = [];
    ronins.push(teamRoninAddress);
    return ronins;
  });
  // 3. We obtain the ronin data
  const roninData = await getRoninData(roninsAddresses);
  // 4. We update each scholar to the database
  for (const scholarData of scholars) {
    const teamStats = calcTeamStats(scholarData, roninData);
    updateScholar(teamStats);
  }
  // 5. We display the response to the user
  await interaction.editReply({ content: 'La base de datos ha sido actualizada!' });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update-scholarship')
    .setDescription('Updates the scholarship'),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await updateScholarship(interaction);
  },
};