// search.js

async function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    const searchResultsContainer = document.querySelector('.search-results-container');
    
    if (!searchTerm) {
        clearSearch();
        return;
    }

    try {
        const params = new URLSearchParams({
            'filters[status][$in][0]': 'AVAILABLE',
            'filters[status][$in][1]': 'ACTIVATING',
            'filters[status][$in][2]': 'UNDERGRAD',
            'filters[priority][$ne]': '-1',
            'filters[$or][0][name][$contains]': searchTerm,
            'filters[$or][1][symbol][$contains]': searchTerm,
            'filters[$or][2][tokenAddress][$contains]': searchTerm,
            'filters[$or][3][preToken][$contains]': searchTerm,
            'sort[0]': 'totalValueLocked:desc',
            'sort[1]': 'createdAt:desc',
            'populate[0]': 'image',
            'pagination[page]': '1',
            'pagination[pageSize]': '10'
        });

        const response = await fetch(`https://api.virtuals.io/api/virtuals?${params}`);
        
        if (!response.ok) {
            throw new Error('Search failed');
        }

        const data = await response.json();

        // Update search results
        const searchResultsGrid = searchResultsContainer.querySelector('.search-results-grid');
        const searchQuery = searchResultsContainer.querySelector('.search-query');
        
        searchQuery.textContent = searchTerm;
        searchResultsGrid.innerHTML = data.data
            .map(agent => createAgentCard(agent))
            .join('');

        // Show search results without hiding main content
        searchResultsContainer.classList.add('active');

    } catch (error) {
        console.error('Search error:', error);
        showError('Failed to perform search. Please try again.');
    }
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.querySelector('.search-results-container');

    // Clear input and results
    searchInput.value = '';
    searchResultsContainer.classList.remove('active');
    
    // No need to refresh agents since they're always visible
}

// Initialize search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.querySelector('.clear-search');
    
    // Add debounced search
    searchInput.addEventListener('input', debounce(handleSearch, 500));
    
    // Add clear search button handler
    clearSearchBtn.addEventListener('click', clearSearch);
    
    // Add enter key handler
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
});