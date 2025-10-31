// Background service worker - Chrome AI Edition
console.log('🔧 Clarity Chrome AI background worker loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ status: "alive" });
    return true;
  }

  return false;
});
