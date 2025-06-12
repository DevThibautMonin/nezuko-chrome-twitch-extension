const streamerChannel = "nezukolive"
const streamerName = "Nezuko"

document.addEventListener("DOMContentLoaded", () => {
  const button = document.getElementById("streamButton");
  if (button) {
    button.addEventListener("click", redirectToStream);
  }

  chrome.runtime.sendMessage({ action: "getStreamStatus" }, (response) => {
    if (response && typeof response.isLive === 'boolean') {
      updateUI(response.isLive);
    } else {
      updateUI(false);
    }
  });
});

async function redirectToStream() {
  chrome.tabs.create({ url: `https://www.twitch.tv/${streamerChannel}` })
}

function updateUI(isLive) {
  const statusIndicator = document.getElementById("streamStatus");
  const titleElement = document.getElementById("streamTitle");
  const streamButton = document.getElementById("streamButton");

  if (statusIndicator) {
    statusIndicator.style.backgroundColor = isLive ? "green" : "red";
  }


  if (titleElement) {
    titleElement.textContent = isLive ? `${streamerName} est en live !` : `${streamerName} n'est pas en live.`;
  }


  if (streamButton) {
    if (isLive) {
      streamButton.textContent = "Rejoindre le stream";
      streamButton.disabled = false;
      streamButton.style.backgroundColor = "#8B5CF6";
      streamButton.style.cursor = "pointer";
    } else {
      streamButton.textContent = "Hors-ligne";
      streamButton.disabled = true;
      streamButton.style.backgroundColor = "#A0A0A0";
      streamButton.style.cursor = "not-allowed";
    }
  }
}
