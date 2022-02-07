const { stripIndents } = require('common-tags');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isCommand()) return;
    const command = interaction.client.commands.get(interaction.commandName);
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
  },
};