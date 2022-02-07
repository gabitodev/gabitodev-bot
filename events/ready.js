const { deployCommands } = require('../modules/deploy-commands');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    await deployCommands();
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};
