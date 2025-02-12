import { Box, Typography } from '@mui/material';
import { ProjectRow } from '../types';
import { useEffect, useState } from 'react';
import axios from 'axios';
import type { ProjectService } from '../types';
import { BarChart } from '@mui/x-charts/BarChart';

const ProjectService = ({ rows }: { rows: ProjectRow[] }) => {
    const [serviceData, setServiceData] = useState<ProjectService[]>([]);
    const [filteredServices, setFilteredServices] = useState<ProjectService[]>([]);

    useEffect(() => {
        const fetchServiceData = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/api/data/project-service');
                setServiceData(response.data);
            } catch (error) {
                console.error('Error fetching service data:', error);
            }
        };

        fetchServiceData();
    }, []);

    useEffect(() => {
        // console.log('Rows:', rows); // Log the rows prop
        // console.log('Service Data:', serviceData); // Log the fetched service data

        const filtered = serviceData.filter(service =>
            rows.some(row => row.ProjectId === service.ProjectId)
        );

        // console.log('Filtered Services:', filtered); // Log the filtered services

        setFilteredServices(filtered);
    }, [serviceData, rows]);

    const groupedByCoreName = filteredServices.reduce((acc, service) => {
        if (!acc[service.CoreName]) {
            acc[service.CoreName] = { inProgress: 0, complete: 0, notStarted: 0 };
        }
        if (service.CompleteDate && service.CompleteDate !== "None") {
            acc[service.CoreName].complete += 1;
        } else if (service.ServiceStartDate && service.ServiceStartDate !== "None") {
            acc[service.CoreName].inProgress += 1;
        } else {
            acc[service.CoreName].notStarted += 1;
        }
        return acc;
    }, {} as Record<string, { inProgress: number; complete: number; notStarted: number }>);

    console.log('Grouped By CoreName:', groupedByCoreName); // Log the grouped data

    const coreNameMapping: Record<string, string> = {
        'Fleet Electrification Planning': 'Plan',
        'Pre-Energization Support': 'Pre',
        'Post-Energization Support': 'Post',
        'Emerging Technology Consulting': 'Tech'
    };

    const originalCoreNames = Object.keys(groupedByCoreName);
    const coreNames = originalCoreNames.map(coreName => coreNameMapping[coreName] || coreName);
    const inProgressData = originalCoreNames.map(coreName => groupedByCoreName[coreName].inProgress);
    const completeData = originalCoreNames.map(coreName => groupedByCoreName[coreName].complete);
    const notStartedData = originalCoreNames.map(coreName => groupedByCoreName[coreName].notStarted);

    console.log('Core Names:', coreNames); // Log the core names
    console.log('In Progress Data:', inProgressData); // Log the in-progress data
    console.log('Complete Data:', completeData); // Log the complete data
    console.log('Not Started Data:', notStartedData); // Log the not-started data

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Services Summary
            </Typography>
            {coreNames.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                    No services found for the filtered projects.
                </Typography>
            ) : (
                <Box sx={{ height: 380, width: '100%', border: '1px solid #ccc', borderRadius: '4px', p: 2 }}>
                    <BarChart
                        yAxis={[{
                            data: coreNames,
                            scaleType: 'band',
                          }]}
                        series={[
                            { data: inProgressData, label: 'In Progress', stack: 'stack1', color: 'blue' },
                            { data: completeData, label: 'Complete', stack: 'stack1', color: 'green' },
                            { data: notStartedData, label: 'Not Started', stack: 'stack1', color: 'red' },
                        ]}
                        grid={{ vertical: true }}
                        layout="horizontal"
                    />
                </Box>
            )}
        </Box>
    );
};

export default ProjectService;