const { AsciiTable3 } = require('ascii-table3');
const { inlineCode, bold, codeBlock, SlashCommandBuilder } = require('@discordjs/builders');
const { stripIndents } = require('common-tags');
const { many, none } = require('../database');
const { getRoninData } = require('../modules/ronin-api');
const { getSlpInUsd } = require('../modules/coingecko-api');

const getScholars = async () => {
  const scholars = await many({
    text: 'SELECT * FROM teams INNER JOIN scholars ON scholars.discord_id = teams.discord_id ORDER BY teams.team_id',
  });
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
    scholarName }) => {
    const array = [
      teamId,
      scholarName,
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

  // 1. We get the total SLP from the owner address
  const mainAccount = await getRoninData(process.env.MANAGER_RONIN);
  const { totalSlp: mainAccountSlp } = mainAccount[process.env.MANAGER_RONIN];

  if (!mainAccountSlp) return await interaction.editReply('No owner ronin address added! Make sure to add a valid ronin address.');

  // 2. We obtain all the scholars
  const scholars = await getScholars();

  // 3. We obtain the teams array to display to the user
  const teams = getTeams(scholars);

  // 4. we obtain the total of in game Slp and the manager Slp
  const totalManagerSlp = scholars.map(({ managerSlp }) => managerSlp).reduce((sum, item) => sum += item, 0);
  const totalInGameSlp = scholars.map(({ inGameSlp }) => inGameSlp).reduce((sum, item) => sum += item, 0);
  const totalOwnerSlp = mainAccountSlp + totalManagerSlp;
  const totalOwnerUsd = await getSlpInUsd(totalOwnerSlp);

  // 5. We create the table
  const table = new AsciiTable3('')
    .setHeading('Team', 'Scholar', 'Last Claim', 'Next Claim', 'In Game SLP', 'Fees SLP', 'Scholar SLP', 'MMR', 'Average SLP', 'Today SLP')
    .setAlign(3)
    .addRowMatrix(teams)
    .setStyle('unicode-single');

  // 6. We display the summary to the user
  await interaction.editReply({
    content: stripIndents`
    ${bold('Gabitodev Scholarship')}
    Shcolarship SLP: ${inlineCode(totalInGameSlp)}
    Manager SLP: ${inlineCode(totalManagerSlp)}
    Main Account SLP: = ${inlineCode(mainAccountSlp)}
    Manager USD: ${inlineCode(totalOwnerUsd)}
    `,
  });
  await interaction.followUp(codeBlock(table));

  // 7. Set the yesterday SLP equal to the unclaimed SLP
  for (const { inGameSlp, teamId } of scholars) {
    await none({
      text: 'UPDATE teams SET yesterday_slp = $1  WHERE team_id = $2',
      values: [inGameSlp, teamId],
    });
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('summary')
    .setDescription('Shows the summary of the scholarship'),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await getSummary(interaction);
  },
};