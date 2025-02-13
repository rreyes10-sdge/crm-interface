'use client';

import { DataGrid } from '@mui/x-data-grid';
import getStatusColor from '../../utils/statusColor';
import { Box, Typography, Tooltip } from '@mui/material';
import { parseISO, isBefore, isToday, differenceInBusinessDays  } from 'date-fns';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { GridRenderCellParams } from '@mui/x-data-grid';
import serviceImageMap from '@/utils/serviceImageMap';
import AddCommentIcon from '@mui/icons-material/AddComment';

interface Project {
    projectNumber: string;
    projectId: string;
    phaseId: string;
    organizationName: string;
    organizationId: string;
    coreName: string;
    serviceName: string;
    serviceStartDate: string;
    followUpDate: string;
    completeDate: string;
    totalDurationMins: number;
    latestActivity: string;
    createdAt: string;
    totalRequired: number;
    filledCount: number;
    filledVsTotal: number;
    actionButton: number;
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
    const parsedDate = parseISO(dateValue.toString());
    const daysSince = differenceInBusinessDays (new Date(), parsedDate);

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
    const parsedDate = parseISO(dateValue.toString());
    const isOverdue = isBefore(parsedDate, new Date()) && !isToday(parsedDate);
    const daysSince = differenceInBusinessDays (new Date(), parsedDate);

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

const ProjectsNotStartedDataGrid = ({ rows }: ProjectsNotStartedDataGridProps) => {
    interface Column {
        field: keyof Project;
        headerName: string;
        width: number;
        renderCell?: (params: GridRenderCellParams<Project>) => React.ReactNode;
    }

    const columns = [
        {
            field: 'projectNumber',
            headerName: 'Project Number',
            width: 125,
            renderCell: (params: GridRenderCellParams<Project>) => (
                <a href={`https://ctsolutions.sempra.com/projects/${params.row.projectId}?phase=${params.row.phaseId}`} target="_blank" rel="noopener noreferrer">
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
        { field: 'actionButton', headerName: 'Action', width: 60, renderCell: (params: any) => <AddCommentIcon /> },
        { field: 'serviceStartDate', headerName: 'Service Start Date', width: 160 },
        { field: 'followUpDate', headerName: 'Follow Up Date', width: 160 },
        { field: 'totalDurationMins', headerName: 'Duration Logged', width: 140 },
        // { field: 'completeDate', headerName: 'Complete Date', width: 200 },
        { field: 'latestActivity', headerName: 'Latest Activity', width: 500 },
        { field: 'createdAt', headerName: 'Latest Activity Date', width: 180 },
        // { field: 'totalRequired', headerName: 'Total Required', width: 50 },
        // { field: 'filledCount', headerName: 'Filled Count', width: 50 },
        {
            field: 'filledVsTotal',
            headerName: 'Filled vs Total',
            width: 130,
            renderCell: (params: { row: { totalRequired: any; filledCount: any; }; }) => {
                const { totalRequired, filledCount } = params.row;
                return `${filledCount} / ${totalRequired}`;
            },
        },
    ];

    return (
        <Box>
            <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
                Services Not Started <span style={{ color: getStatusColor('Services Not Started') }}>({rows.length})</span>
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
                        minHeight: '40px !important',
                    }
                }}
            />
        </Box>
    );
};

export default ProjectsNotStartedDataGrid;