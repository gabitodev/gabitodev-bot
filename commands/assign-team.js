const { SlashCommandBuilder } = require('@discordjs/builders');
const { result } = require('../database');

const assignTeam = async (interaction) => {
  try {
    // 1. We define the variables
    const teamId = interaction.options.getNumber('team-id');
    const discordId = interaction.options.getUser('discord-user').id;

    // 2. We update the database and check if was suscessfull
    const { rowCount } = await result({
      text: 'UPDATE teams SET discord_id = $1 WHERE team_id = $2',
      values: [discordId, teamId],
    });
    if (rowCount === 0) return await interaction.reply('The team could not be assigned because it is not in the database.');

    // 3. Display the response to the user
    await interaction.reply(`Successfully assigned team #${teamId} to scholar <@${discordId}>.`);
  } catch (error) {
    if (error.code === '23503') {
      return await interaction.reply('The team could not be assigned because the discord user is not a scholar.');
    } else {
      console.log(error);
    }
  }
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