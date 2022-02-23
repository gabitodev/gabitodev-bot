const { create } = require('axios').default;
const { default: applyCaseMiddleware } = require('axios-case-converter');

const getRoninData = async (roninAddress) => {
  try {
    const { get } = applyCaseMiddleware(create());
    const { data } = await get(`https://game-api.axie.technology/api/v1/${roninAddress},null`);
    return data;
  } catch (error) {
    console.error(error);
  }
};

module.exports.getRoninData = getRoninData;