'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, CircularProgress, Typography } from '@mui/material';
import { gql, useQuery } from '@apollo/client';
import getStatusColor from '../../utils/statusColor';


const GET_COMPLETED_PROJECTS = gql`
    query GetCompletedProjects {
        completedProjects {
            projectNumber
            projectId
            organizationName
            organizationId
            coreName
            serviceName
            serviceStartDate
            followUpDate
            completeDate
            latestActivity
            createdAt
        }
    }
`;

type CompletedProjectsDataGridProps = {

    rows: any;

};

const CompletedProjectsDataGrid = ({ rows: initialRows }: CompletedProjectsDataGridProps) => {
    const { loading, error, data } = useQuery(GET_COMPLETED_PROJECTS);
    const [rows, setRows] = useState<Array<{ projectId: string;[key: string]: any }>>([]);

    useEffect(() => {
        if (rows) {
            console.log(data.completedProjects); // Log the data to inspect it
            setRows(data.completedProjects);
        }
    }, [data]);

    const columns = [
        { field: 'projectNumber', headerName: 'Project Number', width: 150 },
        { field: 'organizationName', headerName: 'Organization', width: 200 },
        { field: 'coreName', headerName: 'Core Service', width: 200 },
        { field: 'serviceName', headerName: 'Service Name', width: 200 },
        { field: 'serviceStartDate', headerName: 'Service Start Date', width: 200 },
        { field: 'followUpDate', headerName: 'Follow Up Date', width: 200 },
        { field: 'completeDate', headerName: 'Complete Date', width: 200 },
        { field: 'latestActivity', headerName: 'Latest Activity', width: 200 },
        { field: 'createdAt', headerName: 'Created At', width: 200 },
    ];

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <Typography variant="h6" color="error">
                    Error loading data
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
                Completed Projects <span style={{ color: getStatusColor('Completed Projects') }}>({rows.length})</span>
            </Typography>
            <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => `${row.projectId}-${row.serviceName}`} // Ensure unique keys
                initialState={{
                    pagination: { paginationModel: { pageSize: 10 } },
                }}
                pageSizeOptions={[10, 25, 50]}
                slots={{
                    noRowsOverlay: () => (
                        <Box
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            height="100%"
                        >
                            <Box
                                display="flex"
                                flexDirection="column"
                                alignItems="center"
                                gap={1}
                            >
                                <Typography variant="h6" color="text.secondary">
                                    No matching records found
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Try adjusting your filters to find what you're looking for
                                </Typography>
                            </Box>
                        </Box>
                    ),
                }}
                sx={{
                    '& .MuiDataGrid-cell': {
                        display: 'flex',
                        alignItems: 'center',
                    },
                    '& .MuiDataGrid-row': {
                        minHeight: '60px !important',
                    }
                }}
            />
        </Box>
    );
};

export default CompletedProjectsDataGrid;