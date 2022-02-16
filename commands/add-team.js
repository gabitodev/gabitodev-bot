const { stripIndents } = require('common-tags');
const { SlashCommandBuilder, inlineCode, bold } = require('@discordjs/builders');
const { none } = require('../database');

const validFreeDays = (freeDays) => {
  if (!freeDays) {
    return 0;
  } else {
    return freeDays;
  }
};

const createTeam = async (interaction) => {
  try {
    // 1. We define the variables
    const teamId = interaction.options.getNumber('team-id');
    const teamAddress = interaction.options.getString('ronin-address');
    const dailyFee = interaction.options.getNumber('daily-fee');
    const freeDays = validFreeDays(interaction.options.getNumber('free-days'));

    // Check is ronin is valid and use the ronin prefix
    if (!teamAddress.startsWith('ronin:') || teamAddress.length !== 46) {
      return await interaction.reply(`Wrong address! Make sure it starts with the ${inlineCode('ronin:')} prefix and is complete.`);
    }

    // 2. We create the team in the database
    await none({
      text: 'INSERT INTO teams (team_id, team_address, daily_fee, free_days) VALUES ($1, $2, $3, $4)',
      values: [teamId, teamAddress, dailyFee, freeDays],
    });

    // 3. Display the response to the user
    await interaction.reply({
      content: stripIndents`
      ${bold('Successfully created a new team!')}
      Number: ${inlineCode(teamId)}
      Ronin address: ${inlineCode(teamAddress)}
      Daily fee: ${inlineCode(dailyFee)}
      Days without fee: ${inlineCode(freeDays)}
      `,
    });
  } catch (error) {
    if (error.code === '23505') {
      return await interaction.reply('A team already exists with that number or ronin address.');
    } else {
      console.log(error);
    }
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-team')
    .setDescription('Adds a new team')
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
        .setRequired(false)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await createTeam(interaction);
  },
};