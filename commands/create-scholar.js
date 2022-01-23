const { stripIndents } = require('common-tags');
const { SlashCommandBuilder, inlineCode, bold } = require('@discordjs/builders');
const { query } = require('../db');

const insertScholar = async (scholarDiscordID, scholarName, scholarRoninAddress) => {
  const text = `
  INSERT INTO scholars (discord_id, full_name, ronin_address)
  VALUES ($1, $2, $3)`;
  const values = [`${scholarDiscordID}`, `${scholarName}`, `${scholarRoninAddress}`];
  const { rows } = await query(text, values);
  return rows[0];
};

const createScholar = async (interaction) => {
  // 1. We define the variables
  const scholarDiscordId = interaction.options.getString('discord-id');
  const scholarName = interaction.options.getString('name');
  const scholarRoninAddress = interaction.options.getString('ronin-address');
  // 2. We create the scholar in the database
  await insertScholar(scholarDiscordId, scholarName, scholarRoninAddress);
  // 3. Display the response to the user
  interaction.reply({
    content: stripIndents`
    ${bold('Agregado nuevo becado exitosamente!')}
    Usuarion en Discord: <@${scholarDiscordId}>
    Nombre: ${inlineCode(`${scholarName}`)}
    Dirección Ronin: ${inlineCode(`${scholarRoninAddress}`)}`,
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