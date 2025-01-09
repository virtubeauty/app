// Constants
const MAX_FAVORITES = 5;
window.MAX_FAVORITES = MAX_FAVORITES;

// Toast Notifications
function showToast(message, type = 'error') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // Remove toast after animation
    setTimeout(() => {
        toast.remove();
        if (container.children.length === 0) {
            container.remove();
        }
    }, 3000);
}

// Favorites Management
function getFavorites() {
    return JSON.parse(localStorage.getItem('favoriteAgents') || '[]');
}

function saveFavorites(favorites) {
    localStorage.setItem('favoriteAgents', JSON.stringify(favorites));
}

function isFavorited(agentId) {
    const favorites = getFavorites();
    return favorites.includes(agentId.toString());
}

function getFavoritedCount() {
    return getFavorites().length;
}

function updateFavoritesCount() {
    const count = getFavoritedCount();
    const countElement = document.getElementById('favoritesCount');
    if (countElement) {
        countElement.textContent = count.toString();
    }
}

function toggleFavorite(button, agentId) {
    if (!button || !agentId) return;

    const favorites = getFavorites();
    const agentIdStr = agentId.toString();
    const index = favorites.indexOf(agentIdStr);

    if (index === -1) {
        // Add to favorites
        if (favorites.length >= MAX_FAVORITES) {
            const isPremium = localStorage.getItem('walletPremium') === 'true';
            if (!isPremium) {
                showToast(`Connect wallet for premium features and increase your favorites limit to 50!`, 'error');
            } else {
                showToast(`Maximum limit of ${MAX_FAVORITES} favorites reached`, 'error');
            }
            return;
        }
        favorites.push(agentIdStr);
        button.classList.add('active');
        button.title = 'Remove from favorites';
        showToast('Added to favorites', 'success');
    } else {
        // Remove from favorites
        favorites.splice(index, 1);
        button.classList.remove('active');
        button.title = 'Add to favorites';
        showToast('Removed from favorites', 'success');
    }

    saveFavorites(favorites);
    updateFavoritesCount();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateFavoritesCount();
});