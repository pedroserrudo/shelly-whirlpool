# Whirlpool AC — Shelly Script

Controls a Whirlpool AC unit via the Whirlpool EMEA cloud API, intended to run as a Shelly scene trigger.

## What it does

- Authenticates with the Whirlpool cloud (OAuth2 password grant)
- Caches the token on the Shelly KVS (key-value store) so it doesn't re-login every time
- Refreshes the token automatically when it expires
- Sends a command to turn the AC **on** (heat mode, 23°C) or **off**

## File

`ac_shelly.js` — Shelly Script (mJS/JavaScript subset)

## Setup

### 1. Upload the script

Go to your Shelly device web UI → **Scripts** → **Add script**.

### 2. Create the ON scene

Paste the contents of `ac_shelly.js` and make sure line 4 reads:

```js
var POWER_ON = true;
```

Name it e.g. `AC On`.

### 3. Create the OFF scene

Create a second script with the same content but set:

```js
var POWER_ON = false;
```

Name it e.g. `AC Off`.

### 4. Assign to scenes

In **Scenes**, create one scene that runs `AC On` and another that runs `AC Off`. Trigger them however you like (schedule, button, automation).

## Token caching

The script stores the token in the Shelly KVS under the key `whirlpool_token` as a JSON object:

```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_at": 1234567890
}
```

On each run:

1. Reads `whirlpool_token` from KVS
2. If missing → full login
3. If expired → refresh token, fall back to full login if refresh fails
4. If valid → use directly

Tokens are valid for ~1 hour. The script renews 60 seconds before expiry as a buffer.

## AC settings (ON)

| Setting | Value |
|---|---|
| Mode | Heat |
| Temperature | 23°C |
| Power | On |

All three are sent in a single API call.

## API

Uses the Whirlpool EMEA cloud API (`prod-api.whrcloud.eu`). Reverse-engineered and documented by the community at [abmantis/whirlpool-sixth-sense](https://github.com/abmantis/whirlpool-sixth-sense).

Key endpoint: `POST /api/v1/appliance/command`

## Device

| Field | Value |
|---|---|
| SAID | `device id |
| Region | EMEA |
| Auth client | `whirlpool_emea_android_v2` |
