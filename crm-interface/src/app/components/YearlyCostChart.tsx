// src/app/components/YearlyCostChart.tsx
import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale } from 'chart.js';

// Register the necessary components
ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

interface YearlyCostChartProps {
    yearlyFossilFuelCosts: { [year: string]: number };
    yearlyEvCosts: { [year: string]: number }; // New prop for EV costs
}

const YearlyCostChart: React.FC<YearlyCostChartProps> = ({ yearlyFossilFuelCosts, yearlyEvCosts }) => {
    const years = Object.keys(yearlyFossilFuelCosts);
    const fossilFuelCosts = Object.values(yearlyFossilFuelCosts);
    const evCosts = Object.values(yearlyEvCosts);

    const data = {
        labels: years,
        datasets: [
            {
                label: 'Fossil Fuel Vehicles',
                data: fossilFuelCosts,
                borderColor: '#FED600',
                backgroundColor: '#FFF4B8',
                fill: true,
            },
            {
                label: 'Electric Vehicles',
                data: evCosts,
                borderColor: '#001689',
                backgroundColor: '#009BDA',
                fill: true,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Total Costs Over Time',
            },
        },
        scales: {
            y: {
                min: Math.min(...fossilFuelCosts, ...evCosts) * 0.90, // 10% buffer below the minimum value
                max: Math.max(...fossilFuelCosts, ...evCosts) * 1.10, // 10% buffer above the maximum value
                ticks: {
                    callback: (value: number) => {
                        return new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        }).format(value); // Format as US dollars with commas
                    },
                },
            },
        },
    };

    return <Line data={data} options={options as any} />;
};

export default YearlyCostChart;