import { SlashCommandBuilder } from '@discordjs/builders';
import { MessageEmbed } from 'discord.js';
import { DateTime, Interval } from 'luxon';
import { getRoninData } from '../modules/ronin-data.js';
import { db } from '../database/index.js';
import { getDaysToNextClaim } from '../modules/days-next-claim.js';
import { getTeamSummary } from '../modules/team-summary.js';
import { updateScholar } from '../modules/update-scholar.js';
import { convertSlpToUsd } from '../modules/slp-convertion.js';

const getScholarTeam = (teamId) => {
  const scholarTeam = db.prepare(`
  SELECT 
  team_id AS teamId,
  updated_at AS updatedAt,
  renter_discord_id AS discordId,
  ronin_address AS teamAddress,
  next_claim AS nextClaim,
  in_game_slp AS inGameSlp,
  manager_slp AS managerSlp,
  scholar_slp AS scholarSlp,
  average_slp AS averageSlp,
  today_slp AS todaySlp,
  daily_fee AS dailyFee,
  free_days AS freeDays,
  yesterday_slp AS yesterdaySlp
  FROM teams WHERE team_id = ?
  `).get(teamId);
  return scholarTeam;
};

const getHoursPassedSinceUpdate = (updatedAt) => {
  const now = DateTime.now();
  const updatedAtDate = DateTime.fromSeconds(updatedAt);
  const difference = Interval.fromDateTimes(updatedAtDate, now);
  const hours = difference.length('hour');
  return hours;
};

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
  const shcolarSlpInUsd = await convertSlpToUsd(scholarSlp);
  const daysToNextClaim = getDaysToNextClaim(nextClaimIso);
  const teamEmbed = new MessageEmbed()
    .setColor('#8ccf60')
    .setTitle('Scholar Balance')
    .setDescription(`Balance for scholar <@${interaction.user.id}>`)
    .addFields(
      { name: '📖 Team', value: `Gabitodev #${teamId}`, inline: true },
      { name: '🗓 Next Claim', value: `${nextClaimIso}`, inline: true },
      { name: '🗓 Time to Next Claim', value: `${daysToNextClaim}`, inline: true },
      { name: `${slpEmoji} In Game SLP`, value: `${inGameSlp}`, inline: true },
      { name: '🛑 Manager SLP', value: `${managerSlp}`, inline: true },
      { name: '✅ Scholar SLP', value: `${scholarSlp}`, inline: true },
      { name: '📊 Average SLP', value: `${averageSlp}`, inline: true },
      { name: '🔥 Today SLP', value: `${todaySlp}`, inline: true },
      { name: '💵 Scholar USD', value: `${shcolarSlpInUsd}`, inline: true },
    );
  return teamEmbed;
};

const getBalance = async (interaction) => {
  await interaction.reply('Loading the balance of your team...');

  // 1. We get the scholar team in the database
  const teamId = interaction.options.getNumber('team-id');
  const team = getScholarTeam(teamId);

  // 2.1 We verify that the scholar exist in the database
  if (!team) return await interaction.editReply('This team does not exist in the database.');
  const { teamAddress, updatedAt, discordId } = team;
  // 2.2 We verify that the scholar who runs the command is the owner of the team
  if (interaction.user.id !== discordId) {
    return await interaction.editReply('This is not your team.');
  }

  // 3. We verify that 3 hours have not passed since the last update of the database
  const hoursSinceUpdate = getHoursPassedSinceUpdate(updatedAt);
  if (hoursSinceUpdate <= 3) {
    return await interaction.editReply({
      content: 'Loaded the balance correctly!',
      embeds: [await createTeamEmbed(team, interaction)],
    });
  } else {
    // 4. We use the ronin address to get the SLP data on the scholar account.
    const roninData = await getRoninData(teamAddress);

    // 5. We use the data to do the calculations
    const teamSummary = getTeamSummary(team, roninData);

    // 6. We update the database
    updateScholar(teamSummary);

    // 7. Display the response to the user
    await interaction.editReply({
      content: 'Loaded the balance correctly!',
      embeds: [await createTeamEmbed(teamSummary, interaction)],
    });
  }
};

export const command = {
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