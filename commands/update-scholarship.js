import { db } from '../database/index.js';
import { getRoninData } from '../modules/ronin-data.js';
import { getTeamSummary } from '../modules/team-summary.js';
import { updateScholar } from '../modules/update-scholar.js';
import { SlashCommandBuilder } from '@discordjs/builders';

const getScholars = () => {
  const scholars = db.prepare(`
  SELECT 
    team_id AS teamId,
    ronin_address AS teamAddress,
    daily_fee AS dailyFee,
    free_days AS freeDays,
    yesterday_slp AS yesterdaySlp
  FROM teams
  WHERE renter_discord_id IS NOT NULL
  ORDER BY team_id
  `).all();
  return scholars;
};

const updateScholarship = async (interaction) => {
  await interaction.reply('Updating the database...');
  // 1. We obtain all the shcolars
  const scholars = getScholars();

  // 2. We obtain each ronin address
  const roninsAddresses = scholars.map(({ teamAddress }) => teamAddress);

  // 3. We obtain the ronin data
  const roninData = await getRoninData(roninsAddresses);

  // 4. We update each scholar to the database
  for (const scholarData of scholars) {
    const teamSummary = getTeamSummary(scholarData, roninData);
    updateScholar(teamSummary);
  }
  await interaction.editReply('The scholarship has been updated.');
};

export const command = {
  data: new SlashCommandBuilder()
    .setName('update-scholarship')
    .setDescription('Updates scholarship'),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await updateScholarship(interaction);
  },
};