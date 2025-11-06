/**
 * Vercel Deployment Checks Skipper - Popup Script
 *
 * This script handles the popup UI interactions and injects the content script
 * into the active Vercel tab to skip deployment checks.
 */

// Get references to UI elements
const skipButton = document.getElementById('skipBtn');
const statusElement = document.getElementById('status');

/**
 * Updates the status message and applies appropriate styling
 * @param {string} message - The message to display
 * @param {string} type - The type of message ('info', 'success', or 'error')
 */
function updateStatus(message, type = 'info') {
  statusElement.innerText = message;
  statusElement.className = type;
}

/**
 * Disables or enables the skip button
 * @param {boolean} disabled - Whether to disable the button
 */
function setButtonState(disabled) {
  skipButton.disabled = disabled;
}

// Listen for status updates from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'updateStatus') {
    updateStatus(request.message, request.type);
  }
});

/**
 * Main click handler for the "Skip All Checks" button
 */
skipButton.addEventListener('click', async () => {
  try {
    // Disable button and show running status
    setButtonState(true);
    updateStatus('Running...', 'info');

    // Get the active tab
    const [activeTab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    // Validate that we're on a Vercel page
    if (!activeTab.url || !activeTab.url.includes('vercel.com')) {
      updateStatus('Please navigate to vercel.com', 'error');
      setButtonState(false);
      return;
    }

    // Inject and execute the content script
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      files: ['content.js']
    });

    // Trigger the script execution
    await chrome.scripting.executeScript({
      target: { tabId: activeTab.id },
      func: () => {
        // Call the skipVercelDeploymentChecks function that was just defined
        if (typeof window.skipVercelDeploymentChecks === 'function') {
          window.skipVercelDeploymentChecks();
        } else {
          console.error('[Vercel Skipper] Function not found on window object');
        }
      }
    });

    // Show success message
    updateStatus('Process started...', 'success');

    // Keep button disabled - it will be re-enabled by status updates
    // The content script will send status updates throughout the process
    setTimeout(() => {
      setButtonState(false);
    }, 5000);

  } catch (error) {
    // Handle errors gracefully
    console.error('[Vercel Skipper] Error:', error);
    updateStatus('Error: ' + error.message, 'error');
    setButtonState(false);
  }
});

// Optional: Show initial instructions
updateStatus('Click to skip all checks', 'info');
