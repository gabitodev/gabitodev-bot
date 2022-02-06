const { none } = require('../db/db');

module.exports = {
  async updateScholar({ lastClaimDate, nextClaimDate, inGameSlp, managerSlp, scholarSlp, mmr, averageSlp, todaySlp, teamId }) {
    const text = `
    UPDATE teams
    SET
      last_claim = $1,
      next_claim = $2,
      unclaimed_slp = $3,
      manager_slp = $4,
      scholar_slp = $5,
      mmr = $6,
      average_slp = $7,
      today_slp = $8
    WHERE team_id = $9`;
    const values = [
      lastClaimDate,
      nextClaimDate,
      inGameSlp,
      managerSlp,
      scholarSlp,
      mmr,
      averageSlp,
      todaySlp,
      teamId,
    ];
    await none(text, values);
  },
};