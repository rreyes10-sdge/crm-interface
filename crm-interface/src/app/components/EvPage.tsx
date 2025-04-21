import React, { useState } from 'react';
import { Container, Grid, Box, Typography } from '@mui/material';
import EvCalculator from './EvCalculator';
import EvResults from './EvResults';
import LegalDisclaimer from './LegalDisclaimer';
import { Results } from '../types';

const EvPage: React.FC = () => {
    const [results, setResults] = useState<Results | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleCalculate = async (formDataJson: { [key: string]: any }) => {
        console.log('Received Form Data:', formDataJson); // Log the received form data
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
            console.log('API Response:', calculations); // Log the API response

            setResults({
                vehicleGroups: [], // Get from form data
                chargerGroups: [], // Get from form data
                settings: {}, // Get from form data
                calculations: calculations // Use the actual API response
            });
            console.log('Updated Results:', {
                vehicleGroups: [],
                chargerGroups: [],
                settings: {},
                calculations: calculations
            }); // Log the updated results
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
                <Grid item xs={12} lg={5}>
                    <EvCalculator onCalculate={handleCalculate} isLoading={isLoading} />
                </Grid>

                {/* Results - Right Side */}
                <Grid item xs={12} lg={7}>
                    {error && (
                        <Box mb={3}>
                            <Typography color="error">{error}</Typography>
                        </Box>
                    )}
                    
                    {/* Always render EvResults, passing results and isLoading */}
                    <EvResults 
                        results={results ? results.calculations : null} 
                        isLoading={isLoading}
                    />
                </Grid>
            </Grid>
            <LegalDisclaimer />
        </Box>
    );
};

export default EvPage; 