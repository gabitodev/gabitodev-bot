const { none } = require('../database');

module.exports = {
  async updateScholar({ lastClaim, nextClaim, inGameSlp, managerSlp, scholarSlp, mmr, averageSlp, todaySlp, teamId }) {
    const text = `
    UPDATE teams
    SET
      last_claim = $1,
      next_claim = $2,
      in_game_slp = $3,
      manager_slp = $4,
      scholar_slp = $5,
      mmr = $6,
      average_slp = $7,
      today_slp = $8
    WHERE team_id = $9`;
    const values = [
      lastClaim,
      nextClaim,
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