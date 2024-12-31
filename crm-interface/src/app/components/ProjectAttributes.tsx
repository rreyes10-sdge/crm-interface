import React from 'react';
import { Typography, Box } from '@mui/material';

interface ProjectAttributesProps {
    projectNumber: string;
    organizationName: string;
    coreName: string;
    serviceName: string;
    latestActivity: string;
}

const ProjectAttributes: React.FC<ProjectAttributesProps> = ({ projectNumber, organizationName, coreName, serviceName }) => {
    return (
        <Box>
            <Typography variant="body2">
                <strong>Project Number:</strong> {projectNumber}
            </Typography>
            <Typography variant="body2">
                <strong>Organization Name:</strong> {organizationName}
            </Typography>
            <Typography variant="body2">
                <strong>Core Name:</strong> {coreName}
            </Typography>
            <Typography variant="body2">
                <strong>Service Name:</strong> {serviceName}
            </Typography>
        </Box>
    );
};

export default ProjectAttributes;