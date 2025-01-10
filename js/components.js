// components.js
function createAgentCard(agent, type = 'prototype', votingData = null) {
    const isSentient = type === 'sentient';
    let value;

    const rawValue = agent.virtualTokenValue * state.prices['virtual-protocol'];
    value = formatValue(rawValue);

    // Updated address logic to handle both sentient and prototype agents
    const address = (isSentient || agent.status === 'AVAILABLE' || agent.status === 'ACTIVATING')
        ? agent.tokenAddress
        : agent.preToken;

    const truncatedName = truncateText(agent.name, 100);
    const virtualLink = agent.status === 'UNDERGRAD'
        ? `https://app.virtuals.io/prototypes/${address}`
        : `https://app.virtuals.io/virtuals/${agent.id}`;

    // Format voting numbers
    const upvotes = votingData ? formatNumber(votingData.upvoteCount) : '0';
    const downvotes = votingData ? formatNumber(votingData.downvoteCount) : '0';
    const ratio = votingData ? `${Math.round(votingData.upvoteRatio * 100)}%` : '0%';

    return `
        <div class="agent-card" data-agent-id="${agent.id}">
            <div class="agent-header">
                <img src="${agent.image?.url}" alt="${truncatedName}" class="agent-image">
                <div class="agent-info">
                    <h2 title="${agent.name}">${truncatedName} <small>$${agent.symbol}</small></h2>
                    <div class="agent-address" onclick="copyAddress(this, '${address}')" title="Click to copy">
                        <span data-ca=${address}>${truncateAddress(address)}</span>
                        <div class="copy-tooltip">Copied!</div>
                    </div>
                </div>
                <button 
                    class="favorite-btn ${isFavorited(agent.id) ? 'active' : ''}" 
                    onclick="event.stopPropagation(); toggleFavorite(this, '${agent.id}')" 
                    title="${isFavorited(agent.id) ? 'Remove from favorites' : 'Add to favorites'}"
                    data-agent-id="${agent.id}">
                    <span class="favorite-icon">★</span>
                </button>
            </div>

            <div class="agent-stats">
                <div class="stat">👤 ${(agent.holderCount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")} holders</div>
                <div class="stat">💎 ${value}</div>
                <div class="stat">⏰ ${formatTimeAgo(agent.createdAt)}</div>
            </div>

            <div class="social-links">
                ${agent.socials?.TELEGRAM ? `
                    <a href="${agent.socials.TELEGRAM}" target="_blank" rel="noopener noreferrer" class="social-link social-link-bright">
                        <img src="https://app.virtuals.io/static/media/tgGray.6083d11dd277b25e41a73702f8045ea1.svg" alt="Telegram">
                        <span class="tooltip">Telegram</span>
                    </a>
                ` : ''}
                
                ${agent.socials?.TWITTER ? `
                    <a href="${agent.socials.TWITTER}" target="_blank" rel="noopener noreferrer" class="social-link social-link-bright">
                        <img src="https://app.virtuals.io/static/media/twitterGray.d3c0a43eb983ee581b81c4f26c413d45.svg" alt="Twitter">
                        <span class="tooltip">Twitter</span>
                    </a>
                ` : ''}
                
                ${agent.socials?.USER_LINKS?.WEBSITE ? `
                    <a href="${agent.socials.USER_LINKS.WEBSITE}" target="_blank" rel="noopener noreferrer" class="social-link">
                        <span style="font-size: 1.2rem">🌐</span>
                        <span class="tooltip">Website</span>
                    </a>
                ` : ''}
                
                ${agent.walletAddress ? `
                    <a href="https://basescan.org/address/${agent.walletAddress}" target="_blank" rel="noopener noreferrer" class="social-link">
                        <img src="https://images.crunchbase.com/image/upload/c_pad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_2/v1493270825/clcylji7jjegwu18cnmy.png" alt="Basescan" style="border-radius: 4px;">
                        <span class="tooltip">View Developer on Basescan</span>
                    </a>
                ` : ''}
                
                ${agent.walletAddress ? `
                    <a href="https://debank.com/profile/${agent.walletAddress}" target="_blank" rel="noopener noreferrer" class="social-link">
                        <img src="https://assets.debank.com/favicon.ico" alt="Debank" style="border-radius: 4px;">
                        <span class="tooltip">View Developer on Debank</span>
                    </a>
                ` : ''}
                
                ${address ? `
                    <a href="https://basescan.org/token/${address}" target="_blank" rel="noopener noreferrer" class="social-link">
                        <img src="https://images.crunchbase.com/image/upload/c_pad,h_170,w_170,f_auto,b_white,q_auto:eco,dpr_2/v1493270825/clcylji7jjegwu18cnmy.png" alt="Basescan" style="border-radius: 4px;">
                        <span class="tooltip">View ${truncatedName} on Basescan</span>
                    </a>
                ` : ''}
                
                ${(isSentient || agent.status === 'AVAILABLE' || agent.status === 'ACTIVATING') && address ? `
                    <a href="https://dexscreener.com/base/${address}" target="_blank" rel="noopener noreferrer" class="social-link social-link-bright">
                        <img src="https://app.virtuals.io/static/media/dexscreener.0f430eca7d77a03438879f65e415c2ee.svg" alt="Dexscreener" style="border-radius: 4px;">
                        <span class="tooltip">View on Dexscreener</span>
                    </a>
                    <a href="https://www.geckoterminal.com/base/pools/${address}" target="_blank" rel="noopener noreferrer" class="social-link social-link-bright">
                        <img src="https://app.virtuals.io/static/media/gecko.9048c8f45748a66cf5a960102c1e508f.svg" alt="GeckoTerminal" style="border-radius: 4px;">
                        <span class="tooltip">View on GeckoTerminal</span>
                    </a>
                ` : ''}
                
                <a href="${virtualLink}" target="_blank" rel="noopener noreferrer" class="social-link">
                    <img src="https://app.virtuals.io/favicon.ico" alt="Virtuals" style="border-radius: 4px;">
                    <span class="tooltip">View on Virtuals</span>
                </a>
            </div>
            <div class="voting-controls">
            <button class="vote-button upvote" onclick="window.voting.handleVote('${agent.id}', window.voting.VOTE_TYPES.UPVOTE)">
                <span>👍</span>
                <span class="upvote-count">${upvotes}</span>
            </button>
            <button class="vote-button downvote" onclick="window.voting.handleVote('${agent.id}', window.voting.VOTE_TYPES.DOWNVOTE)">
                <span>👎</span>
                <span class="downvote-count">${downvotes}</span>
            </button>
            <button class="vote-button flag" onclick="window.voting.showFlagDialog('${agent.id}')">
                <span>🚩</span>
                <span class="flag-count">0</span>
            </button>
            <button class="vote-button flag-details" onclick="window.voting.showFlagDetailsModal('${agent.id}')">
                <span>📋</span>
                <span>Flags</span>
            </button>
            <span class="vote-ratio">${ratio}</span>
        </div>
    </div>
    `;
}