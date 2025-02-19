import React, { useState } from 'react';
import { Button, TextField, Select, MenuItem, FormControl, InputLabel, Typography, Container, Grid, Box, IconButton } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import EvResults from './EvResults';

const EvCalculator: React.FC = () => {
    const [vehicleGroups, setVehicleGroups] = useState([{ id: 1, vehicleClass: 'Heavy Duty Pickup & Van - Class 3', numVehicles: 5, avgDailyMileage: 80 }]);
    const [chargerGroups, setChargerGroups] = useState([{ id: 1, numChargers: 5, chargerKW: 100 }]);
    const [results, setResults] = useState(null);

    const addVehicleGroup = () => {
        if (vehicleGroups.length < 5) {
            setVehicleGroups([...vehicleGroups, { id: vehicleGroups.length + 1, vehicleClass: '', numVehicles: '', avgDailyMileage: '' }]);
        }
    };

    const removeVehicleGroup = (id: number) => {
        setVehicleGroups(vehicleGroups.filter(group => group.id !== id));
    };

    const handleVehicleGroupChange = (id: number, field: string, value: any) => {
        setVehicleGroups(vehicleGroups.map(group => group.id === id ? { ...group, [field]: value } : group));
    };

    const addChargerGroup = () => {
        if (chargerGroups.length < 5) {
            setChargerGroups([...chargerGroups, { id: chargerGroups.length + 1, numChargers: '', chargerKW: '' }]);
        }
    };

    const removeChargerGroup = (id: number) => {
        setChargerGroups(chargerGroups.filter(group => group.id !== id));
    };

    const handleChargerGroupChange = (id: number, field: string, value: any) => {
        setChargerGroups(chargerGroups.map(group => group.id === id ? { ...group, [field]: value } : group));
    };

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);
        const data = Object.fromEntries(formData.entries());

        // Filter out removed vehicle and charger groups
        const filteredVehicleGroups = vehicleGroups.filter(group => formData.has(`vehicle_class_${group.id}`));
        const filteredChargerGroups = chargerGroups.filter(group => formData.has(`num_chargers_${group.id}`));

        // Perform calculations with filtered groups
        const resultsData = {
            vehicleGroups: filteredVehicleGroups,
            chargerGroups: filteredChargerGroups,
            formData: data
        };

        setResults(resultsData);
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>EV Fuel Savings Calculator</Typography>
            <form id="evForm" onSubmit={handleSubmit}>
                <Box mb={4}>
                    <Typography variant="h5">Vehicle Groups</Typography>
                    {vehicleGroups.map(group => (
                        <Box key={group.id} mb={2}>
                            <Grid container alignItems="center" spacing={2}>
                                <Grid item>
                                    <Typography variant="h6">Group {group.id}</Typography>
                                </Grid>
                                {group.id > 1 && (
                                    <Grid item>
                                        <IconButton color="secondary" onClick={() => removeVehicleGroup(group.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                )}
                            </Grid>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth required>
                                        <InputLabel>Vehicle Class</InputLabel>
                                        <Select
                                            name={`vehicle_class_${group.id}`}
                                            value={group.vehicleClass}
                                            onChange={(e) => handleVehicleGroupChange(group.id, 'vehicleClass', e.target.value)}
                                        >
                                            <MenuItem value="">Select Vehicle Class</MenuItem>
                                            <MenuItem value="Heavy Duty Pickup & Van - Class 2B">Heavy Duty Pickup & Van - Class 2B</MenuItem>
                                            <MenuItem value="Heavy Duty Pickup & Van - Class 3">Heavy Duty Pickup & Van - Class 3</MenuItem>
                                            <MenuItem value="Shuttle Bus - Class 3-5">Shuttle Bus - Class 3-5</MenuItem>
                                            <MenuItem value="Delivery Van - Class 3-5">Delivery Van - Class 3-5</MenuItem>
                                            <MenuItem value="Service Van - Class 3-5">Service Van - Class 3-5</MenuItem>
                                            <MenuItem value="Box Truck (Freight) - Class 3-5">Box Truck (Freight) - Class 3-5</MenuItem>
                                            <MenuItem value="Stake Truck - Class 3-5">Stake Truck - Class 3-5</MenuItem>
                                            <MenuItem value="Stake Truck - Class 6-7">Stake Truck - Class 6-7</MenuItem>
                                            <MenuItem value="Box Truck (Freight) - Class 6-7">Box Truck (Freight) - Class 6-7</MenuItem>
                                            <MenuItem value="Delivery Truck - Class 6-7">Delivery Truck - Class 6-7</MenuItem>
                                            <MenuItem value="Service Truck - Class 6-7">Service Truck - Class 6-7</MenuItem>
                                            <MenuItem value="School Bus - Class 7">School Bus - Class 7</MenuItem>
                                            <MenuItem value="Regional Haul Tractor - Class 7-8">Regional Haul Tractor - Class 7-8</MenuItem>
                                            <MenuItem value="Box Truck (Freight) - Class 8">Box Truck (Freight) - Class 8</MenuItem>
                                            <MenuItem value="Long Haul Tractor - Class 8">Long Haul Tractor - Class 8</MenuItem>
                                            <MenuItem value="Transit Bus - Class 8">Transit Bus - Class 8</MenuItem>
                                            <MenuItem value="Refuse Hauler - Class 8">Refuse Hauler - Class 8</MenuItem>
                                            <MenuItem value="Dump Truck - Class 8">Dump Truck - Class 8</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        name={`num_vehicles_${group.id}`}
                                        label="Number of Vehicles"
                                        type="number"
                                        fullWidth
                                        required
                                        value={group.numVehicles}
                                        onChange={(e) => handleVehicleGroupChange(group.id, 'numVehicles', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        name={`avg_daily_mileage_${group.id}`}
                                        label="Average Daily Mileage"
                                        type="number"
                                        fullWidth
                                        required
                                        value={group.avgDailyMileage}
                                        onChange={(e) => handleVehicleGroupChange(group.id, 'avgDailyMileage', e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                    <Button variant="contained" onClick={addVehicleGroup}>Add Vehicle Group</Button>
                </Box>

                <Box mb={4}>
                    <Typography variant="h5">Charging Behavior</Typography>
                    <TextField name="charging_days" label="What days will you charge your vehicle(s)?" fullWidth required />
                    <TextField name="charging_time" label="What time of day will you charge your vehicle(s)?" fullWidth required />
                </Box>
                {/* // add recommended box here somewhere */}
                <Box mb={4}>
                    <Typography variant="h5">Charger Groups</Typography>
                    {chargerGroups.map(group => (
                        <Box key={group.id} mb={2}>
                            <Grid container alignItems="center" spacing={2}>
                                <Grid item>
                                    <Typography variant="h6">Group {group.id}</Typography>
                                </Grid>
                                {group.id > 1 && (
                                    <Grid item>
                                        <IconButton color="secondary" onClick={() => removeChargerGroup(group.id)}>
                                            <DeleteIcon />
                                        </IconButton>
                                    </Grid>
                                )}
                            </Grid>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        name={`num_chargers_${group.id}`}
                                        label="Number of Chargers"
                                        type="number"
                                        fullWidth
                                        required
                                        value={group.numChargers}
                                        onChange={(e) => handleChargerGroupChange(group.id, 'numChargers', e.target.value)}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        name={`charger_kw_${group.id}`}
                                        label="Charger kW"
                                        type="number"
                                        fullWidth
                                        required
                                        value={group.chargerKW}
                                        onChange={(e) => handleChargerGroupChange(group.id, 'chargerKW', e.target.value)}
                                    />
                                </Grid>
                            </Grid>
                        </Box>
                    ))}
                    <Button variant="contained" onClick={addChargerGroup}>Add Charger Group</Button>
                </Box>

                

                <Box mb={4}>
                    <Typography variant="h5">Optional Settings</Typography>
                    <TextField name="fossil_fuel_price" label="Fossil Fuel Price ($/gal)" type="number" fullWidth />
                    <TextField name="fossil_fuel_multiplier" label="Fossil Fuel Price Increase Multiplier YoY" type="number" fullWidth />
                    <TextField name="fossil_fuel_efficiency" label="Fossil Fuel Vehicle Efficiency Override (mpg)" type="number" fullWidth />
                    <TextField name="transformer_capacity" label="Available Capacity for Existing Transformer (kW)" type="number" fullWidth />
                </Box>

                <Button variant="contained" type="submit">Calculate</Button>
            </form>

            {results && <EvResults results={results} />}
        </Container>
    );
};

export default EvCalculator;