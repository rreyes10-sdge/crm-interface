import React from 'react';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    LineElement,
    PointElement,
    LinearScale,
    Title,
    Tooltip,
    Legend,
    CategoryScale,
} from 'chart.js';
import { Box, Typography } from '@mui/material';



ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);



interface CumulativeCostChartProps {
    yearlyFossilFuelCosts: { [year: string]: number };
    yearlyEvCosts: { [year: string]: number };
    title?: string;
}



const CumulativeCostComparisonChart: React.FC<CumulativeCostChartProps> = ({
    yearlyFossilFuelCosts,
    yearlyEvCosts,
    title = 'Cumulative Cost Difference: EV vs. Fossil Fuel Vehicles',
}) => {
    const years = Object.keys(yearlyFossilFuelCosts);
    const fossilFuelCosts = Object.values(yearlyFossilFuelCosts);
    const evCosts = Object.values(yearlyEvCosts);



    let cumulativeEv = 0;
    let cumulativeFf = 0;



    const cumulativeDifference: number[] = [];



    for (let i = 0; i < years.length; i++) {
        cumulativeEv += evCosts[i];
        cumulativeFf += fossilFuelCosts[i];
        cumulativeDifference.push(cumulativeEv - cumulativeFf);
    }



    const breakEvenYearIndex = cumulativeDifference.findIndex(diff => diff < 0);
    const breakEvenYear = breakEvenYearIndex !== -1 ? years[breakEvenYearIndex] : null;



    const data = {
        labels: years,
        datasets: [
            {
                label: 'Cumulative Cost Difference (EV - Fossil)',
                data: cumulativeDifference,
                borderColor: '#444',
                backgroundColor: '#CCC',
                borderDash: [5, 5],
                fill: false,
                yAxisID: 'y2',
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
                text: title,
            },
        },
        scales: {
            y2: {
                type: 'linear',
                position: 'right' as const,
                title: {
                    display: true,
                    text: 'Cumulative Cost Difference (USD)',
                },
                ticks: {
                    callback: (value: number) =>
                        new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: 'USD',
                        }).format(value),
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
    };



    return (
        <>
            <Box mt={3} mb={3}>
                <Typography variant="h6" align="center">
                    {breakEvenYear ? (
                        <>
                            Based on your estimated usage and rates, <strong>EVs become cheaper than fossil fuel vehicles starting in {breakEvenYear}</strong>.
                        </>
                    ) : (
                        <>
                            Over the modeled time period, <strong>EVs do not reach a break-even point</strong> in total cumulative cost.
                        </>
                    )}
                </Typography>
            </Box>
            <Line data={data} options={options as any} />
        </>
    );
};



export default CumulativeCostComparisonChart;