const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { DateTime, Interval } = require('luxon');
const axios = require('axios').default;
const { query } = require('../db');

const getScholarBattles = async (roninAddress) => {
  try {
    const { data } = await axios.get(`https://game-api.axie.technology/logs/pvp/${roninAddress}`);
    return data;
  } catch (error) {
    console.error(error);
  }
};

const getRoninData = async (roninAddress) => {
  try {
    const { data } = await axios.get(`https://game-api.axie.technology/api/v1/${roninAddress}`);
    return data;
  } catch (error) {
    console.error(error);
  }
};

const getTeamRoninAddress = async (discordID) => {
  const text = `
  SELECT team_address FROM teams
  WHERE discord_id = $1`;
  const values = [`${discordID}`];
  const { rows } = await query(text, values);
  return rows[0];
};

const calcPercentages = (num, total) => {
  const percentage = (num * 100) / total;
  return percentage.toFixed(2);
};

const calcBattlesSummary = async (battles, teamRoninAddress) => {
  const totalBattles = battles.length;
  const wins = battles.filter(battle => battle.winner === teamRoninAddress).length;
  const draws = battles.filter(battle => battle.winner === 'draw').length;
  const loses = battles.filter(battle => battle.winner !== teamRoninAddress && battle.winner !== 'draw').length;
  const winsPercentage = calcPercentages(wins, totalBattles);
  const drawsPercentage = calcPercentages(draws, totalBattles);
  const losesPercentage = calcPercentages(loses, totalBattles);
  const battlesSummary = {
    wins,
    draws,
    loses,
    winsPercentage,
    drawsPercentage,
    losesPercentage,
    totalBattles,
  };
  return battlesSummary;
};

const calcLastBattleinHours = (battleDate) => {
  const now = DateTime.now();
  const lastBattleDate = (DateTime.fromISO(battleDate)).minus({ hours: 3 });
  const difference = Interval.fromDateTimes(lastBattleDate, now);
  const hours = difference.length('hour');
  const minutes = difference.length('minutes');
  if (hours > 1) {
    return `${hours.toFixed(0)} hours ago`;
  } else {
    return `${minutes.toFixed(0)} minutes ago`;
  }
};

const calcAverageSlpPerBattle = (mmr) => {
  if (mmr <= 1300 && mmr >= 1100) {
    return '6 SLP';
  } else if (mmr < 1500 && mmr > 1300) {
    return '9 SLP';
  } else if (mmr < 1900 && mmr > 1500) {
    return '12 SLP';
  } else if (mmr < 2100 && mmr > 1900) {
    return '15 SLP';
  } else {
    return '3-1 SLP';
  }
};

const createBattlesEmbed = (battlesSummary, discordID) => {
  const {
    name,
    rank,
    mmr,
    hoursSinceLastBattle,
    wins,
    draws,
    loses,
    winsPercentage,
    drawsPercentage,
    losesPercentage,
    totalBattles } = battlesSummary;
  const battleEmbed = new MessageEmbed()
    .setColor('#eec300')
    .setTitle('Scholar Recent Battles')
    .setDescription(`Recent battles for scholar <@${discordID}> `)
    .addFields(
      { name: '📖 In-Game Name', value: `${name}`, inline: true },
      { name: '🕐 Last Battle Time', value: `${hoursSinceLastBattle}`, inline: true },
      { name: '💢 Arena Battles', value: `Last ${totalBattles}`, inline: true },
      { name: '⚔ Arena MMR', value: `${mmr}`, inline: true },
      { name: '🏆 Arena Rank', value: `${rank}`, inline: true },
      { name: '📊 SLP Per Battle', value: `${calcAverageSlpPerBattle(mmr)}`, inline: true },
      { name: '🥇 Arena Wins', value: `${wins} (${winsPercentage}%)`, inline: true },
      { name: '💔 Arena Loses', value: `${loses} (${losesPercentage}%)`, inline: true },
      { name: '🛡 Arena Draws', value: `${draws} (${drawsPercentage}%)`, inline: true },
    );
  return battleEmbed;
};

const getBattleStats = async (interaction) => {
  await interaction.reply('Loading your team arena stats...');
  // 1. We define the constants and find the ronin address of the scholar
  const discordID = interaction.user.id;
  const { team_address: teamRoninAddress } = await getTeamRoninAddress(discordID);
  // 2. We get all the battles and the PVP information from the API
  const { battles } = await getScholarBattles(teamRoninAddress);
  const { rank, name, mmr } = await getRoninData(teamRoninAddress);
  // 3. We sort the battles by won, tied and lost
  const battlesSummary = await calcBattlesSummary(battles, teamRoninAddress);
  // 4. We calculate the hours passed since the last battle
  const { game_ended: lastBattleDate } = battles[0];
  const hoursSinceLastBattle = calcLastBattleinHours(lastBattleDate);
  // 5. We create a new Object with the calculations of battleSumary and hoursSinceLastBattle
  const battlesStats = { name, rank, mmr, hoursSinceLastBattle, ...battlesSummary };
  // 6. Display the response to the user
  await interaction.editReply({
    content: 'Successfully loaded arena stats!',
    embeds: [createBattlesEmbed(battlesStats, discordID)],
  });
  // log
  console.log(`The ${interaction.commandName} command has been executed successfully by the shcolar ${interaction.user.username}`);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('battle-stats')
    .setDescription('Show your recent battles in arena'),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await getBattleStats(interaction);
  },
};