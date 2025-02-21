import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress, FormControl, InputLabel, MenuItem, Select, SelectChangeEvent  } from '@mui/material';
import { gql, useQuery } from '@apollo/client';
import FollowUpDataGrid from './FollowUpDataGrid';
import ServicesStartedDataGrid from './ServicesStartedDataGrid';
import ProjectsNotStartedDataGrid from './ProjectsNotStartedDataGrid';
import CompletedProjectsDataGrid from './CompletedProjectsDataGrid';
import KanbanBoard from './KanbanBoard';
import hashStringToNumber from '../../utils/hashStringToNumber';

const GET_ALL_PROJECTS = gql`
    query {
        projectsWithFollowUpDates {
            projectNumber
            projectId
            phaseId
            projectName
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
            totalRequired
            filledCount
        }
        servicesStarted {
            projectNumber
            projectId
            phaseId
            projectName
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
            totalRequired
            filledCount
        }
        projectsNotStarted {
            projectNumber
            projectId
            phaseId
            projectName
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
            totalRequired
            filledCount
        }
        completedProjects {
            projectNumber
            projectId
            phaseId
            projectName
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
            totalRequired
            filledCount
        }
    }
`;

export interface Project {
    projectNumber: string;
    projectId: number;
    phaseId: number;
    projectName: string;
    organizationName: string;
    organizationId: number;
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

type Task = Project & {
    id: number;
    status: string;
};

const ProjectTracker = () => {
    const [view, setView] = useState('table');
    const { loading, error, data } = useQuery(GET_ALL_PROJECTS);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedOrganization, setSelectedOrganization] = useState('All');

    const handleOrganizationChange = (event: SelectChangeEvent) => {
        setSelectedOrganization(event.target.value);
    };

    useEffect(() => {
        if (data) {
            const filteredProjectsWithFollowUpDates = selectedOrganization === 'All' ? data.projectsWithFollowUpDates : data.projectsWithFollowUpDates.filter((project: Project) => project.organizationName === selectedOrganization);
            const filteredServicesStarted = selectedOrganization === 'All' ? data.servicesStarted : data.servicesStarted.filter((project: Project) => project.organizationName === selectedOrganization);
            const filteredProjectsNotStarted = selectedOrganization === 'All' ? data.projectsNotStarted : data.projectsNotStarted.filter((project: Project) => project.organizationName === selectedOrganization);
            const filteredCompletedProjects = selectedOrganization === 'All' ? data.completedProjects : data.completedProjects.filter((project: Project) => project.organizationName === selectedOrganization);

            const combinedTasks: Task[] = [
                ...filteredProjectsWithFollowUpDates.map((task: Project) => ({ ...task, id: hashStringToNumber(`${task.projectId}-${task.serviceName}`), status: 'Overdue Follow Ups' })),
                ...filteredServicesStarted.map((task: Project) => ({ ...task, id: hashStringToNumber(`${task.projectId}-${task.serviceName}`), status: 'Services Started' })),
                ...filteredProjectsNotStarted.map((task: Project) => ({ ...task, id: hashStringToNumber(`${task.projectId}-${task.serviceName}`), status: 'Services Not Started' })),
                ...filteredCompletedProjects.map((task: Project) => ({ ...task, id: hashStringToNumber(`${task.projectId}-${task.serviceName}`), status: 'Completed Services' })),
            ];
            setTasks(combinedTasks);
        }
    }, [data, selectedOrganization]);

    const toggleView = () => {
        setView(view === 'table' ? 'kanban' : 'table');
    };

    if (loading) {
        console.log('Loading state active');
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        console.log('GraphQL Error:', error);
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <Typography variant="h6" color="error">
                    Error loading data: {error.message}
                </Typography>
            </Box>
        );
    }

    if (!data) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
            </Box>
        );
    }

    const getUniqueOrganizations = () => {
        const allOrganizations = [
            ...data.projectsWithFollowUpDates,
            ...data.servicesStarted,
            ...data.projectsNotStarted,
            ...data.completedProjects
        ].map((project: Project) => project.organizationName);
        return ['All', ...new Set(allOrganizations)];
    };

    return (
        <Box sx={{ width: '100%', maxWidth: '100%', mx: 'auto', overflowX: 'auto', marginLeft: 0, marginRight: 0 }}>
            <Box display="flex" justifyContent="center" sx={{ mb: 2, marginLeft: 0, marginRight: 0 }}>
                <Button variant="contained" onClick={toggleView}>
                    {view === 'table' ? 'Switch to Kanban View' : 'Switch to Table View'}
                </Button>
            </Box>
            <FormControl sx={{ minWidth: 200, mb: 2 }}>
                <InputLabel>Organization</InputLabel>
                <Select
                    value={selectedOrganization}
                    onChange={handleOrganizationChange}
                    label="Organization"
                >
                    {getUniqueOrganizations().map((org) => (
                        <MenuItem key={org} value={org}>
                            {org}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            {view === 'table' ? (
                <>
                    <FollowUpDataGrid rows={tasks.filter(task => task.status === 'Overdue Follow Ups')} />
                    <br />
                    <ServicesStartedDataGrid rows={tasks.filter(task => task.status === 'Services Started')} />
                    <br />
                    <ProjectsNotStartedDataGrid rows={tasks.filter(task => task.status === 'Services Not Started')} />
                    <br />
                    <CompletedProjectsDataGrid rows={tasks.filter(task => task.status === 'Completed Services')} />
                </>
            ) : (
                <KanbanBoard tasks={tasks} />
            )}
        </Box>
    );
};

export default ProjectTracker;