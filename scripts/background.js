const clientId = "ynvfymlhir1n84lc8ggn5xfcvlkw51"
const clientSecret = "1wywr3u8p6s1l3pkc026tdl5hlmvz1"
let accessToken = ""
const streamer = "gotaga"
const authUrl = "https://id.twitch.tv/oauth2/token"
const streamerUrl = "https://api.twitch.tv/helix/streams"

async function refreshAccessToken() {
  console.log("Access token retrieving...")
  const response = await fetch(authUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      "client_id": clientId,
      "client_secret": clientSecret,
      "grant_type": "client_credentials"
    }).toString()
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Failed to refresh access token:", response.status, errorText);
    return null;
  }

  const data = await response.json();
  accessToken = data.access_token;
  console.log("Access token retrieved.")
  return accessToken;
}

async function checkIfLive() {
  console.log("Check if channel is live...");
  if (!accessToken) {
    console.log("No access token found, attempting to refresh...");
    await refreshAccessToken();
    if (!accessToken) {
      console.error("Failed to get access token, cannot check live status.");
      return;
    }
  }

  const response = await fetch(`${streamerUrl}?user_login=${streamer}`, {
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`
    }
  });

  const data = await response.json();
  const isLive = data.data && data.data.length > 0

  if (isLive) {
    console.log(`${streamer} est en live !`);
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL("assets/extension_image1024x1024.png"),
      title: `${streamer} est en live !`,
      message: `${streamer} vient de lancer son live sur Twitch.`,
      priority: 2
    });
  } else {
    console.log(`${streamer} est hors-ligne.`);
  }
}

async function redirectToStream() {
  chrome.tabs.create({ url: `https://www.twitch.tv/${streamer}` });
}

async function init() {
  console.log("Init...")
  await refreshAccessToken();
  if (accessToken) {
    checkIfLive();
    setInterval(checkIfLive, 180000);
  } else {
    console.error("Impossible de démarrer la surveillance : aucun token valide obtenu.");
  }
}

init();
