const { SlashCommandBuilder, inlineCode } = require('@discordjs/builders');
const { result } = require('../database');

const validateRoninAddress = (scholarAddress) => {
  if (!scholarAddress) {
    return;
  } else if (!scholarAddress.startsWith('ronin:') || scholarAddress.length !== 46) {
    return false;
  }
};

const updateScholarRonin = async (interaction) => {
  // 1. We define the variables
  const scholarAddress = interaction.options.getString('ronin-address');
  const discordId = interaction.options.getUser('discord-user').id;

  // Check is ronin is valid and use the ronin prefix
  if (validateRoninAddress(scholarAddress) === false) {
    return await interaction.reply(`Wrong address! Make sure it starts with the ${inlineCode('ronin:')} prefix and is complete.`);
  }

  // 2. We update the new ronin address to the database
  const { rowCount } = await result({
    text: 'UPDATE scholars SET scholar_address = $1 WHERE discord_id = $2',
    values: [scholarAddress, discordId],
  });
  if (rowCount === 0) return await interaction.reply('The address could not be updated because the discord user is not a scholar.');

  // 3. We display the response to the user
  await interaction.reply(`Assigned ${inlineCode(`${scholarAddress}`)} ronin address to scholar <@${discordId}>.`);
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update-scholar-address')
    .setDescription('Updates the scholar ronin address')
    .addStringOption(option =>
      option
        .setName('ronin-address')
        .setDescription('The new ronin address')
        .setRequired(true))
    .addUserOption(option =>
      option
        .setName('discord-user')
        .setDescription('Scholar discord user')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await updateScholarRonin(interaction);
  },
};