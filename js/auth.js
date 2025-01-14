class AuthManager {
    constructor() {
        this.token = localStorage.getItem('auth_token');
        this.provider = null;
        this.signer = null;
        this.isLoading = false;
        this.account = null;
    }

    createSiweMessage(address, nonce) {
        const domain = window.location.host;
        const origin = window.location.origin;

        return new SiweMessage({
            domain,
            address,
            statement: 'Sign in with Ethereum to VirtuBeauty',
            uri: origin,
            version: '1',
            chainId: '1',
            nonce
        });
    }

    async init() {
        if (window.ethereum) {
            this.provider = new Web3(window.ethereum);
            await this.checkConnection();
        }
    }

    async checkConnection() {
        if (!this.provider) return false;

        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            this.account = accounts[0] || null;
            return this.checkSession();
        } catch (error) {
            console.error('Connection check error:', error);
            return false;
        }
    }

    async getNonce() {
        const response = await fetch(`${API_CONFIG.virtubeautyapi.baseUrl}/api/auth/nonce`);
        const data = await response.json();
        return data.nonce;
    }

    setLoading(loading) {
        this.isLoading = loading;
        const button = document.querySelector('.auth-button');
        if (button) {
            button.classList.toggle('loading', loading);
            button.disabled = loading;
        }
    }

    async signIn() {
        if (!this.provider || this.isLoading) return;

        try {
            this.setLoading(true);

            // Request account access using ethereum provider
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.account = accounts[0];
            this.web3 = new Web3(window.ethereum);

            // Get nonce
            const nonce = await this.getNonce();

            // Create message to sign
            const domain = window.location.host;
            const origin = window.location.origin;
            const messageToSign = `${domain} wants you to sign in with your Ethereum account:\n${this.account}\n\nSign in with Ethereum to VirtuBeauty\n\nURI: ${origin}\nVersion: 1\nChain ID: 8453\nNonce: ${nonce}\nIssued At: ${new Date().toISOString()}\nResources:\n- https://app.virtubeauty.fun/`;

            // Sign message using personal_sign
            const signature = await window.ethereum.request({
                method: 'personal_sign',
                params: [messageToSign, this.account]
            });

            // Verify signature
            const response = await fetch(`${API_CONFIG.virtubeautyapi.baseUrl}/api/auth/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: messageToSign,
                    signature,
                    address: this.account,
                    nonce
                }),
                credentials: 'include' // Important for session cookies
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to verify signature');
            }

            const { token } = await response.json();
            if (!token) {
                throw new Error('No token received from server');
            }

            // Store token
            this.token = token;
            localStorage.setItem('auth_token', token);

            // Update UI and show success message
            this.updateAuthUI();
            this.showToast('Successfully signed in', 'success');

            // Trigger auth success event
            window.dispatchEvent(new CustomEvent('authSuccess', {
                detail: { address: this.account }
            }));

            return token;

        } catch (error) {
            console.error('Sign in error:', error);
            this.showError(error.message || 'Failed to sign in');

            // Clean up on error
            this.token = null;
            this.account = null;
            localStorage.removeItem('auth_token');
            this.updateAuthUI();

            throw error;
        } finally {
            this.setLoading(false);
        }
    }

// Helper method to show toast
    showToast(message, type = 'info') {
        const event = new CustomEvent('showToast', {
            detail: { message, type }
        });
        window.dispatchEvent(event);
    }

// Helper method to show error
    showError(message) {
        this.showToast(message, 'error');
    }
    async signOut() {
        if (this.isLoading) return;

        try {
            this.setLoading(true);

            if (this.token) {
                await fetch(`${API_CONFIG.virtubeautyapi.baseUrl}/api/auth/signout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`
                    }
                });
            }

            localStorage.removeItem('auth_token');
            this.token = null;
            this.account = null;
            this.updateAuthUI();

        } catch (error) {
            console.error('Sign out error:', error);
            this.showError(error.message);
        } finally {
            this.setLoading(false);
        }
    }

    async checkSession() {
        if (!this.token) return false;

        try {
            const response = await fetch(`${API_CONFIG.virtubeautyapi.baseUrl}/api/auth/session`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`
                }
            });

            if (!response.ok) {
                this.token = null;
                localStorage.removeItem('auth_token');
                return false;
            }

            return true;
        } catch {
            this.token = null;
            localStorage.removeItem('auth_token');
            return false;
        }
    }

    //showError(message) {
    //    const event = new CustomEvent('showToast', {
    //        detail: {
    //            message: message || 'Authentication failed',
    //            type: 'error'
    //        }
    //    });
    //    window.dispatchEvent(event);
    //}

    truncateAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    toggleDropdown() {
        const dropdown = document.querySelector('.auth-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('active');
        }
    }

    updateAuthUI() {
        const container = document.querySelector('.auth-container');
        if (!container) return;

        if (this.account && this.token) {
            container.innerHTML = `
                <button class="auth-button connected" onclick="window.authManager.toggleDropdown()">
                    <span class="wallet-address">${this.truncateAddress(this.account)}</span>
                    <span style="margin-left: auto;">▼</span>
                </button>
                <div class="auth-dropdown">
                    <div class="auth-info">
                        <div class="network-info">Connected to Base</div>
                    </div>
                    <div class="auth-actions">
                        <button class="auth-action-btn" onclick="window.open('https://basescan.org/address/${this.account}', '_blank')">
                            <span>🔍</span> View on Basescan
                        </button>
                        <button class="auth-action-btn" onclick="navigator.clipboard.writeText('${this.account}')">
                            <span>📋</span> Copy Address
                        </button>
                        <button class="auth-action-btn disconnect" onclick="window.authManager.signOut()">
                            <span>🔌</span> Disconnect
                        </button>
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <button class="auth-button" onclick="window.authManager.signIn()">
                    Connect Wallet
                </button>
            `;
        }
    }

    setupEventListeners() {
        // Handle clicking outside of dropdown
        document.addEventListener('click', (event) => {
            const container = document.querySelector('.auth-container');
            const dropdown = document.querySelector('.auth-dropdown');

            if (container && dropdown && !container.contains(event.target)) {
                dropdown.classList.remove('active');
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                const dropdown = document.querySelector('.auth-dropdown');
                if (dropdown) {
                    dropdown.classList.remove('active');
                }
            }
        });
    }
}

// Initialize auth manager
window.authManager = new AuthManager();

document.addEventListener('DOMContentLoaded', async () => {
    await window.authManager.init();
    window.authManager.updateAuthUI();
    window.authManager.setupEventListeners();
});