'use client';

import { DataGrid } from '@mui/x-data-grid';
import { useState, useEffect } from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import { MenuItem, Select, FormControl, InputLabel, Box, SelectChangeEvent, Chip, LinearProgress, Tooltip, Typography } from '@mui/material';
import { ProjectRow } from '../types';
import { projectData } from '../data/staticData';
import { ActiveFilterChip } from './ActiveFilterChips';
import ProjectStatusFilter from './ProjectStatusFilter';



const CustomizedDataGrid = () => {
  const [rows, setRows] = useState<ProjectRow[]>([]);
  const [filteredRows, setFilteredRows] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedOrganizations, setSelectedOrganizations] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://127.0.0.1:5000/api/data/summary');
        if (!response.ok) throw new Error(`Error: ${response.status}`);
        const data = await response.json();

        if (data && data.length > 0) {
          setRows(data);
          setFilteredRows(data);
        } else {
          // Fallback to static data if API returns empty
          setRows(projectData);
          setFilteredRows(projectData);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
        // Fallback to static data on error
        setRows(projectData);
        setFilteredRows(projectData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateDaysBetween = (startDate: string | null, endDate: string | null) => {
    const today = new Date().toISOString().split('T')[0];
    const start = startDate && startDate !== "None" ? new Date(startDate) : new Date(today);
    const end = endDate && endDate !== "None" ? new Date(endDate) : new Date(today);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateColorIntensity = (daysOverTarget: number, targetDays: number) => {
    const maxIntensity = 255; 
    const intensity = Math.min((1 / (daysOverTarget / targetDays)) * 255, maxIntensity);
    return `rgba(${intensity}, 0, 0)`;
  };

  const columns = [
    {
      field: 'ProjectNumber',
      headerName: 'Project Number',
      width: 125,
      renderCell: (params: any) => (
        <a href={`https://ctsolutions.sempra.com/projects/${params.row.ProjectId}`} target="_blank" rel="noopener noreferrer">
          {params.value}
        </a>
      )
    },
    {
      field: 'OrganizationName',
      headerName: 'Organization',
      width: 250,
      renderCell: (params: any) => (
        <a href={`https://ctsolutions.sempra.com/projects/${params.row.ProjectId}`} target="_blank" rel="noopener noreferrer">
          {params.value}
        </a>
      )
    },
    {
      field: 'USC',
      headerName: 'Underserved Flag',
      width: 140,
      renderCell: (params: any) => {
        const isUSC = params.value === 'True' || params.value === true;
        return (
          <Chip
            label={isUSC ? 'USC' : 'Non-USC'}
            color={isUSC ? 'primary' : 'default'}
            size="small"
          />
        );
      }
    },
    { field: 'ProjectStatus', headerName: 'Status', width: 100 },
    { field: 'ProjectLead', headerName: 'Project Lead', width: 150 },
    {
      field: 'submissionToVetting',
      headerName: 'Submission to Vetting',
      width: 200,
      renderCell: (params: any) => {
        const submissionToVettingDays = calculateDaysBetween(params.row.SubmissionDate, params.row.VettingCall);
        const submissionToVettingTarget = params.row.USC === 'True' || params.row.USC === true ? 1 : 2;
        const overTarget = submissionToVettingDays > submissionToVettingTarget;
        const progressColor = overTarget ? calculateColorIntensity(submissionToVettingDays - submissionToVettingTarget, submissionToVettingTarget) : 'rgba(8, 136, 86, 1)';

        return (
          <Tooltip title={`Submission Date: ${params.row.SubmissionDate || 'N/A'} | Vetting Call: ${params.row.VettingCall || 'N/A'}`}>
            <Box sx={{ width: '100%', mr: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <LinearProgress
                variant="determinate"
                value={(submissionToVettingDays / submissionToVettingTarget) * 100}
                sx={{
                  height: 8,
                  borderRadius: 5,
                  width: '100%',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: progressColor,
                  }
                }}
              />
              <Typography variant="caption" sx={{ mt: 0.5 }}>
                {submissionToVettingDays} / {submissionToVettingTarget} days
              </Typography>
            </Box>
          </Tooltip>
        );
      }
    },
    {
      field: 'vettingToConsultation',
      headerName: 'Vetting to Consultation',
      width: 200,
      renderCell: (params: any) => {
        const vettingToConsultationDays = calculateDaysBetween(params.row.VettingCall, params.row.ConsultationCall);
        const vettingToConsultationTarget = 7;
        const overTarget = vettingToConsultationDays > vettingToConsultationTarget;
        const progressColor = overTarget ? calculateColorIntensity(vettingToConsultationDays - vettingToConsultationTarget, vettingToConsultationTarget) : 'rgba(8, 136, 86, 1)';

        return (
          <Tooltip title={`Vetting Call: ${params.row.VettingCall || 'N/A'} | Consultation Call: ${params.row.ConsultationCall || 'N/A'}`}>
            <Box sx={{ width: '100%', mr: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <LinearProgress
                variant="determinate"
                value={(vettingToConsultationDays / vettingToConsultationTarget) * 100}
                sx={{
                  height: 8,
                  borderRadius: 5,
                  width: '100%',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    backgroundColor: progressColor,
                  }
                }}
              />
              <Typography variant="caption" sx={{ mt: 0.5 }}>
                {vettingToConsultationDays} / {vettingToConsultationTarget} days
              </Typography>
            </Box>
          </Tooltip>
        );
      }
    },
    {
      field: 'progress',
      headerName: 'Services Progress',
      width: 200,
      renderCell: (params: any) => {
        const completed = params.row.ServicesCompleted;
        const inProgress = params.row.ServicesInProgress;
        const total = params.row.TotalServicesSelected;

        return (
          <Tooltip title={`Completed: ${completed} | In Progress: ${inProgress} | Total: ${total}`}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress
                variant="buffer"
                value={(completed / total) * 100}
                valueBuffer={((completed + inProgress) / total) * 100}
                sx={{
                  height: 8,
                  borderRadius: 5,
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                  },
                  '& .MuiLinearProgress-dashed': {
                    animation: 'none',
                  }
                }}
              />
            </Box>
          </Tooltip>
        );
      }
    },
    {
      field: 'PercentCompleted',
      headerName: 'Completion',
      width: 100,
      renderCell: (params: any) => {
        const value = params.value;
        let color = 'default';
        if (value >= 75) color = 'success';
        else if (value >= 25) color = 'primary';
        else if (value > 0) color = 'warning';

        return (
          <Chip
            label={`${value}%`}
            color={color as any}
            size="small"
            variant="outlined"
          />
        );
      }
    },
    {
      field: 'serviceStatus',
      headerName: 'Service Status',
      width: 120,
      renderCell: (params: any) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title={`Completed: ${params.row.ServicesCompleted}`}>
            <Chip
              label={params.row.ServicesCompleted}
              size="small"
              color="success"
              variant="outlined"
            />
          </Tooltip>
          <Tooltip title={`In Progress: ${params.row.ServicesInProgress}`}>
            <Chip
              label={params.row.ServicesInProgress}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Tooltip>
          <Tooltip title={`Not Ready: ${params.row.ServicesNotReady}`}>
            <Chip
              label={params.row.ServicesNotReady}
              size="small"
              color="warning"
              variant="outlined"
            />
          </Tooltip>
        </Box>
      )
    },
    {
      field: 'TotalDurationMins',
      headerName: 'Non-Service Duration',
      width: 170,
      renderCell: (params: any) => `${params.value} mins`
    }
  ];

  // Handle filter changes
  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    if (value === 'All') {
      setSelectedStatuses([]);
      setFilteredRows(rows);
    } else {
      setSelectedStatuses([value]);
      const filtered = rows.filter(
        (row) => row.ProjectStatus.toLowerCase() === value.toLowerCase()
      );
      setFilteredRows(filtered);
    }
  };

  // Add this function to get unique organizations
  const getUniqueOrganizations = () => {
    const organizations = rows.map(row => row.OrganizationName);
    return ['All', ...new Set(organizations)];
  };

  // Modify the filter logic to handle both status and organization
  useEffect(() => {
    let filtered = [...rows];

    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(row =>
        selectedStatuses.includes(row.ProjectStatus)
      );
    }

    if (selectedOrganizations.length > 0) {
      filtered = filtered.filter(row =>
        selectedOrganizations.includes(row.OrganizationName)
      );
    }

    setFilteredRows(filtered);
  }, [rows, selectedStatuses, selectedOrganizations]);

  // Add organization filter handler
  const handleOrganizationChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    if (value === 'All') {
      setSelectedOrganizations([]);
    } else {
      setSelectedOrganizations([value]);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Use the first project in the filteredRows for the ProjectDashboard
  const firstProject = filteredRows[0];

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <ProjectStatusFilter
          rows={rows}
          statusFilter={selectedStatuses[0] || 'All'}
          onStatusChange={handleStatusChange}
        />

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Organization</InputLabel>
          <Select
            value={selectedOrganizations[0] || 'All'}
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
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <ActiveFilterChip
          name="Project Status"
          options={selectedStatuses}
          setSelectedOptions={setSelectedStatuses}
          getOptionKey={(option) => option}
          getOptionLabel={(option) => option}
        />

        <ActiveFilterChip
          name="Organization"
          options={selectedOrganizations}
          setSelectedOptions={setSelectedOrganizations}
          getOptionKey={(option) => option}
          getOptionLabel={(option) => option}
        />
      </Box>

      <DataGrid
        rows={filteredRows}
        columns={columns}
        getRowId={(row) => row.ProjectId}
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
      {/* <Box>
        <ProjectDashboard projects={filteredRows} />
      </Box> */}
    </Box>
  );
};

export default CustomizedDataGrid;

function hsl(arg0: number, arg1: number, arg2: number) {
  throw new Error('Function not implemented.');
}
