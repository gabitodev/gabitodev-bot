const { stripIndents } = require('common-tags');
const { SlashCommandBuilder, inlineCode, bold } = require('@discordjs/builders');
const { none } = require('../database');

const validateRoninAddress = (scholarAddress) => {
  if (!scholarAddress) {
    return;
  } else if (!scholarAddress.startsWith('ronin:') || scholarAddress.length !== 46) {
    return false;
  }
};

const addScholar = async (interaction) => {
  try {
    // 1. We define the variables
    const scholarDiscordId = interaction.options.getUser('discord-user').id;
    const scholarName = interaction.options.getString('name');
    const scholarAddress = interaction.options.getString('ronin-address');
    const member = await interaction.guild.members.fetch(scholarDiscordId);
    const role = await interaction.guild.roles.fetch(process.env.SCHOLAR_ROLE_ID);

    // Check if role is correct
    if (!role) return await interaction.reply('Wrong role! Make sure it is correct.');
    // Check is ronin is valid and use the ronin prefix
    if (validateRoninAddress(scholarAddress) === false) {
      return await interaction.reply(`Wrong address! Make sure it starts with the ${inlineCode('ronin:')} prefix and is complete.`);
    }

    // 2. We create the scholar in the database and add Scholar Role
    await none({
      text: 'INSERT INTO scholars (discord_id, scholar_name, scholar_address) VALUES ($1, $2, $3)',
      values: [scholarDiscordId, scholarName, scholarAddress],
    });
    member.roles.add(role);

    // 3. Display the response to the user
    await interaction.reply({
      content: stripIndents`
      ${bold('Successfully created a new scholar!')}
      User: <@${scholarDiscordId}>
      Name: ${inlineCode(scholarName)}
      Ronin Address: ${inlineCode(scholarAddress)}
      Role: <@&${process.env.SCHOLAR_ROLE_ID}>`,
    });
  } catch (error) {
    if (error.code === '23505') {
      return await interaction.reply('A scholar already exists with that discord user.');
    } else {
      console.log(error);
      return await interaction.reply('An error has occurred with the command! Contact the owner of the discord server.');
    }
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('add-scholar')
    .setDescription('Adds a new scholar')
    .addUserOption(option =>
      option
        .setName('discord-user')
        .setDescription('Scholar discord user')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Scholar name')
        .setRequired(true))
    .addStringOption(option =>
      option
        .setName('ronin-address')
        .setDescription('Scholar ronin address')
        .setRequired(false)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await addScholar(interaction);
  },
};