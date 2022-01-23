const { stripIndents } = require('common-tags');
const { SlashCommandBuilder, inlineCode, bold } = require('@discordjs/builders');
const { query } = require('../db');

const insertTeam = async (teamID, teamRoninAddress, isNewTeam) => {
  const text = `
  INSERT INTO Teams (team_id, gabitodev_address, new_team)
  VALUES ($1, $2, $3)`;
  const values = [`${teamID}`, `${teamRoninAddress}`, `${isNewTeam}`];
  const { rows } = await query(text, values);
  return rows[0];
};

const checkNewTeam = (isNewTeam) => {
  if (isNewTeam === 'false') {
    return 'No lo es';
  } else {
    return 'Si lo es';
  }
};

const createTeam = async (interaction) => {
  // 1. We define the variables
  const teamID = interaction.options.getNumber('team-id');
  const teamRoninAddress = interaction.options.getString('ronin-address');
  const isNewTeam = interaction.options.getBoolean('new-team');
  // 2. We create the team in the database
  await insertTeam(teamID, teamRoninAddress, isNewTeam);
  // 3. Display the response to the user
  interaction.reply({
    content: stripIndents`
    ${bold('Agregado nuevo equipo exitosamente!')}
    Número: ${inlineCode(`${teamID}`)}
    Dirección Ronin: ${inlineCode(`${teamRoninAddress}`)}
    Es un nuevo equipo? ${inlineCode(`${checkNewTeam(isNewTeam)}`)}`,
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-team')
    .setDescription('Creates a new team')
    .addNumberOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('ronin-address')
        .setDescription('Team ronin address')
        .setRequired(true))
    .addBooleanOption(option =>
      option
        .setName('new-team')
        .setDescription('Is it a new team')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await createTeam(interaction);
  },
};