'use client';

import React, { useState, useEffect } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { gql, useQuery } from '@apollo/client';
import getStatusColor from '../../utils/statusColor';
import { Box, CircularProgress, Typography, Tooltip } from '@mui/material';
import { parseISO, isBefore, isToday, differenceInDays } from 'date-fns';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { GridRenderCellParams } from '@mui/x-data-grid';
import serviceImageMap from '@/utils/serviceImageMap';
import AddCommentIcon from '@mui/icons-material/AddComment';


const GET_PROJECTS_NOT_STARTED = gql`
    query GetProjectsNotStarted {
        projectsNotStarted {
            projectNumber
            projectId
            organizationName
            organizationId
            coreName
            serviceName
            serviceStartDate
            followUpDate
            completeDate
            totalDurationMins
            latestActivity
            createdAt
        }
    }
`;

interface Project {
    projectNumber: string;
    projectId: string;
    organizationName: string;
    organizationId: string;
    coreName: string;
    serviceName: string;
    serviceStartDate: string;
    followUpDate: string;
    completeDate: string;
    totalDurationMins; number;
    latestActivity: string;
    createdAt: string;
}

const renderCoreServiceCell = (params: GridRenderCellParams<Project>) => {
    const serviceName = params.value as keyof typeof serviceImageMap;
    const imagePath = serviceImageMap[serviceName];

    if (imagePath) {
        return (
            <img
                src={imagePath}
                alt={serviceName}
                title={serviceName}
                width="32"
                height="32"
            />
        );
    }

    return serviceName;
};

const renderNoErrorDateCell = (params: GridRenderCellParams<Project>, dateField: keyof Project) => {
    const dateValue = params.row[dateField];
    const parsedDate = parseISO(dateValue);
    const daysSince = differenceInDays(new Date(), parsedDate);

    return (
        <Tooltip title={`${dateValue} (${daysSince} days ago)`}>
            <Box display="flex" alignItems="center">
                <Typography sx={{ marginRight: 1 }}>
                    {dateValue}
                </Typography>
            </Box>
        </Tooltip>
    );
};

const renderDateCell = (params: GridRenderCellParams<Project>, dateField: keyof Project) => {
    const dateValue = params.row[dateField];
    const parsedDate = parseISO(dateValue);
    const isOverdue = isBefore(parsedDate, new Date()) && !isToday(parsedDate);
    const daysSince = differenceInDays(new Date(), parsedDate);

    return (
        <Tooltip title={`${dateValue} (${daysSince} days ago)`}>
            <Box display="flex" alignItems="center">
                <Typography color={isOverdue ? 'error' : 'inherit'} sx={{ marginRight: 1 }}>
                    {dateValue}
                </Typography>
                {isOverdue && <ErrorOutlineIcon color="error" />}
            </Box>
        </Tooltip>
    );
};

type ProjectsNotStartedDataGridProps = {

    rows: any;

};

const ProjectsNotStartedDataGrid = ({ rows: initialRows }: ProjectsNotStartedDataGridProps) => {
    const { loading, error, data } = useQuery(GET_PROJECTS_NOT_STARTED);
    const [rows, setRows] = useState<Array<{ projectId: string;[key: string]: any }>>([]);

    useEffect(() => {
        if (rows) {
            console.log(data.projectsNotStarted); // Log the data to inspect it
            setRows(data.projectsNotStarted);
        }
    }, [data]);

    const columns = [
        {
            field: 'projectNumber',
            headerName: 'Project Number',
            width: 125,
            renderCell: (params: GridRenderCellParams<Project>) => (
                <a href={`https://ctsolutions.sempra.com/projects/${params.row.projectId}`} target="_blank" rel="noopener noreferrer">
                    {params.value}
                </a>
            )
        },
        {
            field: 'organizationName',
            headerName: 'Organization',
            width: 250,
            renderCell: (params: GridRenderCellParams<Project>) => (
                <a href={`https://ctsolutions.sempra.com/organizations/${params.row.organizationId}`} target="_blank" rel="noopener noreferrer">
                    {params.value}
                </a>
            )
        },
        { field: 'coreName', headerName: 'Core', width: 60, renderCell: renderCoreServiceCell },
        { field: 'serviceName', headerName: 'Service Name', width: 280 },
        { field: 'actionButton', headerName: 'Action', width: 60, renderCell: (params) => <AddCommentIcon /> },
        { field: 'serviceStartDate', headerName: 'Service Start Date', width: 160 },
        { field: 'followUpDate', headerName: 'Follow Up Date', width: 160 },
        { field: 'totalDurationMins', headerName: 'Duration Logged', width: 140 },
        // { field: 'completeDate', headerName: 'Complete Date', width: 200 },
        { field: 'latestActivity', headerName: 'Latest Activity', width: 500 },
        { field: 'createdAt', headerName: 'Latest Activity Date', width: 180 },
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
                Services Not Started <span style={{ color: getStatusColor('Projects Not Started') }}>({rows.length})</span>
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

export default ProjectsNotStartedDataGrid;