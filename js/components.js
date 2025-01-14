// components.js
function createAgentCard(agent, type = 'prototype', isSearch = false) {
    const isSentient = type === 'sentient';
    let value;

    const rawValue = agent.virtualTokenValue * state.prices['virtual-protocol'];
    value = formatValue(rawValue);

    const address = (isSentient || agent.status === 'AVAILABLE' || agent.status === 'ACTIVATING')
        ? agent.tokenAddress
        : agent.preToken;

    const truncatedName = truncateText(agent.name, 15);
    const virtualLink = agent.status === 'UNDERGRAD'
        ? `https://app.virtuals.io/prototypes/${address}`
        : `https://app.virtuals.io/virtuals/${agent.id}`;

   
    if ((type === 'sentient' || isSearch) && agent.status !== 'UNDERGRAD' && agent.tokenAddress) {
        DexScreenerAPI.fetchTokenData(agent.tokenAddress)
            .then(tokenData => {
                const tradingData = tokenData[agent.tokenAddress.toLowerCase()];
                if (tradingData) {
                    const tradingStatsHtml = `
                        <div class="trading-stats">
                <div class="trading-metric" data-tooltip="24 Hour Trading Volume">
                  <span class="metric-label">Volume</span>
                  <span class="metric-value trade-volume">${DexScreenerAPI.formatNumber(tradingData.volume.h24)}</span>
                </div>
                <div class="trading-metric" data-tooltip="24 Hour Price Change">
                  <span class="metric-label">Change</span>
                  <span class="metric-value price-change ${tradingData.priceChange.h24 >= 0 ? 'positive' : 'negative'}">
                    ${DexScreenerAPI.formatPriceChange(tradingData.priceChange.h24)}
                  </span>
                </div>
                <div class="trading-metric" data-tooltip="Buy/Sell Transactions">
                  <span class="metric-label">Trades</span>
                  <div class="trade-count" style='font-size:13px'>
                    <span class="buys">${tradingData.txns.h24.buys}</span>
                    <span>/</span>
                    <span class="sells" style='font-size:13px'>${tradingData.txns.h24.sells}</span>
                  </div>
                </div>
              </div>
          `;

                    const container = document.querySelector(`[data-agent-id="${agent.id}"] .trading-stats-container`);
                    if (container) {
                        container.innerHTML = tradingStatsHtml;
                    }
                }
            })
            .catch(error => {
                console.error('Error updating trading stats:', error);
            });
    }

    if (agent.status === 'UNDERGRAD' && agent.preToken) {
        VbScreenerAPI.fetchTokenData(agent.preToken)
            .then(tokenData => {
                const tradingData = tokenData[agent.preToken.toLowerCase()];
                if (tradingData) {
                    const tradingStatsHtml = `
                        <div class="trading-stats">
                <div class="trading-metric" data-tooltip="24 Hour Trading Volume">
                  <span class="metric-label">Volume</span>
                  <span class="metric-value trade-volume">${VbScreenerAPI.formatNumber(tradingData.volume)}</span>
                </div>
                <div class="trading-metric" data-tooltip="24 Hour Price Change">
                  <span class="metric-label">Change</span>
                  <span class="metric-value price-change ${tradingData.priceChange> 0 ? 'positive' : 'negative'}">
                    ${VbScreenerAPI.formatPriceChange(tradingData.priceChange)}
                  </span>
                </div>
                <div class="trading-metric" data-tooltip="Buy/Sell Transactions">
                  <span class="metric-label">Trades</span>
                  <div class="trade-count">
                    <span class="buys">${tradingData.txns.h24.buys}</span>
                    <span>/</span>
                    <span class="sells">${tradingData.txns.h24.sells}</span>
                  </div>
                </div>
              </div>
          `;

                const container = document.querySelector(`[data-agent-id="${agent.id}"] .trading-stats-container`);
                if (container) {
                    container.innerHTML = tradingStatsHtml;
                }
                }
            })
            .catch(error => {
                console.error('Error updating trading stats:', error);
            });
    }




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
                <div class="stat">
                    <div class="stat-title">Holders</div>
                    <div class="stat-value">${(agent.holderCount || 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}</div>
                </div>
                <div class="stat"  data-tooltip="Market Cap">
                    <div class="stat-title">MC</div>
                    <div class="stat-value">${value}</div>
                </div>
                <div class="stat">
                    <div class="stat-title">Date</div>
                    <div class="stat-value">${formatTimeAgo(agent.createdAt)}</div>
                </div>
            </div>
            
            <div class="trading-stats-container">
                <!-- Trading stats will be injected here -->
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
                <span class="upvote-count">0</span>
            </button>
            <button class="vote-button downvote" onclick="window.voting.handleVote('${agent.id}', window.voting.VOTE_TYPES.DOWNVOTE)">
                <span>👎</span>
                <span class="downvote-count">0</span>
            </button>
            <button class="vote-button flag" onclick="window.voting.showFlagDialog('${agent.id}')">
                <span>🚩</span>
                <span class="flag-count">0</span>
            </button>
            <button class="vote-button flag-details" onclick="window.voting.showFlagDetailsModal('${agent.id}')">
                <span>📋</span>
                <span>Flags</span>
            </button>
        </div>
        <button class="view-details-btn" onclick="window.agentDetails.show('${address}', '${agent.walletAddress}', '${truncatedName}', '${agent.symbol}', '${agent.id}', '${agent.status}','${agent.createdAt}')">
                <span class="details-icon">📊</span>
                View Details
         </button>
    </div>
    `;
}


// components.js

// Agent Details Manager
class AgentDetails {
    constructor() {
        this.modal = null;
        this.createModal();
    }

    createModal() {
        const modalHTML = `
            <div class="details-modal">
                <div class="details-content">
                    <div class="details-header">
                        <h3>Token Details</h3>
                        <button class="details-close">×</button>
                    </div>
                    <div class="details-body">
                        <div class="dev-section">
                            <div id="devData"></div>
                        </div>
                        <div class="detail-main-content">
                            <div class="chart-section">
                                <iframe class="chart-container" frameborder="0"></iframe>
                                <div class="prototype-chart-container"></div>
                            </div>
                            <div class="holders-section">
                                <h4 class="holders-title">Top Holders</h4>
                                <div class="holders-list"></div>
                            </div>
                        </div>
                        <div class="influence-metrics">
                            <div class="metric-item">
                                <span class="metric-label">Impressions (7d)</span>
                                <span class="metric-value" id="impressions">-</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Engagements (7d)</span>
                                <span class="metric-value" id="engagements">-</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Followers</span>
                                <span class="metric-value" id="followers">-</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Smart Followers</span>
                                <span class="metric-value" id="smartFollowers">-</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-label">Mindshare (7d)</span>
                                <span class="metric-value" id="mindshare">-</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.modal = document.querySelector('.details-modal');
        this.setupEventListeners();
    }

    setupEventListeners() {
        const closeBtn = this.modal.querySelector('.details-close');
        closeBtn.addEventListener('click', () => this.close());

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.close();
            }
        });
    }

    calculateHolderPercentage(value) {
        let percentage = (value / 1e7).toFixed(2);
        return percentage;
    }

    async fetchHolders(tokenAddress) {
        try {
            const response = await fetch(`https://api.virtuals.io/api/tokens/${tokenAddress}/holders`);
            if (!response.ok) throw new Error('Failed to fetch holders');
            return await response.json();
        } catch (error) {
            console.error('Error fetching holders:', error);
            return {data: []};
        }
    }

    async fetchInfluenceMetrics(agentId) {
        try {
            const response = await fetch(`https://api.virtuals.io/api/virtuals/${agentId}/influence-metrics`);
            if (!response.ok) throw new Error('Failed to fetch influence metrics');
            return await response.json();
        } catch (error) {
            console.error('Error fetching influence metrics:', error);
            return null;
        }
    }

    updateInfluenceMetrics(metrics) {
        if (!metrics) {
            document.getElementById('impressions').textContent = '-';
            document.getElementById('engagements').textContent = '-';
            document.getElementById('followers').textContent = '-';
            document.getElementById('smartFollowers').textContent = '-';
            document.getElementById('mindshare').textContent = '-';

            return;
        }

        const data = metrics.data;
        const formatNumber = (num) => new Intl.NumberFormat().format(num);
        const formatPercentage = (num) => (num * 100).toFixed(2) + '%';

        document.getElementById('impressions').textContent = formatNumber(data.totalImpressions7Days);
        document.getElementById('engagements').textContent = formatNumber(data.totalEngagements7Days);
        document.getElementById('followers').textContent = formatNumber(data.followersCount);
        document.getElementById('smartFollowers').textContent = formatNumber(data.smartFollowersCount);
        document.getElementById('mindshare').textContent = formatPercentage(data.mindshare7Days);
    }

    renderHolders(holders, agentWalletAddress) {
        const holdersList = this.modal.querySelector('.holders-list');
        holdersList.innerHTML = holders.map(([address, value]) => {
            const percentage = this.calculateHolderPercentage(value);
            const isDev = address.toLowerCase() === agentWalletAddress?.toLowerCase();
            const isDevLocked = address.toLowerCase() === '0xdad686299fb562f89e55da05f1d96fabeb2a2e32';
            return `
                <div class="holder-item">
                    <span class="holder-address">${truncateAddress(address)}</span>
                    ${isDev ? '<span alt="Dev" class="dev-indicator">💡</span>' : ''}
                    ${isDevLocked ? '<span class="dev-indicator">🔒</span>' : ''}
                    <span class="holder-percentage">${percentage}%</span>               
                </div>
            `;
        }).join('');
    }

    async fetchDevData(agentId) {
        try {
            const response = await fetch(`${API_CONFIG.virtubeautyapi.baseUrl}/api/prototype/${agentId}`);
            if (!response.ok) throw new Error('Failed to fetch dev data');
            return await response.json();
        } catch (error) {
            console.error('Error fetching dev data:', error);
            return null;
        }
    }

    renderDevData(data) {
        if (!data) return;

        const formatDate = (dateString) => {
            return new Date(dateString).toLocaleString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        };
        var ethUsd= state.prices['ethereum'];
        const devDataHtml = `
            <table class="dev-table">
                <tr>
                    <th>Dev Wallet</th>
                    <td class="td-address" onclick="copyAddress(this, '${data.devAddress}')" style='cursor:pointer;'> 
                    <span data-ca=${data.devAddress}>${data.devAddress}</span>
                        <div class="copy-tooltip">Copied!</div></td>
                    <th>Token Address</th>
                    <td class="td-address" onclick="copyAddress(this, '${data.tokenAddress}')" style='cursor:pointer;'> 
                    <span data-ca=${data.tokenAddress}>${data.tokenAddress}</span>
                        <div class="copy-tooltip">Copied!</div></td>
                </tr>
                <tr>
                    <th>Wallet Created</th>
                    <td>${formatDate(data.devWalletBaseCreatedDate)}</td>
                    <th>Block Number</th>
                    <td>${data.blockNumber}</td>                    
                </tr>
                <tr>
                    <th>Ethereum Balance</th>
                    <td>${data.devWalletEthereumEtherBalance} ETH ($${(data.devWalletEthereumEtherBalance * ethUsd).toFixed(2) })</td>
                    <th>Base Balance</th>
                    <td>${data.devWalletBaseEtherBalance} ETH ($${(data.devWalletBaseEtherBalance * ethUsd).toFixed(2)})</td>
                   
                </tr>
                <tr>
                    <th>Received Token</th>
                    <td>${data.receivedToken.split('.')[0]} (${(formatPercent(data.receivedToken))}%)</td>
                    <th>Bought Virtual</th>
                    <td>${data.boughtVirtual}</td>
                </tr>
            </table>
        `;

        const devDataContainer = document.getElementById('devData');
        if (devDataContainer) {
            devDataContainer.innerHTML = devDataHtml;
        }
    }


    async show(tokenAddress, agentWalletAddress, agentName, agentSymbol, agentId, agentStatus, agentCreatedAt) {
        this.resetModalState();
        // Show modal immediately with loading state
        const modalTitle = this.modal.querySelector('.details-header h3');
        modalTitle.innerHTML = `${agentName} <span class="agent-symbol">$${agentSymbol}</span>`;

        this.modal.querySelector('.holders-list').innerHTML = `
            <div class="loading-skeleton">
                <div class="skeleton-holder"></div>
                <div class="skeleton-holder"></div>
                <div class="skeleton-holder"></div>
                <div class="skeleton-holder"></div>
                <div class="skeleton-holder"></div>
            </div>
        `;

        // Show modal immediately
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Get chart containers
        const protoChartContainer = this.modal.querySelector('.prototype-chart-container');
        const sentiChartContainer = this.modal.querySelector('.chart-container');

        // Hide both containers initially
        protoChartContainer.style.display = 'none';
        sentiChartContainer.style.display = 'none';

        // Load all data asynchronously
        Promise.all([
            // Load dev data
            (async () => {
                const devContainer = document.getElementById('devData');
                const devData = await this.fetchDevData(agentId);
                if (devData) {
                    this.renderDevData(devData);
                }
                else {
                 //   devContainer.innerHTML = '';
                }
               
            })(),
            // Load chart
            (async () => {
                if (agentStatus === 'UNDERGRAD') {
                    protoChartContainer.style.display = 'block';
                    await this.renderPrototypeChart(protoChartContainer, tokenAddress, agentCreatedAt);
                } else {
                    sentiChartContainer.style.display = 'block';
                    this.renderSentientChart(sentiChartContainer, tokenAddress);
                }
            })(),

            // Load influence metrics
            (async () => {
                try {
                    const influenceMetrics = await this.fetchInfluenceMetrics(agentId);
                    if (influenceMetrics) {
                        this.updateInfluenceMetrics(influenceMetrics);
                      //  metricsSection.style.display = 'flex';
                    } else {
                        // Hide metrics section if no data
                        const metricsSection = this.modal.querySelector('.influence-metrics');
                       // metricsSection.style.display = 'none';
                    }
                } catch (error) {
                    if (error.status === 404) {
                        // Hide metrics section on 404
                        const metricsSection = this.modal.querySelector('.influence-metrics');
                       // metricsSection.style.display = 'none';
                    } else {
                        console.error('Error fetching metrics:', error);
                    }
                }
            })(),
            // Load holders
            (async () => {
                const holdersData = await this.fetchHolders(tokenAddress);
                this.renderHolders(holdersData.data || [], agentWalletAddress);
            })()
        ]).catch(error => {
            console.error('Error loading details:', error);
            // Handle errors gracefully - maybe show an error state
            this.modal.querySelector('.details-content').innerHTML += `
                <div class="error-message">
                    Some data failed to load. Please try again later.
                </div>
            `;
        });
    };

    // Helper method for rendering prototype chart
    async renderPrototypeChart(container, tokenAddress, createdAt) {
        container.innerHTML = ''; // Clear existing content

        // Create canvas container
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'chart-canvas-container';
        container.appendChild(canvasContainer);

        // Add loading overlay
        const loadingOverlay = document.createElement('div');
        loadingOverlay.className = 'loading-overlay';
        loadingOverlay.textContent = 'Loading chart data...';
        container.appendChild(loadingOverlay);

        try {
            const chartHandler = new ChartHandler(canvasContainer);
            const chartData = await chartHandler.fetchChartData(tokenAddress, createdAt);

            if (chartData && chartData.length > 0) {
                chartHandler.drawChart(chartData);
            } else {
                container.innerHTML = '<div class="no-data">No chart data available</div>';
            }
        } catch (error) {
            console.error('Error rendering prototype chart:', error);
            container.innerHTML = '<div class="error">Chart will coming </div>';
        } finally {
            loadingOverlay.remove();
        }
    }

    // Helper method for rendering sentient chart
    renderSentientChart(container, tokenAddress) {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const themeType = currentTheme == 'light' ? 1 : 0;
        container.src = `https://www.geckoterminal.com/base/pools/${tokenAddress}?embed=1&info=0&swaps=0&grayscale=0&light_chart=${themeType}`;

        //container.appendChild(iframe);
    }

    resetModalState() {
        // Reset visibility of all sections
        const metricsSection = this.modal.querySelector('.influence-metrics');
        metricsSection.style.display = 'flex'; // Reset to default display type

        // Reset holders section
        const holdersSection = this.modal.querySelector('.holders-list');
        holdersSection.innerHTML = `
            <div class="loading-skeleton">
                <div class="skeleton-holder"></div>
                <div class="skeleton-holder"></div>
                <div class="skeleton-holder"></div>
                <div class="skeleton-holder"></div>
                <div class="skeleton-holder"></div>
            </div>
        `;

        // Reset chart containers
        const protoChartContainer = this.modal.querySelector('.prototype-chart-container');
        const sentiChartContainer = this.modal.querySelector('.chart-container');

        if (protoChartContainer) {
            protoChartContainer.style.display = 'none';
            protoChartContainer.innerHTML = '';
        }

        if (sentiChartContainer) {
            sentiChartContainer.style.display = 'none';
            sentiChartContainer.src = '';
        }

        // Remove any error messages
        const errorMessages = this.modal.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
    }

    close() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';

        // Clear both chart containers
        const protoChartContainer = this.modal.querySelector('.prototype-chart-container');
        const sentiChartContainer = this.modal.querySelector('.chart-container');
        protoChartContainer.innerHTML = '';
        sentiChartContainer.innerHTML = '';
        sentiChartContainer.src = '';

        // Reset influence metrics
        ['impressions', 'engagements', 'followers', 'smartFollowers', 'mindshare'].forEach(id => {
            document.getElementById(id).textContent = '-';
        });
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.agentDetails = new AgentDetails();
});


