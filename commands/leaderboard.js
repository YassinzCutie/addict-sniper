const { SlashCommandBuilder } = require("discord.js");
const https = require("https");

function fetchLeaderboard(mode, limit) {
  return new Promise(function (resolve, reject) {
    var url = "https://stats.pika-network.net/api/leaderboards?type=bedwars&mode=" + mode + "&interval=weekly&stat=HIGHEST_WIN_STREAK&limit=" + limit;
    https.get(url, { timeout: 10000 }, function (res) {
      var data = "";
      res.on("data", function (chunk) { data = data + chunk; });
      res.on("end", function () {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error("Invalid JSON")); }
      });
    }).on("error", reject).on("timeout", function () { this.destroy(); reject(new Error("Timeout")); });
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("leaderboard")
    .setDescription("Weekly streak leaderboard tracker")
    .addSubcommand(function(sub) {
      return sub.setName("track")
        .setDescription("View weekly streak leaderboard")
        .addStringOption(function(opt) {
          return opt.setName("mode").setDescription("Game mode").setRequired(true).addChoices(
            { name: "Solo", value: "solo" },
            { name: "Doubles", value: "doubles" },
            { name: "Quads", value: "quads" },
            { name: "All Modes", value: "ALL_MODES" }
          );
        }).addIntegerOption(function(opt) {
          return opt.setName("top").setDescription("How many to show").setMinValue(1).setMaxValue(25);
        });
    }).addSubcommand(function(sub) {
      return sub.setName("status").setDescription("Tracker status");
    }),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === "status") {
      return interaction.reply({
        embeds: [{
          color: 0x8B0000,
          title: "\u200b",
          description: "\u2666\u2666 \u2605 LB TRACKER \u2605 \u2666\u2666\n\nStatus: **ACTIVE**\nInterval: 60s\nModes: Solo, Doubles, Quads, All\nAlert: 20+ streak\n\n\u2726 Monitoring weekly leaderboards \u2726",
          footer: { text: "\u2666 addict sniper \u2666 lb" },
          timestamp: new Date().toISOString(),
        }],
      });
    }

    var mode = interaction.options.getString("mode");
    var top = interaction.options.getInteger("top") || 10;
    var modeLabel = mode === "ALL_MODES" ? "All Modes" : mode.charAt(0).toUpperCase() + mode.slice(1);

    await interaction.deferReply();

    try {
      var data = await fetchLeaderboard(mode, top);
      if (!data.entries || data.entries.length === 0) {
        return interaction.editReply("\u2666 No data for " + modeLabel);
      }

      var fields = [];
      for (var i = 0; i < data.entries.length; i++) {
        var e = data.entries[i];
        var medal = e.place == 1 ? "\u2605" : e.place == 2 ? "\u2606" : e.place == 3 ? "\u2726" : "\u25cb";
        var streak = Number(e.value) || 0;
        var isHot = streak >= 20;
        var clanTag = e.clan ? " [" + e.clan + "]" : "";
        fields.push({
          name: medal + " #" + e.place + " " + e.id + clanTag,
          value: (isHot ? "\ud83d\udd25 " : "") + "Streak: **" + streak + "**" + (isHot ? " \u26a0 HIGH" : ""),
          inline: false,
        });
      }

      var hotCount = 0;
      for (var i = 0; i < data.entries.length; i++) {
        if (Number(data.entries[i].value) >= 20) hotCount++;
      }

      var pingRole = hotCount > 0 ? (process.env.PING_ROLE || "") : null;

      return interaction.editReply({
        content: pingRole,
        embeds: [{
          color: 0xCC0000,
          title: "\u200b",
          description: "\u2666\u2666 \u2605 WEEKLY STREAK LB \u2605 \u2666\u2666\n\n**Mode: " + modeLabel + "** \u2502 Top " + top + (hotCount > 0 ? "\n\n\ud83d\udd25 " + hotCount + " player(s) with 20+ streak!" : ""),
          fields: fields,
          footer: { text: "\u2666 addict sniper \u2666 weekly lb" },
          timestamp: new Date().toISOString(),
        }],
      });
    } catch (err) {
      return interaction.editReply("\u2666 Failed: " + err.message);
    }
  },
};