const { create } = require('axios').default;
const { default: applyCaseMiddleware } = require('axios-case-converter');

module.exports = {
  async getRoninData(roninAddress) {
    try {
      const { get } = applyCaseMiddleware(create());
      const { data } = await get(`https://game-api.axie.technology/api/v1/${roninAddress},null`);
      return data;
    } catch (error) {
      console.error(error);
    }
  },
  async getScholarBattles(roninAddress) {
    try {
      const { get } = applyCaseMiddleware(create());
      const { data } = await get(`https://game-api.axie.technology/logs/pvp/${roninAddress}`);
      return data;
    } catch (error) {
      console.error(error);
    }
  },
};
