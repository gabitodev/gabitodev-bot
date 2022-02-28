import { db } from '../database/index.js';

export const updateScholar = ({ lastClaim, nextClaim, inGameSlp, managerSlp, scholarSlp, mmr, averageSlp, todaySlp, teamId }) => {
  db.prepare(`
  UPDATE teams
    SET last_claim = ?, next_claim = ?, in_game_slp = ?, manager_slp = ?, scholar_slp = ?, mmr = ?, average_slp = ?, today_slp = ?
    WHERE team_id = ?
  `).run(lastClaim, nextClaim, inGameSlp, managerSlp, scholarSlp, mmr, averageSlp, todaySlp, teamId);
};