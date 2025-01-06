import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { gql, useQuery } from '@apollo/client';
import FollowUpDataGrid from './FollowUpDataGrid';
import ServicesStartedDataGrid from './ServicesStartedDataGrid';
import ProjectsNotStartedDataGrid from './ProjectsNotStartedDataGrid';
import CompletedProjectsDataGrid from './CompletedProjectsDataGrid';
import KanbanBoard from './KanbanBoard';
import hashStringToNumber from '../../utils/hashStringToNumber';

const GET_ALL_PROJECTS = gql`
    query GetAllProjects {
        projectsWithFollowUpDates {
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
        servicesStarted {
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
            latestActivity
            createdAt
        }
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

type Project = {
    projectNumber: string;
    projectId: string;
    organizationName: string;
    organizationId: string;
    coreName: string;
    serviceName: string;
    serviceStartDate: string;
    followUpDate: string;
    completeDate: string;
    latestActivity: string;
    createdAt: string;
};

type Task = {
    id: number;
    projectNumber: string;
    projectId: string;
    organizationName: string;
    organizationId: string;
    coreName: string;
    serviceName: string;
    serviceStartDate: string;
    followUpDate: string;
    completeDate: string;
    latestActivity: string;
    createdAt: string;
    status: string;
};

const ProjectTracker = () => {
    const [view, setView] = useState('table');
    const { loading, error, data } = useQuery(GET_ALL_PROJECTS);
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        if (data) {
            const combinedTasks: Task[] = [
                ...data.projectsWithFollowUpDates.map((task: Project) => ({ ...task, id: hashStringToNumber(`${task.projectId}-${task.serviceName}`), status: 'Follow Up Dates' })),
                ...data.servicesStarted.map((task: Project) => ({ ...task, id: hashStringToNumber(`${task.projectId}-${task.serviceName}`), status: 'Services Started' })),
                ...data.projectsNotStarted.map((task: Project) => ({ ...task, id: hashStringToNumber(`${task.projectId}-${task.serviceName}`), status: 'Services Not Started' })),
                ...data.completedProjects.map((task: Project) => ({ ...task, id: hashStringToNumber(`${task.projectId}-${task.serviceName}`), status: 'Completed Services' })),
            ];
            setTasks(combinedTasks);
        }
    }, [data]);

    const toggleView = () => {
        setView(view === 'table' ? 'kanban' : 'table');
    };

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
        <Box sx={{ width: '100%', maxWidth: '100%', mx: 'auto', overflowX: 'auto', marginLeft: 0, marginRight: 0 }}>
            <Box display="flex" justifyContent="center" sx={{ mb: 2, marginLeft: 0, marginRight: 0 }}>
                <Button variant="contained" onClick={toggleView}>
                    {view === 'table' ? 'Switch to Kanban View' : 'Switch to Table View'}
                </Button>
            </Box>
            {view === 'table' ? (
                <>
                    <FollowUpDataGrid rows={data.projectsWithFollowUpDates} />
                    <br></br>
                    <ServicesStartedDataGrid rows={data.servicesStarted} />
                    <br></br>
                    <ProjectsNotStartedDataGrid rows={data.projectsNotStarted} />
                    <br></br>
                    <CompletedProjectsDataGrid rows={data.completedProjects} />
                </>
            ) : (
                <KanbanBoard tasks={tasks} />
            )}
        </Box>
    );
};

export default ProjectTracker;