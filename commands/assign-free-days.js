const { SlashCommandBuilder } = require('@discordjs/builders');
const { none } = require('../db/db');

const assignFreeDays = async (interaction) => {
  // 1. We define the variables
  const teamId = interaction.options.getString('team-id');
  const freeDays = interaction.options.getNumber('free-days');
  // 2. We remove the scholar from the database
  await none('UPDATE teams SET free_days = $1 WHERE team_id = $2', [freeDays, teamId]);
  // 3. Display the response to the user
  await interaction.reply(`Assigned ${freeDays} days without fee to team #${teamId}`);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assign-free-days')
    .setDescription('Assign days without fee to a team')
    .addStringOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number to assign free days')
        .setRequired(true))
    .addNumberOption(option =>
      option
        .setName('free-days')
        .setDescription('Number of days')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await assignFreeDays(interaction);
  },
};