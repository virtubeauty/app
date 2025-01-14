// voting.js

// Vote types
const VOTE_TYPES = {
    UPVOTE: 0,
    DOWNVOTE: 1
};

// Cache for vote summaries and flag counts
const voteSummaryCache = new Map();
const flagCountCache = new Map();

// Initialize the voting namespace in window
window.voting = window.voting || {};
window.voting.flagCountCache = flagCountCache;

// Check if user is premium
function checkPremiumAccess() {
    if (!window.walletConnect?.account) {
        // Check if user is signed in but wallet not connected
        if (window.walletConnect?.isSignedIn) {
            showToast('Please wait while we connect to your wallet...', 'info');
            return false;
        }
        showToast('Please connect your wallet', 'error');
        return false;
    }

    if (!window.walletConnect.isPremium) {
        showToast('Only premium users can flag content. Get premium by holding 100,000 $VBEA', 'error');
        return false;
    }

    return true;
}

// Helper function to construct voting API URLs
function getVotingApiUrl(endpoint) {
    return `${API_CONFIG.virtubeautyapi.baseUrl}${endpoint}`;
}

// Handle voting (upvote/downvote)
async function handleVote(itemId, voteType) {
    if (itemId == 17777) {
        window.open('https://vbeaideas.featurebase.app/', '_blank');
        return;
    }

    const button = document.querySelector(`[data-agent-id="${itemId}"] .vote-button.${voteType === VOTE_TYPES.UPVOTE ? 'upvote' : 'downvote'}`);
    if (button) button.disabled = true;

    try {
        const endpoint = voteType === VOTE_TYPES.UPVOTE ?
            API_CONFIG.virtubeautyapi.endpoints.upvote :
            API_CONFIG.virtubeautyapi.endpoints.downvote;

        const token = localStorage.getItem('auth_token');
        const headers = {
            ...API_CONFIG.virtubeautyapi.headers,
            'Authorization': `Bearer ${token}`
        };

        const response = await fetch(getVotingApiUrl(endpoint), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                itemId,
                userWalletAddress: window.walletConnect.account
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                // Clean up on error
                localStorage.removeItem('auth_token');
                window.walletConnect.token = null;
                window.walletConnect.account = null;
                window.walletConnect.updateUI();
                showToast('Please connect your wallet', 'error');
                return;
            }
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit vote');
        }

        await updateVoteSummary(itemId, true);
        showToast(`${voteType === VOTE_TYPES.UPVOTE ? 'Upvoted' : 'Downvoted'} successfully`, 'success');
    } catch (error) {
        console.error('Vote error:', error);
        showToast(error.message, 'error');
    } finally {
        if (button) button.disabled = false;
    }
}

// Handle flagging content
async function handleFlag(itemId, reason) {
    if (!checkPremiumAccess()) return;

    if (itemId == 17777) {
        window.open('https://vbeaideas.featurebase.app/', '_blank'); // '_blank' yeni sekmede açar.
        return; // Diğer işlemleri durdurmak için.
    }

    const token = localStorage.getItem('auth_token');
    const headers = {
        ...API_CONFIG.virtubeautyapi.headers,
        'Authorization': `Bearer ${token}`
    };

    try {
        const response = await fetch(getVotingApiUrl(API_CONFIG.virtubeautyapi.endpoints.flag), {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                itemId,
                userWalletAddress: window.walletConnect.account,
                reason: reason.trim()
            })
        });

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('auth_token');
                window.walletConnect.token = null;
                window.walletConnect.account = null;
                window.walletConnect.updateUI();
                showToast('Please connect your wallet', 'error');
                return;
            }
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit flag');
        }

        await fetchBatchFlagCounts([itemId]);
        showToast('Content flagged successfully', 'success');
    } catch (error) {
        console.error('Flag error:', error);
        showToast(error.message, 'error');
    }
}

// Fetch vote summary for an item
async function fetchVoteSummary(itemId, skipCache = false) {
    if (!skipCache && voteSummaryCache.has(itemId)) {
        return voteSummaryCache.get(itemId);
    }

    try {
        const response = await fetch(getVotingApiUrl(API_CONFIG.virtubeautyapi.endpoints.summary(itemId)));
        if (!response.ok) throw new Error('Failed to fetch vote summary');

        const summary = await response.json();
        voteSummaryCache.set(itemId, summary);
        return summary;
    } catch (error) {
        console.error('Error fetching vote summary:', error);
        return {
            upvoteCount: 0,
            downvoteCount: 0,
            upvoteRatio: 0
        };
    }
}

// Fetch batch flag counts
async function fetchBatchFlagCounts(itemIds) {
    try {
        const params = new URLSearchParams();
        itemIds.forEach(id => params.append('itemIds', id));

        const response = await fetch(`${API_CONFIG.virtubeautyapi.baseUrl}/api/voting/batch-flag-counts?${params}`);
        if (!response.ok) throw new Error('Failed to fetch flag counts');

        const data = await response.json();

        // Update cache and UI
        data.forEach(({ itemId, flagCount }) => {
            flagCountCache.set(itemId, flagCount || 0);
            updateFlagCount(itemId, flagCount || 0);
        });

        return data;
    } catch (error) {
        console.error('Error fetching flag counts:', error);
        return itemIds.map(id => ({ itemId: id, flagCount: 0 }));
    }
}

// Update flag count in UI
function updateFlagCount(itemId, count) {
    const flagButtons = document.querySelectorAll(`[data-agent-id="${itemId}"] .vote-button.flag .flag-count`);
    flagButtons.forEach(button => {
        if (button) {
            button.textContent = formatNumber(count || 0);
        }
    });
}

// Update voting count in UI
function updateVotingCount(itemId, type, count) {
    const voteButtons = document.querySelectorAll(`[data-agent-id="${itemId}"] .vote-button.${type} .${type}-count`);
    voteButtons.forEach(button => {
        if (button) {
            button.textContent = formatNumber(count || 0);
        }
    });
}

// Show flag dialog
function showFlagDialog(itemId) {
    if (!checkPremiumAccess()) return;

    const dialog = document.createElement('div');
    dialog.className = 'flag-dialog';
    dialog.innerHTML = `
        <div class="flag-dialog-content">
            <h3>Flag Content</h3>
            <div class="flag-input-container">
                <textarea 
                    placeholder="Please describe why you are flagging this content... (minimum 10 characters)" 
                    class="flag-reason"
                    minlength="10"></textarea>
                <div class="character-count" style="color: var(--text-secondary); font-size: 0.9em; margin-top: 4px;">
                    0/10 characters minimum
                </div>
                <div class="warning-message" style="color: #f44336; font-size: 0.9em; margin-top: 4px; display: none;">
                    Please enter at least 10 characters
                </div>
            </div>
            <div class="flag-dialog-buttons">
                <button class="cancel-flag">Cancel</button>
                <button class="submit-flag" disabled>Submit</button>
            </div>
        </div>
    `;

    document.body.appendChild(dialog);

    const textarea = dialog.querySelector('.flag-reason');
    const charCount = dialog.querySelector('.character-count');
    const warning = dialog.querySelector('.warning-message');
    const submitButton = dialog.querySelector('.submit-flag');

    // Update character count and validate input
    textarea.addEventListener('input', () => {
        const length = textarea.value.trim().length;
        charCount.textContent = `${length}/10 characters minimum`;

        if (length < 10) {
            warning.style.display = 'block';
            submitButton.disabled = true;
            textarea.style.borderColor = '#f44336';
        } else {
            warning.style.display = 'none';
            submitButton.disabled = false;
            textarea.style.borderColor = 'var(--border)';
        }
    });

    const handleClose = () => dialog.remove();

    dialog.querySelector('.cancel-flag').onclick = handleClose;
    dialog.querySelector('.submit-flag').onclick = async () => {
        const reason = textarea.value.trim();
        if (reason.length < 10) {
            warning.style.display = 'block';
            return;
        }
        await handleFlag(itemId, reason);
        handleClose();
    };

    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) handleClose();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') handleClose();
    }, { once: true });
}

// Update the handleFlag function to include validation
async function handleFlag(itemId, reason) {
    if (!checkPremiumAccess()) return;

    if (reason.trim().length < 10) {
        showToast('Flag reason must be at least 10 characters', 'error');
        return;
    }

    try {
        const response = await fetch(getVotingApiUrl(API_CONFIG.virtubeautyapi.endpoints.flag), {
            method: 'POST',
            headers: API_CONFIG.virtubeautyapi.headers,
            body: JSON.stringify({
                itemId,
                userWalletAddress: window.walletConnect.account,
                reason: reason.trim()
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Failed to submit flag');
        }

        await fetchBatchFlagCounts([itemId]);
        showToast('Content flagged successfully', 'success');
    } catch (error) {
        console.error('Flag error:', error);
        showToast(error.message, 'error');
    }
}

// Show flag details modal
async function showFlagDetailsModal(itemId) {
    try {
        const modal = document.createElement('div');
        modal.className = 'flags-modal';
        modal.innerHTML = `
            <div class="flags-modal-content">
                <div class="flags-modal-header">
                    <h3>Loading flag details...</h3>
                    <button class="flags-modal-close">×</button>
                </div>
                <div class="flags-list">
                    <div class="loading">Loading...</div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Trigger animation
        setTimeout(() => {
            modal.classList.add('show');
            modal.querySelector('.flags-modal-content').classList.add('show');
        }, 10);

        // Fetch flag details
        const details = await fetchFlagDetails(itemId);

        // Format flags list
        const flagsHtml = details.flags.length > 0
            ? details.flags.map(flag => `
                <div class="flag-item">
                    <p class="flag-reason">${escapeHtml(flag.reason)}</p>
                    <p class="flag-timestamp">
                        Flagged by ${truncateAddress(flag.userWalletAddress)}
                        on ${new Date(flag.createdAt).toLocaleString()}
                    </p>
                </div>
            `).join('')
            : '<div class="flags-empty">No flags found for this item</div>';

        // Update modal content
        modal.querySelector('.flags-modal-content').innerHTML = `
            <div class="flags-modal-header">
                <h3>Flag Details${details.totalFlags > 0 ? ` (${details.totalFlags} total)` : ''}</h3>
                <button class="flags-modal-close">×</button>
            </div>
            <div class="flags-list">
                ${flagsHtml}
            </div>
        `;

        // Handle closing
        const closeModal = () => {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300);
        };

        modal.querySelector('.flags-modal-close').onclick = closeModal;
        modal.onclick = (e) => {
            if (e.target === modal) closeModal();
        };

        document.addEventListener('keydown', function escapeHandler(e) {
            if (e.key === 'Escape') {
                document.removeEventListener('keydown', escapeHandler);
                closeModal();
            }
        });

    } catch (error) {
        console.error('Error showing flag details:', error);
        showToast('Failed to load flag details', 'error');
    }
}

// Fetch flag details
async function fetchFlagDetails(itemId) {
    try {
        const response = await fetch(`${API_CONFIG.virtubeautyapi.baseUrl}/api/voting/${itemId}/flags`);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch flag details');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching flag details:', error);
        return {
            itemId: itemId,
            totalFlags: 0,
            flags: []
        };
    }
}

// Update vote summary in UI
async function updateVoteSummary(itemId, skipCache = false) {
    const summary = await fetchVoteSummary(itemId, skipCache);
    if (!summary) return;

    const card = document.querySelector(`[data-agent-id="${itemId}"]`);
    if (!card) return;

    const upvoteCount = card.querySelector('.upvote-count');
    const downvoteCount = card.querySelector('.downvote-count');
    const ratio = card.querySelector('.vote-ratio');

    if (upvoteCount) upvoteCount.textContent = formatNumber(summary.upvoteCount);
    if (downvoteCount) downvoteCount.textContent = formatNumber(summary.downvoteCount);
    if (ratio) ratio.textContent = `${Math.round(summary.upvoteRatio * 100)}%`;
}

// Initialize flag counts
async function initializeFlagCounts(agentIds) {
    if (!agentIds || agentIds.length === 0) return;

    try {
        const params = new URLSearchParams();
        agentIds.forEach(id => params.append('itemIds', id));

        const response = await fetch(`${API_CONFIG.virtubeautyapi.baseUrl}/api/voting/batch-flag-counts?${params}`);

        if (response.ok) {
            const data = await response.json();

            data.forEach(({ itemId, flagCount }) => {
                flagCountCache.set(itemId, flagCount || 0);
                updateFlagCount(itemId, flagCount || 0);
            });

            return data;
        }
    } catch (error) {
        console.error('Error initializing flag counts:', error);
    }

    // Set default values if fetch fails
    agentIds.forEach(id => {
        flagCountCache.set(id, 0);
        updateFlagCount(id, 0);
    });
}

// Initialize flag counts
async function initializeVotingCounts(agentIds) {
    if (!agentIds || agentIds.length === 0) return;

    try {
        const params = new URLSearchParams();
        agentIds.forEach(id => params.append('itemIds', id));

        const response = await fetch(`${API_CONFIG.virtubeautyapi.baseUrl}/api/voting/batch-vote-counts?${params}`);

        if (response.ok) {
            const data = await response.json();

            data.forEach(({ itemId, upvoteCount, downvoteCount }) => {
                updateVotingCount(itemId, 'upvote', upvoteCount || 0);
                updateVotingCount(itemId, 'downvote', downvoteCount || 0);
            });

            return data;
        }
    } catch (error) {
        console.error('Error initializing vote counts:', error);
    }

    // Set default values if fetch fails
    agentIds.forEach(id => {
        flagCountCache.set(id, 0);
        updateFlagCount(id, 0);
    });
}

// Helper function to escape HTML
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Helper function to format addresses
function truncateAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Export all functions to window.voting
window.voting = {
    handleVote,
    handleFlag,
    showFlagDialog,
    showFlagDetailsModal,
    fetchVoteSummary,
    updateVoteSummary,
    fetchFlagDetails,
    initializeFlagCounts,
    initializeVotingCounts,
    fetchBatchFlagCounts,
    VOTE_TYPES,
    getVotingApiUrl,
    flagCountCache,
    updateFlagCount,
    checkPremiumAccess
};