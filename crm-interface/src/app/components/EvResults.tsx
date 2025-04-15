
import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import { CalculationResults } from '../types';
import YearlyCostChart from './YearlyCostChart';

interface EvResultsProps {
	results: any;
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


	// Prepare data for YearlyCostChart
	const yearlyFossilFuelCosts = Object.fromEntries(
		Object.entries(results.yearly_costs).map(([year, costs]: [string, any]) => [year, costs.total_fossil_fuel_tc])
	);
	const yearlyEvCosts = Object.fromEntries(
		Object.entries(results.yearly_costs).map(([year, costs]: [string, any]) => [year, costs.total_electric_tc])
	);


	return (
		<Paper sx={{ p: 3, height: '100%' }}>
			{/* <Typography variant="h5" gutterBottom>Results</Typography> */}

			<Box mb={3}>
				<Typography variant="h6">Average Annual Savings</Typography>
				<Typography variant="h4" color="primary">
					${results?.averages_and_savings?.yearly_savings?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
				</Typography>
			</Box>

			<Box mb={3}>
				<Typography variant="h6">Summary of Findings:</Typography>
				<Typography>
					By electrifying your vehicles during off-peak hours in a managed scenario, you can save on average <strong>${results?.averages_and_savings?.monthly_savings ? Number(results.averages_and_savings.monthly_savings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'} per month</strong>, and <strong>${results?.averages_and_savings?.yearly_savings ? Number(results.averages_and_savings.yearly_savings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'} per year</strong> compared to fossil fuel costs.
				</Typography>
			</Box>


			<Box mt={3}>
				<Typography variant="h6">Yearly Costs</Typography>
				<YearlyCostChart yearlyFossilFuelCosts={yearlyFossilFuelCosts} yearlyEvCosts={yearlyEvCosts} />
			</Box>


			<Box mb={3}>
				<Typography variant="h6">Considerations as You Review Your Load Plan:</Typography>
				<Typography component="div">
					<ul>
						<li><strong>To help manage costs,</strong> scale infrastructure deployments for all planned electric vehicles that will be in operation. With this approach, consider installing as much of the in-ground infrastructure necessary for the full deployment during the first phase to lower construction costs.</li>
						<li><strong>For ease of operation,</strong> consider deploying vehicles and chargers in a 1-1 relationship. Once the operators are more familiar with the technology and its limitations, this can be scaled to a shared asset scenario in keeping with operational needs.</li>
						<li><strong>For customers who lease their sites:</strong> Before development of any specific site plans or engineering drawings needed for deployment, be sure to contact the property lessor to discuss access and permission for construction.</li>
						<li><strong>Easements may be necessary for</strong> some utility-side upgrades, and these will also need to be discussed with the property owner/lessor.</li>
						<li><strong>Understanding energy load can prevent</strong> overloading infrastructure, which could require costly upgrades.</li>
						<li><strong>Level 2 chargers versus DCFC (fast chargers) impact energy load differently.</strong> For example, fast chargers demand more power but reduce charging time. Some key considerations are:
							<ul>
								<li>Operational restrictions (operating hours, staff availability, etc.) will dictate the optimal charging infrastructure deployment.</li>
								<li>The cost of deployment is driven by the cost of equipment. Shared use of assets (1:2 relationship of chargers to vehicles) can help minimize cost of deployment but come with more challenging operating profiles.</li>
							</ul>
						</li>
						<li><strong>Peak vs. Off-Peak Costs:</strong> Charging during off-peak times can reduce energy costs. There will be a rate analysis included with your load plan, but for more information, speak with your advisor about Rate Education service. A best practice is to charge at the lowest power rating possible while still getting a full charge during the available dwell time (this reduces cost of charging and improves long-term battery health).</li>
					</ul>
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
					<Typography variant="subtitle1">CO2 Reduction</Typography>
					<Typography variant="h6">{results.co2Reduction} metric tons/year</Typography>
				</Grid>
				<Grid item xs={12}>
					<Typography variant="subtitle1">Fossil Fuel Daily Avg Cost</Typography>
					<Typography variant="h6">
						${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(results.fossil_fuel_daily_avg_cost)}
					</Typography>
				</Grid>
				<Grid item xs={12}>
					<Typography variant="subtitle1">Fossil Fuel Weekly Avg Cost</Typography>
					<Typography variant="h6">
						${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(results.fossil_fuel_weekly_avg_cost)}
					</Typography>
				</Grid>
				<Grid item xs={12}>
					<Typography variant="subtitle1">Average MPG</Typography>
					<Typography variant="h6">{results.general_info.fossil_fuel_average_mpg.toFixed(2)}</Typography>
				</Grid>
				<Grid item xs={12}>
					<Typography variant="subtitle1">Daily Average Miles</Typography>
					<Typography variant="h6">{results.general_info.total_daily_miles_driven.toFixed(2)}</Typography>
				</Grid>
				<Grid item xs={12}>
					<Typography variant="subtitle1">Daily Fossil Fuel Cost</Typography>
					<Typography variant="h6">
						${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(results.monthly_fossil_fuel_tc / 30)}
					</Typography>
				</Grid>
				<Grid item xs={12}>
					<Typography variant="subtitle1">Total Daily Vehicle Energy Needed</Typography>
					<Typography variant="h6">{results.general_info.TDVEN.toFixed(2)} kWh</Typography>
				</Grid>
				<Grid item xs={12}>
					<Typography variant="subtitle1">Does current set of charger(s) cover your vehicle group(s) daily energy needs? (unmanaged scenario)</Typography>
					<Typography variant="h6">{results.general_info.error_checks.charger_cover_scenarios_1_and_3_flag === "true" ? 'Yes' : 'No'}</Typography>
				</Grid>
				<Grid item xs={12}>
					<Typography variant="subtitle1">Will set of charger(s) cover your vehicle group(s) daily energy using only Off-Peak energy? (optimal scenario)</Typography>
					<Typography variant="h6">{results.general_info.error_checks.charger_cover_scenarios_2_and_4_flag === "true" ? 'Yes' : 'No'}</Typography>
				</Grid>
			</Grid>

			{/* <Box mt={3}>
				<Typography variant="h6">Yearly Costs</Typography>
				<Grid container spacing={3}>
					{Object.entries(results.yearly_costs).map(([year, costs]) => (
						<Grid item xs={12} md={6} key={year}>
							<Typography variant="subtitle1">{year}</Typography>
							<Typography variant="body1">Electric TC: ${results.yearly_costs.total_electric_tc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
							<Typography variant="body1">Fossil Fuel TC: ${results.yearly_costs.total_fossil_fuel_tc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography>
						</Grid>
					))}
				</Grid>
			</Box> */}
		</Paper>
	);
};

export default EvResults;