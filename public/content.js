chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message:", message);
  sendResponse({ received: true });
  if (message.action === "paste_text") {
    // Handle the received text here
    console.log("Received text:", message.text);
    // Example: Insert text into a focused element
    // if (document.activeElement) {
    //     const activeElement = document.activeElement;
    //     if (activeElement.isContentEditable ||
    //         activeElement.tagName === 'INPUT' ||
    //         activeElement.tagName === 'TEXTAREA') {
    //         activeElement.value = message.text;
    //     }
    // }
  }
});
