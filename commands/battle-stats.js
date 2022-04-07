import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { DateTime, Interval } from 'luxon';
import { db } from '../database/index.js';
import { getRoninData } from '../modules/ronin-data.js';
import { getBattlesData } from '../modules/battles-data.js';

const calcPercentages = (num, total) => {
  const percentage = (num * 100) / total;
  return percentage.toFixed(2);
};

const getBattlesSummary = async (battles, teamAddress) => {
  const totalBattles = battles.length;
  const wins = battles.filter(battle => battle.winner === teamAddress).length;
  const draws = battles.filter(battle => battle.winner === 'draw').length;
  const loses = battles.filter(battle => battle.winner !== teamAddress && battle.winner !== 'draw').length;
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

const getLastBattleinHours = (battleDate) => {
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

const getAverageSlpPerBattle = (mmr) => {
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

const createBattlesEmbed = (battlesSummary, discordId) => {
  const {
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
  const averageSlpPerBattle = getAverageSlpPerBattle(mmr);
  const battleEmbed = new MessageEmbed()
    .setColor('#8ccf60')
    .setTitle('Scholar Recent Battles')
    .setDescription(`Recent battles for scholar <@${discordId}> `)
    .addFields(
      { name: '🕐 Last Battle Time', value: `${hoursSinceLastBattle}`, inline: true },
      { name: '💢 Arena Battles', value: `Last ${totalBattles}`, inline: true },
      { name: '⚔ Arena MMR', value: `${mmr}`, inline: true },
      { name: '🏆 Arena Rank', value: `${rank}`, inline: true },
      { name: '📊 SLP Per Battle', value: `${averageSlpPerBattle}`, inline: true },
      { name: '🥇 Arena Wins', value: `${wins} (${winsPercentage}%)`, inline: true },
      { name: '💔 Arena Loses', value: `${loses} (${losesPercentage}%)`, inline: true },
      { name: '🛡 Arena Draws', value: `${draws} (${drawsPercentage}%)`, inline: true },
    );
  return battleEmbed;
};

const getBattleStats = async (interaction) => {
  await interaction.reply('Loading your team arena stats...');

  // 1. We define the constants and find the ronin address of the scholar
  const discordId = interaction.user.id;
  const { teamAddress } = db.prepare('SELECT ronin_address AS teamAddress FROM teams WHERE renter_discord_id = ?').get(discordId) || {};
  db.close();

  // Check if the scholar has a team
  if (!teamAddress) return await interaction.editReply('You dont have a team! Contact your manager.');

  // 2. We get all the battles and the PVP information from the API
  const { battles } = await getBattlesData(teamAddress);
  const roninData = await getRoninData(teamAddress);
  const { rank, mmr } = roninData[teamAddress];

  // 3. We sort the battles by won, tied and lost
  const battlesSummary = await getBattlesSummary(battles, teamAddress);

  // 4. We calculate the hours passed since the last battle
  const { gameEnded: lastBattleDate } = battles[0];
  const hoursSinceLastBattle = getLastBattleinHours(lastBattleDate);

  // 5. We create a new Object with the calculations of battleSumary and hoursSinceLastBattle
  const battlesStats = { rank, mmr, hoursSinceLastBattle, ...battlesSummary };

  // 6. Display the response to the user
  await interaction.editReply({
    content: 'Successfully loaded arena stats!',
    embeds: [createBattlesEmbed(battlesStats, discordId)],
  });
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('battle-stats')
    .setDescription('Show your recent battles in arena'),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.SCHOLAR_ROLE_ID)) return;
    await getBattleStats(interaction);
  },
};