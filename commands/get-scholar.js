const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { many } = require('../database');
const { getRoninData } = require('../modules/ronin-api');
const { calcTeamStats } = require('../modules/team-stats');
const { daysToNextClaim } = require('../modules/utils-date');

const getScholar = async (discordId) => {
  try {
    const scholar = await many({
      text: `
      SELECT scholars.scholar_address, teams.team_id, teams.team_address, teams.daily_fee, teams.free_days, teams.yesterday_slp FROM Teams
      INNER JOIN scholars
      ON scholars.discord_id = teams.discord_id
      WHERE scholars.discord_id = $1
      ORDER BY teams.team_id
      `,
      values: [discordId],
    });
    return scholar;
  } catch (error) {
    return null;
  }
};

const getScholarTeams = async (scholar) => {
  const scholarTeams = [];
  for (const team of scholar) {
    const { teamAddress } = team;
    const roninData = await getRoninData(teamAddress);
    const teamStats = calcTeamStats(team, roninData);
    scholarTeams.push(teamStats);
  }
  return scholarTeams;
};

const createScholarEmbed = (scholarTeams, scholarAddress, discordId) => {
  const scholarEmbed = scholarTeams.map(({
    teamId,
    nextClaim,
    scholarSlp,
    averageSlp,
    mmr }) => {
    const embed = new MessageEmbed()
      .setColor('#eec300')
      .setTitle('Scholar Information')
      .setDescription(`<@${discordId}>`)
      .addFields(
        { name: '🏠 Ronin Address', value: `${scholarAddress}`, inline: false },
        { name: '🆔 Account Name', value: `Gabitodev #${teamId}`, inline: true },
        { name: '🗓 Next Claim', value: `${nextClaim}`, inline: true },
        { name: '🗓 Days to Next Claim', value: `${daysToNextClaim(nextClaim)}`, inline: true },
        { name: '✅ Scholar SLP', value: `${scholarSlp}`, inline: true },
        { name: '📈 MMR', value: `${mmr}`, inline: true },
        { name: '📊 Average SLP', value: `${averageSlp}`, inline: true },
      );
    return embed;
  });
  return scholarEmbed;
};

const getScholarInfo = async (interaction) => {
  await interaction.reply('Loading scholar information...');
  // 1. We obtain the information of the scholar
  const discordId = interaction.options.getUser('discord-user').id;
  const scholar = await getScholar(discordId);
  // 2. We verify that the scholar exists in the database
  if (!scholar) return interaction.editReply('Failed to get the information because the discord user is not a scholar.');
  // 3. We calc the stats of the team and update the database
  const scholarTeams = await getScholarTeams(scholar);
  // 4. We get the scholar address
  const { scholarAddress } = scholar[0];

  // 5. Display the response to the user
  await interaction.editReply({
    content: 'Loaded the scholar information correctly!',
    embeds: createScholarEmbed(scholarTeams, scholarAddress, discordId),
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('get-scholar')
    .setDescription('Shows the information of the scholar')
    .addUserOption(option =>
      option
        .setName('discord-user')
        .setDescription('Scholar discord user')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.user.id !== interaction.guild.ownerId) return;
    await getScholarInfo(interaction);
  },
};