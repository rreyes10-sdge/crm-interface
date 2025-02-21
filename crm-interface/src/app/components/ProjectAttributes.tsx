import React from 'react';
import { Typography, Box, Avatar, TextField, Tooltip, FormControlLabel, Switch, IconButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useState, useEffect } from 'react';
import { ProjectServiceAttributes } from '../types';
import InfoIcon from '@mui/icons-material/Info';
import DownloadIcon from '@mui/icons-material/Download';
import CircularProgress from '@mui/material/CircularProgress';



interface ProjectAttributesProps {
    projectId: number;
    projectNumber: string;
    organizationName: string;
    coreName: string;
    serviceName: string;
}

const ProjectAttributes: React.FC<ProjectAttributesProps> = ({ projectId, projectNumber, organizationName, coreName, serviceName }) => {
    const [rows, setRows] = useState<ProjectServiceAttributes[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:5000/api/data/project-service-attributes?projectId=${projectId}&serviceName=${encodeURIComponent(serviceName)}`);
                if (!response.ok) throw new Error(`Error: ${response.status}`);
                const data = await response.json();
                setRows(data);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [projectNumber, serviceName]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            {rows.map((row, index) => (
                <Box key={index} mt={2} p={2} border={1} borderRadius={4}>
                    <Box display="flex" alignItems="center" mt={1}>
                        {row.ControlType === 'date' && (
                            <TextField
                                type="date"
                                label={row.Label}
                                value={row.Value ? new Date(row.Value).toISOString().split('T')[0] : ''}
                                InputLabelProps={{ shrink: true }}
                                fullWidth
                                margin="normal"
                            />
                        )}
                        {row.ControlType === 'yesno' && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={row.Value === 'True'}
                                        color="primary"
                                    />
                                }
                                label={row.Label}
                            />
                        )}
                        {row.ControlType === 'doc' && (
                            row.Value ? (
                                <IconButton
                                    href={row.Value}
                                    download
                                    color="primary"
                                    aria-label="download document"
                                >
                                    <DownloadIcon />
                                </IconButton>
                            ) : (
                                <Tooltip title="Document not available" arrow>
                                    <span>
                                        <IconButton
                                            color="primary"
                                            aria-label="download document"
                                            disabled
                                        >
                                            <DownloadIcon />
                                        </IconButton>
                                    </span>
                                </Tooltip>
                            )
                        )}
                        {row.ControlType === 'select' && (
                            <FormControl fullWidth margin="normal">
                                <InputLabel>{row.Label}</InputLabel>
                                <Select
                                    value={row.Value || ''}
                                    label={row.Label}
                                >
                                    {/* Replace these options with actual options */}
                                    <MenuItem value="1">Option 1</MenuItem>
                                    <MenuItem value="2">Option 2</MenuItem>
                                    <MenuItem value="3">Option 3</MenuItem>
                                    <MenuItem value="4">Option 4</MenuItem>
                                    <MenuItem value="5">Option 5</MenuItem>
                                </Select>
                            </FormControl>
                        )}
                        {row.Description && (
                            <Tooltip title={row.Description} arrow>
                                <InfoIcon sx={{ ml: 1, color: 'textSecondary' }} />
                            </Tooltip>
                        )}
                        <Avatar sx={{ width: 24, height: 24, ml: 2 }}>
                            {row.Initials}
                        </Avatar>
                    </Box>
                </Box>
            ))}
        </Box>
    );
};

export default ProjectAttributes;