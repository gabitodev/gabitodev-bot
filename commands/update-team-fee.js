const { SlashCommandBuilder } = require('@discordjs/builders');
const { none } = require('../db/db');

const setTeamFee = async (interaction) => {
  // 1. We define the variables
  const teamId = interaction.options.getNumber('team-id');
  const dailyFee = interaction.options.getNumber('fee-amount');
  // 2. We add/remove the 20 energies to the scholar
  await none('UPDATE teams SET daily_fee = $1 WHERE team_id = $2', [dailyFee, teamId]);
  // 3. Display the response to the user
  await interaction.reply(`Successfully assigned a daily fee of ${dailyFee} to team #${teamId}`);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update-team-fee')
    .setDescription('Updates the fee charged daily')
    .addNumberOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number')
        .setRequired(true))
    .addNumberOption(option =>
      option
        .setName('fee-amount')
        .setDescription('Fee charged daily')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await setTeamFee(interaction);
  },
};