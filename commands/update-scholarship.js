const { SlashCommandBuilder } = require('@discordjs/builders');
const { many } = require('../database');
const { getRoninData } = require('../modules/ronin-api');
const { calcTeamStats } = require('../modules/team-stats');
const { updateScholar } = require('../modules/database-querys');

const getScholars = async () => {
  try {
    const scholars = await many({
      text: `
      SELECT * FROM teams
      INNER JOIN scholars 
      ON scholars.discord_id = teams.discord_id
      ORDER BY teams.team_id
      `,
    });
    return scholars;
  } catch (error) {
    return null;
  }

};

const updateScholarship = async (interaction) => {
  await interaction.reply('Updating scholarship...');

  // 1. We obtain all the shcolars
  const scholars = await getScholars();
  if (!scholars) return await interaction.editReply('Failed to update the scholarship because you dont have scholars or teams.');

  // 2. We obtain each ronin address
  const roninsAddresses = scholars.map(({ teamAddress }) => teamAddress);

  // 3. We obtain the ronin data
  const roninData = await getRoninData(roninsAddresses);

  // 4. We update each scholar to the database
  for (const scholarData of scholars) {
    const teamStats = calcTeamStats(scholarData, roninData);
    updateScholar(teamStats);
  }
  // 5. We display the response to the user
  await interaction.editReply('The scholarship has been updated.');
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update-scholarship')
    .setDescription('Updates the scholarship'),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await updateScholarship(interaction);
  },
};