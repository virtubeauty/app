// dexscreener.js

class VbScreenerAPI {
    static cache = new Map();

    static async fetchTokenData(contractAddresses) {
        if (!Array.isArray(contractAddresses)) {
            contractAddresses = [contractAddresses];
        }

        // Check cache first
        const uncachedAddresses = contractAddresses.filter(addr => !this.cache.has(addr.toLowerCase()));

        if (uncachedAddresses.length > 0) {
            const baseUrl = `${API_CONFIG.virtubeautyapi.baseUrl}/api/volume/${contractAddresses}/summary`;
            try {
                const response = await fetch(`${baseUrl}`);
                const data = await response.json();

                const tokenAddress = contractAddresses[0].toLowerCase();
                if (!this.cache.has(tokenAddress)) {
                    this.cache.set(tokenAddress, {
                        volume: data.volume,
                        txns: {
                            h24: {
                                sells: data.sellCount,
                                buys: data.buyCount,
                            }
                        },
                        priceChange: data.priceChange
                    });
                }              
            } catch (error) {
                console.error('Error fetching VBScreener data:', error);
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


    //static async fetchTokenData(contractAddresses) {
    //    if (!Array.isArray(contractAddresses)) {
    //        contractAddresses = [contractAddresses];
    //    }
    //    console.log(contractAddresses);
    //    // Check cache first
    //    const uncachedAddresses = contractAddresses.filter(addr => !this.cache.has(addr.toLowerCase()));

    //    if (uncachedAddresses.length > 0) {
    //        const baseUrl = `${API_CONFIG.virtubeautyapi.baseUrl}/api/prototype/by-token-address/${contractAddresses}`;
    //        try {
    //            const response = await fetch(`${baseUrl}`);
    //            const data = await response.json();

    //            return data;
    //        } catch (error) {
    //            console.error('Error fetching VBScreener data:', error);
    //        }
    //    }

    //    // Return data for all requested addresses
    //    const result = {};
    //    contractAddresses.forEach(addr => {
    //        const data = this.cache.get(addr.toLowerCase());
    //        if (data) {
    //            result[addr.toLowerCase()] = data;
    //        }
    //    });

    //    return result;
    //}

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