import { SlashCommandBuilder } from '@discordjs/builders';
import { db } from '../database/index.js';

const removeScholar = async (interaction) => {
  // 1. We define the variables
  const discordId = interaction.options.getUser('discord-user').id;
  const member = await interaction.guild.members.fetch(discordId);

  // 2. We remove the scholar from the database and kick the user
  const { changes } = db.prepare('DELETE FROM scholars WHERE discord_id = ?').run(discordId);
  db.close();
  if (changes === 0) return await interaction.reply('Could not be remvoved because the discord user is not a scholar.');
  member.kick('He will no longer be part of the scholarship');

  // 3. Display the response to the user
  await interaction.reply(`Successfully removed and kicked the scholar <@${discordId}>.`);
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('remove-scholar')
    .setDescription('Removes and kicks a scholar')
    .addUserOption(option =>
      option
        .setName('discord-user')
        .setDescription('Discord user to remove')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await removeScholar(interaction);
  },
};