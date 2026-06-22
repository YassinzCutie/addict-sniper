const { SlashCommandBuilder } = require("discord.js");
const { watchlist } = require("../tracker");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("watchlist")
    .setDescription("View all locked targets"),

  async execute(interaction) {
    if (watchlist.size === 0) {
      return interaction.reply("\u2666 No targets. Use `/track` to lock on.");
    }
    var fields = [];
    watchlist.forEach(function(data) {
      var status = data.online ? "\ud83d\udd34 **ONLINE**" : "\u26ab Offline";
      var threat = data.lastBest >= 20 ? "\u26a0 EXTREME" : data.lastBest >= 10 ? "\u26a0 HIGH" : data.lastBest >= 5 ? "\u25cb MED" : "\u25cb LOW";
      fields.push({
        name: "\u25c6 " + data.name,
        value: status + " \u2502 Best: **" + data.lastBest + "** \u2502 " + threat,
        inline: false,
      });
    });
    return interaction.reply({
      embeds: [{
        color: 0x8B0000,
        title: "\u200b",
        description: "\u2666\u2666 \u2605 ACTIVE SCOPE \u2605 \u2666\u2666\n\n**" + watchlist.size + "** target(s) monitored",
        fields: fields.slice(0, 25),
        footer: { text: "\u2666 addict sniper \u2666 scope" },
        timestamp: new Date().toISOString(),
      }],
    });
  },
};