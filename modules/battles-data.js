import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';

export const getBattlesData = async (roninAddress) => {
  try {
    const { get } = applyCaseMiddleware.default(axios.create());
    const { data } = await get(`https://game-api.axie.technology/logs/pvp/${roninAddress}`);
    return data;
  } catch (error) {
    console.error(error);
  }
};