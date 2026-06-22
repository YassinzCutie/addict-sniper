const { SlashCommandBuilder } = require("discord.js");
const { watchlist } = require("../tracker");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("streaks")
    .setDescription("Streak leaderboard"),

  async execute(interaction) {
    var list = [];
    watchlist.forEach(function(data) { if (data.lastBest > 0) list.push(data); });
    list.sort(function(a, b) { return b.lastBest - a.lastBest; });
    if (list.length === 0) {
      return interaction.reply("\u2666 No streak data");
    }
    var fields = list.map(function(p, i) {
      var medal = i === 0 ? "\u2605" : i === 1 ? "\u2606" : "\u2726";
      return {
        name: medal + " " + p.name,
        value: "Best: **" + p.lastBest + "**" + (p.online ? " \u2502 \ud83d\udd34 Online" : ""),
        inline: false,
      };
    });
    return interaction.reply({
      embeds: [{
        color: 0xCC0000,
        title: "\u200b",
        description: "\u2666\u2666 \u2605 STREAK RANKINGS \u2605 \u2666\u2666",
        fields: fields,
        footer: { text: "\u2666 addict sniper \u2666 streaks" },
        timestamp: new Date().toISOString(),
      }],
    });
  },
};