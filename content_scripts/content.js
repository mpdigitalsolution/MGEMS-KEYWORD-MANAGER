console.log('Content script loaded');
// Track Ctrl key state
let isCtrlPressed = false;
let captureDebugMode = false;

// Track processed keywords to avoid duplicates
const processedKeywords = new Set();

// Direct storage access — no background message needed
const storage = chrome.storage.local;

function debugLog(...args) {
  if (captureDebugMode) {
    console.log('[Capture Debug]', ...args);
  }
}

function debugNotify(message, targetElement = document.body, isError = false) {
  if (captureDebugMode) {
    showQuickNotification(`Debug: ${message}`, targetElement, isError);
  }
}

function loadCaptureDebugMode() {
  try {
    if (!chrome?.storage?.local) return;
    chrome.storage.local.get(['captureDebugMode'], (result) => {
      captureDebugMode = !!result.captureDebugMode;
      debugLog('Capture Debug Mode active');
    });
  } catch (error) {
    captureDebugMode = false;
  }
}

if (chrome?.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && changes.captureDebugMode) {
      captureDebugMode = !!changes.captureDebugMode.newValue;
      debugLog('Capture Debug Mode updated', captureDebugMode);
    }
  });
}

loadCaptureDebugMode();

// Listen for Ctrl key press/release
document.addEventListener('keydown', (e) => {
  if (e.key === 'Control') {
    console.log('Ctrl key pressed');
    isCtrlPressed = true;
    document.body.classList.add('ctrl-pressed');
  }
});

document.addEventListener('keyup', (e) => {
  if (e.key === 'Control') {
    console.log('Ctrl key released');
    isCtrlPressed = false;
    document.body.classList.remove('ctrl-pressed');
  }
});

// Reset Ctrl state when window loses focus
window.addEventListener('blur', () => {
  isCtrlPressed = false;
  document.body.classList.remove('ctrl-pressed');
});

// Auto-highlight and save selected keywords
// Auto-highlight and save selected keywords
document.addEventListener('mouseup', (event) => {
  const selection = window.getSelection();
  const selectedText = normalizeKeywordText(selection.toString());
  if (selectedText.length > 2 && (isGoogleAdsPage() || isKeywordPlannerPage())) {
    addKeyword(selectedText, event.target, 'selection');
  }
});

// Handle checkbox clicks in Keyword Planner
// Trigger capture on ANY click inside the planner — Google uses complex virtualized tables
// where checkboxes may use custom elements, SVG icons, or Material Design components
// PLUS: inject a MutationObserver + periodic poll for Google's selector-based checkboxes
document.addEventListener('click', (event) => {
  if (!isKeywordPlannerPage()) return;
  
  // Log what was clicked for debugging
  console.log('Mgemz: Click on:', event.target.tagName, 
    'class:', (event.target.className || '').substring(0, 80),
    'role:', event.target.getAttribute('role') || 'none',
    'type:', event.target.getAttribute('type') || 'none',
    'closest row:', event.target.closest('tr, [role="row"]') !== null,
    'closest checkbox:', event.target.closest('[aria-checked]') !== null);
  
  console.log('Mgemz: Planner click detected — triggering capture');
  setTimeout(() => { captureAllCheckedKeywords(); }, 500);
});


// Also detect checkboxes being toggled via keyboard (Space key)
document.addEventListener('keydown', (event) => {
  if (!isKeywordPlannerPage()) return;
  if (event.key === ' ' || event.key === 'Space') {
    const active = document.activeElement;
    if (active) {
      // Check if the active element is part of a checkbox/row in the planner table
      const isCheckboxRow = 
        active.closest('input[type="checkbox"], [role="checkbox"], [aria-checked], tr, [role="row"]') !== null;
      if (isCheckboxRow) {
        setTimeout(captureAllCheckedKeywords, 100);
      }
    }
  }
});

// Handle double-click for quick keyword selection
document.addEventListener('dblclick', (event) => {
  const selection = window.getSelection();
  const selectedText = normalizeKeywordText(selection.toString());
  if (selectedText.length > 2 && (isGoogleAdsPage() || isKeywordPlannerPage())) {
    addKeyword(selectedText, event.target, 'double_click');
  }
});

// Check if we're on Google Ads
function isGoogleAdsPage() {
  return window.location.hostname.includes('ads.google.com') ||
         document.querySelector('[data-test-id], .ads-container, .campaign-row') !== null;
}

// Check if we're on Keyword Planner
function isKeywordPlannerPage() {
  // New Google Keyword Planner is at keywordplanner.google.com (separate domain, Angular app)
  const isCorrectURL = window.location.hostname.includes('keywordplanner.google.com') ||
         (window.location.hostname.includes('ads.google.com') && window.location.pathname.includes('keywordplanner'));
  
  // Detect Angular-based Keyword Planner (uses _ngcontent-* attributes, no traditional tables)
  const isAngularApp = document.querySelector('[ng-version], [_ngcontent]') !== null;
  const hasAngularCheckboxes = document.querySelectorAll('[_ngcontent] input[type="checkbox"], [_ngcontent] [aria-checked]').length > 0;
  
  // Detect the Angular grid structure that Google Keyword Planner uses
  // The keyword list uses div-based cards/rows, not traditional <table>
  const hasKeywordCards = 
    document.querySelector('[class*="card"], [class*="Card"], [class*="keyword"], [class*="Keyword"], [class*="row"], [class*="Row"]') !== null &&
    (document.querySelector('[class*="checkbox"], [class*="Checkbox"]') !== null ||
     document.querySelector('input[type="checkbox"]') !== null);
  
  // Generic: any page with checkboxes near keyword-like text
  const hasKeywordsNearCheckboxes = 
    document.querySelectorAll('input[type="checkbox"]').length > 0 &&
    document.body.innerText.includes('keyword');
  
  const pageDetails = {
    url: window.location.href,
    isCorrectURL,
    isAngularApp,
    hasAngularCheckboxes,
    hasKeywordCards,
    hasKeywordsNearCheckboxes,
    // DOM structure analysis
    allCheckboxes: document.querySelectorAll('input[type="checkbox"]').length,
    allAriaChecked: document.querySelectorAll('[aria-checked]').length,
    allInputs: document.querySelectorAll('input').length,
    allSpans: document.querySelectorAll('span').length,
    allDivs: document.querySelectorAll('div').length,
    tables: document.querySelectorAll('table').length,
    roles: {
      grid: document.querySelectorAll('[role="grid"]').length,
      gridcell: document.querySelectorAll('[role="gridcell"]').length,
      row: document.querySelectorAll('[role="row"]').length,
      checkbox: document.querySelectorAll('[role="checkbox"]').length,
      table: document.querySelectorAll('[role="table"]').length,
    },
    // Sample some div class names to understand the UI framework
    sampleClasses: [...new Set(Array.from(document.querySelectorAll('div[class]')).slice(0, 10).map(d => d.className.substring(0, 60)))]
  };
  
  console.log('Mgemz: Page detection:', pageDetails);
  
  // Return true if we're on the keywordplanner domain OR if the page has Angular+custom checkboxes+keyword content
  return isCorrectURL || (isAngularApp && hasKeywordsNearCheckboxes);
}

function normalizeKeywordText(text) {
  return (text || '').replace(/\s+/g, ' ').trim();
}

function addKeyword(keyword, targetElement, source = 'google_ads') {
  const normalizedKeyword = normalizeKeywordText(keyword);
  if (normalizedKeyword.length < 2) return;

  const keywordObject = {
    text: normalizedKeyword,
    timestamp: Date.now(),
    source
  };

  // Write directly to chrome.storage.local — no background message needed
  addKeywordToStorage(keywordObject).then((result) => {
    if (result.added) {
      highlightElement(targetElement, normalizedKeyword);
      showQuickNotification(`Added: ${normalizedKeyword}`, targetElement);
    } else if (result.duplicate) {
      showQuickNotification('Keyword already exists', targetElement, true);
    } else {
      showQuickNotification('Failed to save keyword', targetElement, true);
    }
  }).catch((err) => {
    showQuickNotification('Failed to save keyword: ' + err.message, targetElement, true);
  });
}

// Add a single keyword directly to chrome.storage.local with duplicate checking
async function addKeywordToStorage(keywordObj) {
  if (!keywordObj || !keywordObj.text) {
    return { added: false, error: 'Invalid keyword' };
  }
  try {
    const data = await storage.get(['keywords']);
    const keywords = data.keywords || [];
    const normalizedIncoming = keywordObj.text.trim().toLowerCase();
    
    if (!keywords.some(k => (k.text || '').trim().toLowerCase() === normalizedIncoming)) {
      keywords.push(keywordObj);
      await storage.set({ keywords });
      return { added: true };
    }
    return { added: false, duplicate: true };
  } catch (err) {
    return { added: false, error: err.message };
  }
}

function isLikelyKeywordText(text) {
  if (!text) return false;
  const cleanText = text.trim();
  if (cleanText.length < 2 || cleanText.length > 80) return false;  // Keywords are short!

  if (/^(low|medium|high|—|-|n\/a|keyword ideas|account status|competition)$/i.test(cleanText)) return false;
  if (/^[0-9.,\s]+$/.test(cleanText)) return false;
  if (/^[0-9.,]+%$/.test(cleanText)) return false;
  if (/^[\$€£₹]\s?[0-9.,]+/.test(cleanText)) return false;
  if (/^[0-9.,]+\s*[kKmM]\s*-\s*[0-9.,]+\s*[kKmM]$/.test(cleanText)) return false;
  if (/^(10K|100K|1M|10M)\s*-\s*(100K|1M|10M|100M)$/i.test(cleanText)) return false;
  if (/^(menu|ads|search|home|create|tools|billing|settings|admin|planning|shared|library|expand_more|arrow_drop_down|chevron_left|chevron_right|close|help_outline|notifications|button_magic)/i.test(cleanText)) return false;

  return /[a-zA-Z]/.test(cleanText);
}

function extractKeywordFromRow(row) {
  if (!row) return { keyword: '', keywordCell: null };

  const preferredSelectors = [
    '[aria-colindex="2"]',
    'td:nth-child(2)',
    '[data-column-name*="Keyword"]',
    '[data-column*="keyword"]',
    '.keyword-cell',
    '.keyword-text',
    '[data-keyword]',
    '[data-text]',
    // Google's new UI — keyword in first data column
    '[aria-colindex="1"]',
    'td:nth-child(1)',
  ];

  for (const selector of preferredSelectors) {
    const element = row.querySelector(selector);
    if (!element) continue;
    const text = (
      element.getAttribute('data-keyword') ||
      element.getAttribute('data-text') ||
      element.getAttribute('title') ||
      element.getAttribute('aria-label') ||
      element.textContent ||
      ''
    ).trim();
    if (isLikelyKeywordText(text)) {
      return { keyword: text, keywordCell: element };
    }
  }

  // Fallback: scan only td/gridcell elements for keyword-like text
  const cellCandidates = Array.from(row.querySelectorAll('td, [role="gridcell"], [role="cell"]'));
  for (const cell of cellCandidates) {
    const text = (cell.textContent || '').trim();
    if (isLikelyKeywordText(text)) {
      return { keyword: text, keywordCell: cell };
    }
  }

  // Last resort: the row's own text
  const rowText = (row.textContent || '').trim();
  if (isLikelyKeywordText(rowText)) {
    return { keyword: rowText, keywordCell: row };
  }

  return { keyword: '', keywordCell: null };
}

// Highlight the selected element
function highlightElement(element, keyword) {
  // Find the best element to highlight
  const targetElement = findBestHighlightTarget(element);
  
  // Apply highlight class
  targetElement.classList.add('keyword-highlight');
  
  // Create a temporary highlight overlay for visual feedback
  const overlay = document.createElement('div');
  overlay.className = 'keyword-overlay';
  overlay.style.cssText = `
    position: absolute;
    background: rgba(255, 235, 59, 0.3);
    border: 2px solid #FFEB3B;
    border-radius: 4px;
    pointer-events: none;
    z-index: 9999;
    transition: opacity 0.3s ease;
  `;
  
  // Position the overlay
  const rect = targetElement.getBoundingClientRect();
  overlay.style.left = (rect.left + window.scrollX) + 'px';
  overlay.style.top = (rect.top + window.scrollY) + 'px';
  overlay.style.width = rect.width + 'px';
  overlay.style.height = rect.height + 'px';
  
  document.body.appendChild(overlay);
  
  // Remove highlights after animation
  setTimeout(() => {
    targetElement.classList.remove('keyword-highlight');
    if (overlay.parentNode) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }, 300);
    }
  }, 2000);
}

// Find the best element to highlight
function findBestHighlightTarget(element) {
  // Look for keyword-specific containers
  let target = element.closest('.keyword-cell, [data-keyword], .keyword-row, .keyword-text');
  
  if (!target) {
    // Look for table cells or list items
    target = element.closest('td, li, .cell, .item');
  }
  
  if (!target) {
    // Look for divs with text content
    target = element.closest('div[class*="keyword"], div[class*="text"], span[class*="keyword"]');
  }
  
  // Fallback to the original element
  return target || element;
}

// Handle select all checkboxes in Keyword Planner
async function handleSelectAllCheckboxes(isChecked) {
  try {
    const keywordRows = document.querySelectorAll('[role="row"], tr, [class*="row"]:not([class*="header"]):not([class*="filter"]):not([class*="toolbar"])');
    
    if (isChecked) {
      // Select all - capture all keywords
      const keywordsToAdd = [];
      
      for (const row of keywordRows) {
        const { keyword: keywordText, keywordCell } = extractKeywordFromRow(row);
        const checkbox = row.querySelector('input[type="checkbox"]');
        
        if (keywordCell && checkbox && !checkbox.checked) {
          if (keywordText) {
            // Get additional keyword data
            const searchVolume = (
              row.querySelector('[aria-colindex="3"], td:nth-child(3), [class*="volume"], [class*="Volume"], [class*="search"]') ||
              row.querySelector('[aria-colindex="2"], td:nth-child(2), [data-column-name*="Volume"]')
            )?.textContent.trim();
            const competition = (
              row.querySelector('[aria-colindex="6"], td:nth-child(6), [class*="competition"], [class*="Competition"]') ||
              row.querySelector('[aria-colindex="5"], td:nth-child(5), [data-column-name*="Competition"]')
            )?.textContent.trim();
            const bidLow = (
              row.querySelector('[aria-colindex="8"], td:nth-child(8), [class*="low"], [class*="Low"]') ||
              row.querySelector('[aria-colindex="7"], td:nth-child(7)')
            )?.textContent.trim();
            const bidHigh = (
              row.querySelector('[aria-colindex="9"], td:nth-child(9), [class*="high"], [class*="High"]') ||
              row.querySelector('[aria-colindex="8"], td:nth-child(8)')
            )?.textContent.trim();
            
            const keywordData = {
              keyword: keywordText,
              searchVolume: searchVolume || 'N/A',
              competition: competition || 'N/A',
              bidLow: bidLow || 'N/A',
              bidHigh: bidHigh || 'N/A'
            };
            
            keywordsToAdd.push({
              text: keywordText,
              keywordData: keywordData,
              row: row,
              keywordCell: keywordCell
            });
            
            // Check the checkbox and mark as selected
            checkbox.checked = true;
            if (row) {
              row.style.backgroundColor = '#FFF9C4';
              row.style.outline = '2px solid #FFEB3B';
              row.style.outlineOffset = '-1px';
            } else if (keywordCell) {
              keywordCell.style.backgroundColor = '#FFF9C4';
              keywordCell.style.outline = '2px solid #FFEB3B';
              keywordCell.style.outlineOffset = '-1px';
            }
          }
        }
      }
      
      // Add all keywords in bulk
      if (keywordsToAdd.length > 0) {
        await addMultipleKeywords(keywordsToAdd);
      }
      
    } else {
      // Deselect all - remove all keywords
      for (const row of keywordRows) {
        const { keyword: keywordText, keywordCell } = extractKeywordFromRow(row);
        const checkbox = row.querySelector('input[type="checkbox"]');
        
        if (keywordCell && checkbox && checkbox.checked) {
          if (keywordText) {
            // Write directly to chrome.storage.local
            try {
              chrome.storage.local.get(['keywords'], (data) => {
                let keywords = data.keywords || [];
                const normalizedTarget = keywordText.trim().toLowerCase();
                keywords = keywords.filter(k => (k.text || '').trim().toLowerCase() !== normalizedTarget);
                chrome.storage.local.set({ keywords });
              });
            } catch(e) {
              console.log('Failed to remove keyword from storage');
            }
            
            // Uncheck and remove selection
            checkbox.checked = false;
            if (row) {
              row.style.backgroundColor = '';
              row.style.outline = '';
              row.style.outlineOffset = '';
            } else if (keywordCell) {
              keywordCell.style.backgroundColor = '';
              keywordCell.style.outline = '';
              keywordCell.style.outlineOffset = '';
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error('Mgemz: Error handling select all:', error);
  }
}

// Add multiple keywords at once directly to chrome.storage.local
async function addMultipleKeywords(keywordsToAdd) {
  console.log('Mgemz: addMultipleKeywords called with', keywordsToAdd.length, 'keywords');
  try {
    // Check if extension context is still valid — prevents "Extension context invalidated" errors
    if (!chrome?.storage?.local) {
      console.log('Mgemz: Extension context invalidated, skipping storage write');
      return;
    }
    
    // Read existing keywords
    const data = await storage.get(['keywords']);
    let keywords = data.keywords || [];
    let addedCount = 0;
    
    // Highlight elements and add non-duplicate keywords
    for (const {text, row} of keywordsToAdd) {
      const keywordObject = {
        text: text,
        timestamp: Date.now(),
        source: 'keyword_planner'
      };
      
      const normalizedIncoming = text.trim().toLowerCase();
      if (!keywords.some(k => (k.text || '').trim().toLowerCase() === normalizedIncoming)) {
        keywords.push(keywordObject);
        addedCount++;
      }
      
      // Apply highlight to the ENTIRE row for better visibility in Google's UI
      if (row) {
        row.style.backgroundColor = '#FFF9C4';
        row.style.outline = '2px solid #FFEB3B';
        row.style.outlineOffset = '-1px';
        // Also try to highlight the parent row if this is a deep child
        if (row.parentElement && !row.matches('[class*="row"], [class*="Row"], tr, [role="row"]')) {
          row.parentElement.style.backgroundColor = '#FFF9C4';
          row.parentElement.style.outline = '2px solid #FFEB3B';
        }
      }
    }
    
    if (addedCount > 0) {
      await storage.set({ keywords });
      // Update badge count instantly by messaging background script
      try {
        chrome.runtime.sendMessage({ action: 'refreshBadge' }).catch(() => {});
      } catch(e) {}
    }
    
    console.log(`Mgemz: Added ${addedCount}/${keywordsToAdd.length} keywords to storage`);
    if (addedCount > 0) {
      showQuickNotification(`✓ Added ${addedCount} keywords`, document.body);
    } else {
      showQuickNotification('All keywords already exist', document.body, false);
    }
    
  } catch (error) {
    console.error('Mgemz: Error adding multiple keywords:', error);
    showQuickNotification('Failed to add keywords', document.body, true);
  }
}

// Show a quick notification
function showQuickNotification(message, targetElement, isError = false) {
  const notification = document.createElement('div');
  notification.className = 'keyword-notification';
  
  // Split message into keyword and details
  const lines = message.split('\n');
  const keywordLine = lines[0];
  const details = lines.slice(1).join(' ');
  
  // Create keyword element
  const keywordElement = document.createElement('span');
  keywordElement.className = 'keyword';
  keywordElement.textContent = keywordLine;
  notification.appendChild(keywordElement);
  
  // Add details if present
  if (details) {
    const detailsElement = document.createElement('span');
    detailsElement.className = 'details';
    detailsElement.textContent = details;
    notification.appendChild(detailsElement);
  }
  
  // Position near the target element
  const rect = targetElement.getBoundingClientRect();
  notification.style.cssText = `
    position: fixed;
    top: ${rect.bottom + window.scrollY + 10}px;
    left: ${rect.left + window.scrollX}px;
    z-index: 9999;
    opacity: 0;
    transition: opacity 0.3s ease;
    background: ${isError ? '#dc3545' : 'rgba(66, 133, 244, 0.95)'};
  `;
  
  document.body.appendChild(notification);
  
  // Fade in
  setTimeout(() => notification.style.opacity = '1', 0);
  
  // Remove after delay
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Handle messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'highlightKeyword') {
    const elements = document.querySelectorAll(`[data-keyword="${message.keyword}"]`);
    elements.forEach(el => highlightElement(el, message.keyword));
    return false;
  }
  if (message.action === 'forceCapture') {
    console.log('Mgemz: Force capture triggered from popup');
    captureAllCheckedKeywords();
    sendResponse({ success: true });
    return true;
  }
  // Only return true if we need to send an async response
  return false;
});

// Watch for manual checkbox selections and capture multiple keywords
// Captures instantly when checkboxes change — no polling, no false negatives from async rendering
let checkboxObserver = null;
let checkboxCaptureTimer = null;

function setupCheckboxObserver() {
  // Clean up any previous observer
  if (checkboxObserver) checkboxObserver.disconnect();
  if (checkboxCaptureTimer) {
    clearTimeout(checkboxCaptureTimer);
    checkboxCaptureTimer = null;
  }

  // Find the best container to watch — fall back to document.body if table not found
  const container = document.querySelector('[role="grid"], [role="table"], table, [role="listbox"], [role="list"], [aria-label*="keyword" i], [aria-label*="planner" i], #main-content') || document.body;
  
  console.log('Mgemz: Observer watching:', container.tagName, container.id || container.className || '');

  checkboxObserver = new MutationObserver((mutations) => {
    // Check if any mutation involves a checkbox attribute change
    let relevantChange = false;
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && 
          ['checked', 'aria-checked', 'aria-selected', 'class', 'data-selected', 'data-checked'].includes(mutation.attributeName)) {
        relevantChange = true;
        break;
      }
      // Also detect new rows being added (virtual scrolling)
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        relevantChange = true;
        break;
      }
    }
    
    if (!relevantChange) return;
    
    if (checkboxCaptureTimer) clearTimeout(checkboxCaptureTimer);
    checkboxCaptureTimer = setTimeout(() => {
      checkboxCaptureTimer = null;
      captureAllCheckedKeywords();
    }, 100); // fast debounce for realtime feel
  });
  
  // Watch the container for ALL DOM changes — covers:
  // - checked attribute changes (standard checkboxes)
  // - aria-checked changes (ARIA-based checkboxes)
  // - class changes (Google sometimes adds .checked class)
  // - subtree additions (new rows in infinite scroll)
  // - characterData changes (Google rewriting cell content)
  checkboxObserver.observe(container, {
    subtree: true,
    attributes: true,
    attributeFilter: ['checked', 'aria-checked', 'class', 'aria-selected', 'data-selected', 'data-checked', 'style'],
    childList: true,
    characterData: false  // skip text changes for performance
  });
}

// Function to capture all currently checked keywords
// Scans Google Ads Keyword Planner for all checked rows and captures keyword text
async function captureAllCheckedKeywords() {
  try {
    // Check if extension context is still valid
    if (!chrome?.storage?.local) {
      return;
    }
    
    // Google's new Keyword Planner is an Angular app
    // It uses a div-based grid with Material Design components.
    // Checkboxes are custom Angular components (often with _ngcontent-* attributes)
    
    // Strategy 1: Find <input type="checkbox"> elements that are checked
    const checkedInputs = Array.from(document.querySelectorAll('input[type="checkbox"]:checked'));
    
    // Strategy 2: Find elements with aria-checked="true" (Material / custom checkboxes)
    const ariaCheckedElements = Array.from(document.querySelectorAll('[aria-checked="true"]'));
    
    // Strategy 3: Find rows that contain a selected/checked indicator — but ONLY inside
    // the keyword results grid, NOT in navigation/sidebar/tabs.
    // Google's Angular Keyword Planner tracks selection via generated class names.
    // Find the main results container first, then look for selected rows inside it.
    const resultsContainer = 
      // The keyword ideas table is usually inside a grid or section containing "keyword"
      document.querySelector('[role="grid"][class*="keyword" i], [role="grid"][class*="results" i], [role="grid"][aria-label*="keyword" i]') ||
      // Or a div with gm-data-table that also has "keyword" nearby in its structure
      document.querySelector('.gm-data-table')?.closest('[class*="section" i], [class*="content" i], [class*="panel" i], [class*="container" i]') ||
      // Last resort: any gm-data-table on the page
      document.querySelector('.gm-data-table');
    
    // Only proceed if we found a results container
    const dataChecked = [];
    if (resultsContainer) {
      // Find elements with selected/checked classes that are actual data rows (have text content)
      const candidates = resultsContainer.querySelectorAll('[class*="selected"], [class*="checked"], [aria-selected="true"]');
      for (const el of candidates) {
        // Skip if this element or its parent is a tab/button/nav element
        if (el.closest('[role="tab"], [role="navigation"], [role="menubar"], nav, header, [class*="tab"], [class*="Tab"], [class*="toolbar"], [class*="Toolbar"], [class*="nav"], [class*="Nav"], [class*="header"], [class*="Header"]')) continue;
        // Skip elements with no actual text content (empty rows)
        if (!el.textContent.trim()) continue;
        dataChecked.push(el);
      }
    }
    
    const allSelected = [...checkedInputs, ...ariaCheckedElements, ...dataChecked];
    
    console.log(`Mgemz: Found ${checkedInputs.length} checked inputs, ${ariaCheckedElements.length} aria-checked, ${dataChecked.length} in data table, total: ${allSelected.length}`);
    
    if (allSelected.length === 0) {
      console.log('Mgemz: No selected elements found');
      return;
    }
    
    // Deduplicate: only keep elements that have a unique parent row
    const seenRows = new Set();
    const checkedKeywords = [];
    
    for (const el of allSelected) {
      // Try to find the containing row / card / list item
      const row = el.closest('[class*="row"], [class*="Row"], [class*="item"], [class*="Item"], [class*="card"], [class*="Card"], [role="row"], [role="listitem"], li, div[_ngcontent]') || el.parentElement;
      if (!row) continue;
      if (seenRows.has(row)) continue;
      seenRows.add(row);
      
      const { keyword: keywordText } = extractKeywordFromRow(row);
      if (!keywordText) continue;
      
      // Skip if already processed in this page session
      if (processedKeywords.has(keywordText)) continue;
      
      checkedKeywords.push({
        text: keywordText,
        row: row
      });
      processedKeywords.add(keywordText);
    }
    
    // Remove processed keywords that are no longer checked
    const currentlyCheckedTexts = new Set();
    for (const el of allSelected) {
      const row = el.closest('[class*="row"], [class*="Row"], [class*="item"], [class*="Item"], [class*="card"], [class*="Card"], [role="row"], [role="listitem"], li, div[_ngcontent]');
      if (row) {
        const { keyword: kw } = extractKeywordFromRow(row);
        if (kw) currentlyCheckedTexts.add(kw);
      }
    }
    for (const kw of processedKeywords) {
      if (!currentlyCheckedTexts.has(kw)) {
        processedKeywords.delete(kw);
      }
    }
    
    if (checkedKeywords.length > 0) {
      console.log(`Mgemz: found ${allSelected.length} selected elements, capturing ${checkedKeywords.length} new keywords`);
      showQuickNotification(`Capturing ${checkedKeywords.length} keywords...`, document.body);
      await addMultipleKeywords(checkedKeywords);
    } else if (allSelected.length > 0) {
      console.log(`Mgemz: ${allSelected.length} selected elements but all keywords already captured`);
    } else {
      console.log('Mgemz: No selected elements found');
    }
    
  } catch (error) {
    console.error('Mgemz: Error capturing checked keywords:', error);
  }
}

// Set up checkbox observer with initial scan
// Uses retry to handle Google Ads' slow async rendering
if (isKeywordPlannerPage()) {
  console.log('Mgemz Keyword Manager: Planner page detected, setting up capture...');
  
  function initCapture() {
    setupCheckboxObserver();
    captureAllCheckedKeywords();
  }
  
  // Retry up to 3 times with increasing delays (Google Ads can take 5s+ to render)
  let attempts = 0;
  function tryInit() {
    attempts++;
    // Angular app — look for any content container instead of a table
    const container = document.querySelector('[ng-version], [class*="content"], [class*="list"], [class*="results"], main, #main-content, [role="main"]') || document.body;
    if (container || attempts >= 3) {
      console.log(`Mgemz: Initializing capture (attempt ${attempts})`);
      initCapture();
      
      // Re-scan when tab becomes visible
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) captureAllCheckedKeywords();
      });
      window.addEventListener('focus', () => captureAllCheckedKeywords());
      
      // Periodic poll every 500ms for near-instant capture
      setInterval(() => {
        captureAllCheckedKeywords();
      }, 500);
    } else {
      console.log(`Mgemz: Container not ready yet, retrying in ${attempts * 2}s (attempt ${attempts})`);
      setTimeout(tryInit, attempts * 2000);
    }
  }
  
  tryInit();
}

// Clean up any lingering highlights on page unload
window.addEventListener('beforeunload', () => {
  document.querySelectorAll('.keyword-highlight, .keyword-overlay, .keyword-notification, .selected').forEach(el => {
    if (el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });
  
  // Clear processed keywords on page unload
  processedKeywords.clear();
});
