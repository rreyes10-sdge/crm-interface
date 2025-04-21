import React, { useState } from 'react';
import { Paper, Typography, Box, Grid, Tabs, Tab, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
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
import { SelectChangeEvent } from '@mui/material';
import EnergySavingsLeafIcon from '@mui/icons-material/EnergySavingsLeaf';
import EnergySavingsLeafTwoToneIcon from '@mui/icons-material/EnergySavingsLeafTwoTone';

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

	// Find the adjusted fossil fuel price for current Year and Month
	const currentYearMonthResult = results.monthly_results.find((result: { month: number; year: number; }) => result.month === new Date().getMonth() && result.year === new Date().getFullYear());
	const adjustedFossilFuelPrice = currentYearMonthResult ? currentYearMonthResult.adjusted_fossil_fuel_price.toFixed(2) : 'N/A';

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

const formatCurrency = (value: any) => {
	if (typeof value === 'number') {
		return `$${value.toFixed(2)}`;
	}
	return value; // Return the value as is if it's not a number
};

const EvResultsPie: React.FC<{ results: any }> = ({ results }) => {
	// Find the adjusted fossil fuel price for January of current year
	const currentYearMonthResult = results.monthly_results.find((result: { month: number; year: number; }) => result.month === new Date().getMonth() && result.year === new Date().getFullYear());

	const monthlyCosts = [
		{
			label: 'Basic Service Fee',
			value: currentYearMonthResult ? currentYearMonthResult.scenario_1.basic_service_fee : 0,
			color: '#F8971D'
		},
		{
			label: 'Subscription Fee',
			value: currentYearMonthResult ? currentYearMonthResult.scenario_1.subscription_fee : 0,
			color: '#1ABFD5'
		},
		{
			label: 'Energy Costs',
			value: currentYearMonthResult ? currentYearMonthResult.scenario_1.commodity_distribution_cost : 0,
			color: '#545861'
		}
	];

	// Ensure that the data structure is correct
	const pieData = monthlyCosts.map(cost => ({
		...cost,
		formattedValue: formatCurrency(cost.value) // Add formatted value for display
	}));

	return (
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
			<PieChart
				series={[
					{
						data: pieData,
						highlightScope: { fade: 'global', highlight: 'item' },
						faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' }					},
				]}
				height={400}
				width={400}
			/>
		</div>
	);
};

const EvResultsLoadProfile: React.FC<{ results: any }> = ({ results }) => {
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
		<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
			<BarChart {...barChartData} />
		</div>
	);
};

const EvResultsMonthlyCosts: React.FC<{ results: any }> = ({ results }) => {
	const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear()); // Default year
	const [selectedScenario, setSelectedScenario] = useState<number>(2); // Default scenario (B)

	const handleYearChange = (event: SelectChangeEvent<number>) => {
		setSelectedYear(event.target.value as number);
	};

	const handleScenarioChange = (event: SelectChangeEvent<number>) => {
		setSelectedScenario(event.target.value as number);
	};

	const years = results?.monthly_results ? Array.from(new Set(results.monthly_results.map((result: { year: number }) => result.year))) : [];

	// Prepare data for the bar chart based on selected year and scenario
	const monthlyData = results && results.monthly_results
		? results.monthly_results.filter((result: { year: number }) => result.year === selectedYear)
		: []; // Default to an empty array if results or monthly_results is null

	const barChartData = {
		xAxis: [
			{
				scaleType: 'band' as const,
				data: monthlyData.map((result: { month: number }) => new Date(0, result.month - 1).toLocaleString('default', { month: 'long' })),
			},
		],
		yAxis: [{ label: 'Cost ($)' }],
		series: [
			{
				label: 'Basic Service Fee',
				data: monthlyData.map((result: any) => result[`scenario_${selectedScenario}`].basic_service_fee),
				color: '#F8971D',
				stack: 'costs',
			},
			{
				label: 'Subscription Fee',
				data: monthlyData.map((result: any) => result[`scenario_${selectedScenario}`].subscription_fee),
				color: '#1ABFD5',
				stack: 'costs',
			},
			{
				label: 'Commodity Distribution Costs',
				data: monthlyData.map((result: any) => result[`scenario_${selectedScenario}`].commodity_distribution_cost),
				color: '#545861',
				stack: 'costs',
			},
		],
		width: 800,
		height: 350,
	};

	return (
		<div>
			{/* Year and Scenario Selection */}
			<Box sx={{ mt: 2 }}>
				<FormControl variant="outlined" sx={{ mr: 2 }}>
					<InputLabel id="year-select-label">Year</InputLabel>
					<Select
						labelId="year-select-label"
						value={selectedYear}
						onChange={handleYearChange}
						label="Year"
					>
						{years.map((year: number) => (
							<MenuItem key={year} value={year}>{year}</MenuItem>
						))}
					</Select>
				</FormControl>

				<FormControl variant="outlined">
					<InputLabel id="scenario-select-label">Scenario</InputLabel>
					<Select
						labelId="scenario-select-label"
						value={selectedScenario}
						onChange={handleScenarioChange}
						label="Scenario"
					>
						<MenuItem value={1}>Scenario A</MenuItem>
						<MenuItem value={2}>Scenario B</MenuItem>
						<MenuItem value={3}>Scenario C</MenuItem>
						<MenuItem value={4}>Scenario D</MenuItem>
					</Select>
				</FormControl>
			</Box>

			{/* Render the Stacked Bar Chart */}
			<Box sx={{ mt: 3 }}>
				<Typography variant="h6" align='center'>Monthly Costs for {selectedYear} - Scenario {selectedScenario}</Typography>
				<BarChart {...barChartData} />
			</Box>
		</div>
	);
};

const EvResults: React.FC<EvResultsProps> = ({ results, isLoading }) => {
	const [value, setValue] = useState(0); // State for managing the selected tab

	const handleChange = (event: React.SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	if (isLoading) {
		return (
			<Paper sx={{ p: 3, height: '100%' }}>
				<Typography variant="h4" align='center' color="primary">Calculating...</Typography>
			</Paper>
		);
	}

	if (!results) {
		return (
			<Paper sx={{ p: 3, height: '100%' }}>
				<Typography variant="h4" align='center' color="primary">Enter your details to see potential savings</Typography>
			</Paper>
		);
	}

	return (
		<Paper sx={{ p: 3, height: '100%' }}>
			<Tabs value={value} onChange={handleChange} aria-label="results tabs">
				<Tab label="Overview" />
				<Tab label="Chargers" />
				<Tab label="Costs" />
				<Tab label="TBD" />
			</Tabs>
			<Box sx={{ p: 2 }}>
				{value === 0 && <OverviewSection results={results} />}
				{value === 1 && <ChargersSection results={results} />}
				{value === 2 && <CostsSection results={results} />}
				{value === 3 && <TBDSection results={results} />}
			</Box>
		</Paper>
	);
};
// Overview Section
const OverviewSection = ({ results }: { results: any }) => (
	<div>
		<Box mb={3} sx={{ display: 'flex', justifyContent: 'space-between' }}>
			<Box sx={{ display: 'flex', alignItems: 'center' }}>
				<Typography variant="h4" color="primary">
					<EnergySavingsLeafTwoToneIcon sx={{ fontSize: '4.5rem', marginRight: '4px' }} />
				</Typography>
			</Box>
			<Box>
				<Typography variant="h6">Average Annual Savings</Typography>
				<Typography variant="h4" color="primary">
					
					${results?.averages_and_savings?.yearly_savings?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
				</Typography>
			</Box>
			<Divider orientation="vertical" flexItem />
			<Box>
				<Typography variant="h6">Annual EV Fuel Costs</Typography>
				<Typography variant="h4" color="primary">
					${results?.averages_and_savings?.yearly_average_cost?.yearly_electric_tc_2?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
				</Typography>
			</Box>
			<Divider orientation="vertical" flexItem />
			<Box>
				<Typography variant="h6">Annual Fossil Fuel Costs</Typography>
				<Typography variant="h4" color="primary">
					${results?.averages_and_savings?.yearly_average_cost?.yearly_fossil_fuel_tc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || 'N/A'}
				</Typography>
			</Box>
		</Box>

		<Divider />

		<Box mt={3} mb={3}>
			{/* <Typography variant="h5" align='center'>Summary of Findings:</Typography> */}
			<Typography variant="h6" align='center'>
				By electrifying your vehicles during off-peak hours in a managed scenario, you can save on average <strong>${results?.averages_and_savings?.monthly_savings ? Number(results.averages_and_savings.monthly_savings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'} per month</strong>, and <strong>${results?.averages_and_savings?.yearly_savings ? Number(results.averages_and_savings.yearly_savings).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A'} per year</strong> compared to fossil fuel costs.
			</Typography>
		</Box>

		<Box mt={3} mb={3}>
			{/* <Typography variant="h6">Yearly Costs</Typography> */}
			<YearlyCostChart
				yearlyFossilFuelCosts={Object.fromEntries(
					Object.entries(results.yearly_costs).map(([year, costs]: [string, any]) => [year, costs.total_fossil_fuel_tc])
				)}
				yearlyEvCosts={Object.fromEntries(
					Object.entries(results.yearly_costs).map(([year, costs]: [string, any]) => [year, costs.total_electric_tc])
				)}
			/>
		</Box>
	</div>
);
// Chargers Section
const ChargersSection = ({ results }: { results: any }) => (
	<div>

		<Box mt={3} mb={3}>
			<Typography variant="h6" align='center'>The site's energy use will be the aggregate of all vehicles and their charging patterns, as shown for each scenario:</Typography>
		</Box>

		<EvResultsLoadProfile results={results} />
		<Divider />
	</div>
);
// Costs Section
const CostsSection = ({ results }: { results: any }) => {
	return (
		<div>
			<EvResultsTable results={results} />
			<br />
			<Divider />
			<Box mt={3} mb={3}>
				<Typography variant="h6" align='left'>Charging Scenarios:</Typography>
				<Typography component="div">
					<strong>Scenario 1 - Managed Optimal Without On-Peak Hours</strong>
					<p>In this scenario, charging is carefully managed to occur only during off-peak and super off-peak hours, when electricity rates are lower. By avoiding on-peak hours, fleet managers can significantly reduce their electricity costs. This approach requires planning and scheduling to ensure that all vehicles are charged within the cheaper hours, but it can lead to substantial savings.</p>
					<br></br>
					<strong>Scenario 2 - Managed Optimal With On-Peak Hours</strong>
					<p>This scenario also involves managing the charging process, but it allows for charging during all available hours, including on-peak hours. This might be necessary if the fleet's charging needs are too high to be met during off-peak hours alone. While this approach offers more flexibility and ensures that all vehicles are charged, it can be more expensive due to the higher rates during on-peak hours.</p>
					<br></br>
					<strong>Scenario 3 - Unmanaged Without On-Peak Hours</strong>
					<p>In this scenario, chargers operate at full capacity during off-peak and super off-peak hours until the vehicles are fully charged. There is no active management of the charging process, which means that chargers will use as much power as needed in a shorter time frame. This can lead to higher subscription charges because of the intense power usage, but it simplifies the charging process as no scheduling is required.</p>
					<br></br>
					<strong>Scenario 4 - Unmanaged With On-Peak Hours</strong>
					<p>Similar to the unmanaged without on-peak hours scenario, but charging can occur during both off-peak and on-peak hours. This approach offers the most flexibility, as vehicles can be charged at any time. However, it can result in even higher costs due to the higher rates during on-peak hours. This scenario is useful when there are no restrictions on charging times, but it can be the most expensive option.</p>

				</Typography>
			</Box>
			<Divider />
			{/* <EvResultsPie results={results} /> */}
			<EvResultsMonthlyCosts results={results} />
		</div>
	);
};
// TBD Section
const TBDSection = ({ results }: { results: any }) => (
	<div>
		<Typography variant="h6">TBD Content</Typography>
		{/* Add TBD-specific content here */}
	</div>
);

export default EvResults;