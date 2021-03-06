import { SlashCommandBuilder } from '@discordjs/builders';
import { db } from '../database/index.js';

const updateFreeDays = async (interaction) => {
  // 1. We define the variables
  const teamId = interaction.options.getString('team-id');
  const freeDays = interaction.options.getNumber('free-days');

  // 2. We update the free days to the team
  const { changes } = db.prepare('UPDATE teams SET free_days = ? WHERE team_id = ?').run(freeDays, teamId);

  if (changes === 0) return await interaction.reply('The team could not be updated because it does not exist in the database.');

  // 3. Display the response to the user
  await interaction.reply(`Assigned ${freeDays} days without fee to team #${teamId}.`);
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-free-days')
    .setDescription('Updates days without fee to a team')
    .addStringOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number to assign free days')
        .setRequired(true))
    .addNumberOption(option =>
      option
        .setName('free-days')
        .setDescription('Number of days')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await updateFreeDays(interaction);
  },
};