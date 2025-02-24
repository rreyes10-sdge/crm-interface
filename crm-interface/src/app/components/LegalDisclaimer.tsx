import React from 'react';
import { Box, Alert, Typography } from '@mui/material';

const LegalDisclaimer: React.FC = () => {
    return (
        <Box mt={4} mb={2}>
            <Alert severity="info" sx={{ 
                backgroundColor: '#f8f9fa',
                '& .MuiAlert-message': { 
                    width: '100%'
                }
            }}>
                <Typography paragraph>
                    Please note that all cost estimates and return on investment (ROI) calculations provided by our advisors are based on current information and are subject to change over time. These projections are for informational purposes only and do not represent guaranteed results.
                </Typography>
                <Typography>
                    Additionally, while our advisors can suggest potential advantages and disadvantages of different rate plans, SDG&E does not guarantee cost savings or financial benefits from any particular rate selection. This information is not intended as financial, legal, or tax advice. Customers should consult their own advisors for guidance on these matters.
                </Typography>
            </Alert>
        </Box>
    );
};

export default LegalDisclaimer; 