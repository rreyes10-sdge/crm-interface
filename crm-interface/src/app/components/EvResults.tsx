import React, { useState, useEffect, useCallback } from 'react';
import { Paper, Typography, Box, Grid, Tabs, Tab, MenuItem, Select, FormControl, InputLabel, Dialog, DialogActions, Button, DialogContent, DialogTitle, Link, Checkbox, FormControlLabel, Slider, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import YearlyCostChart from './YearlyCostChart';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import { BarChart, BarChartProps } from '@mui/x-charts/BarChart';
import Divider from '@mui/material/Divider';
import { axisClasses } from '@mui/x-charts/ChartsAxis';
import { PieChart } from '@mui/x-charts/PieChart';
import { SelectChangeEvent } from '@mui/material';
import EnergySavingsLeafTwoToneIcon from '@mui/icons-material/EnergySavingsLeafTwoTone';
import { Delete as DeleteIcon, Add as AddIcon, ExpandMore as ExpandMoreIcon, HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import { VehicleGroup, ChargerGroup, ProjectSite } from '../types';
import CumulativeCostComparisonChart from './CumulativeCostComparisonChart';

interface EvResultsProps {
	results: any;
	isLoading: boolean;
}

function useCallBack(arg0: (data: any[]) => any[], arg1: { manufacturer: string; numberOfPlugs: string; smartCharging: boolean; vehicleGridIntegration: boolean; msrpRange: number[]; }[]) {
	throw new Error('Function not implemented.');
}

const EvResultsTable: React.FC<{ results: any }> = ({ results }) => {
	const rows = [
		{
			name: 'Monthly Average Fuel Cost',
			scenarioA: `$${results.averages_and_savings.monthly_average_cost.average_electric_monthly_tc_1.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			scenarioB: `$${results.averages_and_savings.monthly_average_cost.average_electric_monthly_tc_2.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			scenarioC: `$${results.averages_and_savings.monthly_average_cost.average_electric_monthly_tc_3.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			scenarioD: `$${results.averages_and_savings.monthly_average_cost.average_electric_monthly_tc_4.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
			fossilFuel: `$${results.averages_and_savings.monthly_average_cost.average_fossil_fuel_monthly_tc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
		},
		{
			name: 'Yearly Average Fuel Cost',
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
						<TableCell align="right">Scenario 1</TableCell>
						<TableCell align="right">Scenario 2</TableCell>
						<TableCell align="right">Scenario 3</TableCell>
						<TableCell align="right">Scenario 4</TableCell>
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
		return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}
	return value; // Return the value as is if it's not a number
};

const EvResultsBarChart: React.FC<{ results: any }> = ({ results }) => {
	// Find the adjusted fossil fuel price for the current year and month
	const currentYearMonthResult = results.monthly_results.find((result: { month: number; year: number; }) => result.month === new Date().getMonth() && result.year === new Date().getFullYear());

	// Prepare data for all four scenarios
	const monthlyCosts = [
		{
			label: 'Basic Service Fee',
			values: [
				currentYearMonthResult ? currentYearMonthResult.scenario_1.basic_service_fee : 0,
				currentYearMonthResult ? currentYearMonthResult.scenario_2.basic_service_fee : 0,
				currentYearMonthResult ? currentYearMonthResult.scenario_3.basic_service_fee : 0,
				currentYearMonthResult ? currentYearMonthResult.scenario_4.basic_service_fee : 0,
			],
			color: '#F8971D',
		},
		{
			label: 'Subscription Fee',
			values: [
				currentYearMonthResult ? currentYearMonthResult.scenario_1.subscription_fee : 0,
				currentYearMonthResult ? currentYearMonthResult.scenario_2.subscription_fee : 0,
				currentYearMonthResult ? currentYearMonthResult.scenario_3.subscription_fee : 0,
				currentYearMonthResult ? currentYearMonthResult.scenario_4.subscription_fee : 0,
			],
			color: '#1ABFD5',
		},
		{
			label: 'Energy Costs',
			values: [
				currentYearMonthResult ? currentYearMonthResult.scenario_1.commodity_distribution_cost : 0,
				currentYearMonthResult ? currentYearMonthResult.scenario_2.commodity_distribution_cost : 0,
				currentYearMonthResult ? currentYearMonthResult.scenario_3.commodity_distribution_cost : 0,
				currentYearMonthResult ? currentYearMonthResult.scenario_4.commodity_distribution_cost : 0,
			],
			color: '#545861',
		},
	];

	// Prepare data for the bar chart
	const barChartData = {
		xAxis: [{ scaleType: 'band' as const, data: ['Scenario 1', 'Scenario 2', 'Scenario 3', 'Scenario 4'] }],
		series: monthlyCosts.map(cost => ({
			label: cost.label,
			data: cost.values,
			color: cost.color,
		})),
		height: 350,
		width: 600,
	};

	return (
		<div>
			<Typography variant="h6" align='center' sx={{ mb: 1, mt: 3 }}>
				Scenario Costs Breakdown for {new Date(0, currentYearMonthResult.month).toLocaleString('default', { month: 'long' })} {currentYearMonthResult.year}
			</Typography>
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<BarChart {...barChartData} />
			</div>
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
				label: 'Scenario 1',
				data: loadProfiles.scenario_1,
				color: '#001689'
			},
			{
				label: 'Scenario 2',
				data: loadProfiles.scenario_2,
				color: '#58B947'
			},
			{
				label: 'Scenario 3',
				data: loadProfiles.scenario_3,
				color: '#009BDA'
			},
			{
				label: 'Scenario 4',
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
		<div>
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '30vh' }}>
				<BarChart {...barChartData} />
			</div>
			{/* <Divider /> */}
			<Accordion
				sx={{
					'&.MuiAccordion-root': {
						width: '100%',
						margin: '0 auto',
						'&:before': {
							display: 'none',
						},
					},
				}}
			>
				<AccordionSummary
					expandIcon={<ExpandMoreIcon />}
					sx={{
						borderBottom: '2px solid #001689',
						backgroundColor: '#FFE1C0',
						color: '#000000',
						textAlign: 'center',
						justifyContent: 'center',
						// '& .MuiAccordionSummary-content': {
						// 	margin: '12px 0',
						// },
					}}
				>
					<Typography variant="h6">View scenario explanations</Typography>
				</AccordionSummary>
				<AccordionDetails>
					<Typography variant="body1">
						<strong>Scenario 1 - Managed Optimal With On-Peak Hours</strong>
					</Typography>
					<div>
						This scenario also involves managing the charging process, but it allows for charging during all available hours, including on-peak hours. This might be necessary if the fleet's charging needs are too high to be met during off-peak hours alone. While this approach offers more flexibility and ensures that all vehicles are charged, it can be more expensive due to the higher rates during on-peak hours.
					</div>
					<br />
					<Typography variant="body1">
						<strong>Scenario 2 - Managed Optimal Without On-Peak Hours</strong><span style={{ color: '#1976d2' }}>*</span>
					</Typography>
					<div>
						In this scenario, charging is carefully managed to occur only during off-peak and super off-peak hours, when electricity rates are lower. By avoiding on-peak hours, fleet managers can significantly reduce electricity costs. This approach requires planning and scheduling to ensure all vehicles are charged within the cheaper hours, leading to substantial savings.
					</div>
					<br />
					<Typography variant="body1">
						<strong>Scenario 3 - Unmanaged With On-Peak Hours</strong>
					</Typography>
					<div>
						In this scenario, chargers operate at full capacity during off-peak and super off-peak hours until the vehicles are fully charged. There is no active management of the charging process, meaning chargers will use as much power as needed in a shorter time frame. This can lead to higher subscription charges due to intense power usage, but it simplifies the charging process as no scheduling is required.
					</div>
					<br />
					<Typography variant="body1">
						<strong>Scenario 4 - Unmanaged Without On-Peak Hours</strong>
					</Typography>
					<div>
						This scenario allows charging to occur during both off-peak and on-peak hours. It offers the most flexibility, as vehicles can be charged at any time. However, it can result in higher costs due to the higher rates during on-peak hours. This scenario is useful when there are no restrictions on charging times, but it can be the most expensive option.
					</div>
				</AccordionDetails>
			</Accordion>
			<div style={{ marginTop: '20px' }}>
				<Typography variant="h6">Insights and Recommendations</Typography>
				<Typography variant="body1" sx={{ mb: 2 }}>
					The load profiles represent the energy consumption patterns over a 24-hour period. Each scenario reflects different charging behaviors, allowing you to compare how various factors influence energy demand.
				</Typography>
				<Typography variant="body1" sx={{ mb: 2 }}>
					The peak demand times are indicated by the highest points on the chart. These times represent when the most energy is consumed, which can help in planning for infrastructure needs and potential upgrades.
				</Typography>
				<Typography variant="body1" sx={{ mb: 2 }}>
					Analyzing these scenarios can help you identify the most efficient charging strategy for your fleet.
				</Typography>
				<Typography variant="body1" sx={{ mb: 2 }}>
					Understanding your load profile can also help in estimating energy costs. Higher energy consumption during peak hours may lead to increased costs, so consider shifting most if not all your charging to off-peak hours to save on energy costs.
				</Typography>
				<Typography variant="body1" sx={{ mb: 2 }}>
					View the <strong>Costs</strong> tab to gain further insight to the cost differences between the four charging scenarios displayed.
				</Typography>
			</div>
		</div>
	);
};

const EvTotalCostOwnershipChart: React.FC<{ results: any; projectSite: ProjectSite[] }> = ({ results, projectSite }) => {
	const config: Partial<BarChartProps> = {
		height: 600,
	};

	// Define color mapping for each cost type
	const colorMapping = {
		vehAcq: '#007BFF', // Vehicle Acquisition
		vehRep: '#00BFFF', // Vehicle Maintenance & Repair
		vehIns: '#1EFFFE', // Vehicle Insurance
		chaIns: '#32CD32', // Charger Installation
		chaRep: '#90EE90', // Charger Maintenance & Repair
		vehInc: '#F8971D', // Vehicle Incentives
		chaInc: '#00A1A4', // Charger Incentives
		energyCosts: '#FED600', // Energy Costs
	};

	// Constructing the data structure
	const dataset = projectSite.length > 0 ? [
		{
			type: 'Electric Costs Breakdown',
			vehAcq: projectSite[0].vehicle_acquisition_costs || 0,
			vehRep: projectSite[0].vehicle_maintenance_repair_costs || 0,
			vehIns: projectSite[0].vehicle_insurance_costs || 0,
			chaIns: projectSite[0].charger_installation_costs || 0,
			chaRep: projectSite[0].charger_maintenance_repair_network_costs || 0,
			vehInc: -(projectSite[0].vehicle_incentive_credits || 0),
			chaInc: -(projectSite[0].charger_incentive_credits || 0),
			energyCosts: results.yearly_costs[new Date().getFullYear()]?.total_electric_tc || 0
		},
		{
			type: 'Final EV TCO',
			vehAcq: (projectSite[0].vehicle_acquisition_costs || 0) - (projectSite[0].vehicle_incentive_credits || 0),
			vehRep: projectSite[0].vehicle_maintenance_repair_costs || 0,
			vehIns: projectSite[0].vehicle_insurance_costs || 0,
			chaIns: (projectSite[0].charger_installation_costs || 0) - (projectSite[0].charger_incentive_credits || 0),
			chaRep: projectSite[0].charger_maintenance_repair_network_costs || 0,
			energyCosts: results.yearly_costs[new Date().getFullYear()]?.total_electric_tc || 0
		},
		{
			type: 'Fossil Fuel TCO',
			vehAcq: projectSite[0].fossil_vehicle_acquisition_costs || 0,
			vehRep: projectSite[0].fossil_vehicle_maintenance_repair_costs || 0,
			vehIns: projectSite[0].fossil_vehicle_insurance_costs || 0,
			energyCosts: results.yearly_costs[new Date().getFullYear()]?.total_fossil_fuel_tc || 0
		}
	] : [];

	// Define the type for the series items
	type SeriesItem = {
		dataKey: keyof typeof translations; // Ensure dataKey matches the keys in translations
		stack: string;
		color: string;
	};

	// Prepare series for EV costs
	const Series: SeriesItem[] = [
		{ dataKey: 'vehAcq', stack: 'Costs', color: colorMapping.vehAcq },
		{ dataKey: 'vehRep', stack: 'Costs', color: colorMapping.vehRep },
		{ dataKey: 'vehIns', stack: 'Costs', color: colorMapping.vehIns },
		{ dataKey: 'chaIns', stack: 'Costs', color: colorMapping.chaIns },
		{ dataKey: 'chaRep', stack: 'Costs', color: colorMapping.chaRep },
		{ dataKey: 'vehInc', stack: 'Incentives', color: colorMapping.vehInc },
		{ dataKey: 'chaInc', stack: 'Incentives', color: colorMapping.chaInc },
		{ dataKey: 'energyCosts', stack: 'Costs', color: colorMapping.energyCosts },
	];

	return (
		<BarChart
			dataset={dataset} // Flatten the costs for the BarChart
			series={addLabels(Series)}
			margin={{ left: 65, right: 360, top: 20, bottom: 50 }}
			xAxis={[{ scaleType: 'band', dataKey: 'type' }]}
			slotProps={{
				legend: {
					direction: 'column',
					position: {
						vertical: 'middle',
						horizontal: 'right'
					}
				}
			}}
			{...config}
		/>
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

	const years: number[] = results?.monthly_results ? Array.from(new Set(results.monthly_results.map((result: { year: number }) => result.year))) : [];

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
		// yAxis: [{ 
		// 	label: 'Cost ($)' ,
		// }],
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
				label: 'Energy Costs',
				data: monthlyData.map((result: any) => result[`scenario_${selectedScenario}`].commodity_distribution_cost),
				color: '#545861',
				stack: 'costs',
			},
		],
		width: 850,
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
						<MenuItem value={1}>Scenario 1</MenuItem>
						<MenuItem value={2}>Scenario 2</MenuItem>
						<MenuItem value={3}>Scenario 3</MenuItem>
						<MenuItem value={4}>Scenario 4</MenuItem>
					</Select>
				</FormControl>
			</Box>

			{/* Render the Stacked Bar Chart */}
			<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
				<Box sx={{ mt: 3 }}>
					<Typography variant="h6" align='center'>Monthly Costs for {selectedYear} - Scenario {selectedScenario}</Typography>
					<BarChart {...barChartData} />
				</Box>
			</div>

		</div>
	);
};

interface EfficiencyData {
	mpg: number;
	mile_per_kwh: number;
}

interface FossilFuelMpgMapping {
	[key: string]: EfficiencyData; // This allows any string key
}

const fossil_fuel_mpg_mapping: FossilFuelMpgMapping = {
	"Heavy Duty Pickup & Van - Class 2B": { "mpg": 15.1, "mile_per_kwh": 1.09 },
	"Heavy Duty Pickup & Van - Class 3": { "mpg": 11.5, "mile_per_kwh": 1.09 },
	"Shuttle Bus - Class 3-5": { "mpg": 6.06, "mile_per_kwh": 2.06 },
	"Delivery Van - Class 3-5": { "mpg": 10.5, "mile_per_kwh": 1.19 },
	"Service Van - Class 3-5": { "mpg": 10.5, "mile_per_kwh": 1.19 },
	"Box Truck (Freight) - Class 3-5": { "mpg": 11.5, "mile_per_kwh": 1.09 },
	"Stake Truck - Class 3-5": { "mpg": 10.5, "mile_per_kwh": 1.19 },
	"Stake Truck - Class 6-7": { "mpg": 8.1, "mile_per_kwh": 1.55 },
	"Box Truck (Freight) - Class 6-7": { "mpg": 8.7, "mile_per_kwh": 1.44 },
	"Delivery Truck - Class 6-7": { "mpg": 8.1, "mile_per_kwh": 1.55 },
	"Service Truck - Class 6-7": { "mpg": 8.1, "mile_per_kwh": 1.55 },
	"School Bus - Class 7": { "mpg": 8.16, "mile_per_kwh": 1.53 },
	"Regional Haul Tractor - Class 7-8": { "mpg": 5.85, "mile_per_kwh": 2.14 },
	"Box Truck (Freight) - Class 8": { "mpg": 7.5, "mile_per_kwh": 1.67 },
	"Long Haul Tractor - Class 8": { "mpg": 5.83, "mile_per_kwh": 2.15 },
	"Transit Bus - Class 8": { "mpg": 6.19, "mile_per_kwh": 2.02 },
	"Refuse Hauler - Class 8": { "mpg": 5.72, "mile_per_kwh": 2.19 },
	"Dump Truck - Class 8": { "mpg": 6.9, "mile_per_kwh": 1.81 }
}

const EvResultsSummary: React.FC<{ results: any; vehicleGroups: VehicleGroup[], chargerGroups: ChargerGroup[] }> = ({ results, vehicleGroups, chargerGroups }) => {
	// Calculate totals
	const totalActiveVehicles = vehicleGroups.reduce((acc, group) => acc + (group.numVehicles > 0 ? group.numVehicles : 0), 0); // Assuming all active

	// Calculate average daily miles driven, ensuring to handle division by zero
	const avgMiles = totalActiveVehicles > 0
		? (vehicleGroups.reduce((acc, group) => acc + (group.avgDailyMileage * group.numVehicles), 0) / totalActiveVehicles).toFixed(2)
		: 'N/A'; // Display 'N/A' if there are no active vehicles

	// Calculate TDVEN (Total Daily Vehicle Energy Needed)
	let tdven = 0;

	return (
		<div>
			<Typography variant="h6" align='center'>Summary</Typography>
			<br />
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell></TableCell>
							{vehicleGroups.map((group, index) => (
								<TableCell key={index}>{group.vehicleClass}</TableCell>
							))}
							<TableCell><strong>Total</strong></TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell>Number of Vehicles</TableCell>
							{vehicleGroups.map((group, index) => (
								<TableCell key={index}>{group.numVehicles > 0 ? group.numVehicles : 0}</TableCell>
							))}
							<TableCell><strong>{totalActiveVehicles}</strong></TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Avg. Daily Miles Driven</TableCell>
							{vehicleGroups.map((group, index) => (
								<TableCell key={index}>{group.avgDailyMileage} Miles</TableCell>
							))}
							<TableCell><strong>{avgMiles} Miles</strong></TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Daily Energy Needed (kWh)</TableCell>
							{vehicleGroups.map((group, index) => {
								const efficiencyData = fossil_fuel_mpg_mapping[group.vehicleClass];
								const milesPerKwh = efficiencyData ? efficiencyData.mile_per_kwh : 0;
								const dailyEnergyNeeded = (group.numVehicles * group.avgDailyMileage) / milesPerKwh;
								tdven += dailyEnergyNeeded; // Accumulate total daily energy needed
								return (
									<TableCell key={index}>{dailyEnergyNeeded.toFixed(2)} kWh</TableCell>
								);
							})}
							<TableCell><strong>{tdven.toFixed(2)} kWh</strong></TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>
		</div>
	);
};

const translations = {
	vehAcq: 'Vehicle Acquisition',
	vehRep: 'Vehicle Maintenance and Repairs',
	vehIns: 'Vehicle Insurance',
	chaIns: 'Charger Install',
	chaRep: 'Charger Network, Maintenance, and Repairs',
	vehInc: 'Vehicle Incentives',
	chaInc: 'Charger Incentives',
	energyCosts: 'Fuel / Energy Costs'
} as const;

export function addLabels<T extends { dataKey: keyof typeof translations }>(series: T[]) {
	return series.map((item) => ({
		...item,
		label: translations[item.dataKey], // Use the translation for the label
		valueFormatter: (v: number | null) => (v ? `$${v.toLocaleString()}` : '-'), // Format the value
	}));
}

const EvResults: React.FC<{ results: any; vehicleGroups: VehicleGroup[]; chargerGroups: ChargerGroup[]; projectSite: ProjectSite[]; isLoading: boolean }> = ({ results, vehicleGroups, chargerGroups, projectSite, isLoading }) => {
	const [value, setValue] = useState(0); // State for managing the selected tab
	console.log('EvResults Props charger data:', { chargerGroups }); // Log incoming props
	const totalActiveVehicles = vehicleGroups.reduce((acc, group) => acc + (group.numVehicles > 0 ? group.numVehicles : 0), 0); // Assuming all active


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
		<div>
			<Paper sx={{ p: 3, height: '100%' }}>
				<Box mb={3} sx={{ display: 'flex', justifyContent: 'space-between' }}>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<Typography variant="h4" color="primary">
							<EnergySavingsLeafTwoToneIcon sx={{ fontSize: '4.5rem', marginRight: '4px' }} />
						</Typography>
					</Box>
					<Box>
						<Typography variant="h6">Average Annual Fuel Savings</Typography>
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

				<Tabs value={value} onChange={handleChange} aria-label="results tabs">
					<Tab label="Overview" />
					<Tab label="Chargers" />
					<Tab label="Costs" />
					<Tab label="Total Cost of Ownership" />
				</Tabs>
				<Divider />
				<Box sx={{ p: 2 }}>
					{value === 0 && <OverviewSection results={results} vehicleGroups={vehicleGroups} chargerGroups={chargerGroups} />}
					{value === 1 && <ChargersSection results={results} chargerGroups={chargerGroups} />}
					{value === 2 && <CostsSection results={results} />}
					{value === 3 && <TCOSection results={results} projectSite={projectSite} totalActiveVehicles={totalActiveVehicles} />}
				</Box>
			</Paper>
		</div>
	);
};
// Overview Section
const OverviewSection = ({ results, vehicleGroups, chargerGroups }: { results: any; vehicleGroups: VehicleGroup[]; chargerGroups: ChargerGroup[] }) => (
	<div>
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
				yearlyTitle='Total Fuel Costs Over Time'
			/>
		</Box>
		<Divider />
		<br></br>
		<EvResultsSummary results={results} vehicleGroups={vehicleGroups} chargerGroups={chargerGroups} />
	</div>
);
// Chargers Section

const ChargersSection = ({ results, chargerGroups }: { results: any; chargerGroups: ChargerGroup[] }) => {
	const [allChargerProducts, setAllChargerProducts] = useState<any[]>([]);
	const [filteredChargerProducts, setFilteredChargerProducts] = useState<any[]>([]);
	const [openHelpModal, setOpenHelpModal] = useState(false);

	const [filters, setFilters] = useState({
		manufacturer: '',
		numberOfPlugs: '',
		smartCharging: false,
		vehicleGridIntegration: false,
		msrpRange: [0, 200000],
	});



	const applyFilters = useCallback((data: any[]) => {
		return data.filter(product => {
			const matchesManufacturer = filters.manufacturer ? product.Manufacturer === filters.manufacturer : true;
			const matchesPlugs = filters.numberOfPlugs ? product.numberOfPlugs === Number(filters.numberOfPlugs) : true;
			const matchesSmartCharging =
				typeof filters.smartCharging === 'boolean' && filters.smartCharging
					? product.smartCharging === 1
					: true;
			const matchesVGI =
				typeof filters.vehicleGridIntegration === 'boolean' && filters.vehicleGridIntegration
					? product.vehicleGridIntegration === 1
					: true;
			const matchesMsrp = product.cost >= filters.msrpRange[0] && product.cost <= filters.msrpRange[1];



			return (
				matchesManufacturer &&
				matchesPlugs &&
				matchesSmartCharging &&
				matchesVGI &&
				matchesMsrp
			);
		});
	}, [filters]);



	useEffect(() => {
		if (allChargerProducts.length) {
			setFilteredChargerProducts(applyFilters(allChargerProducts));
		}
	}, [filters, allChargerProducts, applyFilters]);

	useEffect(() => {
		const fetchChargerProducts = async () => {
			try {
				const response = await fetch('http://127.0.0.1:5000/api/data/charger-products');
				const data = await response.json();

				// if (!Array.isArray(data)) {
				// 	console.error('Unexpected data format:', data);
				// 	return;
				// }

				const powerRatings = chargerGroups.map(group => group.chargerKW);
				const matchedProducts: any[] = [];

				powerRatings.forEach(powerRating => {
					let delta = 5;
					let matched = [];

					while (matched.length === 0 && delta <= 100) {
						matched = data.filter((product: any) =>
							Math.abs(product.powerFullKw - powerRating) <= delta
						);
						delta += 5; // increment search range
					}

					matchedProducts.push(...matched);
				});

				// Remove duplicates in case the same product matched multiple ratings
				const uniqueProducts = Array.from(
					new Map(matchedProducts.map(p => [p.id, p])).values()
				);

				setAllChargerProducts(uniqueProducts);
				setFilteredChargerProducts(applyFilters(uniqueProducts));
			} catch (error) {
				console.error('Error fetching charger products:', error);
			}
		};

		if (chargerGroups?.length > 0) {
			fetchChargerProducts();
		}
	}, [chargerGroups, applyFilters]);

	const handleOpenHelpModal = () => {
		setOpenHelpModal(true);
	};

	const handleCloseHelpModal = () => {
		setOpenHelpModal(false);
	};

	return (
		<div>
			<Box mt={3} mb={3}>
				<Typography variant="h6" align='center'>
					The site's energy use will be the aggregate of all vehicles and their charging patterns, as shown for each scenario:
					<span
						onClick={(event) => {
							event.stopPropagation();
							handleOpenHelpModal();
						}}
						style={{ cursor: 'pointer', marginLeft: '8px' }}
					>
						<HelpOutlineIcon />
					</span>
				</Typography>
			</Box>

			<EvResultsLoadProfile results={results} />
			<Divider />
			<Box mt={3} mb={3}>
				<Typography variant="h6" align='center'>The following chargers may match the power requirements of your selected setup</Typography>
			</Box>

			<Box display="flex" flexWrap="wrap" justifyContent="center" gap={8} mt={2} mb={2}>
				<Box>
					<Typography color="secondary" variant="subtitle1"><strong>Manufacturer</strong></Typography>
					<FormControl size="small" sx={{ minWidth: 160 }}>
						{/* <InputLabel>Manufacturer</InputLabel> */}
						<Select
							value={filters.manufacturer}
							onChange={e => setFilters(prev => ({ ...prev, manufacturer: e.target.value }))}
						// label="Manufacturer"
						>
							<MenuItem value="">All</MenuItem>
							{[...new Set(allChargerProducts.map(p => p.Manufacturer))].map(manufacturer => (
								<MenuItem key={manufacturer} value={manufacturer}>
									{manufacturer}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>


				<Box>
					<Typography color="secondary" variant="subtitle1"><strong>Number of Plugs</strong></Typography>
					<FormControl size="small" sx={{ minWidth: 160 }}>
						{/* <InputLabel>Number of Plugs</InputLabel> */}
						<Select
							value={filters.numberOfPlugs}
							onChange={e => setFilters(prev => ({ ...prev, numberOfPlugs: e.target.value }))}
						// label="Number of Plugs"
						>
							<MenuItem value="">All</MenuItem>
							{[...new Set(allChargerProducts.map(p => p.numberOfPlugs))].sort().map(num => (
								<MenuItem key={num} value={num}>
									{num}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Box>

				<Box sx={{ width: 250 }}>
					<Typography color="secondary" variant="subtitle1"><strong>MSRP Range</strong> (${filters.msrpRange[0]} - ${filters.msrpRange[1].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</Typography>
					<Slider
						value={filters.msrpRange}
						min={0}
						max={200000}
						step={1000}
						onChange={(_, newValue) =>
							setFilters(prev => ({ ...prev, msrpRange: newValue as [number, number] }))
						}
						valueLabelDisplay="auto"
					/>
				</Box>

				<Box display="flex" flexDirection="column" alignItems="flex-start">
					<FormControlLabel
						control={
							<Checkbox
								checked={filters.smartCharging}
								onChange={e => setFilters(prev => ({ ...prev, smartCharging: e.target.checked }))}
							/>
						}
						label="Smart Charging"
					/>



					<FormControlLabel
						control={
							<Checkbox
								checked={filters.vehicleGridIntegration}
								onChange={e => setFilters(prev => ({ ...prev, vehicleGridIntegration: e.target.checked }))}
							/>
						}
						label="Vehicle Grid Integration"
					/>
				</Box>
			</Box>

			<Box mt={3} mb={3}>
				{filteredChargerProducts.length > 0 ? (
					<Box display="flex" flexWrap="wrap" justifyContent="center">
						{filteredChargerProducts.map((product: any) => (
							<Box key={product.id} m={2} p={2} border={.5} borderRadius={2} width={300}>
								<Typography variant="subtitle1" display="flex" justifyContent="space-between">
									<strong>{product.Manufacturer}</strong>
								</Typography>
								<Typography variant="body1" display="flex" justifyContent="space-between">
									<span>Model Name</span>
									<strong>{product.ModelName}</strong>
								</Typography>
								<Typography variant="body1" display="flex" justifyContent="space-between">
									<span>Model Type</span>
									<strong>{product.ModelType || 'N/A'}</strong>
								</Typography>

								<Typography variant="body1" display="flex" justifyContent="space-between">
									<span>Power</span>
									<strong>{product.powerFullKw} kW</strong>
								</Typography>
								<Typography variant="body1" display="flex" justifyContent="space-between">
									<span>Number of Plugs</span>
									<strong>{product.numberOfPlugs}</strong>
								</Typography>
								<Typography variant="body1" display="flex" justifyContent="space-between">
									<span>Smart Charging</span>
									<strong>{product.smartCharging ? 'Yes' : 'No'}</strong>
								</Typography>
								<Typography variant="body1" display="flex" justifyContent="space-between">
									<span>Vehicle Grid Integration</span>
									<strong>{product.vehicleGridIntegration ? 'Yes' : 'No'}</strong>
								</Typography>
								<Typography variant="body1" display="flex" justifyContent="space-between">
									<span>MSRP</span>
									<strong>{formatCurrency(product.cost || 0)}</strong>
								</Typography>
								<Link href={product.detailsLink} target="_blank" rel="noopener noreferrer">External Link</Link>
							</Box>
						))}
					</Box>
				) : (
					<Typography align="center" color="textSecondary" mt={4}>
						No charger products match the selected filters.
					</Typography>
				)}
			</Box>

			<Divider />
			<Dialog open={openHelpModal} onClose={handleCloseHelpModal}>
				<DialogTitle>Charging Scenarios</DialogTitle>
				<DialogContent>
					<Typography variant="body1">
						<strong>Scenario 1 - Managed Optimal With On-Peak Hours</strong>
					</Typography>
					<div>
						This scenario also involves managing the charging process, but it allows for charging during all available hours, including on-peak hours. This might be necessary if the fleet's charging needs are too high to be met during off-peak hours alone. While this approach offers more flexibility and ensures that all vehicles are charged, it can be more expensive due to the higher rates during on-peak hours.
					</div>
					<br />
					<Typography variant="body1">
						<strong>Scenario 2 - Managed Optimal Without On-Peak Hours</strong>
					</Typography>
					<div>
						In this scenario, charging is carefully managed to occur only during off-peak and super off-peak hours, when electricity rates are lower. By avoiding on-peak hours, fleet managers can significantly reduce electricity costs. This approach requires planning and scheduling to ensure all vehicles are charged within the cheaper hours, leading to substantial savings.
					</div>
					<br />
					<Typography variant="body1">
						<strong>Scenario 3 - Unmanaged With On-Peak Hours</strong>
					</Typography>
					<div>
						In this scenario, chargers operate at full capacity during off-peak and super off-peak hours until the vehicles are fully charged. There is no active management of the charging process, meaning chargers will use as much power as needed in a shorter time frame. This can lead to higher subscription charges due to intense power usage, but it simplifies the charging process as no scheduling is required.
					</div>
					<br />
					<Typography variant="body1">
						<strong>Scenario 4 - Unmanaged Without On-Peak Hours</strong>
					</Typography>
					<div>
						This scenario allows charging to occur during both off-peak and on-peak hours. It offers the most flexibility, as vehicles can be charged at any time. However, it can result in higher costs due to the higher rates during on-peak hours. This scenario is useful when there are no restrictions on charging times, but it can be the most expensive option.
					</div>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseHelpModal} color="primary">
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</div>
	);
};
// Costs Section
const CostsSection = ({ results }: { results: any }) => {
	return (
		<div>
			<EvResultsTable results={results} />
			<br />
			<Divider />
			<Box mt={3} mb={3}>
				<Typography variant="h6" align='left' color="secondary">Rate Analysis</Typography>
				<Typography component="div">
					<p>The <strong>Electric Vehicle-High Power (EV-HP)</strong> pricing plan is designed to eliminate demand charges and provide customers with simple, stable, monthly billing. The EV-HP pricing plan utilizes reduced Time of Use (TOU) energy charges that are incurred based on the time of day you use electricity, measured in kilowatt hours (kWh). These rates have a steep differential between "on-peak" and "super off-peak" prices to encourage fleet customers to charge during periods of lowest demand. SDG&E's reduced charging rates and simpler billing make the transition to electric vehicles easier and more cost-effective, especially if you have an EV fleet.</p>
					<br></br>
					<p>The <strong>EV-HP Pricing Plan</strong> allows EV customers to choose the amount of power they will need to charge their vehicles and pay for it with a monthly subscription fee — similar to a cell phone plan that lets customers choose the amount of data they will use.</p>
					<br></br>
					<p>The EV-HP rate has three components: <strong>Basic Service Fee + Subscription Charge + Energy Cost (charging consumption)</strong>. EV-HP Basic Service Fee is $213.30 per month for loads under 500 kW and $766.91 for loads over 500 kW. For more details on the EV-HP rate, please visit the <Link href="https://tariffsprd.sdge.com/sdge/tariffs/?utilId=SDGE&bookId=ELEC&sectId=ELEC-SCHEDS&tarfRateGroup=Commercial/Industrial%20Rates" target="_blank" rel="noopener noreferrer">SDG&E Tariff Rates Page</Link>.
					</p>

				</Typography>
			</Box>
			<Divider />
			<EvResultsBarChart results={results} />
			<Divider />
			<EvResultsMonthlyCosts results={results} />
			<Divider />
			<Box mt={3} mb={3}>
				<Typography variant="h6" align='left' color="secondary">Charging Scenarios</Typography>
				<Typography component="div">
					<strong>Scenario 1 - Managed Optimal With On-Peak Hours</strong>
					<p>This scenario also involves managing the charging process, but it allows for charging during all available hours, including on-peak hours. This might be necessary if the fleet's charging needs are too high to be met during off-peak hours alone. While this approach offers more flexibility and ensures that all vehicles are charged, it can be more expensive due to the higher rates during on-peak hours.</p>
					<br></br>

					<strong>Scenario 2 - Managed Optimal Without On-Peak Hours</strong><span style={{ color: '#1976d2' }}>*</span>
					<p>In this scenario, charging is carefully managed to occur only during off-peak and super off-peak hours, when electricity rates are at the lowest. By avoiding on-peak hours, fleet managers can significantly reduce electricity costs. This approach is <i>typically the best scenario for minimizing energy costs</i>, as it requires planning and scheduling to ensure all vehicles are charged within the cheaper hours, leading to substantial savings.</p>
					<br></br>

					<strong>Scenario 3 - Unmanaged With On-Peak Hours</strong>
					<p>In this scenario, chargers operate at full capacity during off-peak and super off-peak hours until the vehicles are fully charged. There is no active management of the charging process, meaning chargers will use as much power as needed in a shorter time frame. This can lead to higher subscription charges due to intense power usage, but it simplifies the charging process as no scheduling is required.</p>
					<br></br>

					<strong>Scenario 4 - Unmanaged Without On-Peak Hours</strong>
					<p>This scenario allows charging to occur during both off-peak and on-peak hours. It offers the most flexibility, as vehicles can be charged at any time. However, it can result in higher costs due to the higher rates during on-peak hours. This scenario is useful when there are no restrictions on charging times, but it can be the most expensive option.</p>
					<br></br>
				</Typography>
			</Box>
		</div>
	);
};
// TBD Section
const TCOSection = ({ results, projectSite, totalActiveVehicles }: { results: any, projectSite: ProjectSite[], totalActiveVehicles: number }) => {

	const currentYear = new Date().getFullYear();
	const assumptions = [

		{
			label: 'Vehicle Acquisition Cost',
			evValue: formatCurrency(projectSite[0].vehicle_acquisition_costs || 0),
			ffvValue: formatCurrency(projectSite[0].fossil_vehicle_acquisition_costs || 0),
		},
		{
			label: 'Vehicle Maintenance and Repair Cost',
			evValue: formatCurrency(projectSite[0].vehicle_maintenance_repair_costs || 0),
			ffvValue: formatCurrency(projectSite[0].fossil_vehicle_maintenance_repair_costs || 0),
		},
		{
			label: 'Vehicle Insurance Cost',
			evValue: formatCurrency(projectSite[0].vehicle_insurance_costs || 0),
			ffvValue: formatCurrency(projectSite[0].fossil_vehicle_insurance_costs || 0),
		},
		{
			label: 'Charger Installation Cost',
			evValue: formatCurrency(projectSite[0].charger_installation_costs || 0),
			ffvValue: 'N/A',
		},
		{
			label: 'Charger Network, Maintenance, and Repair Cost',
			evValue: formatCurrency(projectSite[0].charger_maintenance_repair_network_costs || 0),
			ffvValue: 'N/A',
		},
		{
			label: 'Fuel / Energy Costs',
			evValue: formatCurrency(results.yearly_costs[currentYear]?.total_electric_tc || 0),
			ffvValue: formatCurrency(results.yearly_costs[currentYear]?.total_fossil_fuel_tc || 0),
		},
	];

	const parseCurrency = (value: string) => {
		return Number(value.replace(/[^0-9.-]+/g, '')) || 0;
	};

	const totalEvCost = assumptions.reduce((sum, a) => sum + parseCurrency(a.evValue), 0);
	const totalFfCost = assumptions.reduce((sum, a) => sum + parseCurrency(a.ffvValue), 0);

	const totalEvCostWithIncentives = totalEvCost - (projectSite[0].vehicle_incentive_credits || 0) - (projectSite[0].charger_incentive_credits || 0);

	const formattedEvTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalEvCost);
	const formattedFfTotal = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalFfCost);
	const formattedEvTotalWithIncentives = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalEvCostWithIncentives);


	return (
		<div>
			<Box mt={3} mb={3}>
				<Typography variant="h6" align='center'>
					Taking a look at the estimated total cost breakdown for the first year of ownership of the <b>{totalActiveVehicles}</b> vehicles selected compared to equivalent fossil fuel vehicles, with electric energy costs and charging behavior based on <i>Scenario 2</i> which is outlined in the <b>Costs</b> tab.
				</Typography>
			</Box>

			<EvTotalCostOwnershipChart results={results} projectSite={projectSite} />

			<Box mt={3} mb={3}>
				<Typography variant="h6" align='center'>Assumptions Used for the First Year</Typography>
				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell><strong>Assumption</strong></TableCell>
								<TableCell align="right"><strong>Electric Costs</strong></TableCell>
								<TableCell align="right"><strong>Fossil Fuel Costs</strong></TableCell>
							</TableRow>
						</TableHead>
						<TableBody>

							{assumptions.map((assumption, index) => (
								<TableRow key={index}>
									<TableCell>{assumption.label}</TableCell>
									<TableCell align="right">{assumption.evValue}</TableCell>
									<TableCell align="right">{assumption.ffvValue}</TableCell>
								</TableRow>
								

							))}
								<TableRow>
									<TableCell><strong>Total Without Incentives</strong></TableCell>
									<TableCell align="right"><strong>{formattedEvTotal}</strong></TableCell>
									<TableCell align="right"><strong>{formattedFfTotal}</strong></TableCell>
								</TableRow>
								<TableRow>
									<TableCell><strong>Total With Incentives</strong></TableCell>
									<TableCell align="right"><strong>{formattedEvTotalWithIncentives}</strong></TableCell>
									<TableCell align="right"><strong>{formattedFfTotal}</strong></TableCell>
								</TableRow>
						</TableBody>
					</Table>
				</TableContainer>
			</Box>

			<p>
				<Link href="https://www.sdge.com/sites/default/files/documents/SDGE.PYDFF%20-%20TCO%20Fact%20Sheet%20-%20Regional%20Freight.pdf" target="_blank" rel="noopener noreferrer">
					See the Regional Fleet TCO Fact Sheet for a full analysis here.
				</Link>
			</p>
			<Box mt={3} mb={3}>
				{/* <Typography variant="h6">Yearly Costs</Typography> */}
				{/* <YearlyCostChart
					yearlyFossilFuelCosts={Object.fromEntries(
						Object.entries(results.yearly_costs).map(([year, costs]: [string, any]) => [year, costs.total_fossil_fuel_tc])
					)}
					yearlyEvCosts={Object.fromEntries(
						Object.entries(results.yearly_costs).map(([year, costs]: [string, any]) => [year, costs.total_electric_tc])
					)}
					yearlyTitle='Total Fuel Costs Over Time - original for reference only'
				/> */}
				<YearlyCostChart
					yearlyFossilFuelCosts={Object.fromEntries(
						Object.entries(results.yearly_costs).map(([year, costs]: [string, any], index) => {
							const isFirstYear = index === 0;

							const total = costs.total_fossil_fuel_tc +
								(projectSite[0].fossil_vehicle_maintenance_repair_costs || 0) +
								(projectSite[0].fossil_vehicle_insurance_costs || 0) +
								(isFirstYear ? (projectSite[0].fossil_vehicle_acquisition_costs || 0) : 0); // acquisition cost FFV (if available)

							return [year, total];
						})
					)}
					yearlyEvCosts={Object.fromEntries(
						Object.entries(results.yearly_costs).map(([year, costs]: [string, any], index) => {
							const isFirstYear = index === 0;

							const total = costs.total_electric_tc +
								(projectSite[0].vehicle_maintenance_repair_costs || 0) +
								(projectSite[0].vehicle_insurance_costs || 0) +
								(projectSite[0].charger_maintenance_repair_network_costs || 0) +
								(isFirstYear ? ((projectSite[0].vehicle_acquisition_costs || 0) + (projectSite[0].charger_installation_costs || 0)) - (projectSite[0].vehicle_incentive_credits || 0) - (projectSite[0].charger_incentive_credits || 0) : 0);

							return [year, total];
						})
					)}
					yearlyTitle="Total Costs of Ownership Over Time With Incentives"
				/>
				<CumulativeCostComparisonChart
					yearlyFossilFuelCosts={Object.fromEntries(
						Object.entries(results.yearly_costs).map(([year, costs]: [string, any], index) => {
							const isFirstYear = index === 0;

							const total = costs.total_fossil_fuel_tc +
								(projectSite[0].fossil_vehicle_maintenance_repair_costs || 0) +
								(projectSite[0].fossil_vehicle_insurance_costs || 0) +
								(isFirstYear ? (projectSite[0].fossil_vehicle_acquisition_costs || 0) : 0); // acquisition cost FFV (if available)

							return [year, total];
						})
					)}
					yearlyEvCosts={Object.fromEntries(
						Object.entries(results.yearly_costs).map(([year, costs]: [string, any], index) => {
							const isFirstYear = index === 0;

							const total = costs.total_electric_tc +
								(projectSite[0].vehicle_maintenance_repair_costs || 0) +
								(projectSite[0].vehicle_insurance_costs || 0) +
								(isFirstYear ? ((projectSite[0].vehicle_acquisition_costs || 0) + (projectSite[0].charger_installation_costs || 0)) - (projectSite[0].vehicle_incentive_credits || 0) - (projectSite[0].charger_incentive_credits || 0) : 0);

							return [year, total];
						})
					)}
				/>
			</Box>
		</div>
	);
};

export default EvResults;


