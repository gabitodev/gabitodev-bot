const { create } = require('axios').default;
const { default: applyCaseMiddleware } = require('axios-case-converter');

const getBattlesData = async (roninAddress) => {
  try {
    const { get } = applyCaseMiddleware(create());
    const { data } = await get(`https://game-api.axie.technology/logs/pvp/${roninAddress}`);
    return data;
  } catch (error) {
    console.error(error);
  }
};

module.exports.getBattlesData = getBattlesData;