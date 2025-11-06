/**
 * Vercel Deployment Checks Skipper - Content Script
 *
 * Author: Aditya Kamat
 *
 * This script automates the process of skipping deployment checks on Vercel.
 * It finds the "Deployment Checks" section, opens it if needed, and clicks
 * all available "Skip" buttons.
 */

// Prevent multiple executions
if (window.vercelSkipperRunning) {
  console.log('[Vercel Skipper] Already running, skipping duplicate execution');
} else {
  window.vercelSkipperRunning = true;

  (function() {
    'use strict';

// Configuration constants for easy customization
const CONFIG = {
  // CSS selectors for various elements
  SELECTORS: {
    HEADERS: '.deploy-step-module__kdfw_G__header',
    NAME_SPAN: '.deploy-step-module__kdfw_G__name',
    TRIGGER_DIV: '.deploy-step-module__kdfw_G__triggerContent',
    ITEM_SECTION: '.deploy-step-module__kdfw_G__item',
    CONTENT: '.deploy-step-module__kdfw_G__content',
    ALL_BUTTONS: 'button'
  },

  // Text identifiers
  TEXT: {
    DEPLOYMENT_CHECKS: 'Deployment Checks',
    SKIP_BUTTON: 'skip'
  },

  // Timing delays (in milliseconds)
  DELAYS: {
    AFTER_OPEN: 1200,       // Wait time after opening a section
    AFTER_SCROLL: 800,      // Wait time after scrolling
    RETRY: 800,             // Wait time before retrying
    BETWEEN_CLICKS: 800,    // Wait time between clicking skip buttons
    AFTER_SKIP: 1500,       // Wait time after clicking a skip button
    CHECK_STATUS: 1000,     // Wait time before checking if all are skipped
    BEFORE_REFRESH: 2000,   // Wait time before refreshing the page
    MAX_RETRIES: 10         // Maximum retry attempts for verification
  },

  // State attribute values
  STATE: {
    OPEN: 'open'
  },

  // Check status indicators
  STATUS_ICONS: {
    PENDING: 'M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM8.75 4.75V4H7.25V4.75V7.875C7.25 8.18976 7.39819 8.48615 7.65 8.675L9.55 10.1L10.15 10.55L11.05 9.35L10.45 8.9L8.75 7.625V4.75Z', // Clock icon (pending)
    SKIPPED: true // Checks for absence of pending/error icons
  }
};

/**
 * Sends status messages to the popup (if available)
 * @param {string} message - The status message to send
 * @param {string} type - Message type ('info', 'success', 'error')
 */
function sendMessageToPopup(message, type = 'info') {
  try {
    // Check if extension context is valid
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
      // Wrap in try-catch and suppress the error
      const promise = chrome.runtime.sendMessage({ action: 'updateStatus', message, type });

      // Only add catch handler if promise exists
      if (promise && typeof promise.catch === 'function') {
        promise.catch(() => {
          // Popup is closed, silently ignore
        });
      }
    }
  } catch (e) {
    // Extension context invalid or popup closed, silently fail
  }
}

/**
 * Main function to skip all Vercel deployment checks
 */
window.skipVercelDeploymentChecks = function skipVercelDeploymentChecks() {
  // Verify we're on a Vercel page
  if (!window.location.href.includes('vercel.com')) {
    console.log('[Vercel Skipper] Not on vercel.com, skipping execution');
    sendMessageToPopup('Please navigate to vercel.com', 'error');
    return;
  }

  console.log('[Vercel Skipper] Starting deployment checks skip process...');
  sendMessageToPopup('Starting skip process...', 'info');

  /**
   * Scrolls to the bottom of the Deployment Checks section to load all checks
   * @param {Function} callback - Function to call after scrolling
   */
  function scrollToBottomOfChecks(callback) {
    console.log('[Vercel Skipper] Scrolling to bottom to load all checks...');
    sendMessageToPopup('Loading all checks...', 'info');

    // Find the Deployment Checks content area
    const headers = Array.from(document.querySelectorAll(CONFIG.SELECTORS.HEADERS));
    const deploymentHeader = headers.find(header => {
      const nameSpan = header.querySelector(CONFIG.SELECTORS.NAME_SPAN);
      return nameSpan && nameSpan.textContent.trim() === CONFIG.TEXT.DEPLOYMENT_CHECKS;
    });

    if (deploymentHeader) {
      const itemSection = deploymentHeader.closest(CONFIG.SELECTORS.ITEM_SECTION);
      const contentSection = itemSection ? itemSection.querySelector(CONFIG.SELECTORS.CONTENT) : null;

      if (contentSection) {
        // Scroll the content section to the bottom
        contentSection.scrollTop = contentSection.scrollHeight;
        console.log('[Vercel Skipper] Scrolled to bottom of Deployment Checks');

        // Also scroll the page to make sure the section is visible
        itemSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        // Wait for any lazy-loaded content to appear
        setTimeout(callback, CONFIG.DELAYS.AFTER_SCROLL);
      } else {
        console.log('[Vercel Skipper] Content section not found, proceeding anyway...');
        setTimeout(callback, CONFIG.DELAYS.AFTER_SCROLL);
      }
    } else {
      console.log('[Vercel Skipper] Deployment header not found for scrolling, proceeding anyway...');
      setTimeout(callback, CONFIG.DELAYS.AFTER_SCROLL);
    }
  }

  /**
   * Opens the Deployment Checks section if it's closed
   * @param {Function} callback - Function to call after section is opened
   */
  function openDeploymentChecksSection(callback) {
    console.log('[Vercel Skipper] Looking for Deployment Checks section...');

    // Find all section headers on the page
    const headers = Array.from(document.querySelectorAll(CONFIG.SELECTORS.HEADERS));
    console.log(`[Vercel Skipper] Found ${headers.length} section headers`);

    // Locate the "Deployment Checks" header
    const deploymentHeader = headers.find(header => {
      const nameSpan = header.querySelector(CONFIG.SELECTORS.NAME_SPAN);
      const headerText = nameSpan ? nameSpan.textContent.trim() : '';
      console.log(`[Vercel Skipper] Checking header: "${headerText}"`);
      return headerText === CONFIG.TEXT.DEPLOYMENT_CHECKS;
    });

    // If header not found, try alternative approach
    if (!deploymentHeader) {
      console.log('[Vercel Skipper] Primary search failed. Trying alternative selectors...');

      // Try finding by text content directly
      const allElements = Array.from(document.querySelectorAll('*'));
      const altHeader = allElements.find(el => {
        const text = el.textContent.trim();
        return text === CONFIG.TEXT.DEPLOYMENT_CHECKS &&
               (el.tagName === 'SPAN' || el.tagName === 'DIV' || el.tagName === 'H3' || el.tagName === 'H4');
      });

      if (altHeader) {
        console.log('[Vercel Skipper] Found via alternative method, getting parent section...');
        const parentSection = altHeader.closest('[data-state]');
        if (parentSection) {
          const isOpen = parentSection.getAttribute('data-state') === CONFIG.STATE.OPEN;
          console.log(`[Vercel Skipper] Section state: ${isOpen ? 'open' : 'closed'}`);

          if (isOpen) {
            scrollToBottomOfChecks(callback);
          } else {
            console.log('[Vercel Skipper] Clicking alternative element to open...');
            altHeader.click();
            setTimeout(() => scrollToBottomOfChecks(callback), CONFIG.DELAYS.AFTER_OPEN);
          }
          return;
        }
      }

      console.log('[Vercel Skipper] Deployment Checks section not found, retrying...');
      sendMessageToPopup('Looking for checks section...', 'info');
      setTimeout(() => openDeploymentChecksSection(callback), CONFIG.DELAYS.RETRY);
      return;
    }

    console.log('[Vercel Skipper] Deployment Checks header found!');

    // Get related elements
    const triggerDiv = deploymentHeader.querySelector(CONFIG.SELECTORS.TRIGGER_DIV);
    const itemSection = deploymentHeader.closest(CONFIG.SELECTORS.ITEM_SECTION);
    const isOpen = itemSection && itemSection.getAttribute('data-state') === CONFIG.STATE.OPEN;

    console.log(`[Vercel Skipper] Trigger found: ${!!triggerDiv}, Section found: ${!!itemSection}, Is Open: ${isOpen}`);

    // Check if section is already open
    if (isOpen) {
      console.log('[Vercel Skipper] Deployment Checks section is already open');
      // Scroll to bottom first, then proceed
      scrollToBottomOfChecks(callback);
    }
    // If closed, click to open it
    else if (triggerDiv) {
      console.log('[Vercel Skipper] Clicking trigger to open Deployment Checks section...');
      sendMessageToPopup('Opening checks section...', 'info');
      triggerDiv.click();
      // After opening, scroll to bottom then proceed
      setTimeout(() => scrollToBottomOfChecks(callback), CONFIG.DELAYS.AFTER_OPEN);
    }
    // If trigger not found, try clicking the header directly
    else if (itemSection) {
      console.log('[Vercel Skipper] No trigger found, clicking item section...');
      itemSection.click();
      setTimeout(() => {
        // Verify it opened and proceed
        const nowOpen = itemSection.getAttribute('data-state') === CONFIG.STATE.OPEN;
        console.log(`[Vercel Skipper] After click, section state: ${nowOpen ? 'open' : 'closed'}`);
        if (nowOpen) {
          scrollToBottomOfChecks(callback);
        } else {
          // Try clicking header as last resort
          console.log('[Vercel Skipper] Clicking header directly as fallback...');
          deploymentHeader.click();
          setTimeout(() => scrollToBottomOfChecks(callback), CONFIG.DELAYS.AFTER_OPEN);
        }
      }, CONFIG.DELAYS.AFTER_OPEN);
    }
    else {
      console.log('[Vercel Skipper] Clicking header directly...');
      deploymentHeader.click();
      setTimeout(() => scrollToBottomOfChecks(callback), CONFIG.DELAYS.AFTER_OPEN);
    }
  }

  /**
   * Checks if all deployment checks have been skipped by examining the icon status
   * @returns {Object} Status object with allSkipped boolean and counts
   */
  function checkAllSkipped() {
    // Find all check items in the Deployment Checks section
    const checkIcons = Array.from(document.querySelectorAll('[data-testid="geist-icon"].deploy-step-module__kdfw_G__icon'));

    let pendingCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    let totalChecks = checkIcons.length;

    checkIcons.forEach(icon => {
      const svg = icon.querySelector('svg');
      if (svg) {
        const path = svg.querySelector('path');
        if (path) {
          const pathData = path.getAttribute('d');

          // Check if it's a pending icon (clock icon)
          if (pathData && pathData.includes('M14.5 8C14.5 11.5899')) {
            pendingCount++;
          }
          // Check if it's an error icon (you can add error icon path check here)
          else if (pathData && pathData.includes('error-specific-path')) {
            errorCount++;
          }
          // Otherwise assume it's skipped or completed
          else {
            skippedCount++;
          }
        }
      }
    });

    const allSkipped = (pendingCount === 0 && errorCount === 0 && totalChecks > 0);

    console.log(`[Vercel Skipper] Status Check - Total: ${totalChecks}, Pending: ${pendingCount}, Error: ${errorCount}, Skipped/Done: ${skippedCount}`);

    return {
      allSkipped,
      totalChecks,
      pendingCount,
      errorCount,
      skippedCount
    };
  }

  /**
   * Completes the skipping process after all buttons have been clicked
   */
  function completeSkipping() {
    const cycleCount = parseInt(sessionStorage.getItem('vercelSkipperCycle') || '0');

    // Always refresh to check for more checks (cycle continues until no skip buttons found)
    console.log('[Vercel Skipper] Refreshing to check for more pending checks...');
    sendMessageToPopup('Refreshing to check for more...', 'info');
    sessionStorage.setItem('vercelSkipperCycle', (cycleCount + 1).toString());
    setTimeout(refreshAndContinue, CONFIG.DELAYS.BEFORE_REFRESH);
  }

  /**
   * Refreshes the page and continues skipping process for second pass
   */
  function refreshAndContinue() {
    console.log('[Vercel Skipper] Refreshing for second pass...');
    sessionStorage.setItem('vercelSkipperContinue', 'true');
    window.location.reload();
  }

  /**
   * Refreshes the page and navigates to the Deployments tab
   */
  function refreshAndOpenDeployments() {
    console.log('[Vercel Skipper] Refreshing page and opening Deployments tab...');

    // Store a flag in sessionStorage to indicate we need to open Deployments tab
    sessionStorage.setItem('vercelSkipperOpenDeployments', 'true');

    // Reload the page
    window.location.reload();
  }

  /**
   * Opens the Deployments tab after page reload
   */
  function openDeploymentsTab() {
    // Check if we should open the Deployments tab
    if (sessionStorage.getItem('vercelSkipperOpenDeployments') === 'true') {
      sessionStorage.removeItem('vercelSkipperOpenDeployments');

      console.log('[Vercel Skipper] Looking for Deployments tab...');

      // Find and click the Deployments tab
      const tabs = Array.from(document.querySelectorAll('a, button'));
      const deploymentsTab = tabs.find(tab => {
        const text = tab.textContent.trim().toLowerCase();
        return text === 'deployments' || text.includes('deployment');
      });

      if (deploymentsTab) {
        console.log('[Vercel Skipper] Opening Deployments tab...');
        sendMessageToPopup('Skipping checks completed', 'success');
        deploymentsTab.click();
        console.log('[Vercel Skipper] ✓ Process complete! Check deployment status.');
      } else {
        console.log('[Vercel Skipper] Deployments tab not found, retrying...');
        setTimeout(openDeploymentsTab, CONFIG.DELAYS.RETRY);
      }
    }
  }

  /**
   * Finds and clicks all "Skip" buttons in the Deployment Checks section
   */
  function skipButtons() {
    const cycleCount = parseInt(sessionStorage.getItem('vercelSkipperCycle') || '0');

    // Find all skip buttons that are enabled and visible
    const skipButtonsFound = Array.from(document.querySelectorAll(CONFIG.SELECTORS.ALL_BUTTONS))
      .filter(button =>
        button.textContent.trim().toLowerCase() === CONFIG.TEXT.SKIP_BUTTON &&
        !button.disabled
      );

    // If no skip buttons found - process is complete!
    if (skipButtonsFound.length === 0) {
      console.log('[Vercel Skipper] No skip buttons found.');
      console.log('[Vercel Skipper] ✓ No checks to skip!');
      sendMessageToPopup('✓ No checks found', 'success');
      sessionStorage.removeItem('vercelSkipperCycle');
      sessionStorage.removeItem('vercelSkipperContinue');
      // Don't refresh or navigate away - stay on current page
      return;
    }

    console.log(`[Vercel Skipper] Found ${skipButtonsFound.length} skip button(s)`);

    if (cycleCount === 0) {
      sendMessageToPopup(`Skipping ${skipButtonsFound.length} checks...`, 'info');
    } else {
      sendMessageToPopup(`Pass ${cycleCount + 1}: Skipping ${skipButtonsFound.length} more...`, 'info');
    }

    // Click each skip button with a delay between clicks
    skipButtonsFound.forEach((button, index) => {
      setTimeout(() => {
        button.click();
        console.log(`[Vercel Skipper] Clicked skip button #${index + 1}/${skipButtonsFound.length}`);
        sendMessageToPopup(`Skipped ${index + 1}/${skipButtonsFound.length}`, 'info');

        // After last button, refresh and check for more
        if (index === skipButtonsFound.length - 1) {
          setTimeout(() => {
            console.log('[Vercel Skipper] All visible skip buttons clicked');
            completeSkipping();
          }, CONFIG.DELAYS.AFTER_SKIP);
        }
      }, index * CONFIG.DELAYS.BETWEEN_CLICKS);
    });
  }

  // Check if we just refreshed after skipping
  if (sessionStorage.getItem('vercelSkipperOpenDeployments') === 'true') {
    // Open Deployments tab after refresh (final step)
    setTimeout(openDeploymentsTab, CONFIG.DELAYS.AFTER_OPEN);
  } else if (sessionStorage.getItem('vercelSkipperContinue') === 'true') {
    // Continue skipping after refresh - open Deployment Checks and look for more skip buttons
    sessionStorage.removeItem('vercelSkipperContinue');
    const cycleCount = parseInt(sessionStorage.getItem('vercelSkipperCycle') || '0');
    console.log(`[Vercel Skipper] Pass ${cycleCount + 1}: Checking for more checks...`);
    sendMessageToPopup(`Pass ${cycleCount + 1}: Checking...`, 'info');

    // Wait for page to fully load, then open Deployment Checks section and check for skip buttons
    setTimeout(() => {
      console.log('[Vercel Skipper] Page loaded, opening Deployment Checks section...');
      openDeploymentChecksSection(() => {
        console.log('[Vercel Skipper] Section opened, looking for skip buttons...');
        skipButtons();
      });
    }, CONFIG.DELAYS.AFTER_OPEN);
  } else {
    // First run - start the process
    console.log('[Vercel Skipper] First run - opening Deployment Checks section...');
    openDeploymentChecksSection(() => {
      console.log('[Vercel Skipper] Section opened, looking for skip buttons...');
      skipButtons();
    });
  }
}

// Only execute automatically if we're in the middle of a process (after refresh)
if (sessionStorage.getItem('vercelSkipperOpenDeployments') === 'true' ||
    sessionStorage.getItem('vercelSkipperContinue') === 'true') {
  console.log('[Vercel Skipper] Auto-executing due to session flags');
  window.skipVercelDeploymentChecks();
}
// Otherwise, the function is exposed on window and will be called by popup.js when user clicks

  })(); // End of IIFE
} // End of duplicate execution check
