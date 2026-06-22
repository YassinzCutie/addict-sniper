const { SlashCommandBuilder } = require("discord.js");
const { watchlist, fetchWithFallback } = require("../tracker");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("track")
    .setDescription("Lock onto a target")
    .addStringOption(opt =>
      opt.setName("username")
        .setDescription("Minecraft username")
        .setRequired(true)
    ),

  async execute(interaction) {
    var username = interaction.options.getString("username").trim();
    if (username.length > 16) {
      return interaction.reply({ content: "\u2666 Invalid username", ephemeral: true });
    }
    if (watchlist.has(username.toLowerCase())) {
      return interaction.reply({ content: "\u2666 **" + username + "** is already locked", ephemeral: true });
    }
    await interaction.deferReply();
    try {
      var result = await fetchWithFallback(username);
      if (!result) {
        return interaction.editReply("\u2666 Target **" + username + "** not found");
      }
      var stats = result.stats;
      var apiName = result.apiName;
      watchlist.set(username.toLowerCase(), { name: username, apiName: apiName, lastBest: stats.bestStreak, online: false, alerted: false });
      var wlr = stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : "N/A";
      var fkdr = stats.finalDeaths > 0 ? (stats.finalKills / stats.finalDeaths).toFixed(2) : "N/A";
      var threat = stats.bestStreak >= 20 ? "\u26a0 EXTREME" : stats.bestStreak >= 10 ? "\u26a0 HIGH" : stats.bestStreak >= 5 ? "\u25cb MED" : "\u25cb LOW";
      return interaction.editReply({
        embeds: [{
          color: 0x8B0000,
          title: "\u200b",
          description: "\u2666\u2666 \u2605 TARGET LOCKED \u2605 \u2666\u2666\n\n**" + username + "** added to scope\n\n\u2726 Monitoring for status changes \u2726",
          fields: [
            { name: "\u25c6 Best Streak", value: String(stats.bestStreak), inline: true },
            { name: "\u25c6 WLR", value: wlr, inline: true },
            { name: "\u25c6 FKDR", value: fkdr, inline: true },
            { name: "\u25c6 Wins", value: stats.wins.toLocaleString(), inline: true },
            { name: "\u25c6 Games", value: stats.gamesPlayed.toLocaleString(), inline: true },
            { name: "\u25c6 Threat", value: threat, inline: true },
          ],
          footer: { text: "\u2666 addict sniper \u2666 locked" },
        }],
      });
    } catch (err) {
      return interaction.editReply("\u2666 Failed: " + err.message);
    }
  },
};