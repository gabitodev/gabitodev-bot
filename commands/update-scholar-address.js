import { SlashCommandBuilder, inlineCode } from '@discordjs/builders';
import { db } from '../database/index.js';

const validateRoninAddress = (scholarAddress) => {
  if (!scholarAddress) {
    return;
  } else if (!scholarAddress.startsWith('ronin:') || scholarAddress.length !== 46) {
    return false;
  }
};

const updateScholarRonin = async (interaction) => {
  // 1. We define the variables
  const scholarAddress = interaction.options.getString('payout-address');
  const discordId = interaction.options.getUser('discord-user').id;

  // Check is ronin is valid and use the ronin prefix
  if (validateRoninAddress(scholarAddress) === false) {
    return await interaction.reply(`Wrong address! Make sure it starts with the ${inlineCode('ronin:')} prefix and is complete.`);
  }

  // 2. We update the new ronin address to the database
  const { changes } = db.prepare('UPDATE scholars SET payout_address = ? WHERE discord_id = ?').run(scholarAddress, discordId);

  if (changes === 0) return await interaction.reply('The address could not be updated because the discord user is not a scholar.');

  // 3. We display the response to the user
  await interaction.reply(`Assigned ${inlineCode(scholarAddress)} ronin address to scholar <@${discordId}>.`);
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-scholar-address')
    .setDescription('Updates the scholar payout address')
    .addStringOption(option =>
      option
        .setName('payout-address')
        .setDescription('The new payout address')
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