const { SlashCommandBuilder, inlineCode } = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
const { stripIndents } = require('common-tags');
const { many } = require('../db/db');
const { getRoninData } = require('../modules/ronin-data');
const { calcTeamStats } = require('../modules/team-stats');
const { updateScholar } = require('../modules/database-querys');

const getScholar = async (discordID) => {
  const text = `
  SELECT scholars.scholar_address, teams.team_id, teams.team_address, teams.daily_fee, teams.free_days, teams.yesterday_slp FROM Teams
  INNER JOIN scholars
  ON scholars.discord_id = teams.discord_id
  WHERE scholars.discord_id = $1
  ORDER BY teams.team_id`;
  const values = [discordID];
  const scholar = await many(text, values);
  return scholar;
};

const getScholarTeams = async (scholar) => {
  const scholarTeams = [];
  for (const team of scholar) {
    const { teamAddress } = team;
    const roninData = await getRoninData(teamAddress);
    const teamStats = calcTeamStats(team, roninData);
    updateScholar(teamStats);
    scholarTeams.push(teamStats);
  }
  return scholarTeams;
};

const createScholarEmbed = (scholarTeams, interaction) => {
  const slpEmoji = interaction.guild.emojis.cache.find(emoji => emoji.name === 'slp');
  const scholarEmbed = scholarTeams.map(({
    teamId,
    nextClaimDate,
    inGameSlp,
    managerSlp,
    scholarSlp,
    averageSlp,
    mmr }) => {
    const embed = new MessageEmbed()
      .setColor('#eec300')
      .setTitle(`Team #${teamId}`)
      .setDescription('')
      .addFields(
        { name: '🗓 Next Claim', value: `${nextClaimDate}`, inline: true },
        { name:  `${slpEmoji} Unclaimed SLP`, value: `${inGameSlp}`, inline: true },
        { name: '🛑 Accrued fees', value: `${managerSlp}`, inline: true },
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
  const discordId = interaction.options.getString('discord-id');
  const scholar = await getScholar(discordId);
  // 2. We verify that the scholar exists in the database
  if (scholar.length === 0) return interaction.editReply({ content: 'The scholar does not own a team!' });
  // 3. We calc the stats of the team and update the database
  const scholarTeams = await getScholarTeams(scholar);
  // 4. We get the scholar address
  const { scholarAddress } = scholar[0];
  // 5. Display the response to the user
  await interaction.editReply({
    content: stripIndents`
    Scholar: <@${discordId}>
    Ronin Address: ${inlineCode(`${scholarAddress}`)}`,
    embeds: createScholarEmbed(scholarTeams, interaction),
  });
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('get-scholar')
    .setDescription('Shows the information of the scholar')
    .addStringOption(option =>
      option
        .setName('discord-id')
        .setDescription('Scholar Discord ID')
        .setRequired(true)),
  async execute(interaction) {
    if (interaction.member.roles.cache.has('863179537324048414')) return;
    await getScholarInfo(interaction);
  },
};