const WASM_MODULE_PATH = '/wasm-search/search.wasm'
const WASM_INDEX_PATH = '/wasm-search/search-index.bin'
const DOCS_MAPPING_PATH = '/wasm-search/docs-mapping.json'

const searchModal = document.getElementById('search-modal')
const searchInput = document.getElementById('search-input')
const resultsContainer = document.getElementById('search-results')


let searchEngine
let isSearchEngineInitialized = false

// Initialize the search engine asynchronously
async function initializeSearchEngine() {
  console.log("Loading the search engine");
  if (!searchEngine) {
    // Only instantiate once
    searchEngine = new SearchEngine() // Assuming SearchEngine is globally available from search-zig.js
    try {
      await searchEngine.initialize(
        WASM_MODULE_PATH,
        WASM_INDEX_PATH,
        DOCS_MAPPING_PATH
      )
      isSearchEngineInitialized = true
      console.log('WASM Search engine initialized!')
      // If the modal is already open, and a query exists, perform search now
      if (!searchModal.classList.contains('hidden') && searchInput.value) {
        performSearch()
      }
    } catch (error) {
      console.error('Failed to initialize WASM Search Engine:', error)
      resultsContainer.innerHTML =
        '<div class="p-4 text-red-400">Error loading search engine.</div>'
    }
  }
}

// Show search modal with Cmd+K or Ctrl+K shortcut
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    openSearchModal()
  }

  if (e.key === 'Escape' && !searchModal.classList.contains('hidden')) {
    closeSearchModal()
  }
})

// Also make the "cmd+k" text in nav clickable
document.querySelector('nav p').addEventListener('click', openSearchModal)

function openSearchModal() {
  searchModal.classList.remove('hidden')
  searchModal.classList.add('flex')
  searchInput.focus()
  // document.body.style.overflow = 'hidden'; // Prevent scrolling when modal is open
}

function closeSearchModal() {
  searchModal.classList.add('hidden')
  searchModal.classList.remove('flex')
  searchInput.value = ''
  resultsContainer.innerHTML = ''
  // document.body.style.overflow = '';
}
// Close when clicking on the backdrop
document
  .getElementById('search-backdrop')
  .addEventListener('click', closeSearchModal)
// Close when clicking outside the modal content
searchModal.addEventListener('click', (e) => {
  if (e.target === searchModal) {
    closeSearchModal()
  }
})

// Perform fuzzy search as user types
searchInput.addEventListener('input', performSearch)

function performSearch() {
  const query = searchInput.value.toLowerCase().trim()
  resultsContainer.innerHTML = ''

  if (!query) return

  if (!isSearchEngineInitialized) {
    // If engine is still loading, don't try to search yet
    resultsContainer.innerHTML =
      '<div class="p-4 text-gray-400">Search engine loading, please wait...</div>'
    return
  }

  let results = []
  try {
    // Call the WASM search engine
    results = searchEngine.search(query) // array of { docId, link, title }
  } catch (error) {
    console.error('WASM Search error:', error)
    resultsContainer.innerHTML =
      '<div class="p-4 text-red-400">An error occurred during search.</div>'
    return
  }

  if (results.length === 0) {
    resultsContainer.innerHTML =
      '<div class="p-4 text-gray-400">No results found</div>'
    return
  }

  // Create and display search results
  results.forEach((result) => {
    const resultElement = document.createElement('a')
    resultElement.href = result.link || "#"
    resultElement.classList.add(
      'block',
      'p-4',
      'hover:bg-gray-700',
      'border-b',
      'border-gray-700'
    )

    const title = result.title ?? `Document ${result.docId}`


    resultElement.innerHTML = `
<div class="font-medium">${title}</div>
`

    resultElement.addEventListener('click', (e) => {
      closeSearchModal()
    })

    resultsContainer.appendChild(resultElement)
  })
}

// Initial passive load of the search engine (optional, but good for faster first search)
initializeSearchEngine();
