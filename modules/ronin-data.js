import axios from 'axios';
import applyCaseMiddleware from 'axios-case-converter';

export const getRoninData = async (roninAddress) => {
  try {
    const client = applyCaseMiddleware.default(axios.create());
    const { data } = await client.get(`https://game-api.axie.technology/api/v2/${roninAddress},null`);
    return data;
  } catch (error) {
    console.error(error);
  }
};