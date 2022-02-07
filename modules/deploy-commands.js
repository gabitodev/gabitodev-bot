const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`../commands/${file}`);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '9' }).setToken(process.env.TOKEN);

module.exports = {
  async deployCommands() {
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
  },
};