import * as React from 'react';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CustomizedDataGrid from './CustomizedDataGrid';
import StatCard, { StatCardProps } from './StatCard';
import ChartProjectSubmissions from './ChartProjectSubmissions';


const data: StatCardProps[] = [
    {
        title: 'Projects',
        value: '15',
        interval: 'Last 30 days',
        trend: 'neutral',
        data: [
            0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0,
        ],
    },
    {
        title: 'Conversions',
        value: '325',
        interval: 'Last 30 days',
        trend: 'down',
        data: [
            1640, 1250, 970, 1130, 1050, 900, 720, 1080, 900, 450, 920, 820, 840, 600, 820,
            780, 800, 760, 380, 740, 660, 620, 840, 500, 520, 480, 400, 360, 300, 220,
        ],
    },
    {
        title: 'Event count',
        value: '200k',
        interval: 'Last 30 days',
        trend: 'neutral',
        data: [
            500, 400, 510, 530, 520, 600, 530, 520, 510, 730, 520, 510, 530, 620, 510, 530,
            520, 410, 530, 520, 610, 530, 520, 610, 530, 420, 510, 430, 520, 510,
        ],
    },
];

export default function MainGrid() {
    return (
        <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '85%' }, mx: 'auto' }}>
            {/* cards */}
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Overview
            </Typography>
            <Grid
                container
                spacing={2}
                columns={12}
                sx={{ mb: (theme) => theme.spacing(2) }}
            >
                {data.map((card, index) => (
                    <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
                        <StatCard {...card} />
                    </Grid>
                ))}
                
            </Grid>
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                Details
            </Typography>
            <Grid container spacing={2} columns={12}>
                <Grid size={{ xs: 11, lg: 9 }}>
                    <CustomizedDataGrid />
                </Grid>
                <Grid size={{ xs: 11, lg: 3 }}>
                    <Stack gap={2} direction={{ xs: 'column', sm: 'row', lg: 'column' }}>
                        <ChartProjectSubmissions />
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
}