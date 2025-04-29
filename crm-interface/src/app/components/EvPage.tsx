import React, { useState } from 'react';
import { Container, Grid, Box, Typography } from '@mui/material';
import EvCalculator from './EvCalculator';
import EvResults from './EvResults';
import LegalDisclaimer from './LegalDisclaimer';
import { Results, VehicleGroup, ChargerGroup, ProjectSite, OptionalSettings } from '../types';
import { Settings } from 'lucide-react';

const EvPage: React.FC = () => {
    const [vehicleGroups, setVehicleGroups] = useState<VehicleGroup[]>([]);
    const [chargerGroups, setChargerGroups] = useState<ChargerGroup[]>([]);
    const [projectSite, setProjectSite] = useState<ProjectSite[]>([]);
    const [results, setResults] = useState<Results | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCalculate = async (formDataJson: { [key: string]: any }) => {
        setError(null);
        setIsLoading(true);

        try {
            const response = await fetch('http://localhost:5000/calculate_v2', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formDataJson), // Use the form data passed from EvCalculator
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const calculations = await response.json();
            // console.log('API Response:', calculations); // Log the API response

            const vehicleGroups = [];
            const chargerGroups = [];

            // Extract vehicle groups from formDataJson
            for (let i = 1; i <= 5; i++) {
                if (formDataJson[`vehicle_group_${i}_class`]) {
                    vehicleGroups.push({
                        id: i,
                        vehicleClass: formDataJson[`vehicle_group_${i}_class`],
                        numVehicles: Number(formDataJson[`vehicle_group_${i}_num`]),
                        avgDailyMileage: Number(formDataJson[`vehicle_group_${i}_mileage`]),
                    });
                }
            }

            // Extract charger groups from formDataJson
            for (let i = 1; i <= 5; i++) {
                if (formDataJson[`charger_group_${i}_num`]) {
                    chargerGroups.push({
                        id: i,
                        numChargers: Number(formDataJson[`charger_group_${i}_num`]),
                        chargerKW: Number(formDataJson[`charger_group_${i}_kw`]),
                    });
                }
            }

            // Populate projectSite with data from calculations
            const projectSiteData: ProjectSite[] = [{
                vehicle_acquisition_costs: formDataJson.vehicle_acquisition_costs,
                vehicle_maintenance_repair_costs: formDataJson.vehicle_maintenance_repair_costs,
                vehicle_insurance_costs: formDataJson.vehicle_insurance_costs,
                charger_installation_costs: formDataJson.charger_installation_costs,
                charger_maintenance_repair_network_costs: formDataJson.charger_maintenance_repair_network_costs,
                vehicle_incentive_credits: formDataJson.vehicle_incentive_credits,
                charger_incentive_credits: formDataJson.charger_incentive_credits,
                fossil_vehicle_acquisition_costs: formDataJson.fossil_vehicle_acquisition_costs,
                fossil_vehicle_maintenance_repair_costs: formDataJson.fossil_vehicle_maintenance_repair_costs,
                fossil_vehicle_insurance_costs: formDataJson.fossil_vehicle_insurance_costs
            }];

            setVehicleGroups(vehicleGroups);
            setChargerGroups(chargerGroups);
            setProjectSite(projectSiteData); // Set the projectSite with the extracted data

            setResults({
                vehicleGroups: vehicleGroups,
                chargerGroups: chargerGroups,
                projectSite: projectSiteData,
                settings: {},
                calculations: calculations
            });

            // console.log('Updated Results:', {
            //     projectSite: projectSiteData,
            // }); // Log the updated results
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <Box sx={{ width: '100%', maxWidth: '100%', mx: 'auto', overflowX: 'auto', px: '40px' }}>
            <Grid container spacing={3}>
                {/* Calculator - Left Side */}
                <Grid item xs={12} lg={4}>
                    <EvCalculator onCalculate={handleCalculate} isLoading={isLoading} />
                </Grid>

                {/* Results - Right Side */}
                <Grid item xs={12} lg={8}>
                    {error && (
                        <Box mb={3}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    )}

                    {/* Always render EvResults, passing results and isLoading */}
                    <EvResults
                        results={results ? results.calculations : null}
                        vehicleGroups={vehicleGroups}
                        chargerGroups={chargerGroups}
                        projectSite={projectSite}
                        isLoading={isLoading}
                    />
                </Grid>
            </Grid>
            <LegalDisclaimer />
        </Box>
    );
};

export default EvPage; 