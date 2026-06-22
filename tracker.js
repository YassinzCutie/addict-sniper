const https = require("https");
const watchlist = new Map();

function fetchProfile(username) {
  return new Promise(function (resolve, reject) {
    var url = "https://stats.pika-network.net/api/profile/" + encodeURIComponent(username);
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

function fetchPikaStats(username) {
  return new Promise(function (resolve, reject) {
    var url = "https://stats.pika-network.net/api/profile/" + encodeURIComponent(username) + "/leaderboard?type=bedwars&interval=total&mode=ALL_MODES";
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

function isPlayerOnline(profileData) {
  var lastSeen = profileData.lastSeen;
  if (!lastSeen) return false;
  var now = Date.now();
  var diff = now - lastSeen;
  if (diff < 0) diff = diff * -1;
  if (diff < 900000) return true;
  return false;
}

function extractBedwarsStats(data, playerName) {
  try {
    if (!data || typeof data !== "object") return null;
    var lower = playerName.toLowerCase();
    var stats = {};
    var keys = Object.keys(data);
    for (var i = 0; i < keys.length; i++) {
      var statName = keys[i];
      var statObj = data[statName];
      if (!statObj) continue;
      if (!Array.isArray(statObj.entries)) continue;
      var entries = statObj.entries;
      for (var j = 0; j < entries.length; j++) {
        var entry = entries[j];
        if (!entry) continue;
        if (!entry.id) continue;
        if (String(entry.id).toLowerCase() === lower) {
          if (entry.value !== undefined) {
            stats[statName] = Number(entry.value) || 0;
          }
          break;
        }
      }
    }
    var wins = stats["Wins"] || 0;
    var games = stats["Games played"] || 0;
    if (wins === 0 && games === 0) return null;
    var best = 0;
    var sKeys = Object.keys(stats);
    for (var i = 0; i < sKeys.length; i++) {
      var k = sKeys[i];
      var kl = k.toLowerCase();
      if (kl.indexOf("highest") !== -1 && kl.indexOf("winstreak") !== -1) { best = stats[k]; break; }
    }
    return {
      wins: wins,
      losses: stats["Losses"] || 0,
      finalKills: stats["Final kills"] || 0,
      finalDeaths: stats["Final deaths"] || 0,
      deaths: stats["Deaths"] || 0,
      bedsBroken: stats["Beds destroyed"] || 0,
      bedsLost: stats["Beds lost"] || 0,
      gamesPlayed: games,
      winStreak: stats["Win streak"] || 0,
      bestStreak: best,
    };
  } catch (err) {
    console.log("[extract] Error:", err.message);
    return null;
  }
}

async function fetchWithFallback(username) {
  var vars = [];
  vars.push(username);
  var cap = username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
  if (cap !== username) vars.push(cap);
  var up = username.toUpperCase();
  if (up !== username) vars.push(up);
  var lo = username.toLowerCase();
  if (lo !== username) vars.push(lo);
  var seen = {};
  for (var i = 0; i < vars.length; i++) {
    var v = vars[i];
    if (seen[v]) continue;
    seen[v] = true;
    try {
      var data = await fetchPikaStats(v);
      var stats = extractBedwarsStats(data, v);
      if (stats) {
        console.log("[Fallback] Found: " + v);
        return { stats: stats, apiName: v };
      }
    } catch(e) {}
  }
  return null;
}

function buildOnlineEmbed(displayName, stats) {
  var wlr = stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : String(stats.wins);
  return {
    color: 0x8B0000,
    title: "\u200b",
    description: "\u2666\u2666 \u2605 TARGET DETECTED \u2605 \u2666\u2666\n\n**" + displayName + "** just came online on Pika Network\n\n\u2726 Queue up. End them. \u2726",
    fields: [
      { name: "\u25c6 Status", value: "\ud83d\udd34 ONLINE", inline: true },
      { name: "\u25c6 WLR", value: wlr, inline: true },
      { name: "\u25c6 Best Streak", value: String(stats.bestStreak), inline: true },
      { name: "\u25c6 FKDR", value: stats.finalDeaths > 0 ? (stats.finalKills / stats.finalDeaths).toFixed(2) : String(stats.finalKills), inline: true },
      { name: "\u25c6 Wins", value: stats.wins.toLocaleString(), inline: true },
      { name: "\u25c6 Threat", value: stats.bestStreak >= 10 ? "\u26a0 HIGH" : "\u25cb MEDIUM", inline: true },
    ],
    footer: { text: "\u2666 addict sniper \u2666 v1.0" },
    timestamp: new Date().toISOString(),
  };
}

function buildOfflineEmbed(displayName) {
  return {
    color: 0x330000,
    title: "\u200b",
    description: "\u2666\u2666 \u2606 TARGET LOST \u2606 \u2666\u2666\n\n**" + displayName + "** went offline\n\n\u2726 Removed from active scan \u2726",
    footer: { text: "\u2666 addict sniper \u2666 v1.0" },
    timestamp: new Date().toISOString(),
  };
}

function buildStreakEmbed(displayName, stats) {
  var wlr = stats.losses > 0 ? (stats.wins / stats.losses).toFixed(2) : String(stats.wins);
  var fkdr = stats.finalDeaths > 0 ? (stats.finalKills / stats.finalDeaths).toFixed(2) : String(stats.finalKills);
  return {
    color: 0xCC0000,
    title: "\u200b",
    description: "\u2666\u2666 \u2605 NEW RECORD \u2605 \u2666\u2666\n\n**" + displayName + "** hit a new best streak of **" + stats.bestStreak + " wins**\n\n\u2726 High priority target \u2726",
    fields: [
      { name: "\u25c6 New Best", value: String(stats.bestStreak), inline: true },
      { name: "\u25c6 WLR", value: wlr, inline: true },
      { name: "\u25c6 FKDR", value: fkdr, inline: true },
      { name: "\u25c6 Wins", value: stats.wins.toLocaleString(), inline: true },
      { name: "\u25c6 Games", value: stats.gamesPlayed.toLocaleString(), inline: true },
      { name: "\u25c6 Beds", value: stats.bedsBroken.toLocaleString(), inline: true },
    ],
    footer: { text: "\u2666 addict sniper \u2666 intel" },
    timestamp: new Date().toISOString(),
  };
}

async function checkPlayer(client, username) {
  try {
    var key = username.toLowerCase();
    var tracked = watchlist.get(key);
    var apiName = tracked ? tracked.apiName : username;
    var profileData = null;
    try { profileData = await fetchProfile(apiName); } catch(e) {}
    var isOnline = false;
    if (profileData) isOnline = isPlayerOnline(profileData);
    var fb = await fetchWithFallback(apiName);
    if (!fb) { console.log("[Tracker] No data for " + apiName); return; }
    var stats = fb.stats;
    apiName = fb.apiName;
    console.log("[Tracker] " + apiName + ": online=" + isOnline + ", best=" + stats.bestStreak);
    var channelId = process.env.ALERT_CHANNEL_ID;
    var channel = client.channels.cache.get(channelId);
    var displayName = tracked ? tracked.name : username;
    if (!tracked) {
      watchlist.set(key, { name: username, apiName: apiName, lastBest: stats.bestStreak, online: isOnline, alerted: false });
      if (isOnline && channel) {
        await channel.send({ embeds: [buildOnlineEmbed(displayName, stats)] });
        console.log("[ONLINE] " + apiName + " is online!");
      }
      return;
    }
    tracked.apiName = apiName;
    if (isOnline && !tracked.online) {
      if (channel) { await channel.send({ embeds: [buildOnlineEmbed(displayName, stats)] }); }
      console.log("[ONLINE] " + apiName + " just came online!");
    }
    if (!isOnline && tracked.online) {
      if (channel) { await channel.send({ embeds: [buildOfflineEmbed(displayName)] }); }
      console.log("[OFFLINE] " + apiName + " went offline");
    }
    if (stats.bestStreak > tracked.lastBest && tracked.lastBest > 0) {
      if (channel) { await channel.send({ embeds: [buildStreakEmbed(displayName, stats)] }); }
      console.log("[ALERT] " + apiName + " new best streak: " + stats.bestStreak);
    }
    tracked.lastBest = stats.bestStreak;
    tracked.online = isOnline;
  } catch (err) { console.error("[Tracker] Error " + username + ":", err.message); }
}

function startTracker(client) {
  var interval = Number(process.env.POLL_INTERVAL) || 30000;
  console.log("[Tracker] Starting with " + interval + "ms interval");
  async function tick() {
    if (watchlist.size === 0) return;
    console.log("[Tracker] Checking " + watchlist.size + " players...");
    var entries = Array.from(watchlist.keys());
    for (var i = 0; i < entries.length; i++) {
      await checkPlayer(client, entries[i]);
      await new Promise(function (r) { setTimeout(r, 2000); });
    }
  }
  tick();
  setInterval(tick, interval);
}

module.exports = { watchlist: watchlist, fetchPikaStats: fetchPikaStats, fetchWithFallback: fetchWithFallback, extractBedwarsStats: extractBedwarsStats, startTracker: startTracker };