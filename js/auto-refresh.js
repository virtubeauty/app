// auto-refresh.js

// Store the refresh interval ID
let refreshIntervalId = null;

// Constants for refresh intervals (in milliseconds)
const REGULAR_INTERVAL = 60000; // 60 seconds
const FAVORITES_INTERVAL = 7000;  // 7 seconds

function startAutoRefresh() {
    // Clear any existing interval
    stopAutoRefresh();
    
    // Set the appropriate interval based on the current tab
    const interval = state.currentTab === 'favorites' ? FAVORITES_INTERVAL : REGULAR_INTERVAL;
    
    // Start the new interval
    refreshIntervalId = setInterval(async () => {
        // Only refresh if the user is still on the same tab
        if (document.visibilityState === 'visible') {
            // Fetch fresh prices first
            await fetchPrices();
            
            // Then refresh the agents
            await fetchAgents();
            
            // Update UI elements
            updateFavoritesCount();
        }
    }, interval);
    }

function stopAutoRefresh() {
    if (refreshIntervalId) {
        clearInterval(refreshIntervalId);
        refreshIntervalId = null;
    }
}

// Handle tab switching
function handleTabSwitch(tabName) {
    if (!tabName || !API_CONFIG[tabName]) return;
    
    // Update state and localStorage
    state.currentTab = tabName;
    state.currentPage = 1;
    localStorage.setItem('currentTab', tabName);
    
    // Update UI
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });
    
    // Update favorites count
    updateFavoritesCount();
    
    // Restart auto-refresh with appropriate interval
    startAutoRefresh();
    
    // Fetch agents for the new tab
    fetchAgents();
}

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
});

// Initialize auto-refresh when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Start auto-refresh
    startAutoRefresh();
    
    // Override the existing switchTab function
    window.switchTab = handleTabSwitch;
});