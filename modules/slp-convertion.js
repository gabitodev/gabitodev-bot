const CoinGecko = require('coingecko-api');

const convertSlpToUsd = async (slp) => {
  const CoinGeckoClient = new CoinGecko;
  const { data } = await CoinGeckoClient.simple.price({
    ids: 'smooth-love-potion',
    vs_currencies: 'usd',
  });
  const slpPriceUsd = data['smooth-love-potion'].usd;
  const scholarUsd = (slp * slpPriceUsd).toFixed(2);
  return `${scholarUsd}$`;
};

module.exports.convertSlpToUsd = convertSlpToUsd;