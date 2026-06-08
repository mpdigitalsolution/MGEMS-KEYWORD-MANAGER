// Helper for storage access
const storage = chrome.storage.local;

function getBadgeTextByCount(count) {
  if (!count || count <= 0) return '';
  if (count > 99) return '99+';
  return String(count);
}

async function updateKeywordBadge(count) {
  try {
    await chrome.action.setBadgeBackgroundColor({ color: '#4e54c8' });
    await chrome.action.setBadgeText({ text: getBadgeTextByCount(count) });
  } catch (error) {
    console.error('Failed to update keyword badge:', error);
  }
}

async function refreshKeywordBadgeFromStorage() {
  try {
    const data = await storage.get(['keywords']);
    const keywords = Array.isArray(data.keywords) ? data.keywords : [];
    await updateKeywordBadge(keywords.length);
  } catch (error) {
    console.error('Failed to refresh keyword badge from storage:', error);
  }
}

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
  refreshKeywordBadgeFromStorage();
});

chrome.runtime.onStartup.addListener(() => {
  refreshKeywordBadgeFromStorage();
});

// Setup Context Menu
function setupContextMenu() {
  chrome.contextMenus.create({
    id: "addKeyword",
    title: "Add to Keyword Manager",
    contexts: ["selection"]
  });
}

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addKeyword" && info.selectionText) {
    const text = info.selectionText.trim();
    if (text) {
      // Write directly to storage
      (async () => {
        const data = await storage.get(['keywords']);
        const keywords = data.keywords || [];
        const normalizedIncoming = text.trim().toLowerCase();
        
        if (!keywords.some(k => (k.text || '').trim().toLowerCase() === normalizedIncoming)) {
          keywords.push({
            text: text,
            source: 'context_menu',
            timestamp: Date.now()
          });
          await storage.set({ keywords });
          await updateKeywordBadge(keywords.length);
        }
      })();
      
      // Visual Feedback: Highlight selected text
      if (tab && tab.id) {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const selection = window.getSelection();
            if (!selection.rangeCount) return;
            const range = selection.getRangeAt(0);
            const span = document.createElement('span');
            span.style.backgroundColor = 'yellow';
            span.style.color = 'black';
            try {
              range.surroundContents(span);
            } catch (e) {
              console.log('Highlight failed:', e);
            }
          }
        }).catch(err => console.log('Scripting error:', err));
      }
    }
  }
});

// Message Handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  (async () => {
    try {
      let response = { success: false };
      
      switch (request.action) {
        case 'getKeywords':
          const data = await storage.get(['keywords']);
          await updateKeywordBadge((data.keywords || []).length);
          response = { success: true, keywords: data.keywords || [] };
          break;

        case 'refreshBadge':
          await refreshKeywordBadgeFromStorage();
          response = { success: true };
          break;
          
        case 'addKeyword':
          response = await addKeywordToStorage(request.keyword);
          break;

        case 'addKeywordsBulk':
          response = await addKeywordsBulkToStorage(request.keywords);
          break;

        case 'removeKeyword':
          await removeKeyword(request.keywordText || request.keyword);
          response = { success: true };
          break;

        case 'removeAllKeywords':
        case 'clearKeywords':
          await storage.set({ keywords: [] });
          chrome.runtime.sendMessage({ action: 'keywordsUpdated' }).catch(() => {});
          await updateKeywordBadge(0);
          response = { success: true };
          break;

        case 'startPlannerAnalysis':
          analyzePlannerKeywords(request.keywords, request.apiKey);
          response = { success: true };
          break;
          
        default:
          console.log('Unknown action:', request.action);
      }
      
      sendResponse(response);
    } catch (error) {
      console.error('Background error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep channel open for async response
});

// Remove keywords (used by context menu and popup)
async function removeKeyword(keywordText) {
  if (!keywordText) return;
  const data = await storage.get(['keywords']);
  let keywords = data.keywords || [];
  const normalizedTarget = String(keywordText).trim().toLowerCase();
  
  const initialLength = keywords.length;
  keywords = keywords.filter(k => (k.text || '').trim().toLowerCase() !== normalizedTarget);
  
  if (keywords.length !== initialLength) {
    await storage.set({ keywords });
    await updateKeywordBadge(keywords.length);
  }
}

// Add a single keyword with duplicate check (used by context menu and popup)
async function addKeywordToStorage(keywordObj) {
  if (!keywordObj || !keywordObj.text) {
    return { success: false, error: 'Invalid keyword' };
  }
  try {
    const data = await storage.get(['keywords']);
    const keywords = data.keywords || [];
    const normalizedIncoming = keywordObj.text.trim().toLowerCase();
    
    if (!keywords.some(k => (k.text || '').trim().toLowerCase() === normalizedIncoming)) {
      keywords.push(keywordObj);
      await storage.set({ keywords });
      await updateKeywordBadge(keywords.length);
      return { success: true, added: true };
    }
    return { success: true, added: false, duplicate: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Add multiple keywords in bulk with duplicate check
async function addKeywordsBulkToStorage(newKeywords) {
  if (!Array.isArray(newKeywords) || newKeywords.length === 0) {
    return { success: true, totalAdded: 0, duplicates: [] };
  }
  try {
    const data = await storage.get(['keywords']);
    let keywords = data.keywords || [];
    let addedCount = 0;
    const duplicates = [];

    newKeywords.forEach((nk) => {
      if (!nk || !nk.text) return;
      const normalizedIncoming = nk.text.trim().toLowerCase();
      if (!keywords.some(k => (k.text || '').trim().toLowerCase() === normalizedIncoming)) {
        keywords.push(nk);
        addedCount++;
      } else {
        duplicates.push(nk.text);
      }
    });

    if (addedCount > 0) {
      await storage.set({ keywords });
      await updateKeywordBadge(keywords.length);
    }
    return { success: true, totalAdded: addedCount, duplicates };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Planner Analysis Logic
async function analyzePlannerKeywords(keywords, apiKey) {
  console.log('Starting Planner Analysis in background...');
  
  // Reset/Init State
  await storage.set({
    plannerAnalysisStatus: 'analyzing',
    plannerProgress: { processed: 0, total: keywords.length, percent: 0, stage: 'initializing' },
    plannerAdGroups: {} 
  });

  try {
    let adGroups = {};

    if (!apiKey) {
      console.log('No API Key provided, using local clustering');
      adGroups = clusterKeywords(keywords);
      await storage.set({
        plannerProgress: {
          processed: keywords.length,
          total: keywords.length,
          percent: 100,
          stage: 'completed'
        }
      });
    } else {
      // AI Analysis
      const clusters = {};
      const chunkSize = 50; 
      const chunks = [];

      await storage.set({
        plannerProgress: {
          processed: 0,
          total: keywords.length,
          percent: 0,
          stage: 'chunking'
        }
      });
      
      for (let i = 0; i < keywords.length; i += chunkSize) {
        chunks.push(keywords.slice(i, i + chunkSize));
      }

      let processedCount = 0;
      
      for (const chunk of chunks) {
        await storage.set({
          plannerProgress: {
            processed: processedCount,
            total: keywords.length,
            percent: Math.max(0, Math.min(100, Math.floor((processedCount / Math.max(1, keywords.length)) * 100))),
            stage: 'ai-request'
          }
        });

        try {
          const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: 'deepseek-chat',
              messages: [
                {
                  role: 'system',
                  content: `You are a Google Ads Expert. Organize the provided keywords into tightly themed Ad Groups based on strict semantic relevance and commercial intent.
                  
                  For each keyword, assign:
                  1. "relevance": A score (0-100) indicating commercial intent (high score = high buying intent).
                  2. "intent": "high", "medium", or "low".
                  
                  Return a JSON object where keys are Ad Group Names and values are arrays of objects with properties: "keyword", "relevance", "intent".
                  Example:
                  {
                    "Emergency Plumbing": [
                      { "keyword": "emergency plumber", "relevance": 95, "intent": "high" }
                    ]
                  }`
                },
                {
                  role: 'user',
                  content: JSON.stringify(chunk.map(k => k.keyword))
                }
              ],
              response_format: { type: 'json_object' }
            })
          });

          if (!response.ok) throw new Error('API request failed');

          const data = await response.json();
          const content = JSON.parse(data.choices[0].message.content);
          
          // Merge results
          Object.entries(content).forEach(([groupName, groupKeywords]) => {
            if (!clusters[groupName]) clusters[groupName] = [];
            
            if (Array.isArray(groupKeywords)) {
              groupKeywords.forEach(aiKw => {
                const originalKw = chunk.find(k => k.keyword === aiKw.keyword);
                if (originalKw) {
                  let bidFactor = 0.3;
                  if (aiKw.relevance > 80) bidFactor = 0.6;
                  else if (aiKw.relevance > 60) bidFactor = 0.45;

                  let suggestedBid = originalKw.lowBid + ((originalKw.highBid - originalKw.lowBid) * bidFactor);
                  if (suggestedBid === 0) suggestedBid = originalKw.lowBid || 0.50;

                  clusters[groupName].push({
                    ...originalKw,
                    score: aiKw.relevance || 0,
                    intent: aiKw.intent || 'medium',
                    suggestedBid
                  });
                }
              });
            }
          });

        } catch (err) {
          console.warn('Chunk analysis failed, falling back to General group:', err);
          if (!clusters['General']) clusters['General'] = [];
          chunk.forEach(k => {
             clusters['General'].push({ ...k, score: 50, suggestedBid: k.lowBid * 1.3 });
          });
        }

        processedCount += chunk.length;
        const percent = Math.floor((processedCount / keywords.length) * 100);
        
        // Update Progress
        await storage.set({
          plannerProgress: {
            processed: processedCount,
            total: keywords.length,
            percent: Math.max(0, Math.min(100, percent)),
            stage: 'merging'
          }
        });
      }

      Object.keys(clusters).forEach(key => {
        clusters[key].sort((a, b) => b.score - a.score);
      });
      adGroups = clusters;
    }

    await storage.set({
      plannerAdGroups: adGroups,
      plannerAnalysisStatus: 'completed',
      plannerAnalysisComplete: true,
      plannerProgress: {
        processed: keywords.length,
        total: keywords.length,
        percent: 100,
        stage: 'completed'
      }
    });
    
    // showNotification function is not defined in background context usually
    // We should use chrome.notifications if needed, or just let popup poll
    // But since this is background, we can't show "popup" notifications easily
    // Use chrome.notifications.create
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '../icons/icon48.png', // Assuming icons exist, otherwise default
      title: 'Analysis Complete',
      message: 'Your keyword analysis is ready.'
    });

  } catch (error) {
    console.error('Planner Analysis Fatal Error:', error);
    await storage.set({
      plannerAnalysisStatus: 'error',
      plannerAnalysisError: error.message,
      plannerProgress: {
        processed: 0,
        total: keywords.length,
        percent: 0,
        stage: 'error'
      }
    });
  }
}

function clusterKeywords(keywords) {
  const clusters = {};
  const intentModifiers = ['buy', 'price', 'cost', 'cheap', 'best', 'review', 'service', 'company', 'agency', 'hire', 'near me', 'quote'];

  keywords.forEach(item => {
    let score = 0;
    score += Math.min(40, (item.volume / 1000) * 10); 
    const hasIntent = intentModifiers.some(mod => item.keyword.toLowerCase().includes(mod));
    if (hasIntent) score += 40;
    if (item.lowBid < 1.0) score += 20;
    else if (item.lowBid < 2.0) score += 10;

    const words = item.keyword.split(' ');
    let groupName = 'General';
    
    if (words.length >= 2) {
      const root = words.filter(w => w.length > 3 && !intentModifiers.includes(w)).join(' ');
      if (root) groupName = capitalizeWords(root);
    }

    if (!clusters[groupName]) clusters[groupName] = [];
    
    let suggestedBid = item.lowBid + ((item.highBid - item.lowBid) * 0.3);
    if (suggestedBid === 0) suggestedBid = item.lowBid || 0.50; 

    clusters[groupName].push({
      ...item,
      score,
      suggestedBid
    });
  });

  Object.keys(clusters).forEach(key => {
    clusters[key].sort((a, b) => b.score - a.score);
  });

  return clusters;
}

function capitalizeWords(str) {
  return str.replace(/\b\w/g, l => l.toUpperCase());
}
