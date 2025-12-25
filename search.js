/**
 * SearchModal - Unified search module
 * Encapsulates WASM engine initialization, modal UI, and search logic
 */
class SearchModal {
  constructor(config = {}) {
    this.config = {
      wasmPath: config.wasmPath || '/wasm/search.wasm',
      indexPath: config.indexPath || '/wasm/search-index.bin',
      mappingsPath: config.mappingsPath || '/wasm/docs-mapping.json',
    };

    this.engine = null;
    this.isInitialized = false;
    this.isInitializing = false;

    // DOM elements
    this.modal = document.getElementById('search-modal');
    this.input = document.getElementById('search-input');
    this.resultsContainer = document.getElementById('search-results');
    this.backdrop = document.getElementById('search-backdrop');

    if (!this.modal || !this.input || !this.resultsContainer) {
      console.error('SearchModal: Required DOM elements not found');
      return;
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeydown(e));

    // Cmd+K text in nav
    const navText = document.querySelector('nav p');
    if (navText) {
      navText.addEventListener('click', () => this.open());
    }

    // Search input
    this.input.addEventListener('input', () => this.search());

    // Modal backdrop and outside clicks
    this.backdrop.addEventListener('click', () => this.close());
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });
  }

  handleKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      this.open();
    }

    if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
      this.close();
    }
  }

  async initialize() {
    if (this.isInitialized || this.isInitializing) return;

    this.isInitializing = true;

    try {
      // Dynamically load the WASM engine if not available
      if (typeof SearchEngine === 'undefined') {
        const script = document.createElement('script');
        script.src = '/wasm/SearchEngine.js';
        document.head.appendChild(script);
        await new Promise(resolve => {
          script.onload = resolve;
        });
      }

      this.engine = new SearchEngine();
      await this.engine.initialize(
        this.config.wasmPath,
        this.config.indexPath,
        this.config.mappingsPath
      );

      this.isInitialized = true;
      console.log('Search modal initialized');

      // If modal was opened before engine was ready, search now
      if (!this.modal.classList.contains('hidden') && this.input.value) {
        this.search();
      }
    } catch (error) {
      console.error('Failed to initialize search modal:', error);
      this.showError('Error loading search engine.');
    } finally {
      this.isInitializing = false;
    }
  }

  open() {
    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    this.input.focus();

    // Initialize engine on first open
    if (!this.isInitialized && !this.isInitializing) {
      this.initialize();
    }
  }

  close() {
    this.modal.classList.add('hidden');
    this.modal.classList.remove('flex');
    this.input.value = '';
    this.resultsContainer.innerHTML = '';
  }

  search() {
    const query = this.input.value.toLowerCase().trim();
    this.resultsContainer.innerHTML = '';

    if (!query) return;

    if (!this.isInitialized) {
      this.showMessage('Search engine loading, please wait...');
      return;
    }

    try {
      // Display query with conjunction symbols
      const keywords = query.split(/\s+/).filter(k => k.length > 0);
      const queryDisplay = keywords.join(' ∧ ');
      const header = document.createElement('div');
      header.className = 'p-4 text-gray-400 text-center border-b border-gray-700';
      header.textContent = queryDisplay;
      this.resultsContainer.appendChild(header);

      const results = this.engine.search(query);

      if (results.length === 0) {
        const noResults = document.createElement('div');
        noResults.className = 'p-4 text-gray-400';
        noResults.textContent = 'No results found';
        this.resultsContainer.appendChild(noResults);
        return;
      }

      this.displayResults(results);
    } catch (error) {
      console.error('Search error:', error);
      this.showError('An error occurred during search.');
    }
  }

  displayResults(results) {
    results.forEach((result) => {
      const link = document.createElement('a');
      link.href = result.link || '#';
      link.classList.add(
        'block',
        'p-4',
        'hover:bg-gray-700',
        'border-b',
        'border-gray-700'
      );

      const title = result.title ?? `Document ${result.docId}`;
      link.innerHTML = `<div class="font-medium">${title}</div>`;

      link.addEventListener('click', () => this.close());

      this.resultsContainer.appendChild(link);
    });
  }

  showMessage(message) {
    this.resultsContainer.innerHTML = `<div class="p-4 text-gray-400">${message}</div>`;
  }

  showError(message) {
    this.resultsContainer.innerHTML = `<div class="p-4 text-red-400">${message}</div>`;
  }
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.searchModal = new SearchModal();
  });
} else {
  window.searchModal = new SearchModal();
}
