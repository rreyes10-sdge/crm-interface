import React from 'react';
import { Typography, Box } from '@mui/material';

const EvResults: React.FC<{ results: any }> = ({ results }) => {
    return (
        <Box mt={4}>
            <Typography variant="h5">Calculation Results</Typography>
            <pre>{JSON.stringify(results, null, 2)}</pre>
        </Box>
    );
};

export default EvResults;