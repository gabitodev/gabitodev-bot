const { DateTime, Interval } = require('luxon');
const { formatDate } = require('./utils-date');

const calcDaysSinceLastClaim = (date) => {
  const now = DateTime.now();
  const lastClaimDate = DateTime.fromISO(date);
  const difference = Interval.fromDateTimes(lastClaimDate, now);
  const days = Math.floor(difference.length('days'));
  return days;
};

const calcScholarFee = (date, freeDays, dailyFee, inGameSlp, mmr) => {
  if (dailyFee > 1) {
    const daysSinceLastClaim = calcDaysSinceLastClaim(date);
    let fee = dailyFee * (daysSinceLastClaim - freeDays);
    fee = Math.max(0, fee);
    return fee;
  } else if (mmr < 1300 && dailyFee === 0) {
    return inGameSlp * 0.60;
  } else if (mmr < 1700 && dailyFee === 0) {
    return inGameSlp * 0.50;
  } else if (mmr < 2200 && dailyFee === 0) {
    return inGameSlp * 0.40;
  } else {
    return inGameSlp * dailyFee;
  }
};

const calcScholarSLP = (total, manager) => {
  const scholarSLP = total - manager;
  return scholarSLP;
};

const calcAverageSLP = (slp, date) => {
  const daysSinceLastClaim = calcDaysSinceLastClaim(date);
  if (daysSinceLastClaim === 0) {
    const average = 0;
    return average;
  } else {
    const average = (slp / daysSinceLastClaim);
    return Math.round(average);
  }
};

module.exports = {
  calcTeamStats(teamData, roninData) {
    const { freeDays, teamId, dailyFee, teamAddress, yesterdaySlp } = teamData;
    const { lastClaim: lastClaimUnix, nextClaim: nextClaimUnix, inGameSlp, mmr } = roninData[teamAddress];
    const lastClaim = formatDate(lastClaimUnix);
    const nextClaim = formatDate(nextClaimUnix);
    const managerSlp = calcScholarFee(lastClaim, freeDays, dailyFee, inGameSlp, mmr);
    const scholarSlp = calcScholarSLP(inGameSlp, managerSlp);
    const averageSlp = calcAverageSLP(inGameSlp, lastClaim);
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
  },
};