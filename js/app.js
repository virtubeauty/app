// app.js
async function fetchPrices(useMockData = false) {
    const CACHE_KEY = 'crypto_prices';
    const CACHE_DURATION = 60 * 1000; // 60 seconds in milliseconds

    try {
        // Check cache first
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
            const { timestamp, prices } = JSON.parse(cachedData);
            const isValid = Date.now() - timestamp < CACHE_DURATION;

            if (isValid) {
                state.prices = prices;
                return;
            }
        }

        if (useMockData) {
            const mockData = {
                "ethereum": { "usd": 3607.21 },
                "virtual-protocol": { "usd": 3.00 }
            };
            state.prices['virtual-protocol'] = mockData['virtual-protocol']?.usd || 0;
            state.prices['ethereum'] = mockData['ethereum']?.usd || 0;
        } else {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=virtual-protocol%2Cethereum&vs_currencies=USD');
            if (!response.ok) throw new Error('Failed to fetch prices');

            const data = await response.json();
            state.prices['virtual-protocol'] = data['virtual-protocol']?.usd || 0;
            state.prices['ethereum'] = data['ethereum']?.usd || 0;

            // Cache the new data
            const cacheData = {
                timestamp: Date.now(),
                prices: state.prices
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
        }
    } catch (error) {
        console.error('Error fetching prices:', error);
        // Fallback to mocked data in case of API failure
        const mockData = {
            "ethereum": { "usd": 3607.21 },
            "virtual-protocol": { "usd": 4.25 }
        };
        state.prices['virtual-protocol'] = mockData['virtual-protocol']?.usd || 0;
        state.prices['ethereum'] = mockData['ethereum']?.usd || 0;
    }
}

// UI State Management
function showLoading() {
    const agentGrid = document.getElementById('agentGrid');
    if (agentGrid) {
        agentGrid.innerHTML = '<div class="loading">Loading agents...</div>';
    }
}

function showError(message) {
    const agentGrid = document.getElementById('agentGrid');
    if (agentGrid) {
        agentGrid.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Modified fetchAgents function
async function fetchAgents() {
    showLoading();
    try {
        const config = API_CONFIG[state.currentTab];
        const params = new URLSearchParams({
            ...config.params,
            'pagination[page]': state.currentPage
        });

        // Handle favorites tab
        if (state.currentTab === 'favorites') {
            const favorites = getFavorites();
            if (favorites.length === 0) {
                document.getElementById('agentGrid').innerHTML = '<div class="no-favorites">No favorites added yet</div>';
                return;
            }
            favorites.forEach(id => {
                params.append('filters[id][$in]', id);
            });
        }

        // Add holder count filters
        if (filters.holderCount.min) {
            params.append('filters[holderCount][$gte]', filters.holderCount.min);
        }
        if (filters.holderCount.max) {
            params.append('filters[holderCount][$lte]', filters.holderCount.max);
        }

        // Add virtual token value filters
        if (filters.virtualTokenValue.min) {
            const minApiValue = filters.virtualTokenValue.min / state.prices['virtual-protocol'];
            params.append('filters[virtualTokenValue][$gte]', minApiValue);
        }
        if (filters.virtualTokenValue.max) {
            const maxApiValue = filters.virtualTokenValue.max / state.prices['virtual-protocol'];
            params.append('filters[virtualTokenValue][$lte]', maxApiValue);
        }

        if (filters.createdAt) {
            params.append('filters[createdAt][$gte]', filters.createdAt);
        }

        if (filters.role) {
            params.append('filters[role]', filters.role);
        }

        const response = await fetch(`${config.url}?${params}`);
        if (!response.ok) throw new Error('Failed to fetch agents');

        const data = await response.json();
        state.totalPages = data.meta.pagination.pageCount;
        state.tabCounts[state.currentTab] = data.meta.pagination.total;

        const agentGrid = document.getElementById('agentGrid');
        if (agentGrid) {
            agentGrid.innerHTML = data.data
                .map(agent => createAgentCard(agent, state.currentTab))
                .join('');
        }

        // Get all agent IDs
        const agentIds = data.data.map(agent => agent.id);

        updatePagination();


        // Initialize flag counts
        await window.voting.initializeFlagCounts(agentIds);
        await window.voting.initializeVotingCounts(agentIds);

    } catch (error) {
        console.error('Error fetching agents:', error);
        showError('Failed to load agents. Please try again later.');
    }
}



function updatePagination() {
    const paginationElement = document.getElementById('pagination');
    if (!paginationElement) return;

    paginationElement.innerHTML = `
        <button onclick="changePage(${state.currentPage - 1})" 
                ${state.currentPage === 1 ? 'disabled' : ''}>
            Previous
        </button>
        <button disabled>
            Page ${state.currentPage} of ${state.totalPages}
        </button>
        <button onclick="changePage(${state.currentPage + 1})" 
                ${state.currentPage === state.totalPages ? 'disabled' : ''}>
            Next
        </button>
    `;
}

async function changePage(newPage) {
    if (newPage < 1 || newPage > state.totalPages) return;
    state.currentPage = newPage;
    await fetchAgents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Initialize Application
function initializeApp() {
    // Initialize favorites count
    updateFavoritesCount();

    // Set initial theme
    setTheme('dark');

    // Initialize prices
    fetchPrices();
    setInterval(fetchPrices, 60000);

    // Set up tab buttons
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // Load initial tab
    const savedTab = localStorage.getItem('currentTab') || 'prototype';
    switchTab(savedTab);
}

// Tab Management
function switchTab(tabName) {
    if (!tabName || !API_CONFIG[tabName]) return;

    state.currentTab = tabName;
    state.currentPage = 1;
    localStorage.setItem('currentTab', tabName);

    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    fetchAgents();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});