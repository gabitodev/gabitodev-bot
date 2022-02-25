import { Client, Intents, Collection } from 'discord.js';
import fs from 'fs';

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

(async () => {
  for (const file of commandFiles) {
    const { command } = await import(`./commands/${file}`);
    client.commands.set(command.data.name, command);
  }
})();

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

(async () => {
  for (const file of eventFiles) {
    const { event } = await import(`./events/${file}`);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
})();

client.login(process.env.TOKEN);