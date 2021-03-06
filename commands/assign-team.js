import { SlashCommandBuilder } from '@discordjs/builders';
import { db } from '../database/index.js';

const assignTeam = async (interaction) => {
  try {
    // 1. We define the variables
    const teamId = interaction.options.getNumber('team-id');
    const discordId = interaction.options.getUser('discord-user').id;

    // 2. We update the database and check if was suscessfull
    const { changes } = db.prepare('UPDATE teams SET renter_discord_id = ? WHERE team_id = ?').run(discordId, teamId);
    if (changes === 0) return await interaction.reply('The team could not be assigned because it does not exist in the database.');

    // 3. Display the response to the user
    await interaction.reply(`Successfully assigned team #${teamId} to scholar <@${discordId}>.`);
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_FOREIGNKEY') {
      return await interaction.reply('The team could not be assigned because the discord user is not a scholar.');
    } else {
      console.log(error);
      return await interaction.reply('An error has occurred with the command! Contact the owner of the discord server.');
    }
  }
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('assign-team')
    .setDescription('Assign a team to the scholar')
    .addNumberOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number to assign')
        .setRequired(true))
    .addUserOption(option =>
      option
        .setName('discord-user')
        .setDescription('Scholar discord user')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await assignTeam(interaction);
  },
};