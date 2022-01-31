require('dotenv').config();
const { Client, Intents, Collection } = require('discord.js');
const { stripIndents } = require('common-tags');
const fs = require('fs');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
  ],
});

client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

client.once('ready', () => {
  console.log('Gabitodev Bot is online!');
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (!interaction.replied) {
      await interaction.reply({
        content: stripIndents`
        An error has occurred with the command!
        Fix me <@772619893278507018>😭`,
      });
    } else {
      await interaction.editReply({
        content: stripIndents`
        An error has occurred with the command!
        Fix me <@772619893278507018>😭`,
      });
    }
  }
});

client.login(process.env.TOKEN);