const { SlashCommandBuilder } = require("discord.js");
const snipeLog = [];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("snipe")
    .setDescription("Snipe commands")
    .addSubcommand(sub =>
      sub.setName("log")
        .setDescription("Log a snipe")
        .addStringOption(opt => opt.setName("username").setDescription("Player sniped").setRequired(true))
        .addIntegerOption(opt => opt.setName("streak").setDescription("Streak ended").setRequired(true))
    )
    .addSubcommand(sub =>
      sub.setName("stats")
        .setDescription("Your snipe stats")
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() === "log") {
      var username = interaction.options.getString("username");
      var streak = interaction.options.getInteger("streak");
      snipeLog.push({ player: username, streak: streak, by: interaction.user.tag, time: new Date() });
      return interaction.reply({
        embeds: [{
          color: 0x8B0000,
          title: "\u200b",
          description: "\u2666\u2666 \u2605 SNIPE CONFIRMED \u2605 \u2666\u2666\n\n**" + interaction.user.username + "** ended **" + username + "**\u2605s **" + streak + "** win streak",
          fields: [
            { name: "\u25c6 Streak Ended", value: String(streak), inline: true },
            { name: "\u25c6 Total Snipes", value: String(snipeLog.length), inline: true },
          ],
          footer: { text: "\u2666 addict sniper \u2666 confirmed" },
          timestamp: new Date().toISOString(),
        }],
      });
    } else {
      var total = snipeLog.length;
      var avg = total > 0 ? (snipeLog.reduce(function(s, l) { return s + l.streak; }, 0) / total).toFixed(1) : 0;
      var best = total > 0 ? Math.max.apply(null, snipeLog.map(function(l) { return l.streak; })) : 0;
      return interaction.reply({
        embeds: [{
          color: 0x660000,
          title: "\u200b",
          description: "\u2666\u2666 \u2605 SNIPE STATS \u2605 \u2666\u2666",
          fields: [
            { name: "\u25c6 Total Snipes", value: String(total), inline: true },
            { name: "\u25c6 Avg Streak", value: avg, inline: true },
            { name: "\u25c6 Best Snipe", value: String(best), inline: true },
          ],
          footer: { text: "\u2666 addict sniper \u2666 stats" },
          timestamp: new Date().toISOString(),
        }],
      });
    }
  },
};