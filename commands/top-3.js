const { SlashCommandBuilder, codeBlock } = require('@discordjs/builders');
const { AsciiTable3 } = require('ascii-table3');
const { many } = require('../db/db');

const getTop = async () => {
  const text = `
  SELECT scholars.full_name, teams.mmr FROM Scholars
  INNER JOIN teams
  ON scholars.discord_id = teams.discord_id
  ORDER BY mmr DESC
  LIMIT 3`;
  const top3 = await many(text);
  return top3;
};

const getTop3 = async (interaction) => {
  // 1. We obtain the top 3 of the scholarships
  const top3Scholars = await getTop();
  // 2. We make an array to display the leaderboard
  const orderedTop3 = top3Scholars.map(({ fullName, mmr }, index) => {
    const array = [`${index + 1}`, `${fullName}`, `${mmr}`];
    return array;
  });
  // 3. We create the table to display
  const top3Table = new AsciiTable3('Top 3 scholars of the week')
    .setHeading('Rating', 'Name', 'MMR')
    .setAlign(3)
    .addRowMatrix(orderedTop3)
    .setStyle('unicode-single');
  // 4. We display the table to the user
  await interaction.reply({ content: codeBlock(top3Table) });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('top-3')
    .setDescription('Show top 3 scholars'),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await getTop3(interaction);
  },
};