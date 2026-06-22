const { SlashCommandBuilder } = require("discord.js");
const { fetchWithFallback } = require("../tracker");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("bwstats")
    .setDescription("Pull intel on a player")
    .addStringOption(opt =>
      opt.setName("username")
        .setDescription("Minecraft username")
        .setRequired(true)
    ),

  async execute(interaction) {
    var username = interaction.options.getString("username").trim();
    await interaction.deferReply();
    try {
      var result = await fetchWithFallback(username);
      if (!result) {
        return interaction.editReply("\u2666 No intel on **" + username + "**");
      }
      var s = result.stats;
      var wlr = s.losses > 0 ? (s.wins / s.losses).toFixed(2) : String(s.wins);
      var fkdr = s.finalDeaths > 0 ? (s.finalKills / s.finalDeaths).toFixed(2) : String(s.finalKills);
      var bblr = s.bedsLost > 0 ? (s.bedsBroken / s.bedsLost).toFixed(2) : String(s.bedsBroken);
      var wr = s.gamesPlayed > 0 ? ((s.wins / s.gamesPlayed) * 100).toFixed(1) : "0.0";
      var threat = s.bestStreak >= 20 ? "\u26a0 EXTREME" : s.bestStreak >= 10 ? "\u26a0 HIGH" : s.bestStreak >= 5 ? "\u25cb MED" : "\u25cb LOW";
      return interaction.editReply({
        embeds: [{
          color: 0x660000,
          title: "\u200b",
          description: "\u2666\u2666 \u2605 INTEL FILE \u2605 \u2666\u2666\n\n**Target: " + username + "**",
          fields: [
            { name: "\u25c6 Wins", value: s.wins.toLocaleString(), inline: true },
            { name: "\u25c6 Losses", value: s.losses.toLocaleString(), inline: true },
            { name: "\u25c6 WLR", value: wlr, inline: true },
            { name: "\u25c6 Final Kills", value: s.finalKills.toLocaleString(), inline: true },
            { name: "\u25c6 Final Deaths", value: s.finalDeaths.toLocaleString(), inline: true },
            { name: "\u25c6 FKDR", value: fkdr, inline: true },
            { name: "\u25c6 Beds Broken", value: s.bedsBroken.toLocaleString(), inline: true },
            { name: "\u25c6 Beds Lost", value: s.bedsLost.toLocaleString(), inline: true },
            { name: "\u25c6 BBLR", value: bblr, inline: true },
            { name: "\u25c6 Best Streak", value: String(s.bestStreak), inline: true },
            { name: "\u25c6 Win Rate", value: wr + "%", inline: true },
            { name: "\u25c6 Games", value: s.gamesPlayed.toLocaleString(), inline: true },
            { name: "\u25c6 Threat", value: threat, inline: true },
          ],
          footer: { text: "\u2666 addict sniper \u2666 intel" },
          timestamp: new Date().toISOString(),
        }],
      });
    } catch (err) {
      return interaction.editReply("\u2666 Intel failed: " + err.message);
    }
  },
};