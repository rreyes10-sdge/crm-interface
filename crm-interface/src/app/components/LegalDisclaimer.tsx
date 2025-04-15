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
                {/* <Typography>
                    Please note that all cost estimates and return on investment (ROI) calculations provided by our advisors are based on current information and are subject to change over time. These projections are for informational purposes only and do not represent guaranteed results.
                </Typography>
                <Typography>
                    Additionally, while our advisors can suggest potential advantages and disadvantages of different rate plans, SDG&E does not guarantee cost savings or financial benefits from any particular rate selection. This information is not intended as financial, legal, or tax advice. Customers should consult their own advisors for guidance on these matters.
                </Typography> */}
                <Typography>
                    No Reliance and Waiver of Claims: Neither customer, nor its agents or representatives, may rely on any estimate or statements made, as a courtesy, by SDG&E provided in this document.  Customer, and its agents and representatives, waive any right to assert any claim based on reliance on any such estimate or statements.
                </Typography>
                <br></br>
                <Typography>
                    “Estimated Available Transformer Capacity” and “Estimated Available Capacity” shall mean: Based on a summary review, and not a detailed study, these estimates show how much energy could flow at a certain location. These estimates are for initial planning purposes, and additional studies are required prior to interconnection.  The actual capacity available, after detailed study or after the passing of time, may differ from this estimate. These estimates do not indicate whether upgrades are required, the cost of interconnection, or the timing of available capacity.  The Estimated Available Capacity shown above is not reserved, guaranteed, or otherwise promised to customer or site.
                </Typography>
                <br></br>
                <Typography>
                    These estimates do not indicate whether upgrades are required, the cost of interconnection, or the timing of available capacity.  The Estimated Available Capacity shown above is not reserved, guaranteed, or otherwise promised to customer or site.
                </Typography>
            </Alert>
        </Box>
    );
};

export default LegalDisclaimer; 