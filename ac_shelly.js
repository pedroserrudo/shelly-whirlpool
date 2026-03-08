// Whirlpool AC control — Shelly Script
// Create 2 scenes: one with POWER_ON = true, one with false

var POWER_ON = true; // <-- change to false for the OFF scene

var EMAIL    = "account email"; // @ → %40
var PASSWORD = "account password";       // @ → %40, ! → %21, % → %25
var CLIENT_ID     = "whirlpool_emea_android_v2";
var CLIENT_SECRET = "90_3TBRfXfcdCYJj6L5BThEqOBZNkEchrTPT7loqm0gBS_tyeFIIEv47mmYTZkb6";
var BASE_URL = "https://prod-api.whrcloud.eu";
var SAID     = "device id";
var KVS_KEY  = "whirlpool_token";

function sendCommand(token) {
  var attrs = { Sys_OpSetPowerOn: POWER_ON ? "1" : "0" };
  if (POWER_ON) {
    attrs.Cavity_OpSetMode    = "3";   // heat
    attrs.Sys_OpSetTargetTemp = "230"; // 23.0°C
  }

  Shelly.call("HTTP.Request", {
    method: "POST",
    url: BASE_URL + "/api/v1/appliance/command",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "User-Agent": "okhttp/3.12.0"
    },
    body: JSON.stringify({
      header: { said: SAID, command: "setAttributes" },
      body: attrs
    })
  }, function (res, err) {
    if (err !== 0) { print("Command error:", err); return; }
    print("AC " + (POWER_ON ? "ON (heat, 23°C)" : "OFF") + " — HTTP " + res.code);
  });
}

function saveAndSend(data) {
  var record = JSON.stringify({
    access_token:  data.access_token,
    refresh_token: data.refresh_token,
    expires_at:    Math.floor(Date.now() / 1000) + data.expires_in - 60
  });
  Shelly.call("KVS.Set", { key: KVS_KEY, value: record }, function () {
    sendCommand(data.access_token);
  });
}

function fetchNewToken() {
  print("Fetching new token...");
  Shelly.call("HTTP.Request", {
    method: "POST",
    url: BASE_URL + "/oauth/token",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "okhttp/3.12.0" },
    body: "grant_type=password&username=" + EMAIL + "&password=" + PASSWORD +
          "&client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET
  }, function (res, err) {
    if (err !== 0 || res.code !== 200) {
      print("Login failed — HTTP", (res ? res.code : err));
      return;
    }
    saveAndSend(JSON.parse(res.body));
  });
}

function refreshToken(refresh_token) {
  print("Refreshing token...");
  Shelly.call("HTTP.Request", {
    method: "POST",
    url: BASE_URL + "/oauth/token",
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "okhttp/3.12.0" },
    body: "grant_type=refresh_token&refresh_token=" + refresh_token +
          "&client_id=" + CLIENT_ID + "&client_secret=" + CLIENT_SECRET
  }, function (res, err) {
    if (err !== 0 || res.code !== 200) {
      print("Refresh failed, re-logging in...");
      fetchNewToken();
      return;
    }
    saveAndSend(JSON.parse(res.body));
  });
}

// Entry point
Shelly.call("KVS.Get", { key: KVS_KEY }, function (res, err) {
  if (err !== 0 || !res || !res.value) {
    fetchNewToken();
    return;
  }
  var t = JSON.parse(res.value);
  if (Math.floor(Date.now() / 1000) < t.expires_at) {
    sendCommand(t.access_token);
  } else {
    refreshToken(t.refresh_token);
  }
});
