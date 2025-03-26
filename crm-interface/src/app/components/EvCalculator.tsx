import React, { useState } from 'react';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Typography, Grid, Box, IconButton, Paper, Checkbox, FormGroup, FormControlLabel, Accordion, AccordionSummary, AccordionDetails, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, ExpandMore as ExpandMoreIcon, HelpOutline as HelpOutlineIcon } from '@mui/icons-material';
import EvStationIcon from '@mui/icons-material/EvStation';
import { VehicleGroup, ChargerGroup, Results, OptionalSettings, ChargingBehavior } from '../types';

interface EvCalculatorProps {
    onCalculate: (formData: { [key: string]: any }) => Promise<void>;
    isLoading: boolean;
}

const EvCalculator: React.FC<EvCalculatorProps> = ({ onCalculate, isLoading }) => {
    const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([{ id: 1, vehicleClass: 'Heavy Duty Pickup & Van - Class 3', numVehicles: 5, avgDailyMileage: 80 }]);
    const [chargerGroups, setChargerGroups] = useState<ChargerGroup[]>([{ id: 1, numChargers: 5, chargerKW: 100 }]);
    const [results, setResults] = useState<Results | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [chargingBehavior, setChargingBehavior] = useState<ChargingBehavior>({
        days: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
        startTime: '22:00',
        endTime: '06:00'
    });
    
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
            formDataJson[key] = value;
        });

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

        console.log('Form Data JSON:', formDataJson); // Log the form data

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
                                    <Grid item xs={12} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
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
                                        <FormControl fullWidth>
                                            <InputLabel>Vehicle Class</InputLabel>
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
                                        <TextField
                                            name={`vehicle_group_${index + 1}_num`}
                                            label="Number of Vehicles"
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
                                        <TextField
                                            name={`vehicle_group_${index + 1}_mileage`}
                                            label="Average Daily Mileage"
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
                                    <Typography variant="subtitle1" gutterBottom sx={{ color: '#555' }}>Days for Charging</Typography>
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
                                                    backgroundColor: chargingBehavior.days.includes(day) ? '#ffc107' : 'transparent',
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
                                    <Typography variant="subtitle1" gutterBottom sx={{ color: '#555' }}>Charging Time Window</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="Start Time"
                                                type="time"
                                                value={chargingBehavior.startTime}
                                                onChange={(e) => setChargingBehavior(prev => ({
                                                    ...prev,
                                                    startTime: e.target.value
                                                }))}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ step: 300 }}
                                                fullWidth
                                                sx={{ backgroundColor: 'white' }}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                label="End Time"
                                                type="time"
                                                value={chargingBehavior.endTime}
                                                onChange={(e) => setChargingBehavior(prev => ({
                                                    ...prev,
                                                    endTime: e.target.value
                                                }))}
                                                InputLabelProps={{ shrink: true }}
                                                inputProps={{ step: 300 }}
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
                        <span 
                            onClick={() => window.open('https://insitetool.org/equipment_catalog', '_blank')}
                            style={{ cursor: 'pointer', marginLeft: '8px' }}
                        >
                            <EvStationIcon />
                        </span>
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
                                        <TextField
                                            name={`charger_group_${index + 1}_num`}
                                            label="Number of Chargers"
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
                                        <TextField
                                            name={`charger_group_${index + 1}_kw`}
                                            label="Charger kW"
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
                                <TextField 
                                    name="fossil_fuel_price" 
                                    label="Fossil Fuel Price ($/gal)" 
                                    type="number" 
                                    fullWidth 
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField 
                                    name="fossil_fuel_multiplier" 
                                    label="Fossil Fuel Price Increase Multiplier YoY" 
                                    type="decimal" 
                                    fullWidth 
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField 
                                    name="fossil_fuel_efficiency" 
                                    label="Fossil Fuel Vehicle Efficiency Override (mpg)" 
                                    type="number" 
                                    fullWidth 
                                    sx={{ backgroundColor: 'white' }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField 
                                    name="transformer_capacity" 
                                    label="Available Capacity for Existing Transformer (kW)" 
                                    type="number" 
                                    fullWidth 
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
                            Vehicle to Charge-Port Ratios<br></br><br></br>
                            <strong>1 to 1</strong>: Ideal for ensuring each vehicle has a dedicated charge port.<br></br>
                            <strong>1.25 to 1</strong>: Slightly more vehicles than charge ports, suitable for fleets with staggered charging schedules.<br></br>
                            <strong>1.5 to 1</strong>: Balanced approach for moderate usage and shared charging.<br></br>
                            <strong>1.75 to 1</strong>: Efficient for fleets with predictable charging patterns.<br></br>
                            <strong>2 to 1</strong>: Cost-effective for larger fleets with flexible charging needs.<br></br>
                            <strong>2.25 to 1</strong>: Optimized for high utilization of charge ports.<br></br>
                            <strong>2.5 to 1</strong>: Suitable for fleets with well-managed charging schedules.<br></br>
                            <strong>2.75 to 1</strong>: Best for fleets with minimal downtime and high charge port turnover.<br></br>
                            <strong>3 to 1</strong>: Maximum efficiency for fleets with highly coordinated charging.<br></br>
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
        </Paper>
    );
};

export default EvCalculator;