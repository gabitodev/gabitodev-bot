const { SlashCommandBuilder, inlineCode } = require('@discordjs/builders');
const { query } = require('../db');

const changeScholarRonin = async (interaction) => {
  // 1. We define the variables
  const scholarRoninAddress = interaction.options.getString('ronin-address');
  const discordID = interaction.options.getString('discord-id');
  // 2. We update the new ronin address to the database
  await query('UPDATE scholars SET scholar_address = $1 WHERE discord_id = $2', [`${scholarRoninAddress}`, `${discordID}`]);
  // 3. We display the response to the user
  await interaction.reply({ content: `Assigned ${inlineCode(`${scholarRoninAddress}`)} ronin address to scholar <@${discordID}>` });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('change-scholar-address')
    .setDescription('Change the scholar ronin address')
    .addStringOption(option =>
      option
        .setName('ronin-address')
        .setDescription('The new ronin address')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('discord-id')
        .setDescription('Scholars discord ID')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await changeScholarRonin(interaction);
  },
};