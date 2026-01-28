// Background script for X Reposter extension
browser.runtime.onInstalled.addListener(() => {
  console.log('X Reposter extension installed');
  
  // Initialize default settings
  browser.storage.local.set({
    hashtags: '',
    delay: 5,
    enableLikes: true,
    isRunning: false
  });
});

// Handle messages between popup and content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'log') {
    console.log('Content Script:', message.data);
  }
  return true;
});