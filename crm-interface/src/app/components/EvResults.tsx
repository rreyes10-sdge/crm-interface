import React from 'react';
import { Paper, Typography, Box, Grid } from '@mui/material';
import YearlyCostChart from './YearlyCostChart';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { BarChart } from '@mui/x-charts/BarChart';
import Divider from '@mui/material/Divider';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { PieChart } from '@mui/x-charts/PieChart';




interface EvResultsProps {
	results: any;
	isLoading: boolean;
}

const EvResultsTable: React.FC<{ results: any }> = ({ results }) => {
	const rows = [
		{
			name: 'Monthly Average Cost',
			scenarioA: `$${results.averages_and_savings.monthly_average_cost.average_electric_monthly_tc_1.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			scenarioB: `$${results.averages_and_savings.monthly_average_cost.average_electric_monthly_tc_2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			scenarioC: `$${results.averages_and_savings.monthly_average_cost.average_electric_monthly_tc_3.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			scenarioD: `$${results.averages_and_savings.monthly_average_cost.average_electric_monthly_tc_4.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			fossilFuel: `$${results.averages_and_savings.monthly_average_cost.average_fossil_fuel_monthly_tc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
		},
		{
			name: 'Yearly Average Cost',
			scenarioA: `$${results.averages_and_savings.yearly_average_cost.yearly_electric_tc_1.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			scenarioB: `$${results.averages_and_savings.yearly_average_cost.yearly_electric_tc_2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			scenarioC: `$${results.averages_and_savings.yearly_average_cost.yearly_electric_tc_3.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			scenarioD: `$${results.averages_and_savings.yearly_average_cost.yearly_electric_tc_4.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			fossilFuel: `$${results.averages_and_savings.yearly_average_cost.yearly_fossil_fuel_tc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
		},
	];

	// Find the adjusted fossil fuel price for January 2025
	const january2025Result = results.monthly_results.find((result: { month: number; year: number; }) => result.month === 1 && result.year === 2025);
	const adjustedFossilFuelPrice = january2025Result ? january2025Result.adjusted_fossil_fuel_price.toFixed(2) : 'N/A';

	return (
		<TableContainer component={Paper}>
			<Table sx={{ minWidth: 650 }} aria-label="basic table">
				<TableHead>
					<TableRow sx={{
						"& th": {
							fontSize: "1rem",
							color: "primary",
							backgroundColor: "primary"
						}
					}}>
						<TableCell></TableCell>
						<TableCell align="right">Scenario A</TableCell>
						<TableCell align="right">Scenario B</TableCell>
						<TableCell align="right">Scenario C</TableCell>
						<TableCell align="right">Scenario D</TableCell>
						<TableCell align="center">Fossil Fuel <br></br>(${adjustedFossilFuelPrice} per gallon)</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{rows.map((row) => (
						<TableRow key={row.name} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
							<TableCell component="th" scope="row">
								{row.name}
							</TableCell>
							<TableCell align="right">{row.scenarioA}</TableCell>
							<TableCell align="right">{row.scenarioB}</TableCell>
							<TableCell align="right">{row.scenarioC}</TableCell>
							<TableCell align="right">{row.scenarioD}</TableCell>
							<TableCell align="right">{row.fossilFuel}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</TableContainer>
	);
};

export const valueFormatter = (item: { value: number }) => `$${item.value.toFixed(2)}`;


const EvResultsPie: React.FC<{ results: any }> = ({ results }) => {
	// Find the adjusted fossil fuel price for January 2025
	const january2025Result = results.monthly_results.find((result: { month: number; year: number; }) => result.month === 1 && result.year === 2025);
	const adjustedFossilFuelPrice = january2025Result ? january2025Result.adjusted_fossil_fuel_price.toFixed(2) : 'N/A';
	const monthlyCosts = [
		{
			label: 'Basic Service Fee',
			value: january2025Result ? january2025Result.scenario_1.basic_service_fee.toFixed(2) : 'N/A',
			color: '#F8971D'

		},
		{
			label: 'Subscription Fee',
			value: january2025Result ? january2025Result.scenario_1.subscription_fee.toFixed(2) : 'N/A',
			color: '#1ABFD5'
		},
		{
			label: 'Energy Costs',
			value: january2025Result ? january2025Result.scenario_1.commodity_distribution_cost.toFixed(2) : 'N/A',
			color: '#545861'
		}
	]

	return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
			<PieChart
				series={[
					{
						data: monthlyCosts,
						highlightScope: { fade: 'global', highlight: 'item' },
						faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
						valueFormatter,
					},
				]}
				height={400}
				width={400}
			/>
		</div>
	);
};

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

	// Prepare data for BarChart using load_profiles
	const loadProfiles = results.general_info.load_profiles;
	const barChartData = {
		xAxis: [{ scaleType: 'band' as const, data: ['12am', '1am', '2am', '3am', '4am', '5am', '6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'] }],
		yAxis: [{
			label: 'Energy (kWh)',
		}],
		series: [
			{
				label: 'Scenario A',
				data: loadProfiles.scenario_1,
				color: '#001689'
			},
			{
				label: 'Scenario B',
				data: loadProfiles.scenario_2,
				color: '#58B947'
			},
			{
				label: 'Scenario C',
				data: loadProfiles.scenario_3,
				color: '#009BDA'
			},
			{
				label: 'Scenario D',
				data: loadProfiles.scenario_4,
				color: '#FED600'
			}
		],
		width: 800,
		height: 350,
		sx: {
			[`& .${axisClasses.directionY} .${axisClasses.label}`]: {
				transform: 'translateX(-10px)',
			},
		},
	};

	return (
		<Paper sx={{ p: 3, height: '100%' }}>
			{/* <Typography variant="h5" gutterBottom>Results</Typography> */}

			<Box mb={3}>
				<Typography variant="h6">Annual Savings</Typography>
				<Typography variant="h4" color="primary">
					${results?.averages_and_savings?.yearly_savings?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
				</Typography>
			</Box>

			<Box mb={3}>
				{/* <Typography variant="h5" align='center'>Summary of Findings:</Typography> */}
				<Typography variant="h6" align='center'>
					By electrifying your vehicles during off-peak hours in a managed scenario, you can save on average <strong>${results?.averages_and_savings?.monthly_savings ? Number(results.averages_and_savings.monthly_savings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'} per month</strong>, and <strong>${results?.averages_and_savings?.yearly_savings ? Number(results.averages_and_savings.yearly_savings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'} per year</strong> compared to fossil fuel costs.
				</Typography>
			</Box>

			<Box mt={3} mb={3}>
				{/* <Typography variant="h6">Yearly Costs</Typography> */}
				<YearlyCostChart yearlyFossilFuelCosts={yearlyFossilFuelCosts} yearlyEvCosts={yearlyEvCosts} />
			</Box>

			<EvResultsTable results={results}></EvResultsTable>
			<br></br>
			<Divider />
			<Box mt={3} mb={3}>
				<Typography variant="h6" align='center'>The site's energy use will be the aggregate of all vehicles and their charging patterns, as shown for each scenario:</Typography>
			</Box>

			<BarChart
				{...barChartData}
			/>

			<Divider />

			<Box mt={3} mb={3}>
				<Typography variant="h6" align='center'>Monthly Electricity Cost Breakdown:</Typography>
				<Typography component="div">

				</Typography>
			</Box>

			<EvResultsPie results={results}></EvResultsPie>

			<Divider />

			<Box mt={3} mb={3}>
				<Typography variant="h6" align='center'>Considerations as You Review Your Load Plan:</Typography>
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

			<Grid container spacing={3} mt={3}>
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
		</Paper>
	);
};

export default EvResults;