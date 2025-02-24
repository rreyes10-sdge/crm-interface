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

    const handleCalculate = async (formData: FormData) => {
        setError(null);
        setIsLoading(true);

        try {
            // TODO: Replace with actual API call
            const mockCalculations = {
                annualFuelSavings: 50000,
                totalCost: 250000,
                paybackPeriod: 5,
                co2Reduction: 100
            };

            setResults({
                vehicleGroups: [], // Get from form data
                chargerGroups: [], // Get from form data
                settings: {}, // Get from form data
                calculations: mockCalculations
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container maxWidth="xl" disableGutters>
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
                    
                    {results && (
                        <EvResults 
                            results={results.calculations} 
                            isLoading={isLoading}
                        />
                    )}
                </Grid>
            </Grid>
            <LegalDisclaimer />
        </Container>
    );
};

export default EvPage; 