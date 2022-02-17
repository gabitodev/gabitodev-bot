const CoinGecko = require('coingecko-api');

module.exports = {
  async getSlpInUsd(slp) {
    const CoinGeckoClient = new CoinGecko;
    const priceSlpData = await CoinGeckoClient.simple.price({
      ids: 'smooth-love-potion',
      vs_currencies: 'usd',
    });
    const slpPriceUsd = priceSlpData.data['smooth-love-potion'].usd;
    const scholarUsd = (slp * slpPriceUsd).toFixed(2);
    return `${scholarUsd}$`;
  },
};