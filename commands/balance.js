const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { getRoninData } = require('../modules/ronin-api');
const { oneOrNone } = require('../database');
const { calcHoursPassed, daysToNextClaim } = require('../modules/utils-date');
const { calcTeamStats } = require('../modules/team-stats');
const { updateScholar } = require('../modules/database-querys');
const { getSlpInUsd } = require('../modules/coingecko-api');

const getScholarTeam = async (teamId) => {
  const scholarTeam = await oneOrNone({
    text: 'SELECT * FROM teams WHERE team_id = $1',
    values: [teamId],
  });
  return scholarTeam;
};

// const makeBalanceChart = (scholarSlp, managerSlp) => {
//   const chart = {
//     type: 'pie',
//     data: {
//       datasets: [
//         {
//           data: [Math.max(0, scholarSlp), managerSlp],
//           backgroundColor: [
//             'rgb(118, 210, 117)',
//             'rgb(255, 134, 124)',
//           ],
//           label: 'SLP TOTAL',
//         },
//       ],
//       labels: ['Scholar', 'Fees'],
//     },
//     options: {
//       legend: {
//         labels: {
//           fontColor: 'white',
//         },
//       },
//     },
//   };
//   const encodedChart = encodeURIComponent(JSON.stringify(chart));
//   const chartUrl = `https://quickchart.io/chart?c=${encodedChart}`;
//   return chartUrl;
// };

const formatToIso = (date) => {
  if (date instanceof Date) {
    return date.toISOString().substring(0, 10);
  } else {
    return date;
  }
};

const createTeamEmbed = async (teamStats, interaction) => {
  const slpEmoji = interaction.guild.emojis.cache.find(emoji => emoji.name === 'slp');
  const { teamId, nextClaim, inGameSlp, managerSlp, scholarSlp, averageSlp, todaySlp } = teamStats;
  const nextClaimIso = formatToIso(nextClaim);
  const shcolarSlpInUsd = await getSlpInUsd(scholarSlp);
  const teamEmbed = new MessageEmbed ()
    .setColor('#eec300')
    .setTitle('Scholar Balance')
    .setDescription(`Balance for scholar <@${interaction.user.id}>`)
    .addFields(
      { name: '📖 Team', value: `Gabitodev #${teamId}`, inline: true },
      { name: '🗓 Next Claim', value: `${nextClaimIso}`, inline: true },
      { name: '🗓 Days to Next Claim', value: `${daysToNextClaim(nextClaimIso)}`, inline: true },
      { name: `${slpEmoji} In Game SLP`, value: `${inGameSlp}`, inline: true },
      { name: '🛑 Accrued fees', value: `${managerSlp}`, inline: true },
      { name: '✅ Scholar SLP', value: `${scholarSlp}`, inline: true },
      { name: '📊 Average SLP', value: `${averageSlp}`, inline: true },
      { name: '🔥 Today SLP', value: `${todaySlp}`, inline: true },
      { name: '💵 Scholar USD', value: `${shcolarSlpInUsd}`, inline: true },
    );
    // .setImage(`${makeBalanceChart(scholarSlp, managerSlp)}`);
  return teamEmbed;
};

const getBalance = async (interaction) => {
  await interaction.reply('Loading the balance of your team...');
  // 1. We get the scholar team in the database
  const teamId = interaction.options.getNumber('team-id');
  const team = await getScholarTeam(teamId);

  // 2.1 We verify that the scholar exist in the database
  if (!team) return await interaction.editReply('This team does not exist in the database.');
  const { teamAddress, updatedAt, discordId } = team;
  // 2.2 We verify that the scholar who runs the command is the owner of the team
  if (interaction.user.id !== discordId) {
    return await interaction.editReply('This is not your team.');
  }

  // 3. We verify that 3 hours have not passed since the last update of the database
  const hoursSinceLastUpdate = calcHoursPassed(updatedAt);
  if (hoursSinceLastUpdate <= 3) {
    return await interaction.editReply({
      content: 'Loaded the balance correctly!',
      embeds: [await createTeamEmbed(team, interaction)],
    });
  } else {
    // 4. We use the ronin address to get the SLP data on the scholar account.
    const roninData = await getRoninData(teamAddress);

    // 5. We use the data to do the calculations
    const teamStats = calcTeamStats(team, roninData);

    // 6. We update the database
    await updateScholar(teamStats);

    // 7. Display the response to the user
    await interaction.editReply({
      content: 'Loaded the balance correctly!',
      embeds: [await createTeamEmbed(teamStats, interaction)],
    });
  }
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Show your team balance')
    .addNumberOption(option =>
      option
        .setName('team-id')
        .setDescription('Team number')
        .setRequired(true)),
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(process.env.SCHOLAR_ROLE_ID)) return;
    await getBalance(interaction);
  },
};