// share-favorites.js

// Constants for sharing
const SHARE_CONFIG = {
    baseUrl: 'https://app.virtubeauty.fun',
    xMessage: 'Check out my favorite virtual agents! 🤖✨',
    xHashtags: ['VirtuBeauty']
};

// Function to add global share buttons container
function addGlobalShareButtons() {
    // Create share buttons container
    const shareContainer = document.createElement('div');
    shareContainer.className = 'global-share-container';
    shareContainer.innerHTML = `
        <div class="share-buttons-wrapper">
            <button class="global-share-btn get-link" onclick="copyGlobalShareLink()">
                <span class="share-icon">🔗</span>
                <span>Get Your Favorites Link</span>
            </button>
            <button class="global-share-btn share-x" onclick="shareGlobalOnX()">
                <span class="share-icon">𝕏</span>
                <span>Share Your Favorites on X</span>
            </button>
        </div>
    `;

    // Insert before the agent grid
    const agentGrid = document.getElementById('agentGrid');
    if (agentGrid && state.currentTab === 'favorites') {
        agentGrid.insertAdjacentElement('beforebegin', shareContainer);
    }
}

// Generate share URL from all current favorites
function generateGlobalShareUrl() {
    const favorites = getFavorites();
    if (!favorites.length) return null;
    
    const params = new URLSearchParams();
    params.append('id', favorites.join(','));
    
    return `${SHARE_CONFIG.baseUrl}/?${params.toString()}`;
}

// Copy share link for all favorites
async function copyGlobalShareLink() {
    const shareUrl = generateGlobalShareUrl();
    if (!shareUrl) {
        showToast('No favorites to share', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('Share link copied to clipboard!', 'success');
    } catch (error) {
        console.error('Failed to copy share link:', error);
        showToast('Failed to copy share link', 'error');
    }
}

// Share all favorites on X
function shareGlobalOnX() {
    const shareUrl = generateGlobalShareUrl();
    if (!shareUrl) {
        showToast('No favorites to share', 'error');
        return;
    }

    const xParams = new URLSearchParams({
        text: `${SHARE_CONFIG.xMessage} @VirtuBeauty\n\n${shareUrl}`,
        hashtags: SHARE_CONFIG.xHashtags.join(',')
    });

    const xShareUrl = `https://twitter.com/intent/tweet?${xParams.toString()}`;
    window.open(xShareUrl, '_blank');
}

// Handle shared favorites from URL
async function handleSharedFavorites() {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedIds = urlParams.get('id');
    
    if (!sharedIds) return;

    try {
        const ids = sharedIds.split(',');
        const params = new URLSearchParams({
            ...API_CONFIG.favorites.params
        });

        ids.forEach(id => {
            params.append('filters[id][$in]', id);
        });

        const response = await fetch(`${API_CONFIG.favorites.url}?${params}`);
        if (!response.ok) throw new Error('Failed to fetch shared agents');

        const data = await response.json();

        // Get all agent IDs
        const agentIds = data.data.map(agent => agent.id);

        // Get voting data first
        let votingResults = [];
        try {
            const params = new URLSearchParams();
            agentIds.forEach(id => params.append('itemIds', id));

            const votingResponse = await fetch(`${API_CONFIG.virtubeautyapi.baseUrl}/api/voting/batch-vote-counts?${params}`);
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

        // Show shared results container
        const sharedContainer = document.createElement('div');
        sharedContainer.className = 'shared-favorites-container';
        sharedContainer.innerHTML = `
            <div class="shared-favorites-header">
                <h2>Shared Favorites</h2>
                <button class="add-all-btn" onclick="addAllToFavorites()">
                    Add All to Favorites
                </button>
            </div>
            <div class="shared-favorites-grid"></div>
        `;

        const grid = sharedContainer.querySelector('.shared-favorites-grid');
        grid.innerHTML = data.data
            .map(agent => createAgentCard(agent, null, votingMap.get(agent.id)))
            .join('');

        // Insert before the main content
        const mainContent = document.getElementById('content');
        mainContent.insertAdjacentElement('beforebegin', sharedContainer);

    } catch (error) {
        console.error('Error handling shared favorites:', error);
        showToast('Failed to load shared favorites', 'error');
    }
}



// Initialize sharing features
document.addEventListener('DOMContentLoaded', () => {
    // Handle shared favorites from URL
    handleSharedFavorites();

    // Modify the existing switchTab function to add share buttons
    const originalSwitchTab = window.switchTab;
    window.switchTab = function(tabName) {
        originalSwitchTab(tabName);
        
        // Remove existing share container if present
        const existingContainer = document.querySelector('.global-share-container');
        if (existingContainer) {
            existingContainer.remove();
        }

        // Add share buttons only on favorites tab
        if (tabName === 'favorites') {
            setTimeout(addGlobalShareButtons, 100); // Small delay to ensure DOM is updated
        }
    };

    if (state.currentTab === 'favorites') {
        setTimeout(addGlobalShareButtons, 100); // Small delay to ensure DOM is updated
    }
});