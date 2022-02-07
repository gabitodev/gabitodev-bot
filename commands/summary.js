require('dotenv').config();
const { AsciiTable3 } = require('ascii-table3');
const { inlineCode, bold, codeBlock, SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const CoinGecko = require('coingecko-api');
const { many, none } = require('../db/db');
const { getRoninData } = require('../modules/ronin-api');

const getScholars = async () => {
  const scholars = await many('SELECT * FROM teams INNER JOIN scholars ON scholars.discord_id = teams.discord_id ORDER BY teams.team_id');
  return scholars;
};

const getTeams = (scholars) => {
  const teams = scholars.map(({
    teamId,
    lastClaim,
    nextClaim,
    inGameSlp,
    managerSlp,
    scholarSlp,
    mmr,
    averageSlp,
    todaySlp,
    fullName }) => {
    const array = [
      teamId,
      fullName,
      lastClaim.toISOString().substring(0, 10),
      nextClaim.toISOString().substring(0, 10),
      inGameSlp,
      managerSlp,
      scholarSlp,
      mmr,
      averageSlp,
      todaySlp,
    ];
    return array;
  });
  return teams;
};

const getSummary = async (interaction) => {
  await interaction.reply('Loading the scholarship summary...');
  // 1. We get the total SLP from my ronin address
  const { totalSlp: mainAccountSlp } = await getRoninData(process.env.RONIN);
  // 2. We obtain all the scholars
  const scholars = await getScholars();
  // 3. We obtain the teams array to display to the user
  const teams = getTeams(scholars);
  // 4. we obtain the total of unclaimed SLP and the manager SLP
  const arrayManagerSlp = scholars.map(({ managerSlp }) => managerSlp);
  const totalManagerSlp = arrayManagerSlp.reduce((sum, item) => sum += item, 0);
  const arrayInGameSlp = scholars.map(({ inGameSlp }) => inGameSlp);
  const totalInGameSlp = arrayInGameSlp.reduce((sum, item) => sum += item, 0);
  // 5. We create the table
  const table = new AsciiTable3('')
    .setHeading('Team', 'Scholar', 'Last Claim', 'Next Claim', 'Unclaimed SLP', 'Fees SLP', 'Scholar SLP', 'MMR', 'Average SLP', 'Today SLP')
    .setAlign(3)
    .addRowMatrix(teams)
    .setStyle('unicode-single');
  // 6. Convert SLP to USD.
  const CoinGeckoClient = new CoinGecko;
  const priceSlpData = await CoinGeckoClient.simple.price({
    ids: 'smooth-love-potion',
    vs_currencies: 'usd',
  });
  const slpPriceUsd = priceSlpData.data['smooth-love-potion'].usd;
  // 6. We display the summary to the user
  await interaction.editReply({
    content: stripIndents`
    ${bold('Gabitodev Scholarship')}
    Total Shcolarship SLP = ${inlineCode(totalInGameSlp)}
    Total Manager SLP = ${inlineCode(totalManagerSlp)}
    Total Main Account SLP = ${inlineCode(mainAccountSlp)}
    Total Manager USD = ${inlineCode(((mainAccountSlp + totalManagerSlp) * slpPriceUsd).toFixed(2))}
    `,
  });
  await interaction.followUp({ content: codeBlock(table) });
  // 7. Set the yesterday SLP equal to the unclaimed SLP
  for (const { inGameSlp, teamId } of scholars) {
    await none('UPDATE teams SET yesterday_slp = $1  WHERE team_id = $2', [inGameSlp, teamId]);
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('summary')
    .setDescription('Shows the summary of the scholarship'),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await getSummary(interaction);
  },
};