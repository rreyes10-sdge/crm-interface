import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, CardActions, Collapse, CardHeader } from '@mui/material';
import getStatusColor from '../../utils/statusColor';
import serviceImageMap from '../../utils/serviceImageMap';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BallotOutlinedIcon from '@mui/icons-material/BallotOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';
import IconButton, { IconButtonProps } from '@mui/material/IconButton';
import ProjectAttributes from './ProjectAttributes';


const statuses = ['Services Not Started', 'Services Started', 'Follow Up Dates', 'Completed Services'];

interface Task {
    id: number;
    status: string;
    projectId: string;
    projectNumber: string;
    organizationName: string;
    coreName: string;
    serviceName: string;
    latestActivity: string;
    totalRequired: number;
    filledCount: number;
}

interface KanbanBoardProps {
    tasks: Task[];
}

interface ExpandMoreProps extends IconButtonProps {
    expand: boolean;
}

const ExpandMore = styled((props: ExpandMoreProps) => {
    const { expand, ...other } = props;
    return <IconButton {...other} />;
})(({ theme, expand }) => ({
    marginLeft: 'auto',
    transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
    }),
    transform: !expand ? 'rotate(0deg)' : 'rotate(180deg)',
}));

const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks }) => {
    const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);

    const handleExpandClick = (taskId: number) => {
        console.log(`Clicked task ID: ${taskId}`);
        setExpandedTaskId(expandedTaskId === taskId ? null : taskId);
        console.log(`Expanded task ID: ${expandedTaskId === taskId ? null : taskId}`);
    };

    return (
        <Box>
            <Box display="flex" justifyContent="space-between" sx={{ overflowX: 'auto' }}>
                {statuses.map((status) => {
                    const filteredTasks = tasks.filter((task) => task.status === status);

                    return (
                        <Box
                            key={status}
                            sx={{
                                backgroundColor: '#f4f5f7',
                                padding: 2,
                                width: '24%',
                                minHeight: 500,
                                marginRight: 2,
                            }}
                        >
                            <Typography variant="h6" sx={{ mb: 2 }}>
                                {status} <span style={{ color: getStatusColor(status) }}>({filteredTasks.length})</span>
                            </Typography>
                            {filteredTasks.map((task) => (
                                <Card key={task.id} sx={{ marginBottom: 2 }}>
                                    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                                        <img
                                            src={serviceImageMap[task.coreName as keyof typeof serviceImageMap]}
                                            alt={task.serviceName}
                                            title={task.serviceName}
                                            width="32"
                                            height="32"
                                            style={{ marginRight: 8 }}
                                        />
                                        <Box>
                                            <Typography variant="caption">
                                                {task.projectNumber}
                                            </Typography>
                                            <Typography variant="h6">
                                                {task.organizationName}
                                            </Typography>
                                            <Typography>
                                                <strong>Service:</strong> {task.serviceName}
                                            </Typography>
                                        </Box>
                                    </CardContent>
                                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }} />
                                    <CardActions disableSpacing>
                                        <Box sx={{ display: 'flex', alignItems: 'center', marginRight: 2 }}>
                                            <ExpandMore
                                                expand={expandedTaskId === task.id}
                                                onClick={() => handleExpandClick(task.id)}
                                                aria-expanded={expandedTaskId === task.id}
                                                aria-label="show more"
                                            >
                                                <BallotOutlinedIcon />
                                                <Typography variant="body2" sx={{ marginLeft: 1 }}>
                                                    {task.filledCount} / {task.totalRequired}
                                                </Typography>
                                            </ExpandMore>
                                        </Box>
                                        {task.latestActivity !== "No recorded activity yet" && (
                                            <ExpandMore
                                                expand={expandedTaskId === task.id + 1000} // Use a different ID for latest activity
                                                onClick={() => handleExpandClick(task.id + 1000)}
                                                aria-expanded={expandedTaskId === task.id + 1000}
                                                aria-label="show latest activity"
                                            >
                                                {expandedTaskId === task.id + 1000 ? <ExpandMoreIcon /> : <ChatBubbleOutlineIcon />}
                                            </ExpandMore>
                                        )}
                                    </CardActions>
                                    <Collapse in={expandedTaskId === task.id} timeout="auto" unmountOnExit>
                                        <CardContent>
                                            <ProjectAttributes
                                                projectId={task.projectId}
                                                projectNumber={task.projectNumber}
                                                organizationName={task.organizationName}
                                                coreName={task.coreName}
                                                serviceName={task.serviceName}
                                            />
                                        </CardContent>
                                    </Collapse>
                                    <Collapse in={expandedTaskId === task.id + 1000} timeout="auto" unmountOnExit>
                                        <CardContent>
                                            <Typography>
                                                <strong>Latest Activity:</strong> {task.latestActivity}
                                            </Typography>
                                        </CardContent>
                                    </Collapse>
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