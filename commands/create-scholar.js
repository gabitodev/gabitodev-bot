const { stripIndents } = require('common-tags');
const { SlashCommandBuilder, inlineCode, bold } = require('@discordjs/builders');
const { none } = require('../db/db');

const insertScholar = async (scholarDiscordId, scholarName, scholarAddress) => {
  const text = `
  INSERT INTO scholars (discord_id, full_name, scholar_address)
  VALUES ($1, $2, $3)`;
  const values = [scholarDiscordId, scholarName, scholarAddress];
  await none(text, values);
};

const createScholar = async (interaction) => {
  // 1. We define the variables
  const scholarRoleId = '863179537324048414';
  const scholarDiscordId = interaction.options.getString('discord-id');
  const scholarName = interaction.options.getString('name');
  const scholarAddress = interaction.options.getString('ronin-address');
  const member = await interaction.guild.members.fetch(scholarDiscordId);
  const role = await interaction.guild.roles.fetch(scholarRoleId);
  // 2. We create the scholar in the database and add Scholar Role
  await insertScholar(scholarDiscordId, scholarName, scholarAddress);
  member.roles.add(role);
  // 3. Display the response to the user
  await interaction.reply({
    content: stripIndents`
    ${bold('Successfully created a new scholar!')}
    User: <@${scholarDiscordId}>
    Name: ${inlineCode(`${scholarName}`)}
    Ronin Address: ${inlineCode(`${scholarAddress}`)}
    Role: <@&${scholarRoleId}>`,
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-scholar')
    .setDescription('Creates a new scholar')
    .addStringOption(option =>
      option
        .setName('discord-id')
        .setDescription('Scholar Discord ID')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Scholar name')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('ronin-address')
        .setDescription('Scholar ronin address')
        .setRequired(false)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await createScholar(interaction);
  },
};