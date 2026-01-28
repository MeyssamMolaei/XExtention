// X Reposter Content Script
class XReposter {
  constructor() {
    this.isRunning = false;
    this.hashtags = [];
    this.delay = 5000; // milliseconds
    this.enableLikes = true;
    this.processedTweets = new Set();
    this.currentIndex = 0;
    this.lastProcessTime = Date.now();
    this.refreshTimeout = 10000; // 10 seconds
    this.lastScrollHeight = 0;
    this.stuckCounter = 0;
    this.maxStuckCount = 3;
    
    this.init();
  }

  async init() {
    // Load settings from storage
    const settings = await browser.storage.local.get(['hashtags', 'delay', 'enableLikes', 'isRunning']);
    if (settings.hashtags) {
      this.hashtags = settings.hashtags.split('\n').filter(h => h.trim());
    }
    if (settings.delay) {
      this.delay = settings.delay * 1000;
    }
    if (settings.enableLikes !== undefined) {
      this.enableLikes = settings.enableLikes;
    }
    
    // Auto-restart if was running before page refresh
    if (settings.isRunning) {
      console.log('Auto-restarting X Reposter after page refresh...');
      setTimeout(() => this.start(), 3000); // Wait 3 seconds for page to fully load
    }
    
    // Listen for messages from popup
    browser.runtime.onMessage.addListener((message) => {
      this.handleMessage(message);
    });

    console.log('X Reposter initialized');
  }

  handleMessage(message) {
    switch (message.action) {
      case 'start':
        this.start();
        break;
      case 'stop':
        this.stop();
        break;
      case 'updateSettings':
        this.hashtags = message.hashtags || [];
        this.delay = (message.delay || 5) * 1000;
        this.enableLikes = message.enableLikes !== undefined ? message.enableLikes : true;
        break;
    }
  }

  start() {
    if (this.isRunning) return;
    
    if (!this.isOnSearchPage()) {
      alert('Please navigate to X.com search results first');
      return;
    }

    if (this.hashtags.length === 0) {
      alert('Please configure hashtags in the extension popup first');
      return;
    }

    this.isRunning = true;
    this.lastProcessTime = Date.now(); // Reset timer on start
    this.lastScrollHeight = document.body.scrollHeight; // Initialize scroll height
    this.stuckCounter = 0; // Reset stuck counter
    console.log('Starting X Reposter...');
    this.processNextTweet();
  }

  stop() {
    this.isRunning = false;
    console.log('X Reposter stopped');
  }

  isOnSearchPage() {
    return window.location.href.includes('/search') || 
           document.querySelector('[data-testid="primaryColumn"]');
  }

  async processNextTweet() {
    if (!this.isRunning) return;

    // Check for error message and retry
    if (this.checkAndHandleError()) {
      setTimeout(() => this.processNextTweet(), 2000);
      return;
    }

    const tweets = this.getTweets();
    if (tweets.length === 0) {
      console.log('No tweets found, waiting...');
      
      // Check if we should refresh the page
      if (Date.now() - this.lastProcessTime > this.refreshTimeout) {
        console.log('No tweets found for 10 seconds, refreshing page...');
        location.reload();
        return;
      }
      
      setTimeout(() => this.processNextTweet(), this.delay);
      return;
    }

    // Find next unprocessed tweet
    let tweet = null;
    for (let i = this.currentIndex; i < tweets.length; i++) {
      const tweetElement = tweets[i];
      const tweetId = this.getTweetId(tweetElement);
      
      if (tweetId && !this.processedTweets.has(tweetId)) {
        tweet = tweetElement;
        this.currentIndex = i;
        break;
      }
    }

    if (!tweet) {
      // Check if we're stuck (no new content loading)
      const currentScrollHeight = document.body.scrollHeight;
      if (currentScrollHeight === this.lastScrollHeight) {
        this.stuckCounter++;
        console.log(`Stuck counter: ${this.stuckCounter}/${this.maxStuckCount}`);
        
        if (this.stuckCounter >= this.maxStuckCount) {
          console.log('Lazy loading stuck, refreshing page...');
          location.reload();
          return;
        }
      } else {
        this.stuckCounter = 0;
        this.lastScrollHeight = currentScrollHeight;
      }
      
      // Scroll to load more tweets
      this.scrollToLoadMore();
      await this.sleep(2000); // Wait longer for lazy loading
      
      setTimeout(() => {
        this.currentIndex = 0; // Reset index after scroll
        this.processNextTweet();
      }, this.delay);
      return;
    }

    // Check if tweet contains target hashtags
    if (this.containsTargetHashtags(tweet)) {
      await this.processTweet(tweet);
      this.lastProcessTime = Date.now(); // Update last process time
    }

    this.currentIndex++;
    setTimeout(() => this.processNextTweet(), this.delay);
  }

  getTweets() {
    // Wait for DOM to be ready and get fresh tweet elements
    const tweets = Array.from(document.querySelectorAll('[data-testid="tweet"]'));
    
    // Filter out tweets that are not fully loaded (lazy loading)
    return tweets.filter(tweet => {
      const tweetText = tweet.textContent;
      const hasContent = tweetText && tweetText.trim().length > 10;
      const hasButtons = tweet.querySelector('[data-testid="like"]') && tweet.querySelector('[data-testid="retweet"]');
      return hasContent && hasButtons;
    });
  }

  getTweetId(tweetElement) {
    // Extract tweet ID from various possible locations
    const link = tweetElement.querySelector('a[href*="/status/"]');
    if (link) {
      const match = link.href.match(/\/status\/(\d+)/);
      return match ? match[1] : null;
    }
    return null;
  }

  containsTargetHashtags(tweetElement) {
    const tweetText = tweetElement.textContent.toLowerCase();
    return this.hashtags.some(hashtag => 
      tweetText.includes(hashtag.toLowerCase().replace('#', ''))
    );
  }

  async processTweet(tweetElement) {
    try {
      const tweetId = this.getTweetId(tweetElement);
      if (tweetId) {
        this.processedTweets.add(tweetId);
      }

      // Scroll tweet into view
      tweetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      await this.sleep(1000);

      // Like tweet if enabled
      if (this.enableLikes) {
        await this.likeTweet(tweetElement);
      }

      // Add comment with hashtags
      await this.commentOnTweet(tweetElement);

      // Repost tweet
      await this.repostTweet(tweetElement);

    } catch (error) {
      console.error('Error processing tweet:', error);
    }
  }

  async likeTweet(tweetElement) {
    const likeButton = tweetElement.querySelector('[data-testid="like"]');
    if (likeButton && !likeButton.querySelector('[data-testid="unlike"]')) {
      likeButton.click();
      console.log('Tweet liked');
      await this.sleep(500);
    }
  }

  async repostTweet(tweetElement) {
    try {
      // Find repost button
      const repostButton = tweetElement.querySelector('[data-testid="retweet"]');
      if (!repostButton) {
        console.log('Repost button not found');
        return;
      }

      // Click repost button
      repostButton.click();
      await this.sleep(1000);

      // Look for repost confirmation (simple repost, not quote tweet)
      const confirmButton = document.querySelector('[data-testid="retweetConfirm"]');
      if (confirmButton) {
        confirmButton.click();
        console.log('Tweet reposted successfully');
        await this.sleep(1000);
      }

    } catch (error) {
      console.error('Error reposting tweet:', error);
    }
  }

  scrollToLoadMore() {
    // Multiple scroll strategies to trigger lazy loading
    const currentScroll = window.pageYOffset;
    const documentHeight = document.body.scrollHeight;
    const windowHeight = window.innerHeight;
    
    // Scroll to 80% of page first, then to bottom
    const targetScroll = documentHeight * 0.8;
    
    window.scrollTo({
      top: targetScroll,
      behavior: 'smooth'
    });
    
    // Then scroll to bottom after a delay
    setTimeout(() => {
      window.scrollTo({
        top: documentHeight,
        behavior: 'smooth'
      });
    }, 1000);
  }

  checkAndHandleError() {
    // Look for "Something went wrong" error message
    const errorMessage = document.querySelector('span');
    if (errorMessage && errorMessage.textContent.includes('Something went wrong. Try reloading.')) {
      console.log('Error detected: Something went wrong. Looking for retry button...');
      
      // Find retry button (button with refresh icon and "Retry" text)
      const retryButton = Array.from(document.querySelectorAll('button')).find(btn => {
        const spanText = btn.querySelector('span');
        return spanText && spanText.textContent.includes('Retry');
      });
      
      if (retryButton) {
        console.log('Clicking retry button...');
        retryButton.click();
        return true;
      }
    }
    return false;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async commentOnTweet(tweetElement) {
    try {
      // Find reply button
      const replyButton = tweetElement.querySelector('[data-testid="reply"]');
      if (!replyButton) {
        console.log('Reply button not found');
        return;
      }

      // Click reply button
      replyButton.click();
      await this.sleep(3000); // Wait longer for dialog to fully load

      // Find the tweet compose textbox with more specific selectors
      let textbox = document.querySelector('[data-testid="tweetTextarea_0"]') ||
                   document.querySelector('div[contenteditable="true"][data-testid*="textInput"]') ||
                   document.querySelector('div[contenteditable="true"][role="textbox"]');
      
      if (!textbox) {
        console.log('Comment textbox not found');
        this.closeReplyDialog();
        return;
      }

      // Create comment from hashtags
      const comment = this.hashtags.join(' ');
      
      // Focus and clear
      textbox.focus();
      await this.sleep(500);
      
      // Use document.execCommand for better compatibility
      textbox.innerHTML = '';
      textbox.textContent = '';
      
      // Insert text using execCommand (more reliable for contenteditable)
      document.execCommand('insertText', false, comment);
      
      // Fallback: direct manipulation if execCommand doesn't work
      if (!textbox.textContent.includes(comment)) {
        textbox.textContent = comment;
        textbox.innerHTML = comment;
      }
      
      // Trigger comprehensive events
      const events = ['focus', 'input', 'change', 'keydown', 'keyup', 'paste'];
      events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true, cancelable: true });
        if (eventType === 'keydown' || eventType === 'keyup') {
          event.key = ' ';
          event.keyCode = 32;
        }
        textbox.dispatchEvent(event);
      });
      
      await this.sleep(2000); // Wait for validation

      // Find submit button with more patience
      let submitButton = null;
      for (let attempts = 0; attempts < 5; attempts++) {
        submitButton = document.querySelector('[data-testid="tweetButtonInline"]:not([disabled])') ||
                      document.querySelector('[data-testid="tweetButton"]:not([disabled])') ||
                      document.querySelector('button[type="submit"]:not([disabled])');
        
        if (submitButton) break;
        await this.sleep(500);
      }
      
      if (submitButton) {
        submitButton.click();
        console.log('Comment posted:', comment);
        await this.sleep(2000);
      } else {
        console.log('Submit button not found or still disabled');
        this.closeReplyDialog();
      }

    } catch (error) {
      console.error('Error commenting on tweet:', error);
      this.closeReplyDialog();
    }
  }

  closeReplyDialog() {
    // Try multiple ways to close the dialog
    const closeSelectors = [
      '[data-testid="app-bar-close"]',
      '[aria-label="Close"]',
      'button[aria-label*="Close"]',
      '.r-1cvl2hr button' // X.com close button class
    ];
    
    for (const selector of closeSelectors) {
      const closeButton = document.querySelector(selector);
      if (closeButton) {
        closeButton.click();
        break;
      }
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => new XReposter());
} else {
  new XReposter();
}