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
        if (!response.ok) throw new Error('Search failed');

        const data = await response.json();

        if (data.data.length === 0) {
            const searchResultsGrid = searchResultsContainer.querySelector('.search-results-grid');
            const searchQuery = searchResultsContainer.querySelector('.search-query');
            searchQuery.textContent = searchTerm;
            searchResultsGrid.innerHTML = '<div class="no-results">No results found</div>';
            searchResultsContainer.classList.add('active');
            return;
        }

        // Get all agent IDs
        const agentIds = data.data.map(agent => agent.id);

        // Get voting data first
        let votingResults = [];
        try {
            const params = new URLSearchParams();
            agentIds.forEach(id => params.append('itemIds', id));

            const votingResponse = await fetch(`${API_CONFIG.voting.baseUrl}/api/voting/batch-vote-counts?${params}`);
            if (votingResponse.ok) {
                votingResults = await votingResponse.json();
            }
        } catch (error) {
            console.error('Error fetching voting data:', error);
            votingResults = agentIds.map(() => null);
        }

        // Create voting data map
        const votingMap = new Map();
        data.data.forEach((agent, index) => {
            votingMap.set(agent.id, votingResults[index] || {
                upvoteCount: 0,
                downvoteCount: 0,
                upvoteRatio: 0
            });
        });

        // Get flag counts
        let flagCountsMap = new Map();
        try {
            // First, render the results with initial 0 flag counts
            const searchResultsGrid = searchResultsContainer.querySelector('.search-results-grid');
            const searchQuery = searchResultsContainer.querySelector('.search-query');

            searchQuery.textContent = searchTerm;
            searchResultsGrid.innerHTML = data.data
                .map(agent => createAgentCard(agent, 'search', votingMap.get(agent.id)))
                .join('');

            // Then fetch and update flag counts
            const flagParams = new URLSearchParams();
            agentIds.forEach(id => flagParams.append('itemIds', id));

            const flagCountsResponse = await fetch(`${API_CONFIG.voting.baseUrl}/api/voting/batch-flag-counts?${flagParams}`);
            if (flagCountsResponse.ok) {
                const flagCountsData = await flagCountsResponse.json();
                console.log('Flag Counts API Response:', flagCountsData);

                // Update flagCountsMap with the actual data
                flagCountsData.forEach(({ itemId, flagCount }) => {
                    flagCountsMap.set(itemId, flagCount);
                });

                // Update the UI with actual flag counts
                flagCountsData.forEach(({ itemId, flagCount }) => {
                    const flagElements = document.querySelectorAll(`[data-agent-id="${itemId}"] .vote-button.flag .flag-count`);
                    flagElements.forEach(element => {
                        element.textContent = formatNumber(flagCount);
                    });
                });
            } else {
                console.error('Failed to fetch flag counts:', await flagCountsResponse.text());
            }
        } catch (error) {
            console.error('Error handling flag counts:', error);
        }

        // Show search results
        searchResultsContainer.classList.add('active');

    } catch (error) {
        console.error('Search error:', error);
        showError('Failed to perform search. Please try again.');
    }
}

function clearSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.querySelector('.search-results-container');
    searchInput.value = '';
    searchResultsContainer.classList.remove('active');
}

function showError(message) {
    const searchResultsContainer = document.querySelector('.search-results-container');
    const searchResultsGrid = searchResultsContainer.querySelector('.search-results-grid');

    if (searchResultsGrid) {
        searchResultsGrid.innerHTML = `<div class="error">${message}</div>`;
        searchResultsContainer.classList.add('active');
    }
}

// Initialize search functionality
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.querySelector('.clear-search');

    // Add debounced search
    searchInput.addEventListener('input', debounce(handleSearch, 500));

    // Add clear search button handler
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }

    // Add enter key handler
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });
});