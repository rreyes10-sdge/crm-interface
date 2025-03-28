import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import { CalculationResults } from '../types';
import YearlyCostChart from './YearlyCostChart';

interface EvResultsProps {
    results: CalculationResults | null;
    isLoading: boolean;
}

const EvResults: React.FC<EvResultsProps> = ({ results, isLoading }) => {
    if (isLoading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Typography>Calculating...</Typography>
            </Paper>
        );
    }

    if (!results) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Typography>Enter your fleet details to see potential savings</Typography>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" gutterBottom>Results</Typography>
            
            <Box mb={3}>
                <Typography variant="h6">Annual Savings</Typography>
                <Typography variant="h4" color="primary">
                    ${results?.average_yearly_savings?.toLocaleString() || 'N/A'}
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Total Cost</Typography>
                    <Typography variant="h6">${results.totalCost}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1">Payback Period</Typography>
                    <Typography variant="h6">{results.paybackPeriod} years</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">Yearly Fossil Fuel Costs</Typography>
                    <YearlyCostChart yearlyFossilFuelCosts={results.yearly_fossil_fuel_costs} yearlyEvCosts={results.yearly_ev_costs} />
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">CO2 Reduction</Typography>
                    <Typography variant="h6">{results.co2Reduction} metric tons/year</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">EV Monthly Cost</Typography>
                    <Typography variant="h6">${results.total_monthly_ev_cost.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">Fossil Fuel Daily Avg Cost</Typography>
                    <Typography variant="h6">${results.fossil_fuel_daily_avg_cost.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">Fossil Fuel Weekly Avg Cost</Typography>
                    <Typography variant="h6">${results.fossil_fuel_weekly_avg_cost.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">Average MPG</Typography>
                    <Typography variant="h6">{results.average_mpg.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">Daily Average Miles</Typography>
                    <Typography variant="h6">{results.daily_average_miles.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">Daily Fossil Fuel Cost</Typography>
                    <Typography variant="h6">${results.daily_fossil_fuel_cost.toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">Total Daily Charger Energy Output</Typography>
                    <Typography variant="h6">{results.total_daily_charger_energy_output} kWh</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">Total Daily Vehicle Energy Needed</Typography>
                    <Typography variant="h6">{results.total_daily_vehicle_energy_needed} kWh</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">Optimal Scenario</Typography>
                    <Typography variant="h6">{results.optimal_scenario ? 'Yes' : 'No'}</Typography>
                </Grid>
                <Grid item xs={12}>
                    <Typography variant="subtitle1">Unmanaged Scenario</Typography>
                    <Typography variant="h6">{results.unmanaged_scenario ? 'Yes' : 'No'}</Typography>
                </Grid>
            </Grid>
        </Paper>
    );
};

export default EvResults;