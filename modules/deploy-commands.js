import fs from 'fs';
import { REST } from '@discordjs/rest';
import { Routes } from 'discord-api-types/v9';

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

(async () => {
  for (const file of commandFiles) {
    const { command } = await import(`../commands/${file}`);
    commands.push(command.data.toJSON());
  }
})();

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

export const deployCommands = async () => {
  try {
    if (process.env.ENV === 'production') {
      await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
        body: commands,
      });
      console.log('The commands were successfully registered globaly');
    } else {
      await rest.put(Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID), {
        body: commands,
      });
      console.log('The commands were successfully registered locally');
    }
  } catch (error) {
    if (error) console.log(error);
  }
};