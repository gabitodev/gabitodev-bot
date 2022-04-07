import { stripIndents } from 'common-tags';
import { SlashCommandBuilder, inlineCode, bold } from '@discordjs/builders';
import { db } from '../database/index.js';

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
    const discordId = interaction.options.getUser('discord-user').id;
    const name = interaction.options.getString('name');
    const payoutAddress = interaction.options.getString('payout-address');
    const member = await interaction.guild.members.fetch(discordId);
    const role = await interaction.guild.roles.fetch(process.env.SCHOLAR_ROLE_ID);

    // Check if role is correct
    if (!role) return await interaction.reply('Wrong role! Make sure it is correct.');
    // Check is ronin is valid and use the ronin prefix
    if (validateRoninAddress(payoutAddress) === false) {
      return await interaction.reply(`Wrong address! Make sure it starts with the ${inlineCode('ronin:')} prefix and is 46 characters long.`);
    }

    // 2. We create the scholar in the database and add Scholar Role
    db.prepare('INSERT INTO scholars (discord_id, full_name, ronin_address) VALUES (?, ?, ?)').run(discordId, name, payoutAddress);
    db.close();
    member.roles.add(role);

    // 3. Display the response to the user
    await interaction.reply({
      content: stripIndents`
      ${bold('Successfully created a new scholar!')}
      User: <@${discordId}>
      Name: ${inlineCode(name)}
      Payout Address: ${inlineCode(payoutAddress)}
      Role: <@&${process.env.SCHOLAR_ROLE_ID}>`,
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_PRIMARYKEY') {
      return await interaction.reply('A scholar already exists with that discord user.');
    } else {
      console.log(error);
      return await interaction.reply('An error has occurred with the command! Contact the owner of the discord server.');
    }
  }
};

export const command = {
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
        .setName('payout-address')
        .setDescription('Scholar payout address. Starts with the ronin: prefix')
        .setRequired(false)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await addScholar(interaction);
  },
};