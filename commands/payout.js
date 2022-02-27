import { db } from '../database/index.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';

const getScholarsForPayout = async () => {
  try {
    return await db.many({
      text: `
      SELECT 
      scholars.discord_id, scholars.scholar_address, teams.team_id, teams.in_game_slp, teams.manager_slp, teams.scholar_slp, teams.next_claim 
      FROM teams
      INNER JOIN scholars
      ON scholars.discord_id = teams.discord_id
      WHERE next_claim < now()
      ORDER BY teams.team_id`,
    });
  } catch (error) {
    console.log(error);
    return [];
  }
};

const createPayoutEmbed = (scholars, interaction) => {
  const slpEmoji = interaction.guild.emojis.cache.find(emoji => emoji.name === 'slp');
  const payoutEmbed = scholars.map(({ discordId, teamId, inGameSlp, managerSlp, scholarSlp, scholarAddress }) => {
    const embed = new MessageEmbed()
      .setColor('#8ccf60')
      .setTitle(`Payout for team #${teamId}`)
      .setDescription(`<@${discordId}>`)
      .addFields(
        { name: '🏠 Ronin Address', value: `${scholarAddress}`, inline: false },
        { name: `${slpEmoji} In Game SLP`, value: `${inGameSlp}`, inline: true },
        { name: '🛑 Manager SLP', value: `${managerSlp}`, inline: true },
        { name: '✅ Scholar SLP', value: `${scholarSlp}`, inline: true },
      );
    return embed;
  });
  return payoutEmbed;
};

const payout = async (interaction) => {
  await interaction.reply('Loading payout...');
  // 1. We get the scholars for the payout
  const scholars = await getScholarsForPayout();
  if (!scholars) return await interaction.editReply('There was an error showing the payout! Verify that you have scholars.');

  // 2. We load the response to the user
  await interaction.editReply({
    content: 'Loaded payout correctly!',
    embeds: createPayoutEmbed(scholars, interaction),
  });
};


export const command = {
  data: new SlashCommandBuilder()
    .setName('payout')
    .setDescription('See who scholars qualified for a payout'),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await payout(interaction);
  },
};