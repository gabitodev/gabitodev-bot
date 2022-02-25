import { SlashCommandBuilder, codeBlock } from '@discordjs/builders';
import { AsciiTable3 } from 'ascii-table3';
import { db } from '../database/index.js';

const getTop = async () => {
  try {
    const top3 = await db.many({
      text:`
      SELECT scholars.scholar_name, teams.mmr FROM Scholars
      INNER JOIN teams
      ON scholars.discord_id = teams.discord_id
      ORDER BY mmr DESC
      LIMIT 3`,
    });
    return top3;
  } catch (error) {
    return null;
  }
};

const getTop3 = async (interaction) => {
  // 1. We obtain the top 3 of the scholarships
  const top3Scholars = await getTop();
  if (!top3Scholars) return await interaction.reply('There was an error loading the top 3! Verify that you have scholars.');

  // 2. We make an array to display the leaderboard
  const orderedTop3 = top3Scholars.map(({ scholarName, mmr }, index) => {
    const array = [index + 1, scholarName, mmr];
    return array;
  });

  // 3. We create the table to display
  const top3Table = new AsciiTable3('Top 3 scholars of the week')
    .setHeading('Rating', 'Name', 'MMR')
    .setAlign(3)
    .addRowMatrix(orderedTop3)
    .setStyle('unicode-single');

  // 4. We display the table to the user
  await interaction.reply(codeBlock(top3Table));
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('top-3')
    .setDescription('Show top 3 scholars'),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await getTop3(interaction);
  },
};