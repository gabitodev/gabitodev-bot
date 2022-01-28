const { stripIndents } = require('common-tags');
const { SlashCommandBuilder, inlineCode, bold } = require('@discordjs/builders');
const { query } = require('../db');

const insertTeam = async (teamID, teamRoninAddress, dailyFee, freeDays) => {
  const text = `
  INSERT INTO teams (team_id, team_address, daily_fee, free_days)
  VALUES ($1, $2, $3, $4)`;
  const values = [`${teamID}`, `${teamRoninAddress}`, `${dailyFee}`, `${freeDays}`];
  const { rows } = await query(text, values);
  return rows[0];
};

const createTeam = async (interaction) => {
  // 1. We define the variables
  const teamID = interaction.options.getNumber('team-id');
  const teamRoninAddress = interaction.options.getString('ronin-address');
  const dailyFee = interaction.options.getNumber('daily-fee');
  const freeDays = interaction.options.getNumber('free-days');
  // 2. We create the team in the database
  await insertTeam(teamID, teamRoninAddress, dailyFee, freeDays);
  // 3. Display the response to the user
  await interaction.reply({
    content: stripIndents`
    ${bold('Successfully created a new team!')}
    Team Number: ${inlineCode(`${teamID}`)}
    Team Ronin Address: ${inlineCode(`${teamRoninAddress}`)}
    Team Daily Fee: ${inlineCode(`${dailyFee}`)}
    Team Days Without Fee: ${inlineCode(`${dailyFee}`)}
    `,
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
    .addNumberOption(option =>
      option
        .setName('daily-fee')
        .setDescription('Fee to be charged daily')
        .setRequired(true))
    .addNumberOption(option =>
      option
        .setName('free-days')
        .setDescription('Days without fee')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await createTeam(interaction);
  },
};