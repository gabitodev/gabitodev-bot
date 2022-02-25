import { DateTime, Interval } from 'luxon';

const getIsoDateFromSeconds = (unixDate) => {
  const date = (DateTime.fromSeconds(unixDate)).toISODate();
  return date;
};

const getDaysSinceLastClaim = (date) => {
  const now = DateTime.now();
  const lastClaimDate = DateTime.fromISO(date);
  const difference = Interval.fromDateTimes(lastClaimDate, now);
  const days = Math.floor(difference.length('days'));
  return days;
};

const calcScholarFee = (daysSinceLastClaim, freeDays, dailyFee, inGameSlp) => {
  if (dailyFee > 1) {
    const fee = Math.max(0, dailyFee * (daysSinceLastClaim - freeDays));
    return fee;
  } else {
    return Math.round(inGameSlp * dailyFee);
  }
};

const calcAverageSLP = (slp, daysSinceLastClaim) => {
  if (daysSinceLastClaim === 0) {
    return 0;
  } else {
    const average = Math.round(slp / daysSinceLastClaim);
    return average;
  }
};

export const getTeamSummary = (teamData, roninData) => {
  const { freeDays, teamId, dailyFee, teamAddress, yesterdaySlp } = teamData;
  const { lastClaim: lastClaimUnix, nextClaim: nextClaimUnix, inGameSlp, mmr } = roninData[teamAddress];
  const lastClaim = getIsoDateFromSeconds(lastClaimUnix);
  const nextClaim = getIsoDateFromSeconds(nextClaimUnix);
  const daysSinceLastClaim = getDaysSinceLastClaim(lastClaim);
  const managerSlp = calcScholarFee(daysSinceLastClaim, freeDays, dailyFee, inGameSlp);
  const averageSlp = calcAverageSLP(inGameSlp, daysSinceLastClaim);
  const scholarSlp = inGameSlp - managerSlp;
  const todaySlp = inGameSlp - yesterdaySlp;
  const teamStats = {
    teamId,
    lastClaim,
    nextClaim,
    inGameSlp,
    managerSlp,
    scholarSlp,
    mmr,
    averageSlp,
    todaySlp,
  };
  return teamStats;
};