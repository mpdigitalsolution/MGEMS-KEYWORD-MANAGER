(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', async () => {
    const toggle = document.getElementById('sidebar-toggle');
    const fullscreenToggle = document.getElementById('fullscreen-toggle');
    const globalAddButton = document.getElementById('global-add-keywords');
    const analyzeGroup = document.getElementById('analyze-nav-group');
    const analyzeToggle = document.getElementById('analyze-nav-toggle');
    const compactLayout = window.matchMedia('(max-width: 700px)');
    let prefersCollapsed = false;
    let managerWindowId = null;
    let preFullscreenState = 'normal';

    function applySidebarState() {
      const collapsed = prefersCollapsed && !compactLayout.matches;
      document.body.classList.toggle('sidebar-collapsed', collapsed);
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.setAttribute('aria-label', collapsed ? 'Expand navigation' : 'Collapse navigation');
      toggle.title = collapsed ? 'Expand navigation' : 'Collapse navigation';
    }

    function applyFullscreenState(windowState) {
      const fullscreen = windowState === 'fullscreen';
      document.body.classList.toggle('fullscreen-workspace', fullscreen);
      fullscreenToggle.setAttribute('aria-pressed', String(fullscreen));
      fullscreenToggle.setAttribute('aria-label', fullscreen ? 'Exit fullscreen' : 'Enter fullscreen');
      fullscreenToggle.title = fullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen';
    }

    function setAnalyzeExpanded(expanded) {
      analyzeGroup.classList.toggle('expanded', expanded);
      analyzeToggle.setAttribute('aria-expanded', String(expanded));
    }

    function syncAnalyzeNavigation(tabId) {
      const analysisActive = ['tab-negative', 'tab-performance', 'tab-planner'].includes(tabId);
      analyzeToggle.classList.toggle('active', analysisActive);
      if (analysisActive) setAnalyzeExpanded(true);
    }

    function openKeywordComposer() {
      document.querySelector('.tab[data-tab="tab-keywords"]')?.click();
      window.setTimeout(() => {
        const addSection = document.querySelector('#tab-keywords .add-section');
        if (addSection) addSection.open = true;
        addSection?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('bulk-paste')?.focus();
      }, 0);
    }

    try {
      const [saved, currentWindow] = await Promise.all([
        chrome.storage.local.get('sidebarCollapsed'),
        chrome.windows.getCurrent()
      ]);
      prefersCollapsed = saved.sidebarCollapsed === true;
      managerWindowId = currentWindow.id;
      preFullscreenState = currentWindow.state === 'maximized' ? 'maximized' : 'normal';
      applyFullscreenState(currentWindow.state);
    } catch (error) {
      console.warn('Could not restore workspace preferences:', error);
    }

    applySidebarState();
    syncAnalyzeNavigation(localStorage.getItem('activeTab'));

    analyzeToggle.addEventListener('click', () => {
      setAnalyzeExpanded(!analyzeGroup.classList.contains('expanded'));
    });

    document.addEventListener('click', (event) => {
      if (compactLayout.matches && !analyzeGroup.contains(event.target)) {
        setAnalyzeExpanded(false);
      }
    });

    document.querySelectorAll('.tab[data-tab]').forEach((tab) => {
      tab.addEventListener('click', () => {
        syncAnalyzeNavigation(tab.dataset.tab);
        if (!tab.classList.contains('analysis-tab') && compactLayout.matches) {
          setAnalyzeExpanded(false);
        }
      });
    });

    globalAddButton.addEventListener('click', openKeywordComposer);

    document.addEventListener('keydown', (event) => {
      const typing = event.target instanceof HTMLInputElement
        || event.target instanceof HTMLTextAreaElement
        || event.target instanceof HTMLSelectElement;

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        openKeywordComposer();
      } else if (!typing && event.key === '/') {
        event.preventDefault();
        document.querySelector('.tab[data-tab="tab-keywords"]')?.click();
        document.getElementById('keyword-search')?.focus();
      } else if (event.key === 'Escape' && analyzeGroup.classList.contains('expanded')) {
        setAnalyzeExpanded(false);
      }
    });

    toggle.addEventListener('click', async () => {
      prefersCollapsed = !document.body.classList.contains('sidebar-collapsed');
      applySidebarState();
      try {
        await chrome.storage.local.set({ sidebarCollapsed: prefersCollapsed });
      } catch (error) {
        console.warn('Could not save sidebar preference:', error);
      }
    });

    fullscreenToggle.addEventListener('click', async () => {
      try {
        const currentWindow = await chrome.windows.getCurrent();
        managerWindowId = currentWindow.id;
        const enteringFullscreen = currentWindow.state !== 'fullscreen';

        if (enteringFullscreen) {
          preFullscreenState = currentWindow.state === 'maximized' ? 'maximized' : 'normal';
          await chrome.windows.update(currentWindow.id, { state: 'fullscreen' });
          applyFullscreenState('fullscreen');
        } else {
          await chrome.windows.update(currentWindow.id, { state: preFullscreenState });
          applyFullscreenState(preFullscreenState);
        }
      } catch (error) {
        console.error('Could not change fullscreen state:', error);
      }
    });

    chrome.windows.onBoundsChanged.addListener((windowInfo) => {
      if (windowInfo.id !== managerWindowId) return;
      applyFullscreenState(windowInfo.state);
      if (windowInfo.state === 'maximized' || windowInfo.state === 'normal') {
        preFullscreenState = windowInfo.state;
      }
    });

    compactLayout.addEventListener('change', applySidebarState);
  });
})();
