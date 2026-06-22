const { SlashCommandBuilder } = require('discord.js');
const { watchlist } = require('../tracker');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untrack')
    .setDescription('Remove a player from the watchlist')
    .addStringOption(opt =>
      opt.setName('username')
        .setDescription('Minecraft username to remove')
        .setRequired(true)
    ),

  async execute(interaction) {
    const username = interaction.options.getString('username').trim();

    if (!watchlist.has(username.toLowerCase())) {
      return interaction.reply({ content: `**${username}** is not on the watchlist.`, ephemeral: true });
    }

    watchlist.delete(username.toLowerCase());
    return interaction.reply(`Stopped tracking **${username}**.`);
  },
};