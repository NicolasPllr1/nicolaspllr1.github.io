// TODO: fetch this based on the site pages / content, automatically
// like: the home and reading list pages, and iterate over all posts content
const searchableContent = [
  {
    title: 'Home Page',
    content: 'Welcome to my personal website.',
    url: '/',
  },
  {
    title: 'Easy Intro to Networks and the Internet',
    content:
      'http, tcp, udp, networks, internet, protocols, layers, interfaces, physical, link, transport, network, application, smtp, dns',
    url: 'posts/networks-intro/post.html',
  },
  {
    title: 'Mini http/1.1 server (in rust)',
    content: 'http, tcp, server, rust, programming, codecrafters, projects',
    url: 'posts/http-server-rust/post.html',
  },
  {
    title: 'Python type hints and complex Pydantic rebuilds',
    content: 'python, types, type hints, pep, pydantic, models, rebuild, init, __init__, forward references, future statement, circular imports',
    url: 'posts/python-type-hints-and-pydantic-rebuilds/post.html',
  },
]

const searchModal = document.getElementById('search-modal')
const searchInput = document.getElementById('search-input')
const resultsContainer = document.getElementById('search-results')

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

  // Simple fuzzy search implementation
  const results = searchableContent.filter((item) => {
    const titleMatch = item.title.toLowerCase().includes(query)
    const contentMatch = item.content.toLowerCase().includes(query)
    return titleMatch || contentMatch
  })

  if (results.length === 0) {
    resultsContainer.innerHTML =
      '<div class="p-4 text-gray-400">No results found</div>'
    return
  }

  // Create and display search results
  results.forEach((result) => {
    const resultElement = document.createElement('a')
    resultElement.href = result.url
    resultElement.classList.add(
      'block',
      'p-4',
      'hover:bg-gray-700',
      'border-b',
      'border-gray-700'
    )

    // Highlight matching parts (simple implementation)
    let title = result.title
    let content = result.content

    if (result.title.toLowerCase().includes(query)) {
      const index = result.title.toLowerCase().indexOf(query)
      title =
        result.title.substring(0, index) +
        `<span class="bg-blue-800">${result.title.substring(index, index + query.length)}</span>` +
        result.title.substring(index + query.length)
    }

    if (result.content.toLowerCase().includes(query)) {
      const index = result.content.toLowerCase().indexOf(query)
      const start = Math.max(0, index - 20)
      const snippet = result.content.substring(start, index + query.length + 30)
      content =
        (start > 0 ? '...' : '') +
        snippet.substring(0, index - start) +
        `<span class="bg-blue-800">${snippet.substring(index - start, index - start + query.length)}</span>` +
        snippet.substring(index - start + query.length) +
        (index + query.length + 30 < result.content.length ? '...' : '')
    }

    resultElement.innerHTML = `
<div class="font-medium">${title}</div>
<div class="text-sm text-gray-400 mt-1">${content}</div>
`

    resultElement.addEventListener('click', (e) => {
      closeSearchModal()
    })

    resultsContainer.appendChild(resultElement)
  })
}

// Future enhancement: Use a proper fuzzy search library like Fuse.js for better results
