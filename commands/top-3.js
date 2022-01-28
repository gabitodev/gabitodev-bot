const { SlashCommandBuilder, codeBlock } = require('@discordjs/builders');
const { AsciiTable3 } = require('ascii-table3');
const { query } = require('../db');

const getTop = async () => {
  const text = `
  SELECT scholars.full_name, teams.mmr FROM Scholars
  INNER JOIN teams
  ON scholars.discord_id = teams.discord_id
  ORDER BY mmr DESC
  LIMIT 3`;
  const { rows } = await query(text);
  return rows;
};

const getTop3 = async (interaction) => {
  // 1. We obtain the top 3 of the scholarships
  const top3Scholars = await getTop();
  // 2. We make an array to display the leaderboard
  const top3Ordered = top3Scholars.map(({ full_name, mmr }, index) => {
    const array = [`${index + 1}`, `${full_name}`, `${mmr}`];
    return array;
  });
  // 3. We create the table to display
  const top3Table = new AsciiTable3('Top 3 becados de la semana')
    .setHeading('Rating', 'Name', 'MMR')
    .setAlign(3)
    .addRowMatrix(top3Ordered)
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