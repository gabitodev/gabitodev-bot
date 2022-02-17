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
        return await interaction.reply('An error has occurred with the command! Contact the owner of the discord server.');
      } else {
        return await interaction.editReply('An error has occurred with the command! Contact the owner of the discord server.');
      }
    } finally {
      console.log(`The command ${interaction.commandName} was executed by ${interaction.user.username}`);
    }
  },
};