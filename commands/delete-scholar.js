const { SlashCommandBuilder } = require('@discordjs/builders');
const { none } = require('../db/db');

const deleteScholar = async (interaction) => {
  // 1. We define the variables
  const discordId = interaction.options.getString('discord-id');
  const member = await interaction.guild.members.fetch(discordId);
  // 2. We remove the scholar from the database and we
  await none('DELETE FROM scholars WHERE discord_id = $1', [discordId]);
  member.kick('He will no longer be part of the scholarship');
  // 3. Display the response to the user
  await interaction.reply(`Successfully deleted and kicked the scholar <@${discordId}>`);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-scholar')
    .setDescription('Deletes and kicks a scholar')
    .addStringOption(option =>
      option
        .setName('discord-id')
        .setDescription('Discord ID to delete')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await deleteScholar(interaction);
  },
};