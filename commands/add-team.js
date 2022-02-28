import { stripIndents } from 'common-tags';
import { SlashCommandBuilder, inlineCode, bold } from '@discordjs/builders';
import { db } from '../database/index.js';

const createTeam = async (interaction) => {
  try {
    // 1. We define the variables
    const teamId = interaction.options.getNumber('team-id');
    const roninAddress = interaction.options.getString('ronin-address');
    const dailyFee = interaction.options.getNumber('daily-fee');

    // Check is ronin is valid and use the ronin prefix
    if (!roninAddress.startsWith('0x') || roninAddress.length !== 42) {
      return await interaction.reply(`Wrong address! Make sure it starts with the ${inlineCode('0x')} prefix and is complete.`);
    }

    // 2. We create the team in the database
    db.prepare('INSERT INTO teams (team_id, ronin_address, daily_fee) VALUES (?, ?, ?)').run(teamId, roninAddress, dailyFee);

    // 3. Display the response to the user
    await interaction.reply({
      content: stripIndents`
      ${bold('Successfully created a new team!')}
      Number: ${inlineCode(teamId)}
      Ronin address: ${inlineCode(roninAddress)}
      Daily fee: ${inlineCode(dailyFee)}
      `,
    });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      return await interaction.reply('A team already exists with that number or ronin address.');
    } else {
      console.log(error);
      return await interaction.reply('An error has occurred with the command! Contact the owner of the discord server.');
    }
  }
};

export const command = {
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
        .setDescription('Team ronin address. Starts with 0x')
        .setRequired(true))
    .addNumberOption(option =>
      option
        .setName('daily-fee')
        .setDescription('Fee to be charged daily')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await createTeam(interaction);
  },
};