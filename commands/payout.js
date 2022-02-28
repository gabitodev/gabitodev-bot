import { db } from '../database/index.js';
import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';

const getScholarsForPayout = () => {
  const qualifiedScholarsForPayout = db.prepare(`
  SELECT 
    scholars.discord_id AS discordId,
    scholars.ronin_address AS scholarAddress,
    teams.team_id AS teamId,
    teams.in_game_slp AS inGameSlp,
    teams.manager_slp AS managerSlp,
    teams.scholar_slp AS scholarSlp,
    teams.next_claim AS nextClaim
  FROM teams
  INNER JOIN scholars
  ON scholars.discord_id = teams.renter_discord_id
  WHERE next_claim < Datetime('now')
  ORDER BY teams.team_id
  `).all();
  return qualifiedScholarsForPayout;
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
  const scholars = getScholarsForPayout();
  if (scholars.length === 0) return await interaction.editReply('No scholars aviable for payout.');

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