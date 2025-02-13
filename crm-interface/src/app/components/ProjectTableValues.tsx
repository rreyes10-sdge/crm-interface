import React from 'react';
import { Card, CardContent, Typography, Box, Grid } from '@mui/material';

interface ProjectTableValue {
    TableName: string;
    Description: string;
    SortOrder: number;
    Value: string;
    Row: number;
    UpdatedAt: string;
    UpdatedBy: string;
    ProjectNumber: string;
    ProjectName: string;
    OrgName: string;
    ProjectId: number;
    PhaseId: number;
    TableId: number;
    TableColumnId: number;
    Label: string;
}

interface ProjectTableValuesProps {
    values: ProjectTableValue[];
}

const ProjectTableValues: React.FC<ProjectTableValuesProps> = ({ values }) => {
    const groupedValues = values.reduce((acc, value) => {
        const projectKey = `${value.ProjectId}-${value.TableId}-${value.Row}`;
        if (!acc[projectKey]) {
            acc[projectKey] = [];
        }
        acc[projectKey].push(value);
        return acc;
    }, {} as Record<string, ProjectTableValue[]>);

    const sortedGroupedValues = Object.entries(groupedValues).sort(
        ([, a], [, b]) => new Date(b[0].UpdatedAt).getTime() - new Date(a[0].UpdatedAt).getTime()
    );

    return (
        <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
            <CardContent>
                {sortedGroupedValues.length > 0 ? (
                    sortedGroupedValues.map(([key, group]) => (
                        <Box key={key} mb={2} p={2} border={1} borderColor="grey.300" borderRadius={4}>
                            <a
                                href={`https://ctsolutions.sempra.com/projects/${group[0].ProjectId}?phase=${group[0].PhaseId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                                <strong>{group[0].ProjectNumber} - {group[0].OrgName}</strong>
                            </a>
                            <Typography variant="body2">
                                <strong>Org:</strong> {group[0].OrgName}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Table:</strong> {group[0].TableName}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Row Number:</strong> {group[0].Row}
                            </Typography>
                            <Grid container spacing={2} mt={1}>
                                {group.map((value, index) => (
                                    <Grid item xs={12} sm={6} md={4} key={index}>
                                        <Typography variant="body2">
                                            <strong>{value.Label}:</strong> {value.Value}
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            {new Date(value.UpdatedAt).toLocaleDateString()}
                                        </Typography>
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))
                ) : (
                    <Typography>No project table values for the selected time range.</Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default ProjectTableValues;