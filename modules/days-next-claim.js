import { DateTime, Interval } from 'luxon';

export const getDaysToNextClaim = (lastClaim) => {
  const now = DateTime.now();
  const lastClaimDate = DateTime.fromISO(lastClaim);
  const difference = Interval.fromDateTimes(now, lastClaimDate);
  const { hours, minutes } = difference.toDuration(['hours', 'minutes']).toObject();
  const days = difference.length('days');
  if (!days) {
    return 'Ready to claim';
  } else if (days < 1) {
    return `In ${hours} hours and ${Math.floor(minutes)} minutes`;
  } else {
    return `In ${Math.floor(days)} days`;
  }
};