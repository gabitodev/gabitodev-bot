const { DateTime, Interval } = require('luxon');

const getDaysToNextClaim = (lastClaim) => {
  const now = DateTime.now();
  const lastClaimDate = DateTime.fromISO(lastClaim);
  const difference = Interval.fromDateTimes(now, lastClaimDate);
  const days = difference.length('days');
  if (!days) {
    return 'Ready to claim';
  } else {
    return `${days.toFixed(0)} days`;
  }
};

exports.getDaysToNextClaim = getDaysToNextClaim;