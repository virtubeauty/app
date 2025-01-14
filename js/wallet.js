// Constants
const PREMIUM_FAVORITE_LIMIT = 50;
const REGULAR_FAVORITE_LIMIT = 5;
const PREMIUM_THRESHOLD = 100000; // Required VBEA for premium

// Token and Network Configuration
const BASE_CHAIN_ID = '0x2105';
const TOKEN_CONFIG = {
    address: '0x414562C94223A5C4Df9F278422F03228F35b8f7d',
    symbol: 'VBEA'
};

// Minimum ABI for token interactions
const TOKEN_ABI = [{
    "inputs": [{"name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
}, {
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
}];

class WalletConnect {
    constructor() {
        this.account = null;
        this.isPremium = false;
        this.provider = null;
        this.chainId = null;
        this.web3 = null;
        this.authManager = window.authManager;
        this.initializeWalletConnect();
    }

    async initializeWalletConnect() {
        if (typeof window.ethereum !== 'undefined') {
            this.provider = window.ethereum;
            this.web3 = new Web3(window.ethereum);
            this.setupEventListeners();
            await this.checkConnection();
            this.updateUI();
        } else {
            console.log('Please install MetaMask!');
            this.showToast('Please install MetaMask to connect', 'error');
        }
    }

    async checkConnection() {
        try {
            const accounts = await this.provider.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                this.account = accounts[0];
                this.chainId = await this.provider.request({ method: 'eth_chainId' });
                await this.checkPremiumStatus();

                // Check if user is authenticated
                if (this.authManager && !await this.authManager.checkSession()) {
                    this.account = null;
                    this.chainId = null;
                }
            }
        } catch (error) {
            console.error('Error checking connection:', error);
        }
    }

    setupEventListeners() {
        this.provider.on('accountsChanged', async (accounts) => {
            if (accounts.length === 0) {
                await this.handleDisconnect();
            } else {
                this.account = accounts[0];
                await this.checkPremiumStatus();
                this.updateUI();
                this.showToast('Account changed', 'success');
            }
        });

        this.provider.on('chainChanged', async (newChainId) => {
            this.chainId = newChainId;
            await this.checkPremiumStatus();
            this.updateUI();
            this.showToast('Network changed', 'success');
        });

        this.provider.on('disconnect', async () => {
            await this.handleDisconnect();
            this.showToast('Wallet disconnected', 'info');
        });
    }

    async connectWallet() {
        if (!this.provider) {
            this.showToast('Please install MetaMask', 'error');
            return;
        }

        try {
            // First connect wallet
            const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
            this.account = accounts[0];
            this.chainId = await this.provider.request({ method: 'eth_chainId' });

            // Then authenticate with SIWE
            if (this.authManager) {
                await this.authManager.signIn();
            }

            await this.checkPremiumStatus();
            this.updateUI();
            this.showToast('Wallet connected successfully!', 'success');
        } catch (error) {
            console.error('Connection error:', error);
            this.showToast(error.message || 'Failed to connect wallet', 'error');
        }
    }

    async getTokenBalance() {
        if (!this.account || this.chainId !== BASE_CHAIN_ID) return '0';

        try {
            const contract = new this.web3.eth.Contract(TOKEN_ABI, TOKEN_CONFIG.address);
            const decimals = await contract.methods.decimals().call();
            const balance = await contract.methods.balanceOf(this.account).call();
            return balance / Math.pow(10, decimals);
        } catch (error) {
            console.error('Error getting token balance:', error);
            return '0';
        }
    }

    async checkPremiumStatus() {
        if (!this.account || this.chainId !== BASE_CHAIN_ID) {
            this.isPremium = false;
            localStorage.removeItem('walletPremium');
            this.updateFavoriteLimit();
            return;
        }

        try {
            const balance = await this.getTokenBalance();
            const previousStatus = this.isPremium;
            this.isPremium = parseFloat(balance) >= PREMIUM_THRESHOLD;

            if (this.isPremium !== previousStatus) {
                if (this.isPremium) {
                    localStorage.setItem('walletPremium', 'true');
                    this.showToast('Premium features activated! Thank you for your support! 🌟', 'success');
                } else {
                    localStorage.removeItem('walletPremium');
                }
            }

            this.updateFavoriteLimit();
        } catch (error) {
            console.error('Error checking premium status:', error);
            this.isPremium = false;
            localStorage.removeItem('walletPremium');
            this.updateFavoriteLimit();
        }
    }

    async getNetworkInfo() {
        try {
            if (this.chainId !== BASE_CHAIN_ID) {
                return {
                    name: 'Wrong Network',
                    isCorrectNetwork: false
                };
            }
            return {
                name: 'Base',
                isCorrectNetwork: true
            };
        } catch (error) {
            console.error('Error getting network:', error);
            return {
                name: 'Unknown Network',
                isCorrectNetwork: false
            };
        }
    }

    async switchToBase() {
        try {
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: BASE_CHAIN_ID }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    await this.provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: BASE_CHAIN_ID,
                            chainName: 'Base',
                            nativeCurrency: {
                                name: 'ETH',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: ['https://mainnet.base.org'],
                            blockExplorerUrls: ['https://basescan.org']
                        }],
                    });
                } catch (addError) {
                    throw new Error('Failed to add Base network to wallet');
                }
            }
            throw new Error('Failed to switch to Base network');
        }
    }

    updateFavoriteLimit() {
        window.MAX_FAVORITES = this.isPremium ? PREMIUM_FAVORITE_LIMIT : REGULAR_FAVORITE_LIMIT;
    }

    formatBalance(balance) {
        const num = parseFloat(balance);
        if (num === 0) return '0';
        if (num < 0.001) return '< 0.001';

        if (num >= 1000000) {
            return num.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
            });
        }

        return num.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: num >= 1 ? 0 : 3
        });
    }

    async handleDisconnect() {
        // Sign out from SIWE if authenticated
        if (this.authManager) {
            await this.authManager.signOut();
        }

        this.account = null;
        this.isPremium = false;
        this.chainId = null;
        localStorage.removeItem('auth_token');
        window.walletConnect.token = null;
        window.walletConnect.account = null;
        window.walletConnect.updateUI();
        localStorage.removeItem('walletPremium');
        this.updateFavoriteLimit();
        this.updateUI();

        // Clear any existing connection
        if (this.web3) {
            this.web3.setProvider(null);
        }

        // Reset web3 instance
        this.web3 = null;

        // Force update favorites count for regular limit
        window.MAX_FAVORITES = REGULAR_FAVORITE_LIMIT;

        // Update UI
        this.updateUI();
    }

    async disconnectWallet() {
        try {
            await this.handleDisconnect();
            this.showToast('Wallet disconnected successfully', 'success');

            setTimeout(() => {
                window.location.reload();
            }, 1000);
        } catch (error) {
            console.error('Error disconnecting:', error);
            this.handleDisconnect();
            this.showToast('Wallet disconnected', 'success');
        }
    }

    toggleDropdown() {
        const dropdown = document.querySelector('.wallet-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    getPremiumTooltipContent() {
        const features = [
            'Expanded favorites limit (50 items)',
            'Priority support access',
            'Early access to new features',
            'Premium badge recognition',
            'Advanced analytics (soon)',
            'Custom notifications (soon)',
            'Priority listings (soon)',
            '🪂'
        ];

        return `
            <div class="tooltip-header">
                <h3>Premium Member</h3>
                <span style="color: #FFD700">★</span>
            </div>
            <div class="tooltip-content">
                Thank you for being a valued premium member! Your contribution helps us grow and improve our platform.
            </div>
            <div class="premium-features">
                <h4>Your Premium Benefits:</h4>
                <ul class="feature-list">
                    ${features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    async updateUI() {
        const container = document.querySelector('.auth-container');
        if (!container) return;

        const isAuthenticated = this.authManager ? await this.authManager.checkSession() : false;

        if (this.account && isAuthenticated) {
            const networkInfo = await this.getNetworkInfo();
            const networkClass = networkInfo.isCorrectNetwork ? 'network-badge' : 'network-badge wrong-network';

            let tokenBalance = '0';
            if (networkInfo.isCorrectNetwork) {
                tokenBalance = await this.getTokenBalance();
            }

            const premiumBadgeHtml = this.isPremium ? `
                <div class="premium-info">
                    <div class="premium-badge">
                        <i>★</i> PREMIUM
                    </div>
                    <div class="premium-tooltip">
                        ${this.getPremiumTooltipContent()}
                    </div>
                </div>
            ` : '';

            const requiredAmount = PREMIUM_THRESHOLD;
            const currentBalance = parseFloat(tokenBalance);
            const remainingForPremium = Math.max(0, requiredAmount - currentBalance);

            const premiumStatusMessage = !this.isPremium && networkInfo.isCorrectNetwork ? `
                <div class="premium-unlock-info">
                    <span>Hold ${this.formatBalance(remainingForPremium)} more $VBEA to unlock Premium</span>
                </div>
            ` : '';

            container.innerHTML = `
                <button class="wallet-connect-btn connected" onclick="window.walletConnect.toggleDropdown()">
                    <span class="wallet-address">${this.truncateAddress(this.account)}</span>
                    ${premiumBadgeHtml}
                    <span style="margin-left: auto;">▼</span>
                </button>
                <div class="wallet-dropdown">
                    <div class="wallet-info">
                        ${networkInfo.isCorrectNetwork ? `
                            <div class="${networkClass}">
                                ${networkInfo.name}
                            </div>
                            <div class="token-balance">
                                <span class="balance-label">$VBEA Balance:</span>
                                <span class="balance-amount">${this.formatBalance(tokenBalance)}</span>
                            </div>
                            ${premiumStatusMessage}
                        ` : `
                            <div class="${networkClass}">
                                Wrong Network - Switch to Base
                            </div>
                            <button class="switch-network-btn" onclick="window.walletConnect.switchToBase()">
                                Switch to Base
                            </button>
                        `}
                    </div>
                    <div class="dropdown-actions">
                        <button class="dropdown-btn" onclick="window.open('https://basescan.org/address/${this.account}', '_blank')">
                            <span>🔍</span> View on Basescan
                        </button>
                        <button class="dropdown-btn" onclick="window.open('https://basescan.org/token/${TOKEN_CONFIG.address}', '_blank')">
                            <span>🪙</span> View $VBEA Token
                        </button>
                        <button class="dropdown-btn" onclick="navigator.clipboard.writeText('${this.account}').then(() => window.walletConnect.showToast('Address copied!', 'success'))">
                            <span>📋</span> Copy Address
                        </button>
                        <button class="dropdown-btn disconnect" onclick="window.walletConnect.disconnectWallet()">
                            <span>🔌</span> Disconnect
                        </button>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button class="wallet-connect-btn" onclick="window.walletConnect.connectWallet()">
                    Connect Wallet
                </button>
            `;
        }
    }

    truncateAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    showToast(message, type = 'info') {
        const event = new CustomEvent('showToast', {
            detail: { message, type }
        });
        window.dispatchEvent(event);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.walletConnect = new WalletConnect();

    // Handle clicking outside of dropdown
    document.addEventListener('click', (event) => {
        const container = document.querySelector('.wallet-container');
        const dropdown = document.querySelector('.wallet-dropdown');

        if (container && dropdown && !container.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Handle escape key to close dropdown
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const dropdown = document.querySelector('.wallet-dropdown');
            if (dropdown) {
                dropdown.classList.remove('active');
            }
        }
    });

    // Handle network change events
    window.ethereum?.on('chainChanged', () => {
        window.location.reload();
    });

    // Handle toast events
    window.addEventListener('showToast', (event) => {
        const { message, type } = event.detail;
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    });

    // Check if there's a pending authentication from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('auth_callback')) {
        window.walletConnect.handleAuthCallback().catch(console.error);
    }
});