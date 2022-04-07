import { AsciiTable3 } from 'ascii-table3';
import { inlineCode, bold, codeBlock, SlashCommandBuilder } from '@discordjs/builders';
import { stripIndents } from 'common-tags';
import { db } from '../database/index.js';
import { getRoninData } from '../modules/ronin-data.js';
import { convertSlpToUsd } from '../modules/slp-convertion.js';

const getScholars = () => {
  const scholars = db.prepare(`
  SELECT 
    team_id AS teamId,
    last_claim AS lastClaim,
    next_claim AS nextClaim,
    in_game_slp AS inGameSlp,
    manager_slp AS managerSlp,
    scholar_slp AS scholarSlp,
    mmr,
    average_slp AS averageSlp,
    today_slp AS todaySlp
  FROM teams
  WHERE renter_discord_id IS NOT NULL
  ORDER BY team_id
  `).all();
  return scholars;
};

const getSummary = async (interaction) => {
  await interaction.reply('Loading the scholarship summary...');

  // 1. We get the total SLP from the owner address
  const mainAccount = await getRoninData(process.env.MANAGER_RONIN);
  const { totalSlp: mainAccountSlp } = mainAccount[process.env.MANAGER_RONIN];

  if (mainAccountSlp === undefined) return await interaction.editReply('No owner ronin address added! Make sure to add a valid ronin address.');

  // 2. We obtain all the scholars
  const scholars = getScholars();

  // 3. We obtain the teams array to display to the user
  const teams = scholars.map(({ teamId, lastClaim, nextClaim, inGameSlp, managerSlp, scholarSlp, mmr, averageSlp, todaySlp }) => {
    const teamsArray = [teamId, lastClaim, nextClaim, inGameSlp, managerSlp, scholarSlp, mmr, averageSlp, todaySlp];
    return teamsArray;
  });

  // 4. we obtain the total of in game Slp and the manager Slp
  const totalManagerSlp = scholars.map(({ managerSlp }) => managerSlp).reduce((sum, item) => sum += item, 0);
  const totalInGameSlp = scholars.map(({ inGameSlp }) => inGameSlp).reduce((sum, item) => sum += item, 0);
  const totalOwnerSlp = mainAccountSlp + totalManagerSlp;
  const totalOwnerUsd = await convertSlpToUsd(totalOwnerSlp);

  // 5. We create the table
  const table = new AsciiTable3('')
    .setHeading('Team', 'Last Claim', 'Next Claim', 'In Game SLP', 'Fees SLP', 'Scholar SLP', 'MMR', 'Average SLP', 'Today SLP')
    .setAlign(3)
    .addRowMatrix(teams)
    .setStyle('unicode-single');

  // 6. We display the summary to the user
  await interaction.editReply({
    content: stripIndents`
    ${bold('Gabitodev Scholarship')}
    Shcolarship SLP: ${inlineCode(totalInGameSlp)}
    Manager SLP: ${inlineCode(totalManagerSlp)}
    Main Account SLP: ${inlineCode(mainAccountSlp)}
    Manager USD: ${inlineCode(totalOwnerUsd)}
    `,
  });
  await interaction.followUp(codeBlock(table));

  // 7. Set the yesterday SLP equal to the unclaimed SLP
  for (const { inGameSlp, teamId } of scholars) {
    db.prepare('UPDATE teams SET yesterday_slp = ? WHERE team_id = ?').run(inGameSlp, teamId);
  }
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('summary')
    .setDescription('Shows the summary of the scholarship'),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await getSummary(interaction);
  },
};