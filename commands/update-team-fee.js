import { SlashCommandBuilder } from '@discordjs/builders';
import { db } from '../database/index.js';

const updateTeamFee = async (interaction) => {
  // 1. We define the variables
  const teamId = interaction.options.getNumber('team-id');
  const dailyFee = interaction.options.getNumber('fee-amount');

  // 2. We add/remove the 20 energies to the scholar
  const { changes } = db.prepare('UPDATE teams SET daily_fee = ? WHERE team_id = ?').run(dailyFee, teamId);
  if (changes === 0) return await interaction.reply('The team could not be updated because it does not exist in the database.');

  // 3. Display the response to the user
  await interaction.reply(`Successfully assigned a daily fee of ${dailyFee} to team #${teamId}.`);
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-team-fee')
    .setDescription('Updates the fee charged daily')
    .addNumberOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number')
        .setRequired(true))
    .addNumberOption(option =>
      option
        .setName('fee-amount')
        .setDescription('Fee charged daily')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await updateTeamFee(interaction);
  },
};