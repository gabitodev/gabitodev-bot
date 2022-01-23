const { SlashCommandBuilder, inlineCode, bold } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const { query } = require('../db');

const assignTeam = async (interaction) => {
  // 1. We define the variables
  const teamId = interaction.options.getNumber('team-number');
  const discordId = interaction.options.getString('discord-id');
  // 2. We update the databse
  await query('UPDATE Teams SET discord_id = $1 WHERE team_id = $2', [`${discordId}`, `${teamId}`]);
  // 3. Display the response to the user
  interaction.reply({
    content: stripIndents`
    ${bold('El equipo fue asignado exitosamente!')}
    Número del equipo: ${inlineCode(`${teamId}`)}
    Asignado al becado: <@${discordId}>`,
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assign-team')
    .setDescription('Assign a team to the scholar')
    .addNumberOption(option =>
      option
        .setName('team-number')
        .setDescription('Team number to assign')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('discord-id')
        .setDescription('Scholar Discord ID')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await assignTeam(interaction);
  },
};