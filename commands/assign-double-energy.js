const { SlashCommandBuilder } = require('@discordjs/builders');
const { query } = require('../db');

const assignDoubleEnergy = async (interaction) => {
  // 1. We define the variables
  const teamID = interaction.options.getNumber('team-id');
  const hasAssigned = interaction.options.getBoolean('add');
  // 2. We add/remove the 20 energies to the scholar
  await query('UPDATE Teams SET double_energy = $1 WHERE team_id = $2', [`${hasAssigned}`, `${teamID}`]);
  // 3. Display the response to the user
  if (hasAssigned) {
    interaction.reply({ content: `Se agregó exitosamente las 20 energías al equipo #${teamID}!` });
  } else {
    interaction.reply({ content: `Se quitó exitosamente las 20 energías al equipo #${teamID}!` });
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assign-double-energy')
    .setDescription('Doubles the energies of a scholar')
    .addNumberOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number')
        .setRequired(true))
    .addBooleanOption(option =>
      option
        .setName('add')
        .setDescription('Add or remove')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await assignDoubleEnergy(interaction);
  },
};