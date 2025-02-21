import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Select, MenuItem, Box, Grid, Paper } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProgramMapping {
  id: number;
  name: string;
}

interface StatusMapping {
  id: number;
  name: string;
}

const PROGRAM_MAPPINGS: ProgramMapping[] = [
  { id: 1, name: 'Power Your Drive For Fleets' },
  { id: 2, name: 'Schools and Educational' },
  { id: 3, name: 'Beaches, Parks, Recreational' },
  { id: 4, name: 'TOU-M Waiver' },
  { id: 5, name: 'Industry Partner Network' },
  { id: 6, name: 'On Campus Charging' },
  { id: 7, name: 'Power Your Drive 2.0' },
  { id: 8, name: 'Power Your Drive 1.0' },
  { id: 10, name: 'Priority Review Projects' },
  { id: 12, name: 'Rule 45 DPM' },
  { id: 13, name: 'ITQA' },
  { id: 14, name: 'National Electric Vehicle Infrastructure' },
  { id: 15, name: 'Power Your Drive For Fleets - Phased Projects' },
  { id: 16, name: 'TEAS' }
];

const STATUS_MAPPINGS: StatusMapping[] = [
  { id: 1, name: 'Active' },
  { id: 2, name: 'WaitList' },
  { id: 3, name: 'OnHold' },
  { id: 4, name: 'Canceled' },
  { id: 5, name: 'Operational' },
  { id: 6, name: 'Decommissioned' },
  { id: 7, name: 'Complete' }
];

interface PhaseData {
  StartDate: string;
  EndDate: string;
  ProgramId: string | null;
  PhaseName: string;
  ProjectCount: number;
}

const ProgramSummary: React.FC = () => {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("Any");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("Any");
  const [phaseData, setPhaseData] = useState<PhaseData[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch phase data when selections change
  useEffect(() => {
    // Only fetch if at least one filter is selected
    if (selectedProgramId === "Any" && selectedStatusId === "Any") {
      setPhaseData([]);
      return;
    }

    setLoading(true);
    
    const params = new URLSearchParams();
    if (selectedProgramId !== "Any") params.append('program_id', selectedProgramId);
    if (selectedStatusId !== "Any") params.append('project_status', selectedStatusId);

    axios.get(`http://127.0.0.1:5000/api/project-phase?${params.toString()}`)
      .then(response => {
        setPhaseData(response.data);
      })
      .catch(error => {
        console.error('Error fetching phase data:', error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedProgramId, selectedStatusId]);

  // Process data for the chart
  const chartData = React.useMemo(() => {
    const phaseGroups = phaseData.reduce((acc, item) => {
      const date = new Date(item.StartDate).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { date };
      }
      acc[date][item.PhaseName] = item.ProjectCount;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(phaseGroups);
  }, [phaseData]);

  // Get unique phase names for creating chart areas
  const uniquePhases = [...new Set(phaseData.map(item => item.PhaseName))].filter(Boolean);

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      minWidth: '100%',
      p: 2
    }}>
      <Typography variant="h6" gutterBottom>
        Program Phase Summary
      </Typography>

      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Select
            value={selectedProgramId}
            onChange={(e) => setSelectedProgramId(e.target.value)}
            fullWidth
            displayEmpty
          >
            <MenuItem value="Any">Any Program</MenuItem>
            {PROGRAM_MAPPINGS.map(program => (
              <MenuItem key={program.id} value={program.id.toString()}>
                {program.name}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} md={6}>
          <Select
            value={selectedStatusId}
            onChange={(e) => setSelectedStatusId(e.target.value)}
            fullWidth
            displayEmpty
          >
            <MenuItem value="Any">Any Status</MenuItem>
            {STATUS_MAPPINGS.map(status => (
              <MenuItem key={status.id} value={status.id.toString()}>
                {status.name}
              </MenuItem>
            ))}
          </Select>
        </Grid>
      </Grid>

      {loading && (
        <Typography>Loading...</Typography>
      )}

      {!loading && chartData.length > 0 && (
        <Box sx={{ 
          width: '100%',
          minWidth: '100%',
          height: 500,
          '& .recharts-wrapper': {
            width: '100% !important'
          }
        }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 30,
                left: 40,  // Increased left margin for Y-axis labels
                bottom: 20 // Increased bottom margin for X-axis labels
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              {uniquePhases.map((phase, index) => (
                <Area
                  key={phase}
                  type="monotone"
                  dataKey={phase}
                  stackId="1"
                  fill={`hsl(${(index * 360) / uniquePhases.length}, 70%, 50%)`}
                  stroke={`hsl(${(index * 360) / uniquePhases.length}, 70%, 40%)`}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Box>
      )}

      {!loading && selectedProgramId === "Any" && selectedStatusId === "Any" && (
        <Typography sx={{ textAlign: 'center', mt: 4 }}>
          Please select a Program or Status to view the phase summary
        </Typography>
      )}
    </Box>
  );
};

export default ProgramSummary;
