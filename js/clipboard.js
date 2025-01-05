// clipboard.js
function copyAddress(element, text) {
    if (!text || !element) return;

    navigator.clipboard.writeText(text).then(() => {
        const tooltip = element.querySelector('.copy-tooltip');

        if (tooltip) {
            // Remove show class from all other tooltips
            document.querySelectorAll('.copy-tooltip.show').forEach(t => {
                if (t !== tooltip) t.classList.remove('show');
            });

            // Show this tooltip
            tooltip.classList.add('show');

            // Add scale effect to the clicked element
            element.style.transform = 'scale(0.95)';

            // Reset scale after animation
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, 200);

            // Hide tooltip after delay
            setTimeout(() => {
                tooltip.classList.remove('show');
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('Failed to copy to clipboard');
    });
}

// Initialize clipboard functionality for both agent cards and footer
document.addEventListener('DOMContentLoaded', () => {
    // Handle footer token address
    const tokenAddress = document.querySelector('.token-address');
    if (tokenAddress) {
        const copyButton = tokenAddress.querySelector('.copy-button');
        const address = tokenAddress.dataset.address;

        if (copyButton && address) {
            copyButton.addEventListener('click', (event) => {
                event.preventDefault();
                copyAddress(tokenAddress, address);
            });
        }
    }

    document.addEventListener('click', (event) => {
        const agentAddress = event.target.closest('.agent-address');
        if (agentAddress) {
            const fullAddress = agentAddress.querySelector('span').getAttribute('data-ca');
            
            if (fullAddress) {
                copyAddress(agentAddress, fullAddress);
                console.log(`Copied: ${fullAddress}`);
            } else {
                console.error('Address not found!');
            }
        }
    });
});


