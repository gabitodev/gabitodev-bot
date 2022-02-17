const { DateTime, Interval } = require('luxon');

module.exports = {
  calcHoursPassed(updatedAt) {
    const now = DateTime.now();
    const updatedAtDate = DateTime.fromJSDate(updatedAt);
    const difference = Interval.fromDateTimes(updatedAtDate, now);
    const hours = difference.length('hour');
    return hours;
  },
  formatDate(unixDate) {
    const date = (DateTime.fromSeconds(unixDate)).toISODate();
    return date;
  },
  daysToNextClaim(lastClaim) {
    const now = DateTime.now();
    const lastClaimDate = DateTime.fromISO(lastClaim);
    const difference = Interval.fromDateTimes(now, lastClaimDate);
    const days = difference.length('days');
    return `${days.toFixed(0)} days`;
  },
};