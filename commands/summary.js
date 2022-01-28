const axios = require('axios').default;
const { AsciiTable3 } = require('ascii-table3');
const { inlineCode, bold, codeBlock, SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const CoinGecko = require('coingecko-api');
const { query } = require('../db');

const getRoninData = async (roninAddress) => {
  try {
    const { data } = await axios.get(`https://game-api.axie.technology/api/v1/${roninAddress}`);
    return data;
  } catch (error) {
    console.error(error);
  }
};

const setYesterdaySLP = async (yesterdaySlp, teamID) => {
  const text = `
  UPDATE teams
  SET yesterday_slp = $1 
  WHERE team_id = $2`;
  const values = [`${yesterdaySlp}`, `${teamID}`];
  const res = await query(text, values);
  return res;
};

const getScholars = async () => {
  const text = `
  SELECT * FROM teams
  INNER JOIN scholars 
  ON scholars.discord_id = teams.discord_id 
  ORDER BY teams.team_id`;
  const { rows } = await query(text);
  return rows;
};

const getTeams = (scholars) => {
  const teams = scholars.map(({
    team_id,
    last_claim,
    next_claim,
    unclaimed_slp,
    manager_slp,
    scholar_slp,
    mmr,
    average_slp,
    today_slp,
    full_name }) => {
    const array = [
      `${team_id}`,
      `${full_name}`,
      `${last_claim.toISOString().substring(0, 10)}`,
      `${next_claim.toISOString().substring(0, 10)}`,
      `${unclaimed_slp}`,
      `${manager_slp}`,
      `${scholar_slp}`,
      `${mmr}`,
      `${average_slp}`,
      `${today_slp}`,
    ];
    return array;
  });
  return teams;
};

const getSummary = async (interaction) => {
  await interaction.reply('Loading the scholarship summary...');
  // 1. We get the total SLP from my ronin address
  const { total_slp: mainAccountSlp } = await getRoninData(process.env.RONIN);
  // 2. We obtain all the scholars
  const scholars = await getScholars();
  // 3. We obtain the teams array to display to the user
  const teams = getTeams(scholars);
  // 4. we obtain the total of unclaimed SLP and the manager SLP
  const allManagerSLP = scholars.map(({ manager_slp }) => manager_slp);
  const totalManagerSLP = allManagerSLP.reduce((sum, item) => sum += item, 0);
  const allUnclaimedSLP = scholars.map(({ unclaimed_slp }) => unclaimed_slp);
  const totalUnclaimedSLP = allUnclaimedSLP.reduce((sum, item) => sum += item, 0);
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
  const priceSlpUsd = priceSlpData.data['smooth-love-potion'].usd;
  // 6. We display the summary to the user
  await interaction.editReply({
    content: stripIndents`
    ${bold('Gabitodev Scholarship')}
    Total Shcolarship SLP = ${inlineCode(`${totalUnclaimedSLP}`)}
    Total Manager SLP = ${inlineCode(`${totalManagerSLP}`)}
    Total Main Account SLP = ${inlineCode(`${mainAccountSlp}`)}
    Total Manager USD = ${inlineCode(`${((mainAccountSlp + totalManagerSLP) * priceSlpUsd).toFixed(2)}$`)}`,
  });
  await interaction.followUp({ content: codeBlock(table) });
  // 7. Set the yesterday SLP equal to the unclaimed SLP
  for (const { unclaimed_slp: unclaimedSLP, team_id: teamID } of scholars) {
    setYesterdaySLP(unclaimedSLP, teamID);
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