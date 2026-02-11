document.addEventListener('DOMContentLoaded', function() {
  const hashtagsInput = document.getElementById('hashtags');
  const commentTextInput = document.getElementById('commentText');
  const delayInput = document.getElementById('delay');
  const enableLikesInput = document.getElementById('enableLikes');
  const statusDiv = document.getElementById('status');
  const startBtn = document.getElementById('start');
  const stopBtn = document.getElementById('stop');
  const saveBtn = document.getElementById('save');

  // Load default config from file
  fetch(browser.runtime.getURL('config.json'))
    .then(response => response.json())
    .then(config => {
      // Load saved settings or use defaults from config
      browser.storage.local.get(['hashtags', 'commentText', 'delay', 'enableLikes', 'isRunning']).then(result => {
        commentTextInput.value = result.commentText || config.defaultCommentText || '';
        hashtagsInput.value = result.hashtags || config.defaultHashtags || '';
        delayInput.value = result.delay || 5;
        if (result.enableLikes !== undefined) enableLikesInput.checked = result.enableLikes;
        updateStatus(result.isRunning || false);
      });
    })
    .catch(error => {
      console.error('Error loading config:', error);
      // Fallback to storage only
      browser.storage.local.get(['hashtags', 'commentText', 'delay', 'enableLikes', 'isRunning']).then(result => {
        if (result.commentText) commentTextInput.value = result.commentText;
        if (result.hashtags) hashtagsInput.value = result.hashtags;
        if (result.delay) delayInput.value = result.delay;
        if (result.enableLikes !== undefined) enableLikesInput.checked = result.enableLikes;
        updateStatus(result.isRunning || false);
      });
    });

  // Save settings
  saveBtn.addEventListener('click', () => {
    const hashtags = hashtagsInput.value.trim();
    const commentText = commentTextInput.value.trim();
    const delay = parseInt(delayInput.value);
    const enableLikes = enableLikesInput.checked;
    
    browser.storage.local.set({
      hashtags: hashtags,
      commentText: commentText,
      delay: delay,
      enableLikes: enableLikes
    });
    
    // Send to content script
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
      browser.tabs.sendMessage(tabs[0].id, {
        action: 'updateSettings',
        hashtags: hashtags.split('\n').filter(h => h.trim()),
        commentText: commentText,
        delay: delay,
        enableLikes: enableLikes
      });
    });
  });

  // Start automation
  startBtn.addEventListener('click', () => {
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
      browser.tabs.sendMessage(tabs[0].id, {action: 'start'});
    });
    updateStatus(true);
    browser.storage.local.set({isRunning: true});
  });

  // Stop automation
  stopBtn.addEventListener('click', () => {
    browser.tabs.query({active: true, currentWindow: true}).then(tabs => {
      browser.tabs.sendMessage(tabs[0].id, {action: 'stop'});
    });
    updateStatus(false);
    browser.storage.local.set({isRunning: false});
  });

  function updateStatus(isRunning) {
    if (isRunning) {
      statusDiv.textContent = 'Running';
      statusDiv.className = 'status running';
    } else {
      statusDiv.textContent = 'Stopped';
      statusDiv.className = 'status stopped';
    }
  }
});