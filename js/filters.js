// filters.js
const filters = {
    holderCount: {
        min: null,
        max: null,
        mode: 'single' // or 'range'
    },
    virtualTokenValue: {
        min: null,
        max: null,
        mode: 'single' // or 'range'
    },
    createdAt: null,
    role: null,
    timeUnit: 'hours'
};

function toggleFilterMode(filterType) {
    const filter = filters[filterType];
    filter.mode = filter.mode === 'single' ? 'range' : 'single';

    // Update UI
    const container = document.querySelector(`[data-filter="${filterType}"]`);
    const modeButton = container.querySelector('.filter-mode');
    const inputsContainer = container.querySelector('.filter-input-wrapper');

    modeButton.textContent = filter.mode === 'single' ? 'Switch to Range' : 'Switch to Single';

    // Update input structure
    if (filterType === 'virtualTokenValue') {
        updateVirtualTokenInputs(container, filter.mode);
    } else {
        updateHolderCountInputs(container, filter.mode);
    }
}

function updateVirtualTokenInputs(container, mode) {
    const wrapper = container.querySelector('.filter-input-wrapper');
    if (mode === 'single') {
        wrapper.innerHTML = `
            <div class="value-input-group">
                <input type="number" class="filter-input" id="virtualTokenValue" placeholder="e.g., 10">
                <select class="filter-select" id="valueUnit">
                    <option value="regular">Regular</option>
                    <option value="K">K</option>
                    <option value="M">M</option>
                </select>
            </div>
        `;
    } else {
        wrapper.innerHTML = `
            <div class="range-group">
                <div class="range-value-group">
                    <input type="number" class="filter-input" id="virtualTokenValueMin" placeholder="Min value">
                    <select class="filter-select" id="valueUnitMin">
                        <option value="regular">Regular</option>
                        <option value="K">K</option>
                        <option value="M">M</option>
                    </select>
                </div>
                <div class="range-value-group">
                    <input type="number" class="filter-input" id="virtualTokenValueMax" placeholder="Max value">
                    <select class="filter-select" id="valueUnitMax">
                        <option value="regular">Regular</option>
                        <option value="K">K</option>
                        <option value="M">M</option>
                    </select>
                </div>
            </div>
        `;
    }
}

function updateHolderCountInputs(container, mode) {
    const wrapper = container.querySelector('.filter-input-wrapper');
    if (mode === 'single') {
        wrapper.innerHTML = `
            <input type="number" class="filter-input" id="holderCount" placeholder="e.g., 400">
        `;
    } else {
        wrapper.innerHTML = `
            <div class="range-inputs">
                <input type="number" class="filter-input" id="holderCountMin" placeholder="Min holders">
                <span class="range-separator">to</span>
                <input type="number" class="filter-input" id="holderCountMax" placeholder="Max holders">
            </div>
        `;
    }
}

function initializeFilters() {
    const filtersHTML = `
        <div class="filters-container">
            <div class="filters-header">
                <h3 class="filters-title">Filters</h3>
            </div>
            <div class="filters-grid">
                <div class="filter-group" data-filter="holderCount">
                    <label class="filter-label">
                        Holders Count
                        <span class="filter-mode" onclick="toggleFilterMode('holderCount')">Switch to Range</span>
                    </label>
                    <div class="filter-input-wrapper">
                        <input type="number" id="holderCount" class="filter-input" placeholder="e.g., 400">
                    </div>
                </div>
                <div class="filter-group" data-filter="virtualTokenValue">
                    <label class="filter-label">
                        Market Cap
                        <span class="filter-mode" onclick="toggleFilterMode('virtualTokenValue')">Switch to Range</span>
                    </label>
                    <div class="filter-input-wrapper">
                        <div class="value-input-group">
                            <input type="number" id="virtualTokenValue" class="filter-input" placeholder="e.g., 10">
                            <select id="valueUnit" class="filter-select">
                                <option value="K">K</option>
                                <option value="M">M</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Created Within</label>
                    <div class="filter-input-wrapper">
                                            <div class="value-input-group">

                        <input type="number" id="timeValue" class="filter-input" placeholder="e.g., 24">
                        <select id="timeUnit" class="filter-select">
                            <option value="minutes">Minutes</option>
                            <option value="hours" selected>Hours</option>
                            <option value="days">Days</option>
                            <option value="months">Months</option>
                        </select>
                                                </div>

                    </div>
                </div>
                <div class="filter-group">
                    <label class="filter-label">Role</label>
                    <select id="role" class="filter-select">
                        <option value="">All Roles</option>
                        <option value="PRODUCTIVITY">Productivity</option>
                        <option value="ENTERTAINMENT">Entertainment</option>
                        <option value="ON-CHAIN">On-Chain</option>
                        <option value="INFORMATION">Information</option>
                        <option value="CREATIVE">Creative</option>
                    </select>
                </div>
            </div>
            <div class="filter-buttons">
                <button class="clear-filters" onclick="clearFilters()">Clear Filters</button>
                <button class="apply-filters" onclick="applyFilters()">Apply Filters</button>
            </div>
        </div>
    `;

    // Insert filters before the agent grid
    const agentGrid = document.getElementById('agentGrid');
    agentGrid.insertAdjacentHTML('beforebegin', filtersHTML);

    // Add event listeners
    document.getElementById('timeUnit').addEventListener('change', (e) => {
        filters.timeUnit = e.target.value;
    });
}

function getValueMultiplier(unit) {
    switch (unit) {
        case 'K':
            return 1e12;
        case 'M':
            return 1e15;
        default:
            return 1e9;
    }
}

function clearFilters() {
    // Reset all input fields
    document.getElementById('holderCount').value = '';
    document.getElementById('virtualTokenValue').value = '';
    document.getElementById('valueUnit').value = 'regular';
    document.getElementById('timeValue').value = '';
    document.getElementById('timeUnit').value = 'hours';
    document.getElementById('role').value = '';

    // Reset filters object
    Object.keys(filters).forEach(key => filters[key] = null);

    // Refresh agents with no filters
    fetchAgents();
}

function applyFilters() {
    const timeValue = document.getElementById('timeValue').value;
    const role = document.getElementById('role').value;

    // Handle Holder Count
    if (filters.holderCount.mode === 'single') {
        const holderCount = document.getElementById('holderCount').value;
        filters.holderCount.min = holderCount ? parseInt(holderCount) : null;
        filters.holderCount.max = null;
    } else {
        const minHolders = document.getElementById('holderCountMin').value;
        const maxHolders = document.getElementById('holderCountMax').value;
        filters.holderCount.min = minHolders ? parseInt(minHolders) : null;
        filters.holderCount.max = maxHolders ? parseInt(maxHolders) : null;
    }

    // Handle Virtual Token Value
    if (filters.virtualTokenValue.mode === 'single') {
        const value = document.getElementById('virtualTokenValue').value;
        const unit = document.getElementById('valueUnit').value;
        if (value) {
            const multiplier = getValueMultiplier(unit);
            filters.virtualTokenValue.min = parseFloat(value) * multiplier;
            filters.virtualTokenValue.max = null;
        } else {
            filters.virtualTokenValue.min = null;
            filters.virtualTokenValue.max = null;
        }
    } else {
        const minValue = document.getElementById('virtualTokenValueMin').value;
        const maxValue = document.getElementById('virtualTokenValueMax').value;
        const minUnit = document.getElementById('valueUnitMin').value;
        const maxUnit = document.getElementById('valueUnitMax').value;

        filters.virtualTokenValue.min = minValue ? parseFloat(minValue) * getValueMultiplier(minUnit) : null;
        filters.virtualTokenValue.max = maxValue ? parseFloat(maxValue) * getValueMultiplier(maxUnit) : null;
    }
    filters.role = role || null;

    // Calculate createdAt timestamp if time value is provided
    if (timeValue) {
        const now = new Date();
        switch (filters.timeUnit) {
            case 'minutes':
                now.setMinutes(now.getMinutes() - parseInt(timeValue));
                break;
            case 'hours':
                now.setHours(now.getHours() - parseInt(timeValue));
                break;
            case 'days':
                now.setDate(now.getDate() - parseInt(timeValue));
                break;
            case 'months':
                now.setMonth(now.getMonth() - parseInt(timeValue));
                break;
        }
        filters.createdAt = now.toISOString();
    } else {
        filters.createdAt = null;
    }

    // Refresh agents with new filters
    fetchAgents();
}

// Initialize filters when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeFilters);