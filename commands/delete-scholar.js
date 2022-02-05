const { SlashCommandBuilder } = require('@discordjs/builders');
const { query } = require('../db');

const deleteScholar = async (interaction) => {
  // 1. We define the variables
  const discordID = interaction.options.getString('discord-id');
  const member = await interaction.guild.members.fetch(discordID);
  // 2. We remove the scholar from the database and we
  await query('DELETE FROM scholars WHERE discord_id = $1', [`${discordID}`]);
  member.kick('He will no longer be part of the scholarship');
  // 3. Display the response to the user
  await interaction.reply({ content: `Successfully deleted and kicked the scholar <@${discordID}>` });
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