import React, { useEffect, useState } from 'react';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Typography, Grid, Box, IconButton, Paper, Checkbox, FormGroup, FormControlLabel, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions, Tooltip, Link } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, ExpandMore as ExpandMoreIcon, HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import EvStationIcon from '@mui/icons-material/EvStation';
import { VehicleGroup, ChargerGroup, Results, OptionalSettings, ChargingBehavior, ProjectSite } from '../types';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';

interface EvCalculatorProps {
    onCalculate: (formData: { [key: string]: any }) => Promise<void>;
    isLoading: boolean;
}

const EvCalculator: React.FC<EvCalculatorProps> = ({ onCalculate, isLoading }) => {
    const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([{ id: 1, vehicleClass: 'Heavy Duty Pickup & Van - Class 3', numVehicles: 5, avgDailyMileage: 180 }]);
    const [chargerGroups, setChargerGroups] = useState<ChargerGroup[]>([{ id: 1, numChargers: 5, chargerKW: 30 }]);
    const [projectSite, setProjectSites] = useState<ProjectSite[]>([]);
    const [results, setResults] = useState<Results | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [chargingBehavior, setChargingBehavior] = useState<ChargingBehavior>({
        days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        startTime: '18:00',
        endTime: '06:00'
    });

    // Calculate project costs when the component mounts
    useEffect(() => {
        calculateProjectCosts();
    }, []); // Empty dependency array means this runs once on mount

    // State for modal
    const [openHelpModal, setOpenHelpModal] = useState(false);

    const sectionStyle = {
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '32px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    };

    const sectionHeaderStyle = {
        borderBottom: '2px solid #1976d2',
        paddingBottom: '12px',
        marginBottom: '24px',
        color: '#1976d2',
        fontSize: '1.5rem',
        fontWeight: 500
    };

    const vehicleClassOptions = [
        "Heavy Duty Pickup & Van - Class 2B",
        "Heavy Duty Pickup & Van - Class 3",
        "Shuttle Bus - Class 3-5",
        "Delivery Van - Class 3-5",
        "Service Van - Class 3-5",
        "Box Truck (Freight) - Class 3-5",
        "Stake Truck - Class 3-5",
        "Stake Truck - Class 6-7",
        "Box Truck (Freight) - Class 6-7",
        "Delivery Truck - Class 6-7",
        "Service Truck - Class 6-7",
        "School Bus - Class 7",
        "Regional Haul Tractor - Class 7-8",
        "Box Truck (Freight) - Class 8",
        "Long Haul Tractor - Class 8",
        "Transit Bus - Class 8",
        "Refuse Hauler - Class 8",
        "Dump Truck - Class 8"
    ];

    // Helper function to format numbers with commas
    const formatNumberWithCommas = (num: number) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    };

    // Helper function to parse formatted number back to a number
    const parseFormattedNumber = (value: string) => {
        return Number(value.replace(/,/g, ''));
    };

    const calculateProjectCosts = () => {
        const vehicleCostPerUnit = 300000; // Example cost per vehicle
        const maintenanceCostPerMile = 0.15; // Example maintenance cost per mile
        const chargerInstallationCostPerUnit = 114400; // Example cost per charger
        const vehicleInsuranceCostPerUnit = 1500; // Example insurance cost per vehicle
        const chargerMaintenanceCostPerUnit = 1100; // Example maintenance cost per charger
        const vehicleIncentiveCreditPerUnit = 150000; // Example incentive credit per vehicle
        const chargerIncentiveCreditPerUnit = 1000; // Example incentive credit per charger

        // Calculate total vehicle acquisition costs
        const totalVehicleAcquisitionCosts = vehicleGroups.reduce((total, group) => {
            return total + (group.numVehicles * vehicleCostPerUnit);
        }, 0);

        // // Calculate total vehicle maintenance costs (annual)
        // const totalVehicleMaintenanceCosts = vehicleGroups.reduce((total, group) => {
        //     return total + (group.avgDailyMileage * group.numVehicles * maintenanceCostPerMile * 365); // Annual maintenance cost
        // }, 0);

        // Calculate total vehicle maintenance costs (annual)
        const totalVehicleMaintenanceCosts = vehicleGroups.reduce((total, group) => {
            const selectedDaysCount = chargingBehavior.days.length; // Get the number of selected days
            return total + (group.avgDailyMileage * group.numVehicles * maintenanceCostPerMile * selectedDaysCount * 52); // Annual maintenance cost
        }, 0);

        // Calculate total vehicle insurance costs (annual)
        const totalVehicleInsuranceCosts = vehicleGroups.reduce((total, group) => {
            return total + (group.numVehicles * vehicleInsuranceCostPerUnit);
        }, 0);

        // Calculate total charger installation costs
        const totalChargerInstallationCosts = chargerGroups.reduce((total, group) => {
            return total + (group.numChargers * chargerInstallationCostPerUnit);
        }, 0);

        // Calculate total charger maintenance costs (annual)
        const totalChargerMaintenanceCosts = chargerGroups.reduce((total, group) => {
            return total + (group.numChargers * chargerMaintenanceCostPerUnit);
        }, 0);

        // Calculate total vehicle incentive credits
        const totalVehicleIncentiveCredits = vehicleGroups.reduce((total, group) => {
            return total + (group.numVehicles * vehicleIncentiveCreditPerUnit);
        }, 0);

        // Calculate total charger incentive credits
        const totalChargerIncentiveCredits = chargerGroups.reduce((total, group) => {
            return total + (group.numChargers * chargerIncentiveCreditPerUnit);
        }, 0);

        const fossilFuelAcquisitionCostTotal = totalVehicleAcquisitionCosts * 0.8; // 80% of electric vehicle costs
        const fossilFuelMaintenanceCostTotal = totalVehicleMaintenanceCosts * 1.3; // 30% higher than electric vehicle costs
        const fossilFuelInsuranceCostTotal = totalVehicleInsuranceCosts * 1.1; // 10% higher than electric vehicle costs

        // Update projectSite state with calculated values
        setProjectSites([{
            vehicle_acquisition_costs: totalVehicleAcquisitionCosts,
            vehicle_maintenance_repair_costs: totalVehicleMaintenanceCosts,
            vehicle_insurance_costs: totalVehicleInsuranceCosts,
            charger_installation_costs: totalChargerInstallationCosts,
            charger_maintenance_repair_network_costs: totalChargerMaintenanceCosts,
            vehicle_incentive_credits: totalVehicleIncentiveCredits,
            charger_incentive_credits: totalChargerIncentiveCredits,
            fossil_vehicle_acquisition_costs: fossilFuelAcquisitionCostTotal,
            fossil_vehicle_maintenance_repair_costs: fossilFuelMaintenanceCostTotal,
            fossil_vehicle_insurance_costs: fossilFuelInsuranceCostTotal
        }]);
    };

    const addVehicleGroup = () => {
        if (vehicleGroups.length < 5) {
            setVehicleGroups([...vehicleGroups, {
                id: vehicleGroups.length + 1,
                vehicleClass: '',
                numVehicles: 0,
                avgDailyMileage: 0
            }]);
        }
    };

    const removeVehicleGroup = (id: number) => {
        setVehicleGroups(vehicleGroups.filter(group => group.id !== id));
    };

    const handleVehicleGroupChange = (id: number, field: string, value: string | number) => {
        setVehicleGroups(vehicleGroups.map(group => {
            if (group.id === id) {
                const updatedValue = field === 'vehicleClass' ? value : Number(value);
                return { ...group, [field]: updatedValue };
            }
            return group;
        }));
        calculateProjectCosts();
    };

    const addChargerGroup = () => {
        if (chargerGroups.length < 5) {
            setChargerGroups([...chargerGroups, {
                id: chargerGroups.length + 1,
                numChargers: 0,
                chargerKW: 0
            }]);
        }
    };

    const removeChargerGroup = (id: number) => {
        setChargerGroups(chargerGroups.filter(group => group.id !== id));
    };

    const handleChargerGroupChange = (id: number, field: string, value: string | number) => {
        setChargerGroups(chargerGroups.map(group => {
            if (group.id === id) {
                return { ...group, [field]: Number(value) };
            }
            return group;
        }));
        calculateProjectCosts();
    };

    const handleDayChange = (day: string) => {
        setChargingBehavior(prev => ({
            ...prev,
            days: prev.days.includes(day)
                ? prev.days.filter(d => d !== day)
                : [...prev.days, day]
        }));
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);

        // Convert FormData to a JSON object
        const formDataJson: { [key: string]: any } = {};
        formData.forEach((value, key) => {
            // Check if the key is related to project costs and parse it as an integer
            if (key.includes('costs') || key.includes('credits')) {
                formDataJson[key] = parseFormattedNumber(value as string); // Ensure it's an integer
            } else {
                formDataJson[key] = value;
            }
        });

        // Calculate project costs to get fossil fuel values
        calculateProjectCosts();

        // Add fossil fuel costs to formDataJson
        formDataJson.fossil_vehicle_acquisition_costs = projectSite[0]?.fossil_vehicle_acquisition_costs || 0;
        formDataJson.fossil_vehicle_maintenance_repair_costs = projectSite[0]?.fossil_vehicle_maintenance_repair_costs || 0;
        formDataJson.fossil_vehicle_insurance_costs = projectSite[0]?.fossil_vehicle_insurance_costs || 0;

        // Include charging behavior in the form data
        formDataJson['charging_behavior'] = {
            days: chargingBehavior.days,
            startTime: chargingBehavior.startTime,
            endTime: chargingBehavior.endTime
        };

        // Rename vehicle and charger group keys
        vehicleGroups.forEach((group, index) => {
            const groupIndex = index + 1; // Start from 1
            formDataJson[`vehicle_group_${groupIndex}_class`] = group.vehicleClass;
            formDataJson[`vehicle_group_${groupIndex}_num`] = group.numVehicles;
            formDataJson[`vehicle_group_${groupIndex}_mileage`] = group.avgDailyMileage;
        });

        chargerGroups.forEach((group, index) => {
            const groupIndex = index + 1; // Start from 1
            formDataJson[`charger_group_${groupIndex}_num`] = group.numChargers;
            formDataJson[`charger_group_${groupIndex}_kw`] = group.chargerKW;
        });

        // Pass the FormData back to the parent component
        await onCalculate(formDataJson); // Call the parent function with the FormData
    };

    const handleOpenHelpModal = () => {
        setOpenHelpModal(true);
    };

    const handleCloseHelpModal = () => {
        setOpenHelpModal(false);
    };

    return (
        <Paper sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
                <Accordion
                    defaultExpanded
                    sx={{
                        ...sectionStyle,
                        '&.MuiAccordion-root': {
                            '&:before': {
                                display: 'none',
                            },
                        },
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            borderBottom: '2px solid #1976d2',
                            color: '#1976d2',
                            '& .MuiAccordionSummary-content': {
                                margin: '12px 0',
                            },
                        }}
                    >
                        <Typography variant="h5">Vehicle Groups</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        {vehicleGroups.map((group, index) => (
                            <Box key={group.id} mb={3}>
                                <Grid container alignItems="center" spacing={2}>
                                    <Grid item xs={12} sx={{ mb: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="h6" sx={{ color: '#555' }}>Group {index + 1}</Typography>
                                        {group.id > 1 && (
                                            <IconButton
                                                color="error"
                                                onClick={() => removeVehicleGroup(group.id)}
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography color="secondary" variant="subtitle1"><strong>Vehicle Class</strong>
                                            <Tooltip title="Vehicle Class refers to the category your commercial fleet vehicle falls into based on its size, weight, and purpose. To determine the correct class, check your vehicle's registration, manufacturer specifications, or industry classification standards">
                                                <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                            </Tooltip>
                                        </Typography>
                                        <FormControl fullWidth>
                                            <Select
                                                name={`vehicle_group_${index + 1}_class`}
                                                value={group.vehicleClass}
                                                onChange={(e) => handleVehicleGroupChange(group.id, 'vehicleClass', e.target.value)}
                                                sx={{ backgroundColor: 'white' }}
                                            >
                                                <MenuItem value="">Select Vehicle Class</MenuItem>
                                                {vehicleClassOptions.map(option => (
                                                    <MenuItem key={option} value={option}>{option}</MenuItem>
                                                ))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography color="secondary" variant="subtitle1"><strong>Number of Vehicles</strong>
                                            <Tooltip title="Total number of vehicles in your fleet that belong in the specified vehicle class selected above">
                                                <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                            </Tooltip>
                                        </Typography>
                                        <TextField
                                            name={`vehicle_group_${index + 1}_num`}
                                            type="number"
                                            fullWidth
                                            required
                                            value={group.numVehicles}
                                            onChange={(e) => handleVehicleGroupChange(group.id, 'numVehicles', e.target.value)}
                                            sx={{ backgroundColor: 'white' }}
                                            InputProps={{
                                                inputProps: { min: 0 }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography color="secondary" variant="subtitle1"><strong>Average Daily Mileage</strong>
                                            <Tooltip title="The average daily mileage that EACH vehicle in your fleet drives per day in the specified vehicle class selected. Please report the average using a 7-day week (Monday-Sunday).">
                                                <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                            </Tooltip>
                                        </Typography>
                                        <TextField
                                            name={`vehicle_group_${index + 1}_mileage`}
                                            type="number"
                                            fullWidth
                                            required
                                            value={group.avgDailyMileage}
                                            onChange={(e) => handleVehicleGroupChange(group.id, 'avgDailyMileage', e.target.value)}
                                            sx={{ backgroundColor: 'white' }}
                                            InputProps={{
                                                inputProps: { min: 0 }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                        <Button
                            variant="contained"
                            onClick={addVehicleGroup}
                            startIcon={<AddIcon />}
                            disabled={vehicleGroups.length >= 5}
                            sx={{
                                mt: 2,
                                backgroundColor: vehicleGroups.length >= 5 ? 'grey.400' : undefined,
                                '&:hover': {
                                    backgroundColor: vehicleGroups.length >= 5 ? 'grey.500' : undefined
                                }
                            }}
                        >
                            Add Vehicle Group
                        </Button>
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    defaultExpanded
                    sx={{
                        ...sectionStyle,
                        '&.MuiAccordion-root': {
                            '&:before': {
                                display: 'none',
                            },
                        },
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            borderBottom: '2px solid #1976d2',
                            color: '#1976d2',
                            '& .MuiAccordionSummary-content': {
                                margin: '12px 0',
                            },
                        }}
                    >
                        <Typography variant="h5">Charging Behavior</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <FormGroup>
                            <Grid container spacing={3}>
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom sx={{ color: '#555' }}>Days for Charging
                                        <Tooltip title="Select all days that the vehicles charge on">
                                            <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                        </Tooltip>
                                    </Typography>
                                    <Box sx={{
                                        display: 'flex',
                                        gap: 1,
                                        width: '100%',
                                        justifyContent: 'space-between'
                                    }}>
                                        {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
                                            <Box
                                                key={day}
                                                onClick={() => handleDayChange(day)}
                                                sx={{
                                                    backgroundColor: chargingBehavior.days.includes(day) ? '#FED600' : 'transparent',
                                                    border: '1px solid #e0e0e0',
                                                    borderRadius: '8px',
                                                    padding: '12px',
                                                    flex: 1,
                                                    textAlign: 'center',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        backgroundColor: chargingBehavior.days.includes(day)
                                                            ? '#ffc107'
                                                            : 'rgba(0, 0, 0, 0.04)'
                                                    }
                                                }}
                                            >
                                                <Typography
                                                    variant="body1"
                                                    sx={{
                                                        fontWeight: chargingBehavior.days.includes(day) ? 500 : 400
                                                    }}
                                                >
                                                    {day}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography variant="h6" sx={{ color: '#555' }}>Charging Time Window
                                        <Tooltip title="Select the time windows when the vehicles are plugged in to charge. If there are multiple windows, please add additional time frames below.">
                                            <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                        </Tooltip>
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <Typography color="secondary" variant="subtitle1"><strong>Start Time</strong></Typography>
                                            <TextField
                                                // label="Start Time"
                                                type="time"
                                                value={chargingBehavior.startTime}
                                                onChange={(e) => setChargingBehavior(prev => ({
                                                    ...prev,
                                                    startTime: e.target.value
                                                }))}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ step: 3600 }}  // Set step to 3600 seconds (1 hour)
                                                fullWidth
                                                sx={{ backgroundColor: 'white' }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <Typography color="secondary" variant="subtitle1"><strong>End Time</strong></Typography>
                                            <TextField
                                                // label="End Time"
                                                type="time"
                                                value={chargingBehavior.endTime}
                                                onChange={(e) => setChargingBehavior(prev => ({
                                                    ...prev,
                                                    endTime: e.target.value
                                                }))}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ step: 3600 }}  // Set step to 3600 seconds (1 hour)
                                                fullWidth
                                                sx={{ backgroundColor: 'white' }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Grid>
                        </FormGroup>
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    defaultExpanded
                    sx={{
                        ...sectionStyle,
                        '&.MuiAccordion-root': {
                            '&:before': {
                                display: 'none',
                            },
                        },
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            borderBottom: '2px solid #1976d2',
                            color: '#1976d2',
                            '& .MuiAccordionSummary-content': {
                                margin: '12px 0',
                            },
                        }}
                    >
                        <Typography variant="h5">Charger Groups</Typography>
                        {/* <span
                            onClick={() => window.open('https://insitetool.org/equipment_catalog', '_blank')}
                            style={{ cursor: 'pointer', marginLeft: '8px' }}
                        >
                            <EvStationIcon />
                        </span> */}
                        <span
                            onClick={(event) => {
                                event.stopPropagation();
                                handleOpenHelpModal();
                            }}
                            style={{ cursor: 'pointer', marginLeft: '8px' }}
                        >
                            <HelpOutlineIcon />
                        </span>
                    </AccordionSummary>
                    <AccordionDetails>
                        {chargerGroups.map((group, index) => (
                            <Box key={group.id} mb={3}>
                                <Grid container alignItems="center" spacing={2}>
                                    <Grid item xs={12} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="h6" sx={{ color: '#555' }}>Charger Group {index + 1}</Typography>
                                        {group.id > 1 && (
                                            <IconButton
                                                color="error"
                                                onClick={() => removeChargerGroup(group.id)}
                                                size="small"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography color="secondary" variant="subtitle1"><strong>Number of Chargers</strong>
                                            <Tooltip title="The total number of chargers you have available within the specified charger group selected">
                                                <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                            </Tooltip>
                                        </Typography>
                                        <TextField
                                            name={`charger_group_${index + 1}_num`}
                                            // label="Number of Chargers"
                                            type="number"
                                            fullWidth
                                            required
                                            value={group.numChargers}
                                            onChange={(e) => handleChargerGroupChange(group.id, 'numChargers', e.target.value)}
                                            sx={{ backgroundColor: 'white' }}
                                            InputProps={{
                                                inputProps: { min: 0 }
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <Typography color="secondary" variant="subtitle1"><strong>Charger kW</strong>
                                            <Tooltip title="Charger kW refers to the power output of an EV charger, measured in kilowatts (kW). To find the correct kW value, check the charger's specifications—common power levels range from 50 kW for slower DC charging to 350+ kW for high-power fast charging. Please list the kW for EACH charger within the specified charger group, rather than the total kW for all chargers within the group.">
                                                <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                            </Tooltip>
                                        </Typography>
                                        <TextField
                                            name={`charger_group_${index + 1}_kw`}
                                            // label="Charger kW"
                                            type="number"
                                            fullWidth
                                            required
                                            value={group.chargerKW}
                                            onChange={(e) => handleChargerGroupChange(group.id, 'chargerKW', e.target.value)}
                                            sx={{ backgroundColor: 'white' }}
                                            InputProps={{
                                                inputProps: { min: 0 }
                                            }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>
                        ))}
                        <Button
                            variant="contained"
                            onClick={addChargerGroup}
                            startIcon={<AddIcon />}
                            disabled={chargerGroups.length >= 5}
                            sx={{
                                mt: 2,
                                backgroundColor: chargerGroups.length >= 5 ? 'grey.400' : undefined,
                                '&:hover': {
                                    backgroundColor: chargerGroups.length >= 5 ? 'grey.500' : undefined
                                }
                            }}
                        >
                            Add Charger Group
                        </Button>
                    </AccordionDetails>
                </Accordion>

                <Accordion
                    sx={{
                        ...sectionStyle,
                        '&.MuiAccordion-root': {
                            '&:before': {
                                display: 'none',
                            },
                        },
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            borderBottom: '2px solid #1976d2',
                            color: '#1976d2',
                            '& .MuiAccordionSummary-content': {
                                margin: '12px 0',
                            },
                        }}
                    >
                        <Typography variant="h5">Optional Settings</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={3}>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Fossil Fuel Price ($/gal)</strong></Typography>
                                <TextField
                                    name="fossil_fuel_price"
                                    type="decimal"
                                    fullWidth
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Fossil Fuel Price Increase Multiplier YoY</strong></Typography>
                                <TextField
                                    name="fossil_fuel_multiplier"
                                    type="decimal"
                                    fullWidth
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Fossil Fuel Vehicle Efficiency Override (mpg)</strong></Typography>
                                <TextField
                                    name="fossil_fuel_efficiency"
                                    type="number"
                                    fullWidth
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Available Capacity for Existing Transformer (kW)</strong></Typography>
                                <TextField
                                    name="transformer_capacity"
                                    type="number"
                                    fullWidth
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>
                <Accordion
                    sx={{
                        ...sectionStyle,
                        '&.MuiAccordion-root': {
                            '&:before': {
                                display: 'none',
                            },
                        },
                    }}
                >
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        sx={{
                            borderBottom: '2px solid #1976d2',
                            color: '#1976d2',
                            '& .MuiAccordionSummary-content': {
                                margin: '12px 0',
                            },
                        }}
                    >
                        <Typography variant="h5">Project Costs</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sx={{ mb: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h6" sx={{ color: '#555' }}>Vehicle Costs</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Vehicle Acquisition Costs</strong>
                                    <Tooltip title="Typical costs are $300,000 per vehicle, one-time costs applied to the first year">
                                        <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                    </Tooltip>
                                </Typography>
                                <TextField
                                    name="vehicle_acquisition_costs"
                                    type="text"
                                    fullWidth
                                    value={formatNumberWithCommas(projectSite[0]?.vehicle_acquisition_costs || 0)}
                                    onChange={(e) => setProjectSites([{ ...projectSite[0], vehicle_acquisition_costs: parseFormattedNumber(e.target.value) }])}
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Vehicle Maintenance and Repair Annual Costs</strong>
                                    <Tooltip title="Typical costs are $0.15 per mile">
                                        <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                    </Tooltip>
                                </Typography>
                                <TextField
                                    name="vehicle_maintenance_repair_costs"
                                    type="text"
                                    fullWidth
                                    value={formatNumberWithCommas(projectSite[0]?.vehicle_maintenance_repair_costs || 0)}
                                    onChange={(e) => setProjectSites([{ ...projectSite[0], vehicle_maintenance_repair_costs: parseFormattedNumber(e.target.value) }])}
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Vehicle Insurance Annual Costs</strong>
                                    <Tooltip title="Typical costs are $1,500 per vehicle per year">
                                        <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                    </Tooltip>
                                </Typography>
                                <TextField
                                    name="vehicle_insurance_costs"
                                    type="text"
                                    fullWidth
                                    value={formatNumberWithCommas(projectSite[0]?.vehicle_insurance_costs || 0)}
                                    onChange={(e) => setProjectSites([{ ...projectSite[0], vehicle_insurance_costs: parseFormattedNumber(e.target.value) }])}
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12} sx={{ mb: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h6" sx={{ color: '#555' }}>Charger Costs</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Charger Installation Costs</strong>
                                    <Tooltip title="Typical costs are $114,400 per charger">
                                        <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                    </Tooltip>
                                </Typography>
                                <TextField
                                    name="charger_installation_costs"
                                    type="text"
                                    fullWidth
                                    value={formatNumberWithCommas(projectSite[0]?.charger_installation_costs || 0)}
                                    onChange={(e) => setProjectSites([{ ...projectSite[0], charger_installation_costs: parseFormattedNumber(e.target.value) }])}
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Charger Maintenance, Repair and Network Annual Costs</strong>
                                    <Tooltip title="Typical costs are $1,100 per charger per year">
                                        <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                    </Tooltip>
                                </Typography>
                                <TextField
                                    name="charger_maintenance_repair_network_costs"
                                    type="text"
                                    fullWidth
                                    value={formatNumberWithCommas(projectSite[0]?.charger_maintenance_repair_network_costs || 0)}
                                    onChange={(e) => setProjectSites([{ ...projectSite[0], charger_maintenance_repair_network_costs: parseFormattedNumber(e.target.value) }])}
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12} sx={{ mb: 0, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h6" sx={{ color: '#555' }}>Incentives</Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Vehicle Incentive Credits</strong>
                                    <Tooltip title="Typical incentives are a one-time $150,000 credit per vehicle">
                                        <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                    </Tooltip>
                                </Typography>
                                <TextField
                                    name="vehicle_incentive_credits"
                                    type="text"
                                    fullWidth
                                    value={formatNumberWithCommas(projectSite[0]?.vehicle_incentive_credits || 0)}
                                    onChange={(e) => setProjectSites([{ ...projectSite[0], vehicle_incentive_credits: parseFormattedNumber(e.target.value) }])}
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="secondary" variant="subtitle1"><strong>Charger Incentive Credits</strong>
                                    <Tooltip title="Typical incentives are a one-time $1,000 credit per charger">
                                        <HelpOutlineIcon sx={{ color: '#555', fontSize: '1rem', cursor: 'pointer' }} />
                                    </Tooltip>
                                </Typography>
                                <TextField
                                    name="charger_incentive_credits"
                                    type="text"
                                    fullWidth
                                    value={formatNumberWithCommas(projectSite[0]?.charger_incentive_credits || 0)}
                                    onChange={(e) => setProjectSites([{ ...projectSite[0], charger_incentive_credits: parseFormattedNumber(e.target.value) }])}
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                        </Grid>
                    </AccordionDetails>
                </Accordion>

                {/* Modal for Help */}
                <Dialog open={openHelpModal} onClose={handleCloseHelpModal}>
                    <DialogTitle>Charger Help Information</DialogTitle>
                    <DialogContent>
                        <Typography variant="body1">
                    Charger Group refers to the category your EV chargers fall into based on factors such as their power level, charging speed, or connector type. To determine the correct group, check the charger specifications.
                    </Typography>
                    <br></br>
                        <Typography variant="body1">
                            <strong>Vehicle to Charge-Port Ratios</strong><br></br>
                            <strong>1 to 1</strong>: Ideal for ensuring each vehicle has a dedicated charge port.<br></br>
                            <strong>1.25 to 1</strong>: Slightly more vehicles than charge ports, suitable for fleets with staggered charging schedules.<br></br>
                            <strong>1.5 to 1</strong>: Balanced approach for moderate usage and shared charging.<br></br>
                            <strong>1.75 to 1</strong>: Efficient for fleets with predictable charging patterns.<br></br>
                            <strong>2 to 1</strong>: Cost-effective for larger fleets with flexible charging needs.<br></br>
                            <strong>2.25 to 1</strong>: Optimized for high utilization of charge ports.<br></br>
                            <strong>2.5 to 1</strong>: Suitable for fleets with well-managed charging schedules.<br></br>
                            <strong>2.75 to 1</strong>: Best for fleets with minimal downtime and high charge port turnover.<br></br>
                            <strong>3 to 1</strong>: Maximum efficiency for fleets with highly coordinated charging.<br></br>
                            <br></br>
                            
                                For additional help, refer to the equipment catalog from Insite to help pick out charger specifications <Link href="https://insitetool.org/equipment_catalog" target='_blank'>here</Link>.
                                {/* <span
                                    onClick={() => window.open('https://insitetool.org/equipment_catalog', '_blank')}
                                    style={{ cursor: 'pointer', marginLeft: '8px' }}
                                >
                                    <EvStationIcon />
                                </span> */}
                            
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseHelpModal} color="primary">
                            Close
                        </Button>
                    </DialogActions>
                </Dialog>

                <Button
                    variant="contained"
                    type="submit"
                    disabled={isLoading}
                    fullWidth
                    size="large"
                    sx={{ mt: 2 }}
                >
                    {isLoading ? 'Calculating...' : 'Calculate'}
                </Button>
            </form>
        </Paper >
    );
};

export default EvCalculator;