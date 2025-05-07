// crm-interface/src/app/components/KanbanBoardv2.tsx
import React, { useEffect, useState } from 'react';
import {
    DragDropContext,
    Droppable,
    Draggable,
    DropResult,
} from 'react-beautiful-dnd';
import { Box, Typography, Paper, Tooltip } from '@mui/material';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddTaskIcon from '@mui/icons-material/AddTask';
import { InfoOutlined } from '@mui/icons-material';
import Divider from '@mui/material/Divider';

interface KanbanBoardProps {
    services: { id: string; projectId: any; name: string; status: string }[];
}

const statuses = [
    'Backlog',
    'Waiting on Customer',
    'Ready to Start',
    'In Progress',
    'Customer Verification',
    'Completed',
];

const statusIcons: { [key: string]: React.ReactNode } = {
    'Backlog': <ListAltIcon />,
    'Waiting on Customer': <HourglassEmptyIcon />,
    'Ready to Start': <PlayArrowIcon />,
    'In Progress': <PlaylistAddCheckIcon />,
    'Customer Verification': <AddTaskIcon />,
    'Completed': <CheckCircleIcon />,
};

const statusColors: { [key: string]: string } = {
    'Backlog': '#f5f5f5',
    'Waiting on Customer': '#41B9EA',
    'Ready to Start': '#8BD2D3',
    'In Progress': '#e8f5e9',
    'Customer Verification': '#FDC88A',
    'Completed': '#A4C494',
};

const statusTooltips: { [key: string]: string } = {
    'Backlog': 'Services that have not been reviewed and assigned a status yet.',
    'Waiting on Customer': 'Services that require customer readiness, or other approval/resource or another valid reason as to why it is not Ready to Start',
    'Ready to Start': 'All dependencies are met (internal dependencies and customer readiness) and is ready to be set to "In Progress"',
    'In Progress': 'Services actively being worked',
    'Customer Verification': 'Deliverable sent over to the customer via email or customer portal. Pending customer approval to close out this service.',
    'Completed': 'Customer received deliverable and has signed off on the service. No further action is required',
};

const KanbanBoardv2: React.FC<KanbanBoardProps> = ({ services }) => {
    const [serviceList, setServiceList] = useState(services);

    useEffect(() => {
        setServiceList(services);
    }, [services]);

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;
        if (!destination) return;

        // Group services by status.
        const columns: { [key: string]: typeof serviceList } = {};
        statuses.forEach((status) => {
            columns[status] = serviceList.filter(
                (service) => service.status === status
            );
        });

        const sourceColumn = columns[source.droppableId];
        const draggedItem = sourceColumn[source.index];
        if (!draggedItem) return;

        // Remove the item from its source column.
        sourceColumn.splice(source.index, 1);

        // Update the service's status.
        draggedItem.status = destination.droppableId;

        // Insert the item into the destination column.
        const destinationColumn = columns[destination.droppableId];
        destinationColumn.splice(destination.index, 0, draggedItem);

        // Reassemble the overall list based on the order of statuses.
        const newServiceList = statuses.reduce(
            (acc, status) => acc.concat(columns[status]),
            [] as typeof serviceList
        );
        setServiceList(newServiceList);
    };

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <Box display="flex" gap={2} flexWrap="nowrap" mt={2}>
                {statuses.map((status) => {
                    const filteredServices = serviceList.filter(
                        (service) => service.status === status
                    );
                    return (
                        <Droppable key={status} droppableId={status}>
                            {(provided) => (
                                // Wrap in a plain div so the ref is assigned to a native DOM element.
                                <div
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    style={{ flex: 1 }}
                                >
                                    <Paper
                                        sx={{
                                            padding: 2,
                                            backgroundColor: statusColors[status],
                                            minHeight: '400px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        <Typography
                                            variant="h6"
                                            display="flex"
                                            alignItems="center"
                                            gap={1}
                                            noWrap
                                            sx={{
                                                minHeight: '54px',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {statusIcons[status]} {status} ({filteredServices.length})
                                            <Tooltip title={statusTooltips[status]} arrow>
                                                <InfoOutlined fontSize="small" sx={{ cursor: 'pointer' }} />
                                            </Tooltip>
                                        </Typography>

                                        <Divider />

                                        {filteredServices.map((service, index) => (
                                            <Draggable
                                                key={service.id}
                                                draggableId={service.id}
                                                index={index}
                                            >
                                                {(provided) => (
                                                    // Use a plain div to attach draggable refs and props.
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}
                                                        style={{
                                                            margin: '8px 0',
                                                            ...provided.draggableProps.style,
                                                        }}
                                                    >
                                                        <Paper sx={{ padding: 2 }}>{service.name}</Paper>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </Paper>
                                </div>
                            )}
                        </Droppable>
                    );
                })}
            </Box>
        </DragDropContext>
    );
};

export default KanbanBoardv2;