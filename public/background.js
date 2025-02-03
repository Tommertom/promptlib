// chrome.action.onClicked.addListener(async () => {
//   const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
//   // Next state will always be the opposite
//   const nextState = prevState === "ON" ? "OFF" : "ON";

//   console.log("prevState", prevState);

//   // Set the action badge to the next state
//   await chrome.action.setBadgeText({
//     tabId: tab.id,
//     text: nextState,
//   });

//   chrome.windows.create({
//     url: chrome.runtime.getURL("index.html"), // Opens the new window
//     type: "popup",
//     width: 800,
//     height: 600,
//   });

//   console.log("Popup opened");
// });

chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: 'index.html',
    type: 'popup',
    width: 800, // specify your desired width
    height: 600, // specify your desired height
  })
})

chrome.runtime.onInstalled.addListener(() => {
  console.log('onInstalled...')
  chrome.action.setBadgeText({
    text: 'OFF',
  })
})

chrome.runtime.onConnect.addListener((port) => {
  console.log('Connected:', port.name, port)

  port.onMessage.addListener((msg, sender) => {
    if (msg.from === 'index') {
      // Forward message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          chrome.tabs.sendMessage(tabs[0].id, msg)
        }
      })
    } else if (msg.from === 'content') {
      // Forward message to index.html
      chrome.runtime.sendMessage(msg)
    }
  })
})
