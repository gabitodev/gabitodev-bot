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
};