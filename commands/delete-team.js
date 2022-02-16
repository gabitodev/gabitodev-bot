const { SlashCommandBuilder } = require('@discordjs/builders');
const { none } = require('../database');

const deleteTeam = async (interaction) => {
  // 1. We define the variables
  const teamId = interaction.options.getString('team-id');
  // 2. We remove the team from the database
  await none('DELETE FROM Teams WHERE team_id = $1', [teamId]);
  // 3. Display the response to the user
  await interaction.reply(`Successfully deleted team #<@${teamId}>`);
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