import React from 'react';
import { Box, Typography, Card, CardContent } from '@mui/material';
import getStatusColor from '../../utils/statusColor';

const statuses = ['Projects Not Started', 'Services Started', 'Follow Up Dates', 'Completed Projects'];

interface Task {
    id: number;
    status: string;
    projectNumber: string;
    organizationName: string;
    coreName: string;
    serviceName: string;
    latestActivity: string;
}

interface KanbanBoardProps {
    tasks: Task[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks }) => {
    return (
        <Box>
            <Typography component="h3" variant="h6" sx={{ mb: 2 }}>
                Kanban Board View
            </Typography>
            <Box display="flex" justifyContent="space-between" sx={{ overflowX: 'auto' }}>
                {statuses.map((status) => {
                    const filteredTasks = tasks.filter((task) => task.status === status);

                    return (
                        <Box
                            key={status}
                            sx={{
                                backgroundColor: '#f4f5f7',
                                padding: 2,
                                width: '24%', // Increase the width of each column
                                minHeight: 500,
                                marginRight: 2,
                            }}
                        >
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                {status} <span style={{ color: getStatusColor(status) }}>({filteredTasks.length})</span>
                            </Typography>
                            {filteredTasks.map((task) => (
                                <Card key={`${task.projectNumber}-${task.serviceName}`} sx={{ marginBottom: 2 }}>
                                    <CardContent>
                                        <Typography variant="h6">
                                            {task.projectNumber} - {task.organizationName}
                                        </Typography>
                                        <Typography>
                                            <strong>Service:</strong> {task.serviceName}
                                        </Typography>
                                        <Typography>
                                            <strong>Latest Activity:</strong> {task.latestActivity}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            ))}
                        </Box>
                    );
                })}
            </Box>
        </Box>
    );
};

export default KanbanBoard;