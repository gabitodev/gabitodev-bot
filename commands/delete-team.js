const { SlashCommandBuilder } = require('@discordjs/builders');
const { query } = require('../db');

const deleteTeam = async (interaction) => {
  // 1. We define the variables
  const teamID = interaction.options.getString('team-id');
  // 2. We remove the team from the database
  await query('DELETE FROM Teams WHERE team_id = $1', [`${teamID}`]);
  // 3. Display the response to the user
  interaction.reply({ content: `¡Elinminado el equipo <@${teamID}> exitosamente!` });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('delete-team')
    .setDescription('Deletes a team')
    .addStringOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number to delete')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await deleteTeam(interaction);
  },
};