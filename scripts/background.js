const clientId = "ynvfymlhir1n84lc8ggn5xfcvlkw51"
let accessToken = ""
const streamer = "nezukolive"
const tokenFetchUrl = "https://chrome-twitch-extension-back.vercel.app/api/get-twitch-token?project=nezuko"
const streamerUrl = "https://api.twitch.tv/helix/streams"
let currentLiveStatus = null
let tokenRetryActive = false

async function refreshAccessToken() {
  console.log("Trying to retrieve access token...")

  try {
    const response = await fetch(tokenFetchUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Token fetch failed:", response.status, errorText)
      scheduleTokenRetry()
      return null
    }

    const data = await response.json()
    accessToken = data.access_token
    console.log("Access token retrieved successfully.")
    tokenRetryActive = false
    return accessToken
  } catch (error) {
    console.error("Token fetch exception:", error)
    scheduleTokenRetry()
    return null
  }
}

function scheduleTokenRetry() {
  if (tokenRetryActive) return
  tokenRetryActive = true

  console.log("Scheduling retry in 5 minutes...")
  setTimeout(async () => {
    console.log("Retrying token fetch...")
    await refreshAccessToken()
  }, 5 * 60 * 1000)
}

async function checkIfLive() {
  console.log("Check if channel is live...")

  if (!accessToken) {
    console.log("No access token found, attempting to refresh...")
    await refreshAccessToken()
    if (!accessToken) {
      console.error("Failed to get access token, cannot check live status.")
      currentLiveStatus = false
      return
    }
  }

  try {
    const response = await fetch(`${streamerUrl}?user_login=${streamer}`, {
      headers: {
        'Client-ID': clientId,
        'Authorization': `Bearer ${accessToken}`
      }
    })

    const data = await response.json()
    const isLive = data.data && data.data.length > 0

    if (isLive && currentLiveStatus !== true) {
      console.log(`[${new Date().toLocaleString()}] ${streamer} est en live !`)
      currentLiveStatus = true
      chrome.notifications.create("nezuko-live", {
        type: 'basic',
        iconUrl: chrome.runtime.getURL("assets/extension_image1024x1024.png"),
        title: `${streamer} est en live !`,
        message: `${streamer} vient de lancer son live sur Twitch.`,
        priority: 2
      })
    } else if (!isLive) {
      console.log(`[${new Date().toLocaleString()}] ${streamer} est hors-ligne.`)
      currentLiveStatus = false
    }
  } catch (err) {
    console.error("Error during stream status check:", err)
  }
}

function startMonitoring() {
  console.log("Setting up stream status checker...")
  chrome.alarms.create("checkStreamStatus", {
    periodInMinutes: 3
  })
}

async function init() {
  console.log("Init...")
  await refreshAccessToken()
  startMonitoring()
  checkIfLive()
}

init()

chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed.")
  init()
})

chrome.runtime.onStartup.addListener(() => {
  console.log("Chrome restarted. Re-initializing.")
  init()
})

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === "nezuko-live") {
    chrome.tabs.create({ url: `https://www.twitch.tv/${streamer}` })
    chrome.notifications.clear(notificationId)
  }
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkStreamStatus") {
    console.log("⏰ Alarm triggered : checking stream status...")
    checkIfLive()
  }
})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getStreamStatus") {
    sendResponse({ isLive: currentLiveStatus, streamerName: streamer })
  }
  return true
})
