import { SlashCommandBuilder } from '@discordjs/builders';
import { db } from '../database/index.js';

const removeTeam = async (interaction) => {
  // 1. We define the variables
  const teamId = interaction.options.getString('team-id');

  // 2. We remove the team from the database
  const { changes } = db.prepare('DELETE FROM Teams WHERE team_id = ?').run(teamId);
  if (changes === 0) return await interaction.reply('Could not be remvoved because the team is not in the database.');

  // 3. Display the response to the user
  await interaction.reply(`Successfully removed team #<@${teamId}>.`);
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('remove-team')
    .setDescription('Removes a team')
    .addStringOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number to delete')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await removeTeam(interaction);
  },
};