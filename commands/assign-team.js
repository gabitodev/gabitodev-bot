const { SlashCommandBuilder } = require('@discordjs/builders');
const { none } = require('../database');

const assignTeam = async (interaction) => {
  // 1. We define the variables
  const teamId = interaction.options.getNumber('team-id');
  const discordId = interaction.options.getUser('discord-user').id;

  // 2. We update the databse
  await none('UPDATE teams SET discord_id = $1 WHERE team_id = $2', [discordId, teamId]);

  // 3. Display the response to the user
  await interaction.reply(`Successfully assigned team #${teamId} to scholar <@${discordId}>.`);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('assign-team')
    .setDescription('Assign a team to the scholar')
    .addNumberOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number to assign')
        .setRequired(true))
    .addUserOption(option =>
      option
        .setName('discord-user')
        .setDescription('Scholar discord user')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await assignTeam(interaction);
  },
};