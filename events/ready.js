import { deployCommands } from '../modules/deploy-commands.js';

export const event = {
  name: 'ready',
  once: true,
  async execute(client) {
    await deployCommands();
    console.log(`Ready! Logged in as ${client.user.tag}`);
  },
};