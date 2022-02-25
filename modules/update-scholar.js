import { db } from '../database/index.js';

export const updateScholar = async ({ lastClaim, nextClaim, inGameSlp, managerSlp, scholarSlp, mmr, averageSlp, todaySlp, teamId }) => {
  await db.none({
    text: `
    UPDATE teams
    SET last_claim = $1, next_claim = $2, in_game_slp = $3, manager_slp = $4, scholar_slp = $5, mmr = $6, average_slp = $7, today_slp = $8
    WHERE team_id = $9`,
    values: [lastClaim, nextClaim, inGameSlp, managerSlp, scholarSlp, mmr, averageSlp, todaySlp, teamId],
  });
};