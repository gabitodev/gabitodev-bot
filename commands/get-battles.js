import { SlashCommandBuilder, codeBlock } from '@discordjs/builders';
import { db } from '../database/index.js';
import { getBattlesData } from '../modules/battles-data.js';
import { AsciiTable3 } from 'ascii-table3';

const getBattlesPerDay = (battles, teamAddress) => {
  const battlesPerDay = [];
  const battlesByDate = battles.reduce((group, battle) => {
    const key = battle.gameEnded.split('T')[0];
    group[key] = (group[key] || []).concat(battle);
    return group;
  }, {});

  for (const date in battlesByDate) {
    const wins = battlesByDate[date].filter(battle => battle.winner === teamAddress).length;
    const draws = battlesByDate[date].filter(battle => battle.winner === 'draw').length;
    const loses = battlesByDate[date].filter(battle => battle.winner !== teamAddress && battle.winner !== 'draw').length;
    const battleDay = [[date], battlesByDate[date].length, wins, draws, loses ];
    battlesPerDay.push(battleDay);
  }
  return battlesPerDay;
};

const getBattles = async (interaction) => {
  const discordId = interaction.options.getUser('discord-user').id;

  const { teamAddress, teamId } = db.prepare('SELECT ronin_address AS teamAddress, team_id AS teamId FROM teams WHERE renter_discord_id = ?').get(discordId) || {};
  db.close();

  if (!teamAddress) return await interaction.editReply('This discord user is not a scholar.');

  const { battles } = await getBattlesData(teamAddress);

  const battlesPerDay = getBattlesPerDay(battles, teamAddress);

  const table = new AsciiTable3(`Battles for Gabitodev #${teamId}`)
    .setHeading('Date', 'Battles', 'Wins', 'Draws', 'Loses')
    .setAlign(3)
    .addRowMatrix(battlesPerDay)
    .setStyle('unicode-single');

  await interaction.reply(codeBlock(table));
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('get-battles')
    .setDescription('Shows scholar battles')
    .addUserOption(option =>
      option
        .setName('discord-user')
        .setDescription('Scholar discord user')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await getBattles(interaction);
  },
};