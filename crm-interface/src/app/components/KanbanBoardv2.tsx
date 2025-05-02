// crm-interface/src/app/components/KanbanBoardv2.tsx
import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Box, Typography, Paper } from '@mui/material';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';

interface KanbanBoardProps {
    services: { id: string; projectId: any; name: string; status: string }[];
}

const statuses = ['Backlog', 'Waiting on Customer', 'Ready to Start', 'In Progress', 'Completed'];

const statusIcons: { [key: string]: React.ReactNode } = {
    'Backlog': <ListAltIcon />,
    'Waiting on Customer': <HourglassEmptyIcon />,
    'Ready to Start': <PlayArrowIcon />,
    'In Progress': <PlaylistAddCheckIcon />,
    'Completed': <CheckCircleIcon />
};

const statusColors: { [key: string]: string } = {
    'Backlog': '#f5f5f5',
    'Waiting on Customer': '#fff3e0',
    'Ready to Start': '#e3f2fd',
    'In Progress': '#e8f5e9',
    'Completed': '#ede7f6'
};


const KanbanBoard: React.FC<KanbanBoardProps> = ({ services }) => {
    const [serviceList, setServiceList] = useState(services);

    useEffect(() => {
        setServiceList(services);
    }, [services]);

    // console.log("Kanban input services:", services);

    const onDragEnd = (result: any) => {
        if (!result.destination) return;

        const updatedServices = Array.from(serviceList);
        const [movedService] = updatedServices.splice(result.source.index, 1);
        movedService.status = result.destination.droppableId;
        updatedServices.splice(result.destination.index, 0, movedService);

        setServiceList(updatedServices);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box display="flex" justifyContent="space-between">
                {statuses.map((status) => {
                    const filteredServices = serviceList.filter(service => service.status === status);
                    return (
                        <Droppable key={status} droppableId={status}>
                            {(provided) => (
                                <Paper
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    sx={{
                                        width: '18%',
                                        padding: 2,
                                        margin: 1,
                                        backgroundColor: statusColors[status],
                                        minHeight: '400px'
                                    }}
                                >
                                    <Typography variant="h6" display="flex" alignItems="center" gap={1}>
                                        {statusIcons[status]} {status} ({filteredServices.length})
                                    </Typography>
                                    {filteredServices.map((service, index) => (
                                        <Draggable key={service.id} draggableId={service.id} index={index}>
                                            {(provided) => (
                                                <Paper
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    sx={{ margin: '8px 0', padding: 2 }}
                                                >
                                                    {service.name}
                                                </Paper>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </Paper>
                            )}
                        </Droppable>
                    );
                })}
            </Box>
        </DragDropContext>
    );
};

export default KanbanBoard;