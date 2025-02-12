import React from 'react';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';

interface ProjectTableValue {
    TableName: string;
    Label: string;
    Description: string;
    SortOrder: number;
    Value: string;
    Row: number;
    UpdatedAt: string;
    UpdatedBy: string;
    PhaseName: string;
    ProjectNumber: string;
    ProjectName: string;
    OrgName: string;
}

interface ProjectTableValuesProps {
    values: ProjectTableValue[];
}

const ProjectTableValues: React.FC<ProjectTableValuesProps> = ({ values }) => {
    const sortedValues = values.sort((a, b) => new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime());
    return (
        <>

                <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
                    <CardContent>
                        {sortedValues.length > 0 ? (
                            sortedValues.map((value, index) => (
                                <Box key={index} mb={2} p={2} border={1} borderColor="grey.300" borderRadius={4}>
                                    <Typography variant="subtitle2" gutterBottom>
                                        {value.ProjectName} ({value.ProjectNumber})
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Org:</strong> {value.OrgName}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Table:</strong> {value.TableName}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Label:</strong> {value.Label}
                                    </Typography>
                                    <Typography variant="body2">
                                        <strong>Value:</strong> {value.Value}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {new Date(value.UpdatedAt).toLocaleDateString()}
                                    </Typography>
                                </Box>
                            ))
                        ) : (
                            <Typography>No project table values for the selected time range.</Typography>
                        )}
                    </CardContent>
                </Card>
        </>
    );
};

export default ProjectTableValues;