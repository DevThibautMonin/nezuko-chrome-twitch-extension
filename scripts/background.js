const clientId = "ynvfymlhir1n84lc8ggn5xfcvlkw51"
let accessToken = ""
const streamer = "nezukolive"
const tokenFetchUrl = "https://nezuko-chrome-twitch-extension-back.vercel.app/api/get-twitch-token"
const authUrl = "https://id.twitch.tv/oauth2/token"
const streamerUrl = "https://api.twitch.tv/helix/streams"
let currentLiveStatus = null;

async function refreshAccessToken(retryCount = 0) {
  console.log("Access token retrieving...");
  try {
    const response = await fetch(tokenFetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Failed to refresh access token:", response.status, errorText);

      if (retryCount < 5) {
        console.log(`Retrying token fetch... (${retryCount + 1}/3)`);
        await new Promise(res => setTimeout(res, 1000 * (retryCount + 1)));
        return await refreshAccessToken(retryCount + 1);
      }
      return null;
    }

    const data = await response.json();
    accessToken = data.access_token;
    console.log("Access token retrieved.");
    return accessToken;

  } catch (err) {
    console.error("Exception during token refresh:", err);
    return null;
  }
}

async function checkIfLive() {
  console.log("Check if channel is live...")
  if (!accessToken) {
    currentLiveStatus = false;
    console.log("No access token found, attempting to refresh...")
    await refreshAccessToken()
    if (!accessToken) {
      currentLiveStatus = false;
      console.error("Failed to get access token, cannot check live status.")
      return
    }
  }

  const response = await fetch(`${streamerUrl}?user_login=${streamer}`, {
    headers: {
      'Client-ID': clientId,
      'Authorization': `Bearer ${accessToken}`
    }
  })

  const data = await response.json()
  const isLive = data.data && data.data.length > 0

  if (isLive) {
    console.log(`${streamer} est en live !`)
    currentLiveStatus = isLive;
    chrome.notifications.create({
      type: 'basic',
      iconUrl: chrome.runtime.getURL("assets/extension_image1024x1024.png"),
      title: `${streamer} est en live !`,
      message: `${streamer} vient de lancer son live sur Twitch.`,
      priority: 2
    })
  } else {
    console.log(`${streamer} est hors-ligne.`)
    currentLiveStatus = false;
  }
}

async function redirectToStream() {
  chrome.tabs.create({ url: `https://www.twitch.tv/${streamer}` })
}

async function init() {
  console.log("Init...")
  await refreshAccessToken()
  if (accessToken) {
    checkIfLive()
    setInterval(checkIfLive, 180000)
  } else {
    console.error("Impossible de démarrer la surveillance : aucun token valide obtenu.")
  }
}

init()

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkStreamStatus") {
    checkIfLive();
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStreamStatus") {
    sendResponse({ isLive: currentLiveStatus, streamerName: streamer });
  }
  return true;
});
