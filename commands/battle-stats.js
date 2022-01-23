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
  SELECT gabitodev_address FROM Teams
  WHERE discord_id = $1`;
  const values = [`${discordID}`];
  const { rows } = await query(text, values);
  return rows[0];
};

const calcPercentages = (num, total) => {
  const percentage = (num * 100) / total;
  return percentage.toFixed(2);
};

const calcBattleSummary = async (battles, teamRoninAddress) => {
  const wins = battles.filter(battle => battle.winner === teamRoninAddress).length;
  const draws = battles.filter(battle => battle.winner === 'draw').length;
  const loses = battles.filter(battle => battle.winner !== teamRoninAddress && battle.winner !== 'draw').length;
  const winsPercentage = calcPercentages(wins, battles.length);
  const drawsPercentage = calcPercentages(draws, battles.length);
  const losesPercentage = calcPercentages(loses, battles.length);
  const battlesSummary = {
    wins,
    draws,
    loses,
    winsPercentage,
    drawsPercentage,
    losesPercentage,
    totalBattles: battles.length,
  };
  return battlesSummary;
};

const calcLastBattleinHours = (battleDate) => {
  const now = DateTime.now();
  const lastMatchDate = (DateTime.fromISO(battleDate)).minus({ hours: 3 });
  const difference = Interval.fromDateTimes(lastMatchDate, now);
  const hours = difference.length('hour');
  const minutes = difference.length('minutes');
  if (hours > 1) {
    return `Hace ${hours.toFixed(0)} horas`;
  } else {
    return `Hace ${minutes.toFixed(0)} minutos`;
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

const createBattleEmbed = (battlesSummary, discordID) => {
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
    .setTitle('Estadisticas PVP')
    .setDescription(`Batallas recientes del becado <@${discordID}>`)
    .addFields(
      { name: '📖 Nombre en Axie', value: `#${name}`, inline: true },
      { name: '🕐 Ultima batalla', value: `${hoursSinceLastBattle}`, inline: true },
      { name: '💢 Batallas en Arena', value: `Ultimas ${totalBattles}`, inline: true },
      { name: '⚔ MMR', value: `${mmr}`, inline: true },
      { name: '🏆 Rank en Arena', value: `${rank}`, inline: true },
      { name: '📊 SLP por batalla', value: `${calcAverageSlpPerBattle(mmr)}`, inline: true },
      { name: '🥇 Ganadas', value: `${wins} (${winsPercentage}%)`, inline: true },
      { name: '💔 Perdidas', value: `${loses} (${losesPercentage}%)`, inline: true },
      { name: '🛡 Empates', value: `${draws} (${drawsPercentage}%)`, inline: true },
    );
  return battleEmbed;
};

const getBattleStats = async (interaction) => {
  await interaction.reply('Cargando las estadísticas en Arena de tu equipo...');
  // 1. We define the constants and find the ronin address of the scholar
  const discordID = '849878890092822538';
  const { gabitodev_address: teamRoninAddress } = await getTeamRoninAddress(discordID);
  // 2. We get all the battles and the PVP information from the API
  const { battles } = await getScholarBattles(teamRoninAddress);
  const { rank, name, mmr } = await getRoninData(teamRoninAddress);
  // 3. We sort the battles by won, tied and lost
  const battlesSummary = await calcBattleSummary(battles, teamRoninAddress);
  // 4. We calculate the hours passed since the last battle
  const { game_ended: lastMatchDate } = battles[0];
  const hoursSinceLastBattle = calcLastBattleinHours(lastMatchDate);
  // 5. We create a new Object with the calculations of battleSumary and hoursSinceLastBattle
  const battleStats = { name, rank, mmr, hoursSinceLastBattle, ...battlesSummary };
  // 6. Display the response to the user
  await interaction.editReply({
    content: 'Cargadas correctamente las estadísticas de Arena!',
    embeds: [createBattleEmbed(battleStats, discordID)],
  });
  // log
  console.log(`The ${interaction.commandName} command has been executed successfully by the shcolar ${interaction.user.username}`);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('battle-stats')
    .setDescription('Muestra tus estadisticas en Arena'),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await getBattleStats(interaction);
  },
};