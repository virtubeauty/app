// dexscreener.js

class DexScreenerAPI {
    static cache = new Map();

    static async fetchTokenData(contractAddresses) {
        if (!Array.isArray(contractAddresses)) {
            contractAddresses = [contractAddresses];
        }

        // Check cache first
        const uncachedAddresses = contractAddresses.filter(addr => !this.cache.has(addr.toLowerCase()));

        if (uncachedAddresses.length > 0) {
            const baseUrl = 'https://api.dexscreener.com/latest/dex/tokens/';
            try {
                const response = await fetch(`${baseUrl}${uncachedAddresses.join(',')}`);
                const data = await response.json();

                if (data.pairs) {
                    // Process and cache the data
                    data.pairs.forEach(pair => {
                        const tokenAddress = pair.baseToken.address.toLowerCase();
                        if (!this.cache.has(tokenAddress) ||
                            pair.volume.h24 > this.cache.get(tokenAddress).volume.h24) {
                            this.cache.set(tokenAddress, {
                                volume: pair.volume,
                                txns: pair.txns,
                                priceChange: pair.priceChange
                            });
                        }
                    });
                }
            } catch (error) {
                console.error('Error fetching DEXScreener data:', error);
            }
        }

        // Return data for all requested addresses
        const result = {};
        contractAddresses.forEach(addr => {
            const data = this.cache.get(addr.toLowerCase());
            if (data) {
                result[addr.toLowerCase()] = data;
            }
        });

        return result;
    }

    static formatNumber(num) {
        if (!num) return '0';
        if (num >= 1000000) return (num / 1000000).toFixed(2) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(2) + 'K';
        return num.toFixed(2);
    }

    static formatPriceChange(change) {
        if (!change) return '0.00%';
        return (change > 0 ? '+' : '') + change.toFixed(2) + '%';
    }
}