import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Typography, Grid, Stack } from '@mui/material';
import StatCard from './StatCard';
import CustomizedDataGrid from './CustomizedDataGrid';
import ChartProjectSubmissions from './ChartProjectSubmissions';

interface StatCardProps {
    title: string;
    value: string;
    interval: string;
    trend: 'neutral' | 'up' | 'down';
    percentageChange: number;
    data: number[];
}

async function fetchData(endpoint: string): Promise<any[]> {
    const response = await axios.get(endpoint);
    return response.data;
}

async function fetchTrend(endpoint: string): Promise<{ Trend: 'neutral' | 'up' | 'down', PercentageChange: number }> {
    const response = await axios.get(endpoint);
    return response.data[0]; // Assuming the trend and percentage change are in the first object
}

function calculateValue(data: any[], key: string): string {
    return data.reduce((acc, curr) => acc + curr[key], 0).toString();
}

async function initializeData() {
    try {
        const projectsData = await fetchData('http://127.0.0.1:5000/api/data/projects');
        const projectsTrend = await fetchTrend('http://127.0.0.1:5000/api/data/projects-trend');

        const loggedActivitiesData = await fetchData('http://127.0.0.1:5000/api/data/logged-activities');
        const loggedActivitiesTrend = await fetchTrend('http://127.0.0.1:5000/api/data/logged-activities-trend');

        const attributesFilledData = await fetchData('http://127.0.0.1:5000/api/data/attributes-filled');
        const attributesFilledTrend = await fetchTrend('http://127.0.0.1:5000/api/data/attributes-filled-trend');

        const servicesCompletedData = await fetchData('http://127.0.0.1:5000/api/data/services-completed');
        const servicesCompletedTrend = await fetchTrend('http://127.0.0.1:5000/api/data/services-completed-trend');

        return [
            {
                title: 'Projects',
                value: calculateValue(projectsData, 'ProjectCount'),
                interval: 'Last 30 days',
                trend: projectsTrend.Trend,
                percentageChange: projectsTrend.PercentageChange,
                data: projectsData.map(item => item.ProjectCount), // Extracting the values for the sparkline
            },
            {
                title: 'Logged Activities',
                value: calculateValue(loggedActivitiesData, 'ActivityCount'),
                interval: 'Last 30 days',
                trend: loggedActivitiesTrend.Trend,
                percentageChange: loggedActivitiesTrend.PercentageChange,
                data: loggedActivitiesData.map(item => item.ActivityCount), // Extracting the values for the sparkline
            },
            {
                title: 'Attributes Filled In',
                value: calculateValue(attributesFilledData, 'FilledCount'),
                interval: 'Last 30 days',
                trend: attributesFilledTrend.Trend,
                percentageChange: attributesFilledTrend.PercentageChange,
                data: attributesFilledData.map(item => item.FilledCount), // Extracting the values for the sparkline
            },
            {
                title: 'Services Completed',
                value: calculateValue(servicesCompletedData, 'CompletedCount'),
                interval: 'Last 30 days',
                trend: servicesCompletedTrend.Trend,
                percentageChange: servicesCompletedTrend.PercentageChange,
                data: servicesCompletedData.map(item => item.CompletedCount), // Extracting the values for the sparkline
            }
        ];
    } catch (error) {
        console.error('Error loading data:', error);
        return [
            {
                title: 'Error',
                value: 'Error loading data',
                interval: '',
                trend: 'neutral' as 'neutral',
                percentageChange: 0,
                data: [],
            }
        ];
    }
}

export default function MainGrid() {
    const [data, setData] = useState<StatCardProps[]>([]);

    useEffect(() => {
        initializeData().then(setData);
    }, []);

    return (
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '100%' }, mx: 'auto' }}>
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Overview
            </Typography>
            <Grid
                container
                spacing={2}
                columns={15}
                sx={{ mb: (theme) => theme.spacing(2) }}
            >
                {data.map((card, index) => (
                    <Grid key={index} item xs={12} sm={6} lg={3}>
                        <StatCard {...card} />
                    </Grid>
                ))}
                <Grid item xs={12} sm={6} lg={3}>
                    <ChartProjectSubmissions />
                </Grid>
            </Grid>
            <Grid item xs={11} lg={13}>
                <CustomizedDataGrid />
            </Grid>
        </Box>
    );
}
