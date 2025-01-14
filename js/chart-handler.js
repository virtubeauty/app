// chart-handler.js

class ChartHandler {
    constructor(container) {
        this.container = container;
        this.canvas = document.createElement('canvas');
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        this.setupResizeListener();
    }

    resize() {
        const rect = this.container.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.drawChart();
    }

    setupResizeListener() {
        let timeout;
        const observer = new ResizeObserver(() => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.resize(), 100);
        });
        observer.observe(this.container);
    }

    async fetchChartData(preTokenAddress, createdAt) {
        const start = new Date(createdAt).toISOString();
        const end = new Date().toISOString();
        const url = `https://fun-chart.virtuals.io/api/chart-data/chart?preTokenAddress=${preTokenAddress}&interval=1m&start=${start}&end=${end}`;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch chart data');
            return await response.json();
        } catch (error) {
            console.error('Error fetching chart data:', error);
            return null;
        }
    }

    formatDate(timestamp) {
        const date = new Date(timestamp * 1000);
        const month = date.toLocaleString('default', { month: 'short' });
        const day = date.getDate();
        const time = date.toLocaleString('default', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
        return `${month} ${day}, ${time}`;
    }

    drawChart(data = []) {
        if (!data.length) return;

        const ctx = this.ctx;
        const width = this.canvas.width;
        const height = this.canvas.height;
        const padding = 60; // Increased padding to accommodate longer date format

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        // Calculate min/max values
        const prices = data.map(d => [d.low, d.high]).flat();
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = maxPrice - minPrice;

        // Calculate scaling factors
        const xScale = (width - padding * 2) / (data.length - 1);
        const yScale = (height - padding * 2) / priceRange;

        // Draw price line with color based on trend
        ctx.lineWidth = 2;

        data.forEach((point, i) => {
            if (i === 0) return;

            const startX = padding + (i - 1) * xScale;
            const startY = height - padding - (data[i - 1].close - minPrice) * yScale;
            const endX = padding + i * xScale;
            const endY = height - padding - (point.close - minPrice) * yScale;

            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);

            // Determine color based on price trend
            ctx.strokeStyle = endY < startY ? '#00b894' : '#ff7675'; // Green for up, Red for down
            ctx.stroke();
        });

        // Draw axes
        ctx.strokeStyle = '#dfe6e9';
        ctx.lineWidth = 1;
        ctx.beginPath();

        // X-axis
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Draw price labels on the right side
        ctx.fillStyle = '#636e72';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';

        const priceSteps = 5;
        for (let i = 0; i <= priceSteps; i++) {
            const price = minPrice + (priceRange * i) / priceSteps;
            const y = height - padding - (price - minPrice) * yScale;
            ctx.fillText(price.toFixed(8), width - padding + 10, y + 4);
        }

        // Draw time labels with improved formatting
        ctx.textAlign = 'center';
        const timeSteps = Math.min(5, data.length);
        for (let i = 0; i < timeSteps; i++) {
            const x = padding + (i * (width - padding * 2)) / (timeSteps - 1);
            const dataIndex = Math.floor(i * (data.length - 1) / (timeSteps - 1));
            const formattedDate = this.formatDate(data[dataIndex].time);

            // Rotate canvas for angled text
            ctx.save();
            ctx.translate(x, height - padding + 15);
            ctx.rotate(Math.PI / 6); // 30-degree angle
            ctx.fillText(formattedDate, 0, 0);
            ctx.restore();
        }
    }
}

window.ChartHandler = ChartHandler;
// Export the class
