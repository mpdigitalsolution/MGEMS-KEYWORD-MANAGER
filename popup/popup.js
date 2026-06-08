console.log('Popup script loaded');

// Global error handler for the popup
window.addEventListener('error', (event) => {
  console.error('Unhandled error in popup:', event.error);
  // Optionally, you could display a user-friendly error message here
});

document.addEventListener('DOMContentLoaded', () => {
 try {
    // UI Elements
    const settingsBtn = document.getElementById('settings-btn') || null;
    const settingsPanel = document.getElementById('settings-panel') || null;
  const capitalizeKeywordsCheckbox = document.getElementById('capitalize-cb');
  const captureDebugModeCheckbox = document.getElementById('debug-cb');
  const captureDebugBadge = document.getElementById('capture-debug-badge');
  const gradientStartInput = document.getElementById('gradient-start') || null;
  const gradientEndInput = document.getElementById('gradient-end') || null;
  const fontSelect = document.getElementById('font-select') || null;
  const fontSizeInput = document.getElementById('font-size') || null;
  const deepseekApiKeyInput = document.getElementById('api-key-input');
  const saveApiKeyBtn = document.getElementById('save-api-btn');
  const clearStorageBtn = document.getElementById('clear-storage-btn');
  const exportBtn = document.getElementById('export-btn');
  const getSuggestionsBtn = document.getElementById('get-suggestions-btn');
  const suggestionsContainer = document.getElementById('suggestions-list');
  const keywordsContainer = document.getElementById('kw-list');
  const removeAllBtn = document.getElementById('remove-all-btn') || null;
  const bulkPasteArea = document.getElementById('bulk-paste');
  const bulkPasteBtn = document.getElementById('bulk-add-btn');
  const regenerateBtn = document.getElementById('regenerate-btn');
  const generateAdsBtn = document.getElementById('generate-ads-btn');
  const adsContainer = document.getElementById('ads-container');
  const headlinesContainer = document.getElementById('headlines-container');
  const descriptionsContainer = document.getElementById('descriptions-container');
  const regenerateAdsBtn = document.getElementById('regenerate-ads-btn');
  
  // Selection bar elements
  const selBar = document.getElementById('sel-bar');
  const selBarLabel = document.getElementById('sel-bar-label');
  
  // Match type buttons
  const matchTypeBtns = document.querySelectorAll('.mt-btn');
  
  // Negative Keyword Analyzer Elements
  const uploadCsvBtn = document.getElementById('upload-csv-btn');
  const csvFileInput = document.getElementById('csv-file-input');
  const uploadArea = document.getElementById('upload-area');
  const uploadZone = document.getElementById('upload-zone');
  const uploadProgress = document.getElementById('upload-progress');
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  const fileInfo = document.getElementById('file-info') || null;
  const fileName = document.getElementById('file-name') || null;
  const fileSize = document.getElementById('file-size') || null;
  const analysisResults = document.getElementById('neg-results');
  const resultsSummary = document.getElementById('neg-summary');
  const negativeKeywordsList = document.getElementById('neg-list');
  const addAllNegativeBtn = document.getElementById('export-neg-btn');

  // Keyword Performance Optimizer Elements
  const uploadPerformanceCsvBtn = document.getElementById('upload-perf-btn');
  const performanceCsvFileInput = document.getElementById('perf-file-input');
  const performanceUploadArea = document.getElementById('perf-upload-area');
  const performanceUploadZone = document.getElementById('perf-upload-zone');
  const performanceUploadProgress = document.getElementById('perf-progress');
  const performanceProgressFill = document.getElementById('perf-progress-fill');
  const performanceProgressText = document.getElementById('perf-progress-text');
  const performanceFileInfo = document.getElementById('performance-file-info') || null;
  const performanceFileName = document.getElementById('performance-file-name') || null;
  const performanceFileSize = document.getElementById('performance-file-size') || null;
  
  const performanceAnalysisResults = document.getElementById('perf-results');
  const performanceSummaryCards = document.getElementById('perf-summary');
  const exportPauseListBtn = document.getElementById('export-perf-btn');

  // High-Intent Keyword Analyzer Elements
  const uploadPlannerCsvBtn = document.getElementById('upload-planner-btn');
  const plannerCsvFileInput = document.getElementById('planner-file-input');
  const plannerUploadArea = document.getElementById('planner-upload-area');
  const plannerUploadZone = document.getElementById('planner-upload-zone');
  const plannerUploadProgress = document.getElementById('planner-progress');
  const plannerProgressFill = document.getElementById('planner-progress-fill');
  const plannerProgressText = document.getElementById('planner-progress-text');
  
  const plannerSettingsPanel = document.getElementById('planner-settings');
  const minVolumeInput = document.getElementById('min-volume');
  const maxCpcInput = document.getElementById('max-cpc');
  const useAiAnalysisCheckbox = document.getElementById('use-ai-analysis') || { checked: false };
  const analyzePlannerBtn = document.getElementById('analyze-planner-btn');
  
  const plannerAnalysisResults = document.getElementById('planner-results');
  const plannerResultsSummary = document.getElementById('planner-summary');
  const adGroupsContainer = document.getElementById('ad-groups');
  const downloadPlannerResultsBtn = document.getElementById('download-planner-btn');

  let currentMatchType = 'phrase';
  let analyzedNegativeKeywords = [];
  let performanceData = [];
  let performanceAnalysis = {
    pause: [],
    optimize: [],
    scale: []
  };
  let plannerData = [];
  let adGroups = {};

  // Initialize
  loadSettings();
  updateKeywordsList();
  restoreSavedData();
  initializeCSVUpload();
  initializeKeywordPerformanceOptimizer();
  initializeHighIntentAnalyzer();

  // High-Intent Keyword Analyzer Logic
  function initializeHighIntentAnalyzer() {
    uploadPlannerCsvBtn.addEventListener('click', () => {
      plannerUploadArea.classList.remove('hidden');
    });

    plannerUploadZone.addEventListener('click', () => {
      plannerCsvFileInput.click();
    });

    plannerCsvFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) handlePlannerFileSelect(e.target.files[0]);
    });

    analyzePlannerBtn.addEventListener('click', runPlannerAnalysis);
    
    downloadPlannerResultsBtn.addEventListener('click', downloadPlannerResults);
  }

  function handlePlannerFileSelect(file) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      showNotification('Error', 'Please upload a valid CSV file.');
      return;
    }

    plannerUploadZone.classList.add('hidden');
    plannerUploadProgress.classList.remove('hidden');
    plannerProgressFill.style.width = '10%';
    plannerProgressText.textContent = 'Reading file...';

    const reader = new FileReader();
    reader.onload = (e) => {
      plannerProgressFill.style.width = '40%';
      plannerProgressText.textContent = 'Parsing Keyword Data...';
      
      const text = e.target.result;
      const parsedData = parsePlannerCSV(text);
      
      if (parsedData.length === 0) {
        showNotification('Error', 'No valid keyword data found. Ensure CSV is from Keyword Planner.');
        resetPlannerUpload();
        return;
      }

      plannerData = parsedData;
      // Persist uploaded data immediately so it's not lost on close
      chrome.storage.local.set({ plannerData: plannerData });

      plannerProgressFill.style.width = '100%';
      plannerProgressText.textContent = `Ready to analyze ${parsedData.length} keywords.`;
      
      setTimeout(() => {
        plannerUploadArea.classList.add('hidden');
        plannerSettingsPanel.classList.remove('hidden');
      }, 500);
    };
    reader.readAsText(file);
  }

  function parsePlannerCSV(csvText) {
    const lines = csvText.split('\n');
    // Keyword Planner CSVs often have 2 header rows, we need to find the real header
    let headerRowIndex = -1;
    for (let i = 0; i < Math.min(20, lines.length); i++) {
      const lowerLine = lines[i].toLowerCase();
      if (lowerLine.includes('avg. monthly searches') || lowerLine.includes('keyword (by relevance)') || lowerLine.includes('top of page bid')) {
        headerRowIndex = i;
        break;
      }
    }

    if (headerRowIndex === -1) return [];

    const headers = lines[headerRowIndex].split('\t').length > 1 ? lines[headerRowIndex].split('\t') : (lines[headerRowIndex].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[headerRowIndex].split(','));
    const cleanHeaders = headers.map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

    const colMap = {
      keyword: cleanHeaders.findIndex(h => h.includes('keyword')), // Matches "Keyword (by relevance)" or "Keyword"
      volume: cleanHeaders.findIndex(h => h.includes('monthly searches')), // Matches "Avg. monthly searches"
      lowBid: cleanHeaders.findIndex(h => h.includes('low range') || h.includes('top of page bid (low range)')),
      highBid: cleanHeaders.findIndex(h => h.includes('high range') || h.includes('top of page bid (high range)'))
    };

    if (colMap.keyword === -1 || colMap.volume === -1) return [];

    const data = [];
    
    // Helper to parse volume strings like "10K - 100K", "1,000", "50"
    const parseVolume = (str) => {
      if (!str) return 0;
      // Handle range: "10K - 100K" -> take lower bound "10K"
      let val = str;
      if (val.includes('-')) {
        val = val.split('-')[0].trim();
      }
      
      let multiplier = 1;
      const upperVal = val.toUpperCase();
      if (upperVal.includes('M')) multiplier = 1000000;
      else if (upperVal.includes('K')) multiplier = 1000;
      
      let num = parseFloat(val.replace(/[^0-9.]/g, ''));
      return Math.round(num * multiplier) || 0;
    };

    // Helper to parse currency strings like "1,200.50" or "$1.50"
    const parseCurrency = (str) => {
      if (!str) return 0;
      return parseFloat(str.replace(/[^0-9.]/g, '')) || 0;
    };

    for (let i = headerRowIndex + 1; i < lines.length; i++) {
      let line = lines[i];
      // Only remove carriage returns, preserve tabs for correct column counting
      line = line.replace(/\r$/, '');
      if (!line.trim()) continue;
      
      // Handle potential tab separation from Planner
      const columns = line.includes('\t') ? line.split('\t') : (line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(','));
      
      // We only need the columns we mapped, so checking against headers.length might be too strict
      // if the data rows have missing trailing columns
      const maxNeededIndex = Math.max(colMap.keyword, colMap.volume, colMap.lowBid, colMap.highBid);
      if (columns.length <= maxNeededIndex) continue;

      // Extract raw values safely
      const rawKeyword = columns[colMap.keyword] ? columns[colMap.keyword].replace(/^"|"$/g, '') : '';
      const rawVolume = columns[colMap.volume] ? columns[colMap.volume].replace(/^"|"$/g, '') : '';
      const rawLowBid = columns[colMap.lowBid] ? columns[colMap.lowBid].replace(/^"|"$/g, '') : '';
      const rawHighBid = columns[colMap.highBid] ? columns[colMap.highBid].replace(/^"|"$/g, '') : '';

      const volume = parseVolume(rawVolume);
      const lowBid = parseCurrency(rawLowBid);
      const highBid = parseCurrency(rawHighBid);

      if (rawKeyword && (volume > 0 || rawVolume.includes('0'))) { // Allow 0 volume if explicitly 0? But parseVolume returns 0 for invalid.
         // Filter out purely empty/invalid rows
         if (volume > 0 || rawVolume.trim() !== '') {
            data.push({ keyword: rawKeyword, volume, lowBid, highBid });
         }
      }
    }
    return data;
  }

  async function runPlannerAnalysis() {
    const minVolume = parseInt(minVolumeInput.value) || 0;
    const maxCpc = parseFloat(maxCpcInput.value) || 100;
    const useAi = useAiAnalysisCheckbox.checked;

    // Filter Data
    const filteredData = plannerData.filter(item => {
      // Use lowBid as proxy for "Affordability" if Avg CPC isn't available
      const estimatedCpc = item.lowBid || 0; 
      return item.volume >= minVolume && estimatedCpc <= maxCpc;
    });

    if (filteredData.length === 0) {
      showNotification('Warning', 'No keywords matched your filters.');
      return;
    }

    // Cluster Data
    if (useAi) {
      // Check for API Key
      const { deepseekApiKey } = await new Promise(resolve => {
        chrome.storage.local.get(['deepseekApiKey'], resolve);
      });

      if (!deepseekApiKey) {
        showNotification('Warning', 'DeepSeek API Key required for AI analysis. Falling back to local clustering.');
        // Local clustering fallback logic can be moved to background too, or kept here if simple. 
        // For consistency, let's assume background handles everything or we send a flag.
        // But the user prompt specifically asked for AI analysis to run in background.
        // Let's send it to background regardless, and let background handle the fallback if key is missing?
        // Actually, background script has access to storage, so it can check the key itself.
        // But we usually pass it for convenience.
        
        // If no key, we can just run local cluster here to be fast?
        // But to ensure "non-interrupting", even local processing for large files is better in background.
        // Let's send everything to background.
        
        // Wait, if no key, the background script I wrote falls back to local clustering.
        // So we can just send the request.
      }
      
      // Start Background Analysis
      analyzePlannerBtn.disabled = true;
      analyzePlannerBtn.textContent = 'Analysis Started...';
      
      // Update UI immediately
      plannerUploadArea.classList.add('hidden'); // Show progress area again
      plannerSettingsPanel.classList.add('hidden');
      plannerUploadZone.classList.add('hidden');
      plannerUploadProgress.classList.remove('hidden');
      plannerProgressFill.style.width = '0%';
      plannerProgressText.textContent = 'AI Analyzing: 0% (0/0 keywords)';

      chrome.runtime.sendMessage({
        action: 'startPlannerAnalysis',
        keywords: filteredData,
        apiKey: deepseekApiKey
      });

      monitorPlannerProgress();

    } else {
      // Local clustering (immediate)
      // We can also move this to background, but for now let's keep it here if user didn't check AI
      // OR, to be consistent with "ensure results won't be removed", maybe ALL analysis should be background?
      // The user specifically said "AI analyzing keywords".
      // But let's leave non-AI local for now as it's instant.
      adGroups = clusterKeywords(filteredData);
      
      // Save state to persist results
      chrome.storage.local.set({ 
        plannerData: plannerData, 
        plannerAdGroups: adGroups,
        plannerAnalysisComplete: true 
      });

      displayPlannerResults();
    }
  }

  function monitorPlannerProgress() {
    const checkProgress = () => {
      chrome.storage.local.get(['plannerAnalysisStatus', 'plannerProgress', 'plannerAdGroups', 'plannerAnalysisError'], (result) => {
        const { plannerAnalysisStatus, plannerProgress, plannerAdGroups, plannerAnalysisError } = result;

        if (plannerAnalysisStatus === 'analyzing') {
          plannerUploadArea.classList.remove('hidden');
          plannerSettingsPanel.classList.add('hidden');
          plannerUploadProgress.classList.remove('hidden');
          
          if (plannerProgress) {
            const percent = Math.max(0, Math.min(100, Number(plannerProgress.percent) || 0));
            const processed = Number(plannerProgress.processed) || 0;
            const total = Number(plannerProgress.total) || 0;
            const stage = plannerProgress.stage ? ` [${plannerProgress.stage}]` : '';
            plannerProgressFill.style.width = `${percent}%`;
            plannerProgressText.textContent = `AI Analyzing: ${percent}% (${processed}/${total} keywords)${stage}`;
          }
          
          // Continue monitoring
          setTimeout(checkProgress, 1000);
        } else if (plannerAnalysisStatus === 'completed') {
          adGroups = plannerAdGroups;
          analyzePlannerBtn.disabled = false;
          analyzePlannerBtn.textContent = 'Analyze & Organize';
          plannerProgressFill.style.width = '100%';
          plannerProgressText.textContent = 'AI Analysis Complete: 100%';
          setTimeout(() => {
            plannerUploadProgress.classList.add('hidden');
            displayPlannerResults();
          }, 500);
        } else if (plannerAnalysisStatus === 'error') {
          analyzePlannerBtn.disabled = false;
          analyzePlannerBtn.textContent = 'Analyze & Organize';
          plannerUploadProgress.classList.add('hidden');
          plannerSettingsPanel.classList.remove('hidden');
          showNotification('Error', plannerAnalysisError || 'Analysis failed');
        }
      });
    };
    
    checkProgress();
  }

  // Removed local analyzeWithAI function as it is now in background
  // async function analyzeWithAI(keywords, apiKey) { ... } 

  function clusterKeywords(keywords) {
    const clusters = {};
    
    // Intent keywords organized by strength
    const highIntent = ['buy', 'purchase', 'order', 'price', 'cost', 'quote', 'hire', 'emergency', 'near me', 'best', 'top', 'cheap', 'discount', 'deal', 'coupon', 'promo', 'sale', 'service', 'company', 'agency', 'plumber', 'contractor', 'install', 'repair', 'replacement', 'attorney', 'lawyer', 'doctor', 'dentist', 'insurance', 'loan', 'mortgage'];
    const mediumIntent = ['review', 'comparison', 'vs', 'or', 'guide', 'tips', 'how to', 'what is', 'cost of', 'pricing', 'rates', 'fee', 'coverage', 'benefits', 'near', 'local', 'certified', 'professional', 'licensed', 'insured'];
    const lowIntent = ['free', 'diy', 'homemade', 'definition', 'meaning', 'history', 'examples', 'ideas', 'information', 'info', 'research', 'article', 'blog', 'news', 'job', 'salary', 'training', 'class', 'course'];

    keywords.forEach(item => {
      const keywordLower = item.keyword.toLowerCase();
      
      // ---- 1. Volume Score (0-30) - logarithmic scale ----
      // This gives a more balanced score across different volume ranges
      let volumeScore = 0;
      if (item.volume >= 10000) volumeScore = 30;
      else if (item.volume >= 5000) volumeScore = 25;
      else if (item.volume >= 1000) volumeScore = 20;
      else if (item.volume >= 500) volumeScore = 15;
      else if (item.volume >= 100) volumeScore = 10;
      else if (item.volume >= 50) volumeScore = 5;
      else if (item.volume > 0) volumeScore = 2;
      
      // ---- 2. Intent Score (0-40) - keyword-based detection ----
      let intentScore = 0;
      let intentLabel = 'low';
      
      // Check high intent keywords
      const hasHighIntent = highIntent.some(word => keywordLower.includes(word));
      // Check medium intent keywords
      const hasMediumIntent = mediumIntent.some(word => keywordLower.includes(word));
      // Check low intent keywords (negative signal)
      const hasLowIntent = lowIntent.some(word => keywordLower.includes(word));
      
      if (hasHighIntent) {
        intentScore = 40;
        intentLabel = 'high';
      } else if (hasMediumIntent) {
        intentScore = 25;
        intentLabel = 'medium';
      } else if (hasLowIntent) {
        intentScore = 5;
        intentLabel = 'low';
      } else {
        // Default: assume medium intent for multi-word commercial keywords
        if (keywordLower.split(' ').length >= 2) {
          intentScore = 15;
          intentLabel = 'medium';
        } else {
          intentScore = 10;
          intentLabel = 'low';
        }
      }
      
      // ---- 3. CPC Score (0-30) - both cheap AND expensive are useful ----
      let cpcScore = 0;
      let cpcLabel = 'medium';
      
      if (item.lowBid > 0 && item.highBid > 0) {
        const avgCpc = (item.lowBid + item.highBid) / 2;
        if (avgCpc <= 1.0) {
          cpcScore = 30;  // Cheap CPC = great for budget campaigns
          cpcLabel = 'cheap';
        } else if (avgCpc <= 3.0) {
          cpcScore = 20;  // Moderate CPC
          cpcLabel = 'medium';
        } else if (avgCpc <= 5.0) {
          cpcScore = 15;  // Moderate-expensive
          cpcLabel = 'medium';
        } else {
          cpcScore = 10;  // Expensive CPC — still usable, but budget-heavy
          cpcLabel = 'expensive';
        }
      }
      
      // ---- 4. Total Score ----
      const totalScore = volumeScore + intentScore + cpcScore;
      
      // ---- 5. Ad Group Assignment ----
      const words = keywordLower.split(' ');
      let groupName = 'General';
      
      if (words.length >= 2) {
        // Find the core noun phrase (filter out common words and intent modifiers)
        const coreWords = words.filter(w => 
          w.length > 3 && 
          !highIntent.includes(w) && 
          !mediumIntent.includes(w) &&
          !['with', 'for', 'and', 'the', 'your', 'our', 'from', 'this', 'that', 'have', 'are', 'not'].includes(w)
        );
        if (coreWords.length > 0) {
          groupName = coreWords.slice(0, 2).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }
      
      if (!clusters[groupName]) clusters[groupName] = [];
      
      // Calculate suggested bid based on CPC data
      let suggestedBid = item.lowBid + ((item.highBid - item.lowBid) * 0.3);
      if (suggestedBid === 0) suggestedBid = item.lowBid || 0.50;

      clusters[groupName].push({
        ...item,
        score: totalScore,
        volumeScore,
        intentScore,
        intent: intentLabel,
        cpcScore,
        cpcLabel,
        suggestedBid
      });
    });

    // Sort keywords within clusters by score (highest first)
    Object.keys(clusters).forEach(key => {
      clusters[key].sort((a, b) => b.score - a.score);
    });

    return clusters;
  }

  function displayPlannerResults() {
    plannerSettingsPanel.classList.add('hidden');
    plannerAnalysisResults.classList.remove('hidden');

    const groupCount = Object.keys(adGroups).length;
    const keywordCount = Object.values(adGroups).reduce((a, b) => a + b.length, 0);

    plannerResultsSummary.innerHTML = `
      <p><strong>Found:</strong> ${keywordCount} keywords in ${groupCount} Ad Groups</p>
    `;

    adGroupsContainer.innerHTML = '';
    
    Object.entries(adGroups).forEach(([groupName, keywords]) => {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'ad-group-item stagger-item';
      
      const header = document.createElement('div');
      header.className = 'ad-group-header';
      header.innerHTML = `
        <span>${groupName}</span>
        <span class="ad-group-count">${keywords.length}</span>
      `;
      
      const content = document.createElement('div');
      content.className = 'ad-group-content';
      
      keywords.forEach(k => {
        const row = document.createElement('div');
        row.className = 'planner-keyword-row';
        
        // Intent badge color
        let intentBadge = '';
        if (k.intent === 'high') intentBadge = '<span class="badge badge-scale" style="font-size:9px;padding:2px 6px;">HIGH</span>';
        else if (k.intent === 'medium') intentBadge = '<span class="badge badge-optimize" style="font-size:9px;padding:2px 6px;">MED</span>';
        else intentBadge = '<span class="badge badge-pause" style="font-size:9px;padding:2px 6px;">LOW</span>';
        
        // CPC label
        let cpcBadge = '';
        if (k.cpcLabel === 'cheap') cpcBadge = '<span style="color:#2e7d32;font-size:10px;">💰 Cheap</span>';
        else if (k.cpcLabel === 'expensive') cpcBadge = '<span style="color:#c62828;font-size:10px;">🔥 Expensive</span>';
        else cpcBadge = '';
        
        row.innerHTML = `
          <button class="planner-add-btn" title="Add to keyword list" data-keyword="${k.keyword.replace(/"/g, '&quot;')}">
            <span class="material-icons">add_circle</span>
          </button>
          <div style="flex:1;min-width:0;">
            <div class="pk-term">${k.keyword}</div>
            <div style="display:flex;gap:6px;align-items:center;margin-top:4px;">
              ${intentBadge}
              ${cpcBadge}
              <span style="font-size:10px;color:#8898aa;">Score: ${k.score}</span>
            </div>
          </div>
          <div class="pk-stats" style="text-align:right;">
            <div>Vol: ${k.volume.toLocaleString()}</div>
            <div class="pk-bid">Bid: $${k.suggestedBid.toFixed(2)}</div>
          </div>
        `;
        
        // Add click handler for the + button
        const addBtn = row.querySelector('.planner-add-btn');
        addBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const keywordText = addBtn.dataset.keyword;
          const keywordObject = { text: keywordText, timestamp: Date.now(), source: 'planner_analysis' };
          try {
            const result = await addKeywordToStorage(keywordObject);
            if (result.added) {
              addBtn.innerHTML = '<span class="material-icons" style="color:#2e7d32;">check_circle</span>';
              showNotification('Success', `Added "${keywordText}"`);
              updateKeywordsList();
            } else if (result.duplicate) {
              showNotification('Warning', `"${keywordText}" already exists`);
            }
          } catch (err) {
            showNotification('Error', 'Failed to add keyword');
          }
          setTimeout(() => {
            addBtn.innerHTML = '<span class="material-icons">add_circle</span>';
          }, 2000);
        });
        
        content.appendChild(row);
      });

      header.addEventListener('click', () => {
        content.classList.toggle('open');
      });

      groupDiv.appendChild(header);
      groupDiv.appendChild(content);
      adGroupsContainer.appendChild(groupDiv);
    });
  }

  function downloadPlannerResults() {
    let csvContent = "Campaign,Ad Group,Keyword,Criterion Type,Max CPC,Intent,CPC Label,Score,Volume\n";
    
    Object.entries(adGroups).forEach(([groupName, keywords]) => {
      keywords.forEach(k => {
        csvContent += `My Campaign,"${groupName}","${k.keyword}",Broad,${k.suggestedBid.toFixed(2)},${k.intent || 'medium'},${k.cpcLabel || 'medium'},${k.score},${k.volume}\n`;
      });
    });

    downloadCSV(csvContent, 'optimized-ad-groups.csv');
  }

  function capitalizeWords(str) {
    return str.replace(/\b\w/g, l => l.toUpperCase());
  }

  function resetPlannerUpload() {
    plannerUploadProgress.classList.add('hidden');
    plannerUploadZone.classList.remove('hidden');
    plannerCsvFileInput.value = '';
  }

  // Keyword Performance Optimizer Logic
  function initializeKeywordPerformanceOptimizer() {
    if (uploadPerformanceCsvBtn) {
      uploadPerformanceCsvBtn.addEventListener('click', () => {
        if (performanceUploadArea) performanceUploadArea.classList.remove('hidden');
      });
    }

    if (performanceUploadZone) {
      performanceUploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        performanceUploadZone.classList.add('drag-over');
      });

      performanceUploadZone.addEventListener('dragleave', () => {
        performanceUploadZone.classList.remove('drag-over');
      });

      performanceUploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        performanceUploadZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length > 0) handlePerformanceFileSelect(files[0]);
      });

      performanceUploadZone.addEventListener('click', () => {
        if (performanceCsvFileInput) performanceCsvFileInput.click();
      });
    }

    if (performanceCsvFileInput) {
      performanceCsvFileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) handlePerformanceFileSelect(e.target.files[0]);
      });
    }

    // Export pause list button — wired up dynamically in displayPerformanceResults
    const exportPerfBtn = document.getElementById('export-perf-btn');
    if (exportPerfBtn) {
      // Will be wired in displayPerformanceResults
    }
  }

  function handlePerformanceFileSelect(file) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      showNotification('Error', 'Please upload a valid CSV file.');
      return;
    }

    performanceFileName.textContent = file.name;
    performanceFileSize.textContent = formatFileSize(file.size);
    performanceFileInfo.classList.remove('hidden');
    performanceUploadZone.classList.add('hidden');
    
    processPerformanceCSV(file);
  }

  function processPerformanceCSV(file) {
    performanceUploadProgress.classList.remove('hidden');
    performanceProgressFill.style.width = '10%';
    performanceProgressText.textContent = 'Reading file...';

    const reader = new FileReader();
    reader.onload = async (e) => {
      performanceProgressFill.style.width = '30%';
      performanceProgressText.textContent = 'Parsing Performance Data...';
      
      const text = e.target.result;
      const parsedData = parsePerformanceCSV(text);
      
      if (parsedData.length === 0) {
        showNotification('Error', 'No valid keyword data found. Ensure CSV has "Keyword", "Clicks", "Cost", and "Conversions" columns.');
        resetPerformanceUpload();
        return;
      }

      performanceData = parsedData;
      performanceProgressFill.style.width = '50%';
      performanceProgressText.textContent = `Parsed ${parsedData.length} keywords. Running AI analysis...`;

      // Auto-run AI analysis — no manual targets needed
      await runAIPerformanceAnalysis(parsedData);
    };
    reader.onerror = () => {
      showNotification('Error', 'Failed to read file.');
      resetPerformanceUpload();
    };
    reader.readAsText(file);
  }

  // New: AI-powered performance analysis — runs automatically after CSV upload
  async function runAIPerformanceAnalysis(keywords) {
    const { deepseekApiKey } = await new Promise(resolve => {
      chrome.storage.local.get(['deepseekApiKey'], resolve);
    });

    if (!deepseekApiKey) {
      // Fall back to local rule-based analysis
      showNotification('Warning', 'No DeepSeek API key. Using rule-based analysis.');
      runLocalPerformanceAnalysis(keywords);
      return;
    }

    performanceProgressFill.style.width = '60%';
    performanceProgressText.textContent = 'AI analyzing performance data...';

    // Filter: keywords with 7+ clicks and no conversions → pause candidates
    // Plus keywords with high CPC relative to value
    const pauseCandidates = [];

    try {
      // Send to AI in chunks
      const chunkSize = 100;
      for (let i = 0; i < keywords.length; i += chunkSize) {
        const chunk = keywords.slice(i, i + chunkSize);
        
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `You are a Google Ads performance analyst. Review these keyword performance metrics.

Identify keywords that should be PAUSED based on these rules:

1. "no_conversions" — Keywords with 7+ clicks and ZERO conversions. These are wasting budget. Include the keyword, clicks, cost, and reason.
2. "high_cpc" — Keywords that HAVE conversions but the CPC is too high compared to the value they bring. These are converting but too expensive. Include keyword, clicks, cost, conversions, CPC, and reason.

Return as JSON: { "pause": [{ "keyword": "...", "clicks": N, "cost": N, "conversions": N, "cpc": N, "reason": "..." }] }

Be thorough — check every keyword. If none match, return empty array.`
              },
              {
                role: 'user',
                content: JSON.stringify(chunk.map(k => ({
                  keyword: k.keyword,
                  clicks: k.clicks,
                  cost: k.cost,
                  conversions: k.conversions,
                  cpc: k.cpc
                })))
              }
            ],
            response_format: { type: 'json_object' }
          })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        const pause = content.pause || [];
        if (Array.isArray(pause)) {
          pauseCandidates.push(...pause);
        }

        const percent = 60 + Math.floor(((i + chunkSize) / keywords.length) * 35);
        performanceProgressFill.style.width = `${Math.min(percent, 95)}%`;
      }

      performanceProgressFill.style.width = '100%';
      performanceProgressText.textContent = `AI identified ${pauseCandidates.length} keywords to pause`;
      
      setTimeout(() => {
        displayPerformanceResults(pauseCandidates);
      }, 500);

    } catch (error) {
      console.error('AI performance analysis failed:', error);
      showNotification('Warning', 'AI analysis failed. Falling back to rule-based analysis.');
      runLocalPerformanceAnalysis(keywords);
    }
  }

  // Fallback: local rule-based analysis
  function runLocalPerformanceAnalysis(keywords) {
    const pauseCandidates = [];
    
    keywords.forEach(item => {
      // Rule 1: 7+ clicks, no conversions
      if (item.clicks >= 7 && item.conversions === 0) {
        pauseCandidates.push({
          keyword: item.keyword,
          clicks: item.clicks,
          cost: item.cost,
          conversions: 0,
          cpc: item.cpc,
          reason: `${item.clicks} clicks, 0 conversions — wasted spend`
        });
      }
      // Rule 2: Has conversions but CPC is high
      else if (item.conversions > 0 && item.cpc > 0) {
        const cpa = item.cost / item.conversions;
        if (cpa > item.cpc * 3 || item.cpc > 5.0) {
          pauseCandidates.push({
            keyword: item.keyword,
            clicks: item.clicks,
            cost: item.cost,
            conversions: item.conversions,
            cpc: item.cpc,
            reason: `Converting (${item.conversions}) but CPC $${item.cpc.toFixed(2)} is too high`
          });
        }
      }
    });
    
    performanceProgressFill.style.width = '100%';
    performanceProgressText.textContent = `Found ${pauseCandidates.length} keywords to pause (local analysis)`;
    
    setTimeout(() => {
      displayPerformanceResults(pauseCandidates);
    }, 500);
  }

  // Updated display — simpler, shows pause candidates with AI reason
  function displayPerformanceResults(pauseCandidates) {
    performanceUploadArea.classList.add('hidden');
    performanceAnalysisResults.classList.remove('hidden');
    
    // Summary cards
    const totalSpend = pauseCandidates.reduce((sum, k) => sum + (k.cost || 0), 0);
    const totalClicks = pauseCandidates.reduce((sum, k) => sum + (k.clicks || 0), 0);
    
    performanceSummaryCards.innerHTML = `
      <div class="performance-card">
        <h5>Pause Candidates</h5>
        <span class="metric-value" style="color: #c62828;">${pauseCandidates.length}</span>
      </div>
      <div class="performance-card">
        <h5>Wasted Spend</h5>
        <span class="metric-value" style="color: #c62828;">$${totalSpend.toFixed(2)}</span>
      </div>
    `;

    // Pause list
    const pauseList = document.getElementById('perf-pause-list');
    pauseList.innerHTML = '';
    
    if (pauseCandidates.length === 0) {
      pauseList.innerHTML = '<div style="padding:20px;text-align:center;color:#666;">No keywords found that need pausing.</div>';
      return;
    }

    pauseCandidates.forEach(item => {
      const div = document.createElement('div');
      div.className = 'neg-item stagger-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.className = 'neg-checkbox';
      checkbox.checked = true;
      
      const content = document.createElement('div');
      content.className = 'neg-content';
      
      const term = document.createElement('span');
      term.className = 'neg-term';
      term.textContent = item.keyword;
      
      const stats = document.createElement('span');
      stats.style.cssText = 'display:block;font-size:10px;color:#525f7f;margin-top:2px;';
      stats.textContent = `${item.clicks} clicks | $${(item.cost || 0).toFixed(2)} cost | ${item.conversions || 0} conv`;
      
      const reason = document.createElement('span');
      reason.className = 'neg-reason';
      reason.textContent = item.reason;
      
      content.appendChild(term);
      content.appendChild(stats);
      content.appendChild(reason);
      
      div.appendChild(checkbox);
      div.appendChild(content);
      pauseList.appendChild(div);
    });
    
    // Update export button
    const exportBtn = document.getElementById('export-perf-btn');
    exportBtn.onclick = () => {
      const selected = [];
      document.querySelectorAll('#perf-pause-list .neg-checkbox:checked').forEach(cb => {
        const term = cb.closest('.neg-item').querySelector('.neg-term').textContent;
        selected.push(term);
      });
      if (selected.length === 0) {
        showNotification('Warning', 'No keywords selected for export.');
        return;
      }
      const csvContent = "Keyword,Match Type,Status\n" + selected.map(k => `"${k}",Phrase,Paused`).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'keywords-to-pause.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Success', `Exported ${selected.length} keywords to pause`);
    };
  }

  initializeKeywordPerformanceOptimizer();
  initializeTabs();

  // Tab Navigation Logic
  function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    function activateTab(tabId) {
      // Deactivate all
      tabBtns.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => {
        content.classList.remove('active');
        content.classList.add('hidden');
      });
      
      // Activate selected
      const selectedBtn = document.querySelector(`.tab[data-tab="${tabId}"]`);
      const selectedContent = document.getElementById(tabId);
      
      if (selectedBtn && selectedContent) {
        selectedBtn.classList.add('active');
        selectedContent.classList.add('active');
        selectedContent.classList.remove('hidden');
        
        // Save state
        localStorage.setItem('activeTab', tabId);
      }
    }
    
    // Add click listeners
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        activateTab(tabId);
      });
    });
    
    // Restore state or default
    const savedTab = localStorage.getItem('activeTab');
    if (savedTab && document.getElementById(savedTab)) {
      activateTab(savedTab);
    } else {
      activateTab('tab-keywords'); // Default
    }
  }

  // Remove duplicate initialization call if present
  // initializeKeywordPerformanceOptimizer(); 
  // settingsBtn listener removed as it is now a tab

  if (capitalizeKeywordsCheckbox) {
    capitalizeKeywordsCheckbox.addEventListener('change', () => {
      saveSettings();
      updateKeywordsList();
    });
  }

  if (captureDebugModeCheckbox) {
    captureDebugModeCheckbox.addEventListener('change', () => {
      saveSettings();
      updateCaptureDebugBadge();
      showNotification('Success', `Capture Debug Mode ${captureDebugModeCheckbox.checked ? 'enabled' : 'disabled'}.`);
    });
  }

  if (gradientStartInput) gradientStartInput.addEventListener('input', saveSettings);
  if (gradientEndInput) gradientEndInput.addEventListener('input', saveSettings);
  if (fontSelect) fontSelect.addEventListener('change', saveSettings);
  if (fontSizeInput) fontSizeInput.addEventListener('input', saveSettings);

  // Check if content script is active on a Keyword Planner page
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0) {
      const tab = tabs[0];
      const url = tab.url || '';
      const plannerBadge = document.getElementById('planner-status-badge') || null;
      if (plannerBadge) {
        if (url.includes('keywordplanner') || url.includes('ads.google.com')) {
          plannerBadge.classList.remove('hidden');
          plannerBadge.textContent = url.includes('keywordplanner') ? '📋 Planner Active' : '📊 Ads Active';
        } else {
          plannerBadge.classList.add('hidden');
        }
      }
    }
  });

  if (saveApiKeyBtn) {
    saveApiKeyBtn.addEventListener('click', () => {
      if (deepseekApiKeyInput) {
        const apiKey = deepseekApiKeyInput.value.trim();
        if (apiKey) {
          chrome.storage.local.set({ deepseekApiKey: apiKey }, () => {
            showNotification('Success', 'API Key saved.');
          });
        }
      }
    });
  }

  // Diagnostics: Force Capture button
  const forceCaptureBtn = document.getElementById('force-capture-btn');
  const captureStatusMsg = document.getElementById('capture-status');
  
  if (forceCaptureBtn) {
    forceCaptureBtn.addEventListener('click', async () => {
      captureStatusMsg.textContent = 'Syncing keywords...';
      captureStatusMsg.style.color = '#525f7f';
      
      try {
        // First, try to sync from page localStorage to extension storage
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.id) {
          // Try to send forceCapture to the content script
          try {
            await chrome.tabs.sendMessage(tab.id, { action: 'forceCapture' });
            captureStatusMsg.textContent = '✅ Force capture sent! Refreshing list...';
          } catch(e) {
            captureStatusMsg.textContent = '⚠️ Content script not reachable. Trying direct sync...';
            
            // Fallback: read localStorage directly from the page
            try {
              const results = await chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: () => {
                  try {
                    const data = localStorage.getItem('googleAdsKeywords');
                    return data ? JSON.parse(data) : [];
                  } catch(e) { return []; }
                }
              });
              
              if (results && results[0] && results[0].result && results[0].result.length > 0) {
                const localKeywords = results[0].result;
                // Push them to extension storage
                for (const kw of localKeywords) {
                  await chrome.runtime.sendMessage({ action: 'addKeyword', keyword: kw }).catch(() => {});
                }
                captureStatusMsg.textContent = `✅ Synced ${localKeywords.length} keywords from page storage!`;
              } else {
                captureStatusMsg.textContent = 'ℹ️ No keywords found in page storage';
              }
            } catch(e) {
              captureStatusMsg.textContent = '❌ Failed: ' + e.message;
            }
          }
        } else {
          captureStatusMsg.textContent = '❌ No active tab found';
          captureStatusMsg.style.color = '#c62828';
        }
        
        // Refresh the keyword list
        updateKeywordsList();
        
      } catch (error) {
        captureStatusMsg.textContent = '❌ Failed: ' + error.message;
        captureStatusMsg.style.color = '#c62828';
        console.error('Force capture failed:', error);
      }
    });
  }

  if (clearStorageBtn) {
    clearStorageBtn.addEventListener('click', () => {
      if (confirm('This will delete ALL keywords and analysis data. This action cannot be undone. Continue?')) {
        chrome.storage.local.remove(['keywords', 'aiSuggestions', 'generatedHeadlines', 'generatedDescriptions', 'generatedCallToActions', 'plannerData', 'plannerAdGroups', 'plannerAnalysisComplete', 'plannerAnalysisStatus', 'plannerProgress'], () => {
          // Clear the UI
          if (suggestionsContainer) suggestionsContainer.innerHTML = '';
          const suggestionsDetails = document.getElementById('suggestions-details');
          if (suggestionsDetails) suggestionsDetails.classList.add('hidden');
          if (regenerateBtn) regenerateBtn.classList.add('hidden');
          
          const headlinesContainer = document.getElementById('headlines-container');
          const descriptionsContainer = document.getElementById('descriptions-container');
          const adsContainer = document.getElementById('ads-container');
          const regenerateAdsBtn = document.getElementById('regenerate-ads-btn');
          
          if (headlinesContainer) headlinesContainer.innerHTML = '';
          if (descriptionsContainer) descriptionsContainer.innerHTML = '';
          if (adsContainer) adsContainer.classList.add('hidden');
          if (regenerateAdsBtn) regenerateAdsBtn.classList.add('hidden');

          // Clear Planner UI
          if (plannerAnalysisResults) plannerAnalysisResults.classList.add('hidden');
          if (plannerSettingsPanel) plannerSettingsPanel.classList.add('hidden');
          if (plannerUploadArea) plannerUploadArea.classList.add('hidden');
          if (plannerUploadZone) plannerUploadZone.classList.remove('hidden');
          plannerData = [];
          adGroups = {};
          
          // Refresh the keyword list (will show empty)
          updateKeywordsList();
          
          // Update badge to 0
          chrome.runtime.sendMessage({ action: 'refreshBadge' }).catch(() => {});
          
          showNotification('Success', 'All keywords and data cleared.');
        });
      }
    });
  }

  if (getSuggestionsBtn) getSuggestionsBtn.addEventListener('click', getAIKeywordSuggestions);

  if (regenerateBtn) regenerateBtn.addEventListener('click', getAIKeywordSuggestions);

  if (generateAdsBtn) generateAdsBtn.addEventListener('click', generateAds);

  if (regenerateAdsBtn) regenerateAdsBtn.addEventListener('click', generateAds);

  // Match type: buttons instead of radio inputs
  if (matchTypeBtns) {
    matchTypeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        matchTypeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMatchType = btn.dataset.value;
        chrome.storage.local.set({ matchType: currentMatchType });
        updateKeywordsList();
      });
    });
  }

  // Select All / Deselect All toggle
  const selectAllToggleBtn = document.getElementById('select-all-btn');
  if (selectAllToggleBtn) {
    selectAllToggleBtn.addEventListener('click', () => {
      toggleSelectAll();
    });
  }

  // Keyboard shortcut: Ctrl+A to Select All / Deselect All
  document.addEventListener('keydown', (e) => {
    if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
      // Only if not in an input/textarea
      if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        toggleSelectAll();
      }
    }
  });

  function toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.kw-checkbox');
    const anyUnchecked = Array.from(checkboxes).some(cb => !cb.checked);
    checkboxes.forEach(cb => {
      cb.checked = anyUnchecked;
      const item = cb.closest('.kw-item');
      if (anyUnchecked) {
        item.classList.add('selected');
      } else {
        item.classList.remove('selected');
      }
    });
    updateSelectedKeywordsList();
  }

  // Copy Selected
  const copySelectedBtn = document.getElementById('copy-sel-btn');
  if (copySelectedBtn) {
    copySelectedBtn.addEventListener('click', async () => {
      const selected = window.selectedKeywords || [];
      if (selected.length === 0) {
        showNotification('Warning', 'No keywords selected. Check the boxes next to keywords first.');
        return;
      }
      const keywordsText = selected
        .map(k => formatKeyword(k, currentMatchType))
        .join('\n');
      await navigator.clipboard.writeText(keywordsText);
      showNotification('Success', `Copied ${selected.length} selected keywords`);
    });
  }

  // Remove Selected
  const removeSelectedBtn = document.getElementById('remove-sel-btn');
  if (removeSelectedBtn) {
    removeSelectedBtn.addEventListener('click', async () => {
      const selected = window.selectedKeywords || [];
      if (selected.length === 0) {
        showNotification('Warning', 'No keywords selected. Check the boxes next to keywords first.');
        return;
      }
      try {
        for (const kw of selected) {
          await chrome.runtime.sendMessage({
            action: 'removeKeyword',
            keywordText: kw
          });
        }
        updateKeywordsList();
        showNotification('Success', `Removed ${selected.length} selected keywords`);
      } catch (error) {
        showNotification('Error', 'Failed to remove selected keywords');
      }
    });
  }

  // Export Selected
  const exportSelectedBtn = document.getElementById('export-sel-btn');
  if (exportSelectedBtn) {
    exportSelectedBtn.addEventListener('click', async () => {
      const selected = window.selectedKeywords || [];
      if (selected.length === 0) {
        showNotification('Warning', 'No keywords selected. Check the boxes next to keywords first.');
        return;
      }
      const csvContent = "Keyword,Match Type\n" +
        selected.map(k => `"${k}","${currentMatchType}"`).join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'selected-keywords.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Success', `Exported ${selected.length} selected keywords`);
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', async () => {
      try {
        // Get keywords directly from storage — no background message needed
        const result = await new Promise(resolve => chrome.storage.local.get(['keywords'], resolve));
        const keywords = result.keywords || [];
        
        if (keywords.length === 0) {
          showNotification('Warning', 'No keywords to export.');
          return;
        }
        
        // Build CSV content
        let csvContent = "Keyword,Match Type\n";
        keywords.forEach(k => {
          const formatted = formatKeyword(k.text, currentMatchType);
          csvContent += `"${formatted}","${currentMatchType}"\n`;
        });
        
        // Download as CSV
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keywords-${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Success', `Exported ${keywords.length} keywords`);
      } catch (error) {
        showNotification('Error', `Export failed: ${error.message}`);
        console.error('Export error:', error);
      }
    });
  }

  // copyAllBtn removed — selection bar replaces bottom actions

  if (removeAllBtn) {
    removeAllBtn.addEventListener('click', async () => {
      try {
        const response = await chrome.runtime.sendMessage({ action: 'clearKeywords' });
        if (response.success) {
          updateKeywordsList();
          showNotification('Success', 'All keywords removed');
        } else {
          showNotification('Error', 'Failed to remove keywords');
        }
      } catch (error) {
        showNotification('Error', 'Failed to remove keywords');
      }
    });
  }

  if (bulkPasteBtn) {
    bulkPasteBtn.addEventListener('click', async () => {
      if (!bulkPasteArea) return;
      const keywords = bulkPasteArea.value.split('\n')
        .map(k => k.trim())
        .filter(k => k !== '');

      if (keywords.length > 0) {
        const keywordObjects = keywords.map(k => ({ text: k, timestamp: Date.now(), source: 'bulk_paste' }));
        
        try {
          const response = await new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ action: 'addKeywordsBulk', keywords: keywordObjects }, (response) => {
              if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
              }
              resolve(response);
            });
          });

          if (response.success) {
            bulkPasteArea.value = '';
            await updateKeywordsList();
            
            let notificationMessage = `Added ${response.totalAdded} keywords.`;
            if (response.duplicates && response.duplicates.length > 0) {
              notificationMessage += ` ${response.duplicates.length} duplicates were skipped.`;
            }
            showNotification('Success', notificationMessage);
            
          } else {
            showNotification('Error', response.error || 'Failed to add keywords.');
          }
        } catch (error) {
          showNotification('Error', `An error occurred: ${error.message}`);
        }
      }
    });
  }

  // Functions
  function loadSettings() {
    chrome.storage.local.get(['capitalizeKeywords', 'captureDebugMode', 'gradientStart', 'gradientEnd', 'font', 'fontSize', 'deepseekApiKey'], (result) => {
      if (result.capitalizeKeywords) {
        capitalizeKeywordsCheckbox.checked = true;
      }
      if (captureDebugModeCheckbox) {
        captureDebugModeCheckbox.checked = !!result.captureDebugMode;
      }
      updateCaptureDebugBadge();
      if (result.gradientStart && gradientStartInput) {
        gradientStartInput.value = result.gradientStart;
      }
      if (result.gradientEnd && gradientEndInput) {
        gradientEndInput.value = result.gradientEnd;
      }
      if (result.font && fontSelect) {
        fontSelect.value = result.font;
      }
      if (result.fontSize && fontSizeInput) {
        fontSizeInput.value = result.fontSize;
      }
      if (result.deepseekApiKey) {
        deepseekApiKeyInput.value = result.deepseekApiKey;
      }
      applySettings();
    });
  }

  function saveSettings() {
    const settings = {
      capitalizeKeywords: capitalizeKeywordsCheckbox.checked,
      captureDebugMode: captureDebugModeCheckbox ? captureDebugModeCheckbox.checked : false,
      gradientStart: gradientStartInput ? gradientStartInput.value : '#6366F1',
      gradientEnd: gradientEndInput ? gradientEndInput.value : '#8f94fb',
      font: fontSelect ? fontSelect.value : '-apple-system',
      fontSize: fontSizeInput ? fontSizeInput.value : 14,
      deepseekApiKey: deepseekApiKeyInput.value
    };
    chrome.storage.local.set(settings);
    applySettings();
  }

  function updateCaptureDebugBadge() {
    if (!captureDebugBadge || !captureDebugModeCheckbox) return;
    if (captureDebugModeCheckbox.checked) {
      captureDebugBadge.classList.remove('hidden');
    } else {
      captureDebugBadge.classList.add('hidden');
    }
  }

  function applySettings() {
    if (gradientStartInput && gradientEndInput) {
      document.body.style.setProperty('--gradient-start', gradientStartInput.value);
      document.body.style.setProperty('--gradient-end', gradientEndInput.value);
    }
    if (fontSelect) {
      document.body.style.fontFamily = fontSelect.value;
    }
    if (fontSizeInput) {
      document.body.style.fontSize = `${fontSizeInput.value}px`;
    }
  }

  async function updateKeywordsList() {
    console.log('Updating keywords list in popup');
    let keywords = [];

    try {
      // Try to get from background script first (source of truth)
      const response = await new Promise((resolve) => {
        try {
          chrome.runtime.sendMessage({ action: 'getKeywords' }, (res) => {
            if (chrome.runtime.lastError) {
              // Connection failed - silently resolve null to trigger fallback
              // Accessing lastError suppresses the browser's automatic error log
              const ignore = chrome.runtime.lastError; 
              resolve(null);
            } else {
              resolve(res);
            }
          });
        } catch (e) {
          // Handle synchronous errors (e.g. context invalidated)
          resolve(null);
        }
      });

      if (response && response.keywords) {
        keywords = response.keywords;
      } else {
        // Fallback: Read directly from storage if background is silent
        const result = await new Promise(resolve => chrome.storage.local.get(['keywords'], resolve));
        if (result.keywords && result.keywords.length > 0) {
          keywords = result.keywords;
        }
      }

      // Render the list
      keywordsContainer.innerHTML = '';
      
      // Update Sticky Count Bar
      const countBar = document.getElementById('count-bar');
      const countText = document.getElementById('kw-count');
      if (countBar && countText) {
        countText.textContent = `Total Keywords: ${keywords.length}`;
        if (keywords.length > 0) {
          countBar.classList.remove('hidden');
        } else {
          countBar.classList.add('hidden');
        }
      }

      if (keywords.length > 0) {
        // Create a copy and reverse it for display
        [...keywords].reverse().forEach((keyword) => {
          const keywordItem = document.createElement('div');
          keywordItem.className = 'kw-item stagger-item';
          keywordItem.dataset.keyword = keyword.text;

          // Add checkbox for selection
          const checkbox = document.createElement('input');
          checkbox.type = 'checkbox';
          checkbox.className = 'kw-checkbox';
          checkbox.addEventListener('change', (e) => handleKeywordSelection(e, keyword, keywordItem));

          const keywordText = document.createElement('span');
          keywordText.className = 'kw-text';
          // Use textContent to ensure full text is visible, apply CSS truncation if needed
          keywordText.textContent = formatKeyword(keyword.text, currentMatchType);
          keywordText.title = keyword.text; // Tooltip for full text

          const actions = document.createElement('div');
          actions.className = 'kw-actions';

          const copyBtn = document.createElement('button');
          copyBtn.className = 'kw-action';
          copyBtn.innerHTML = '<span class="material-icons">content_copy</span>';
          copyBtn.addEventListener('click', () => copyKeyword(keyword.text));

          const removeBtn = document.createElement('button');
          removeBtn.className = 'kw-action remove';
          removeBtn.innerHTML = '<span class="material-icons">close</span>';
          removeBtn.addEventListener('click', () => removeKeyword(keyword));

          actions.appendChild(copyBtn);
          actions.appendChild(removeBtn);

          keywordItem.appendChild(checkbox);
          keywordItem.appendChild(keywordText);
          keywordItem.appendChild(actions);
          keywordsContainer.appendChild(keywordItem);
        });
        
        // Auto-scroll to top to show newest items
        keywordsContainer.scrollTop = 0;
      }

    } catch (error) {
      // Only log errors that are NOT related to connection/context issues
      const errorMsg = error.message || '';
      if (!errorMsg.includes('establish connection') && !errorMsg.includes('Receiving end does not exist')) {
        console.error('Failed to update keywords list:', error);
      }
      
      // Even in error, try to show something if we have storage access
      const result = await new Promise(resolve => chrome.storage.local.get(['keywords'], resolve));
      if (result.keywords && result.keywords.length > 0) {
         // Fallback display if not already rendered
         if (keywords.length === 0) {
            // We could re-run the rendering logic here, but simpler to just let the next update handle it
            // or we could refactor the rendering into a separate function.
            // For now, let's just log that data exists.
         }
      }
    }
  }

  function formatKeyword(keyword, matchType) {
    let formattedKeyword = keyword;
    if (capitalizeKeywordsCheckbox.checked) {
      formattedKeyword = formattedKeyword.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
    switch (matchType) {
      case 'phrase':
        return `"${formattedKeyword}"`;
      case 'exact':
        return `[${formattedKeyword}]`;
      default:
        return formattedKeyword;
    }
  }

  function handleKeywordSelection(event, keyword, keywordItem) {
    const isChecked = event.target.checked;
    
    if (isChecked) {
      // Add yellow highlighting when checked
      keywordItem.classList.add('selected');
      console.log(`Keyword selected: ${keyword.text}`);
    } else {
      // Remove highlighting when unchecked
      keywordItem.classList.remove('selected');
      console.log(`Keyword deselected: ${keyword.text}`);
    }
    
    // Update the selected keywords list for potential bulk operations
    updateSelectedKeywordsList();
  }

  function updateSelectedKeywordsList() {
    const selectedCheckboxes = document.querySelectorAll('.kw-checkbox:checked');
    const selectedKeywords = Array.from(selectedCheckboxes).map(checkbox => {
      const keywordItem = checkbox.closest('.kw-item');
      return keywordItem.dataset.keyword;
    });
    
    console.log('Selected keywords:', selectedKeywords);
    // Store selected keywords for potential bulk operations
    window.selectedKeywords = selectedKeywords;
    
    // Update selection bar visibility and label
    if (selBar && selBarLabel) {
      if (selectedKeywords.length > 0) {
        selBarLabel.textContent = `${selectedKeywords.length} selected`;
        selBar.classList.remove('hidden');
      } else {
        selBar.classList.add('hidden');
      }
    }
    
    // Update selected count badge (legacy fallback)
    const countBadge = document.getElementById('sel-count');
    if (countBadge) {
      if (selectedKeywords.length > 0) {
        countBadge.textContent = `${selectedKeywords.length} selected`;
        countBadge.classList.remove('hidden');
      } else {
        countBadge.classList.add('hidden');
      }
    }
  }

  function copyKeyword(keyword) {
    const formattedKeyword = formatKeyword(keyword, currentMatchType);
    navigator.clipboard.writeText(formattedKeyword)
      .then(() => showNotification('Success', 'Keyword copied'))
      .catch(() => showNotification('Error', 'Failed to copy keyword'));
  }

  async function removeKeyword(keyword) {
    try {
      const keywordText = typeof keyword === 'string' ? keyword : keyword?.text;
      if (!keywordText) return;
      await chrome.runtime.sendMessage({
        action: 'removeKeyword',
        keywordText: keywordText
      });
      updateKeywordsList();
    } catch (error) {
      console.error('Failed to remove keyword:', error);
    }
  }

  function showNotification(title, message) {
    const notification = document.createElement('div');
    notification.className = `notification ${title.toLowerCase()}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 2000);
  }

  // Add keyword to chrome.storage.local directly (used by planner + search term analysis)
  async function addKeywordToStorage(keywordObj) {
    if (!keywordObj || !keywordObj.text) {
      return { added: false, error: 'Invalid keyword' };
    }
    try {
      const data = await chrome.storage.local.get(['keywords']);
      const keywords = data.keywords || [];
      const normalizedIncoming = keywordObj.text.trim().toLowerCase();
      
      if (!keywords.some(k => (k.text || '').trim().toLowerCase() === normalizedIncoming)) {
        keywords.push(keywordObj);
        await chrome.storage.local.set({ keywords });
        return { added: true };
      }
      return { added: false, duplicate: true };
    } catch (err) {
      return { added: false, error: err.message };
    }
  }

  // Download CSV utility (used by planner export)
  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Listen for real-time keyword updates
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'keywordsUpdated') {
      updateKeywordsList();
    }
  });

  async function getAIKeywordSuggestions() {
    const { deepseekApiKey, keywords } = await new Promise(resolve => {
      chrome.storage.local.get(['deepseekApiKey', 'keywords'], resolve);
    });

    if (!deepseekApiKey) {
      showNotification('Error', 'Please save your DeepSeek API key in the settings.');
      return;
    }

    if (!keywords || keywords.length === 0) {
      showNotification('Error', 'Add some keywords first to get suggestions.');
      return;
    }

    getSuggestionsBtn.textContent = 'Generating...';
    getSuggestionsBtn.disabled = true;
    getSuggestionsBtn.classList.add('loading');

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: 'You are a Google Ads expert. Generate a list of 20 high-intent keywords based on the provided list. Return only the keywords, separated by newlines.'
            },
            {
              role: 'user',
              content: keywords.map(k => k.text).join('\n')
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const suggestions = data.choices[0].message.content.split('\n').filter(k => k.trim() !== '');
      
      displaySuggestions(suggestions);

    } catch (error) {
      showNotification('Error', 'Failed to get suggestions. Check your API key and network connection.');
      console.error('Error fetching suggestions:', error);
    } finally {
      getSuggestionsBtn.textContent = 'High-Intent Keyword Suggestions';
      getSuggestionsBtn.disabled = false;
      getSuggestionsBtn.classList.remove('loading');
    }
  }

  function displaySuggestions(suggestions) {
    // Save suggestions to Chrome storage for persistence
    chrome.storage.local.set({ aiSuggestions: suggestions });
    
    const suggestionsDetails = document.getElementById('suggestions-details');
    suggestionsContainer.innerHTML = '';
    suggestions.forEach(suggestion => {
      const suggestionItem = document.createElement('div');
      suggestionItem.className = 'suggestion-item stagger-item';

      const suggestionText = document.createElement('span');
      suggestionText.textContent = suggestion;

      const actionsContainer = document.createElement('div');
      actionsContainer.className = 'suggestion-actions';

      const copyBtn = document.createElement('button');
      copyBtn.innerHTML = '<span class="material-icons">content_copy</span>';
      copyBtn.className = 'suggestion-copy-btn';
      copyBtn.title = 'Copy suggestion';
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(suggestion);
          showNotification('Success', `Copied "${suggestion}"`);
        } catch (error) {
          showNotification('Error', 'Failed to copy suggestion');
        }
      });

      const addBtn = document.createElement('button');
      addBtn.innerHTML = '<span class="material-icons">add_circle</span>';
      addBtn.className = 'suggestion-add-btn';
      addBtn.title = 'Add to keywords';
      addBtn.addEventListener('click', async () => {
        const keywordObject = { text: suggestion, timestamp: Date.now(), source: 'ai_suggestion' };
        try {
          const response = await chrome.runtime.sendMessage({ action: 'addKeyword', keyword: keywordObject });
          if (response.success) {
            showNotification('Success', `Added "${suggestion}"`);
            suggestionItem.remove();
            updateKeywordsList();
            // Update stored suggestions by removing the added one
            const { aiSuggestions } = await new Promise(resolve => {
              chrome.storage.local.get(['aiSuggestions'], resolve);
            });
            if (aiSuggestions) {
              const updatedSuggestions = aiSuggestions.filter(s => s !== suggestion);
              chrome.storage.local.set({ aiSuggestions: updatedSuggestions });
            }
          } else {
            showNotification('Error', response.error || 'Failed to add keyword.');
          }
        } catch (error) {
          showNotification('Error', 'Failed to add keyword.');
        }
      });

      actionsContainer.appendChild(copyBtn);
      actionsContainer.appendChild(addBtn);
      suggestionItem.appendChild(suggestionText);
      suggestionItem.appendChild(actionsContainer);
      suggestionsContainer.appendChild(suggestionItem);
    });
    if (suggestionsDetails) {
      suggestionsDetails.classList.remove('hidden');
      suggestionsDetails.open = true;
    }
    regenerateBtn.classList.remove('hidden');
  }

  // Negative Keyword Analyzer Logic
  function initializeCSVUpload() {
    // Show upload area
    uploadCsvBtn.addEventListener('click', () => {
      uploadArea.classList.remove('hidden');
    });

    // Handle drag and drop
    uploadZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadZone.classList.add('drag-over');
    });

    uploadZone.addEventListener('dragleave', () => {
      uploadZone.classList.remove('drag-over');
    });

    uploadZone.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadZone.classList.remove('drag-over');
      
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    });

    uploadZone.addEventListener('click', () => {
      csvFileInput.click();
    });

    csvFileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleFileSelect(e.target.files[0]);
      }
    });

    // downloadResultsBtn listener removed — now handled via export-neg-btn in displayAnalysisResults
  }

  function handleFileSelect(file) {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      showNotification('Error', 'Please upload a valid CSV file.');
      return;
    }

    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    fileInfo.classList.remove('hidden');
    uploadZone.classList.add('hidden');
    
    // Start processing
    processCSV(file);
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  function processCSV(file) {
    uploadProgress.classList.remove('hidden');
    progressFill.style.width = '10%';
    progressText.textContent = 'Reading file...';

    const reader = new FileReader();
    reader.onload = (e) => {
      progressFill.style.width = '40%';
      progressText.textContent = 'Parsing CSV...';
      
      const text = e.target.result;
      const searchTerms = extractSearchTerms(text);
      
      if (searchTerms.length === 0) {
        showNotification('Error', 'No search terms found in the CSV. Make sure it contains a "Search term" column.');
        resetUpload();
        return;
      }

      progressFill.style.width = '60%';
      progressText.textContent = `Analyzing ${searchTerms.length} search terms...`;
      
      analyzeSearchTerms(searchTerms);
    };
    reader.onerror = () => {
      showNotification('Error', 'Failed to read file.');
      resetUpload();
    };
    reader.readAsText(file);
  }

  function extractSearchTerms(csvText) {
    const lines = csvText.split('\n');
    if (lines.length < 2) return [];

    // Find "Search term" column index
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    const searchTermIndex = headers.findIndex(h => h === 'search term' || h === 'search query' || h === 'term');

    if (searchTermIndex === -1) return [];

    const terms = new Set();
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV parsing (simple regex for comma separation respecting quotes)
      const columns = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || line.split(',');
      
      if (columns[searchTermIndex]) {
        let term = columns[searchTermIndex].trim().replace(/^"|"$/g, '');
        if (term) terms.add(term);
      }
    }

    return Array.from(terms);
  }

  async function analyzeSearchTerms(searchTerms) {
    const { deepseekApiKey } = await new Promise(resolve => {
      chrome.storage.local.get(['deepseekApiKey'], resolve);
    });

    if (!deepseekApiKey) {
      showNotification('Error', 'DeepSeek API key required for analysis.');
      resetUpload();
      return;
    }

    // Process in chunks to avoid token limits
    const chunkSize = 50;
    const chunks = [];
    for (let i = 0; i < searchTerms.length; i += chunkSize) {
      chunks.push(searchTerms.slice(i, i + chunkSize));
    }

    analyzedNegativeKeywords = [];
    let analyzedGoodKeywords = [];
    let processedCount = 0;

    try {
      for (const chunk of chunks) {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${deepseekApiKey}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
              {
                role: 'system',
                content: `You are a Google Ads expert analyzing search terms reports. 
                
Split the provided search terms into TWO categories:

1. "negatives": Terms that are IRRELEVANT, low-intent, or BAD for a commercial campaign — these should be added as negative keywords. Examples: competitors, free/DIY seekers, job seekers, informational queries, unrelated concepts. For each, include "keyword" and "reason".

2. "good": Terms that are RELEVANT, high-intent, and NOT currently being targeted — these should be added to the keyword list. For each, include "keyword" and "reason" (why it's a good addition).

Return as JSON: { "negatives": [{ "keyword": "...", "reason": "..." }], "good": [{ "keyword": "...", "reason": "..." }] }
Put each term in ONLY one category. Be thorough.`
              },
              {
                role: 'user',
                content: JSON.stringify(chunk)
              }
            ],
            response_format: { type: 'json_object' }
          })
        });

        if (!response.ok) throw new Error('API request failed');

        const data = await response.json();
        const content = JSON.parse(data.choices[0].message.content);
        
        // Handle different JSON structures the API might return
        const negatives = content.negatives || content.keywords || (Array.isArray(content) ? content : []);
        const good = content.good || [];
        
        if (Array.isArray(negatives)) {
          analyzedNegativeKeywords.push(...negatives);
        }
        if (Array.isArray(good)) {
          analyzedGoodKeywords.push(...good);
        }

        processedCount += chunk.length;
        const percent = 60 + Math.floor((processedCount / searchTerms.length) * 30);
        progressFill.style.width = `${percent}%`;
      }

      progressFill.style.width = '100%';
      progressText.textContent = 'Analysis Complete!';
      
      setTimeout(() => {
        displayAnalysisResults(analyzedGoodKeywords);
      }, 500);

    } catch (error) {
      console.error('Analysis error:', error);
      showNotification('Error', 'AI Analysis failed. Please try again.');
      resetUpload();
    }
  }

  function displayAnalysisResults(goodKeywords = []) {
    uploadArea.classList.add('hidden');
    analysisResults.classList.remove('hidden');
    
    resultsSummary.innerHTML = `
      <p><strong>Search Terms Analyzed:</strong> ${analyzedNegativeKeywords.length + goodKeywords.length} total</p>
      <p style="color:#c62828;margin:4px 0;">🚫 ${analyzedNegativeKeywords.length} negative candidates</p>
      <p style="color:#2e7d32;margin:4px 0;">✅ ${goodKeywords.length} good keywords to add</p>
    `;

    // --- Render Negative Keywords ---
    negativeKeywordsList.innerHTML = '';
    
    if (analyzedNegativeKeywords.length === 0) {
      negativeKeywordsList.innerHTML = '<div style="padding:10px;text-align:center;color:#666;">No negative keywords identified.</div>';
    } else {
      analyzedNegativeKeywords.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'neg-item stagger-item';
        div.dataset.index = idx;
        div.innerHTML = `
          <input type="checkbox" class="neg-checkbox" checked>
          <div class="neg-content">
            <span class="neg-term">${item.keyword}</span>
            <span class="neg-reason">${item.reason}</span>
          </div>
        `;
        negativeKeywordsList.appendChild(div);
      });
    }

    // --- Render Good Keywords ---
    const goodKeywordsList = document.getElementById('good-list');
    goodKeywordsList.innerHTML = '';
    
    if (goodKeywords.length === 0) {
      goodKeywordsList.innerHTML = '<div style="padding:10px;text-align:center;color:#666;">No relevant keywords found to add.</div>';
    } else {
      goodKeywords.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'good-item stagger-item';
        div.dataset.index = idx;
        div.innerHTML = `
          <div class="good-content">
            <span class="good-term">${item.keyword}</span>
            <span class="good-reason">${item.reason}</span>
          </div>
          <button class="good-add-btn" data-keyword="${item.keyword.replace(/"/g, '&quot;')}">
            <span class="material-icons">add_circle</span>
          </button>
        `;
        
        // Add click handler for individual + button
        const addBtn = div.querySelector('.good-add-btn');
        addBtn.addEventListener('click', async () => {
          const kw = addBtn.dataset.keyword;
          const result = await addKeywordToStorage({ text: kw, timestamp: Date.now(), source: 'search_term_analysis' });
          if (result.added) {
            addBtn.innerHTML = '<span class="material-icons" style="color:#2e7d32;">check_circle</span>';
            showNotification('Success', `Added "${kw}"`);
            updateKeywordsList();
            setTimeout(() => { addBtn.innerHTML = '<span class="material-icons">add_circle</span>'; }, 2000);
          } else if (result.duplicate) {
            showNotification('Warning', `"${kw}" already exists`);
          }
        });
        
        goodKeywordsList.appendChild(div);
      });
    }

    // Wire up "Add All as Negative" button
    addAllNegativeBtn.onclick = async () => {
      const selectedCheckboxes = document.querySelectorAll('.neg-checkbox:checked');
      if (selectedCheckboxes.length === 0) {
        showNotification('Warning', 'No negative keywords selected.');
        return;
      }
      // Just download as CSV for now — Google Ads Editor import format
      const selected = [];
      selectedCheckboxes.forEach(cb => {
        const term = cb.closest('.neg-item').querySelector('.neg-term').textContent;
        selected.push(term);
      });
      const csvContent = "Negative Keyword\n" + selected.join("\n");
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'negative-keywords.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showNotification('Success', `Exported ${selected.length} negative keywords`);
    };

    // Wire up "Add All Good Keywords" button
    const addAllGoodBtn = document.getElementById('add-good-btn');
    addAllGoodBtn.onclick = async () => {
      let added = 0;
      for (const item of goodKeywords) {
        const result = await addKeywordToStorage({ text: item.keyword, timestamp: Date.now(), source: 'search_term_analysis' });
        if (result.added) added++;
      }
      showNotification('Success', `Added ${added} of ${goodKeywords.length} keywords`);
      updateKeywordsList();
    };

    // Also wire download button
    const downloadBtn = document.getElementById('export-neg-btn');
    downloadBtn.onclick = downloadNegativeKeywords;
  }

  function downloadNegativeKeywords() {
    const selected = [];
    document.querySelectorAll('.neg-checkbox:checked').forEach(cb => {
      const term = cb.closest('.neg-item').querySelector('.neg-term').textContent;
      selected.push(term);
    });

    if (selected.length === 0) {
      showNotification('Warning', 'No keywords selected for download.');
      return;
    }

    const csvContent = "Negative Keyword\n" + selected.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'negative-keywords.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function resetUpload() {
    uploadProgress.classList.add('hidden');
    fileInfo.classList.add('hidden');
    uploadZone.classList.remove('hidden');
    csvFileInput.value = '';
  }

  async function generateAds() {
    const { deepseekApiKey, keywords } = await new Promise(resolve => {
      chrome.storage.local.get(['deepseekApiKey', 'keywords'], resolve);
    });

    if (!deepseekApiKey) {
      showNotification('Error', 'Please save your DeepSeek API key in the settings.');
      return;
    }

    if (!keywords || keywords.length === 0) {
      showNotification('Error', 'Add some keywords first to generate ads.');
      return;
    }

    generateAdsBtn.textContent = 'Generating...';
    generateAdsBtn.disabled = true;
    regenerateAdsBtn.disabled = true;

    try {
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${deepseekApiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            {
              role: 'system',
              content: `You are a Google Ads expert. Generate 20 headlines (max 28 characters), 8 descriptions (max 60 characters), and 8 call-to-action phrases (max 15 characters) based on the provided keywords. The ad copy should focus on benefits, have a clear call to action, and touch on emotional pain points to encourage clicks. IMPORTANT: Call-to-action phrases must be directly related to and contextually relevant to the specific keywords provided. Analyze each keyword to determine the most appropriate action (e.g., for "running shoes" use "Shop Shoes", for "yoga classes" use "Book Class", for "web design" use "Get Quote", for "insurance" use "Get Covered"). Make CTAs keyword-specific rather than generic. ${capitalizeKeywordsCheckbox.checked ? 'CAPITALIZATION: Since the user has enabled keyword capitalization, ensure ALL generated content (headlines, descriptions, and call-to-actions) uses proper title case capitalization where each major word starts with a capital letter.' : ''} Return the response as a JSON object with three keys: "headlines", "descriptions", and "callToActions".`
            },
            {
              role: 'user',
              content: keywords.map(k => capitalizeKeywordsCheckbox.checked ? k.text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : k.text).join('\n')
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const { headlines, descriptions, callToActions } = JSON.parse(data.choices[0].message.content);

      displayAds(headlines, descriptions, callToActions);

    } catch (error) {
      showNotification('Error', 'Failed to generate ads. Check your API key and network connection.');
      console.error('Error generating ads:', error);
    } finally {
      generateAdsBtn.textContent = 'Generate Headlines & Descriptions';
      generateAdsBtn.disabled = false;
      regenerateAdsBtn.disabled = false;
    }
  }

  function displayAds(headlines, descriptions, callToActions) {
    // Save generated ads to Chrome storage for persistence
    chrome.storage.local.set({ 
      generatedHeadlines: headlines,
      generatedDescriptions: descriptions,
      generatedCallToActions: callToActions
    });
    
    headlinesContainer.innerHTML = '';
    descriptionsContainer.innerHTML = '';

    headlines.forEach(headline => {
      const adItem = createAdItem(headline);
      headlinesContainer.appendChild(adItem);
    });

    descriptions.forEach(description => {
      const adItem = createAdItem(description);
      descriptionsContainer.appendChild(adItem);
    });

    // Display call-to-action phrases
    const ctaContainer = document.getElementById('cta-container');
    if (ctaContainer) {
      ctaContainer.innerHTML = '';
      callToActions.forEach(cta => {
        const adItem = createAdItem(cta);
        ctaContainer.appendChild(adItem);
      });
    }

    adsContainer.classList.remove('hidden');
    regenerateAdsBtn.classList.remove('hidden');
  }

  function createAdItem(text) {
    const adItem = document.createElement('div');
    adItem.className = 'ad-item stagger-item';

    const adText = document.createElement('span');
    adText.textContent = text;

    const actionsContainer = document.createElement('div');
    actionsContainer.className = 'ad-actions';

    const copyBtn = document.createElement('button');
    copyBtn.innerHTML = '<span class="material-icons">content_copy</span>';
    copyBtn.className = 'ad-copy-btn';
    copyBtn.title = 'Copy ad text';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        showNotification('Success', `Copied "${text}"`);
      } catch (error) {
        showNotification('Error', 'Failed to copy ad text');
      }
    });

    const addBtn = document.createElement('button');
    addBtn.innerHTML = '<span class="material-icons">add_circle</span>';
    addBtn.className = 'ad-add-btn';
    addBtn.title = 'Add to keywords';
    addBtn.addEventListener('click', async () => {
      const keywordObject = { text, timestamp: Date.now(), source: 'ad_generation' };
      try {
        const response = await chrome.runtime.sendMessage({ action: 'addKeyword', keyword: keywordObject });
        if (response.success) {
          showNotification('Success', `Added "${text}"`);
          adItem.remove();
          updateKeywordsList();
        } else {
          showNotification('Error', response.error || 'Failed to add keyword.');
        }
      } catch (error) {
        showNotification('Error', 'Failed to add keyword.');
      }
    });

    actionsContainer.appendChild(copyBtn);
    actionsContainer.appendChild(addBtn);
    adItem.appendChild(adText);
    adItem.appendChild(actionsContainer);
    return adItem;
  }

  // Function to restore saved suggestions and ads data
  async function restoreSavedData() {
    try {
      const { 
        aiSuggestions, 
        generatedHeadlines, 
        generatedDescriptions, 
        generatedCallToActions,
        plannerData: savedPlannerData,
        plannerAdGroups,
        plannerAnalysisComplete,
        plannerAnalysisStatus
      } = await new Promise(resolve => {
        chrome.storage.local.get([
          'aiSuggestions', 
          'generatedHeadlines', 
          'generatedDescriptions', 
          'generatedCallToActions',
          'plannerData',
          'plannerAdGroups',
          'plannerAnalysisComplete',
          'plannerAnalysisStatus'
        ], resolve);
      });

      // Restore AI keyword suggestions if they exist
      if (aiSuggestions && aiSuggestions.length > 0) {
        displaySuggestions(aiSuggestions);
      }

      // Restore generated ads if they exist
      if (generatedHeadlines && generatedDescriptions && 
          generatedHeadlines.length > 0 && generatedDescriptions.length > 0) {
        const callToActions = generatedCallToActions || [];
        displayAds(generatedHeadlines, generatedDescriptions, callToActions);
      }

      // Restore Planner Results
      if (plannerAnalysisComplete && plannerAdGroups && savedPlannerData) {
        plannerData = savedPlannerData;
        adGroups = plannerAdGroups;
        displayPlannerResults();
      } else if (plannerAnalysisStatus === 'analyzing') {
        // Resume monitoring if analysis is still in progress
        plannerData = savedPlannerData || [];
        monitorPlannerProgress();
      } else if (savedPlannerData && savedPlannerData.length > 0) {
        // If data was uploaded but not analyzed, restore the "Ready to analyze" state
        plannerData = savedPlannerData;
        plannerUploadArea.classList.add('hidden');
        plannerSettingsPanel.classList.remove('hidden');
      }

    } catch (error) {
      console.error('Error restoring saved data:', error);
    }
  }
 } catch (error) {
    console.error('Fatal error during popup initialization:', error);
    document.body.innerHTML = '<div style="padding: 16px; text-align: center;">An unexpected error occurred. Please try again.</div>';
 }
});
