import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Select, MenuItem, Box, Grid, Paper, IconButton, Tooltip, Modal, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, TooltipProps, Legend } from 'recharts';
import { Calendar, ArrowRight, TrendingUp, Users, Clock, Activity, BarChart2, Zap, Target, ArrowUpRight, Award, AlertTriangle, HelpCircle, X } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';
import { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { Tooltip as RechartsTooltip } from 'recharts';
import ProjectSummary from './ProjectSummary';
import TEASServiceSummary from './TEASServiceSummary';
import { gql, useQuery } from '@apollo/client';

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
  SortOrder: number;
}

interface PhaseStats {
  totalProjects: number;
  phaseDistribution: { [key: string]: number };
  largestPhase: {
    name: string;
    count: number;
  };
  smallestPhase: {
    name: string;
    count: number;
  };
  growthRate: {
    absolute: number;
    timeSpan: string;
  };
  timeAnalysis: {
    averageMonthlyGrowth: number;
    fastestGrowingPhase: {
      name: string;
      growthRate: number;
    };
    peakTotal: {
      count: number;
      date: string;
    };
    monthlyTrend: {
      increasing: boolean;
      rate: number;
    };
  };
}

interface PhaseTransition {
  PhaseId: number;
  PhaseName: string;
  SortOrder: number;
  ProjectCount: number;
  AvgDaysInPhase: number;
  MinDaysInPhase: number;
  MaxDaysInPhase: number;
  MedDaysInPhase: number;
}

interface CustomTooltipProps extends TooltipProps<ValueType, NameType> {
  phases: PhaseData[];
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, phases }) => {
  if (active && payload && payload.length) {
    const sortedPayload = [...payload].sort((a, b) => {
      const phaseOrderA = phases.find(p => p.PhaseName === a.name)?.SortOrder ?? 0;
      const phaseOrderB = phases.find(p => p.PhaseName === b.name)?.SortOrder ?? 0;
      return phaseOrderA - phaseOrderB;
    });

    return (
      <Box sx={{
        bgcolor: 'background.paper',
        p: 1.5,
        border: '1px solid',
        borderColor: 'grey.200',
        borderRadius: 1,
        boxShadow: 1
      }}>
        <Typography variant="caption" color="text.secondary">
          {new Date(label as string).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
        {sortedPayload.map((entry) => (
          <Box
            key={entry.name}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 1
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: entry.color
              }}
            />
            <Typography variant="body2">
              {entry.name}: <strong>{entry.value}</strong>
            </Typography>
          </Box>
        ))}
      </Box>
    );
  }
  return null;
};

interface PhaseAnalysis extends PhaseTransition {
  score: number;
  metrics: {
    durationScore: number;    // How long projects stay
    volumeScore: number;      // How many projects are here
    variabilityScore: number; // How inconsistent the duration is
    throughputScore: number;  // How fast projects move through
    medianDays: number;       // Median days in the phase
  };
}

const calculateBottleneck = (transitions: PhaseTransition[]): PhaseAnalysis => {
  // Calculate max values for normalization
  const maxAvgDays = Math.max(...transitions.map(t => t.AvgDaysInPhase));
  const maxCount = Math.max(...transitions.map(t => t.ProjectCount));
  const maxVariability = Math.max(...transitions.map(t => t.MaxDaysInPhase - t.MinDaysInPhase));

  const analysisResults = transitions.map(phase => {
    // Duration Score (30%) - Higher average duration indicates bottleneck
    const durationScore = (phase.AvgDaysInPhase / maxAvgDays) * 0.3;

    // Volume Score (25%) - More projects increases bottleneck impact
    const volumeScore = (phase.ProjectCount / maxCount) * 0.25;

    // Variability Score (25%) - High variability suggests process issues
    const variability = phase.MaxDaysInPhase - phase.MinDaysInPhase;
    const variabilityScore = (variability / maxVariability) * 0.25;

    // Throughput Score (20%) - Lower throughput indicates bottleneck
    const throughput = phase.ProjectCount / phase.AvgDaysInPhase;
    const maxThroughput = Math.max(...transitions.map(t => t.ProjectCount / t.AvgDaysInPhase));
    const throughputScore = (1 - (throughput / maxThroughput)) * 0.2;

    // Calculate median days in phase
    const daysInPhase = [
      phase.AvgDaysInPhase,
      phase.MinDaysInPhase,
      phase.MaxDaysInPhase,
      phase.MedDaysInPhase
    ].filter(day => typeof day === 'number' && !isNaN(day)); // Filter out non-numeric values

    const medianDays = calculateMedian(daysInPhase);

    // Total score
    const score = durationScore + volumeScore + variabilityScore + throughputScore;

    return {
      ...phase,
      score,
      metrics: {
        durationScore,
        volumeScore,
        variabilityScore,
        throughputScore,
        medianDays
      }
    };
  });

  return analysisResults.reduce((max, phase) =>
    phase.score > max.score ? phase : max
    , analysisResults[0]);
};

// Helper function to calculate median
const calculateMedian = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const getPhaseColor = (phase: string, allPhases: string[]) => {
  // Define fixed phase colors to ensure consistency
  const phaseColorMap: { [key: string]: number } = {
    'General': 0,
    'Leads': 30,
    'Interest List': 60,
    'Initiation': 90,
    'Preliminary Eng & Design': 120,
    'Final Design': 150,
    'Pre-Construction': 180,
    'Construction': 210,
    'Close Out': 240,
    'Project Complete': 270
  };

  // If phase isn't in our map, generate a consistent hue based on the phase name
  const hue = phaseColorMap[phase] ??
    phase.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;

  return {
    main: `hsl(${hue}, 70%, 50%)`,
    light: `hsl(${hue}, 70%, 85%)`,
    dark: `hsl(${hue}, 70%, 40%)`
  };
};

interface ProjectDetails {
  ProjectId: number;
  ProjectName: string;
  ProgramName: string;
  CurrentPhase: string;
  DaysInPhase: number;
  Status: string;
}

const ProgramSummary: React.FC = () => {
  const [selectedProgramId, setSelectedProgramId] = useState<string>("Any");
  const [selectedStatusId, setSelectedStatusId] = useState<string>("Any");
  const [phaseData, setPhaseData] = useState<PhaseData[]>([]);
  const [transitionData, setTransitionData] = useState<PhaseTransition[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [projectDetails, setProjectDetails] = useState<ProjectDetails[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedCurrentPhase, setSelectedCurrentPhase] = useState<string | null>('Any');

  // Fetch phase data when selections change
  useEffect(() => {
    if (selectedProgramId === "16") {
      // Skip fetching phase data if TEAS is selected
      return;
    }

    // Only fetch if at least one filter is selected
    if (selectedProgramId === "Any" && selectedStatusId === "Any") {
      setPhaseData([]);
      setTransitionData([]);
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

  // Fetch transition data
  useEffect(() => {
    if (selectedProgramId === "Any" && selectedStatusId === "Any") {
      setTransitionData([]);
      return;
    }

    const params = new URLSearchParams();
    if (selectedProgramId !== "Any") params.append('program_id', selectedProgramId);
    if (selectedStatusId !== "Any") params.append('project_status', selectedStatusId);

    axios.get(`http://127.0.0.1:5000/api/phase-transitions?${params.toString()}`)
      .then(response => {
        setTransitionData(response.data);
      })
      .catch(error => {
        console.error('Error fetching transition data:', error);
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

  // Update the uniquePhases memo to use the actual SortOrder
  const uniquePhases = React.useMemo(() => {
    // Create a map of phase names to their sort orders
    const phaseOrders = phaseData.reduce((acc, item) => {
      acc[item.PhaseName] = item.SortOrder;
      return acc;
    }, {} as Record<string, number>);

    // Get unique phase names and sort by their SortOrder
    const phases = [...new Set(phaseData.map(item => item.PhaseName))].filter(Boolean);

    // Sort in descending order for the area chart (higher SortOrder appears on top)
    return phases.sort((a, b) => phaseOrders[b] - phaseOrders[a]);
  }, [phaseData]);

  const StatsSummary: React.FC<{ data: PhaseData[], chartData: any[] }> = ({ data, chartData }) => {
    const stats = React.useMemo(() => {
      if (!chartData.length) return null;

      // Get latest data point (current snapshot)
      const latestData = chartData[chartData.length - 1];
      const earliestData = chartData[0];

      // Calculate total projects (current)
      const totalProjects = Object.entries(latestData)
        .filter(([key]) => key !== 'date')
        .reduce((sum, [_, count]) => sum + (count as number), 0);

      // Calculate phase distribution
      const phaseDistribution = Object.entries(latestData)
        .filter(([key]) => key !== 'date')
        .reduce((acc, [phase, count]) => {
          acc[phase] = count as number;
          return acc;
        }, {} as { [key: string]: number });

      // Find phase with most projects
      const largestPhase = Object.entries(phaseDistribution)
        .reduce((max, [phase, count]) =>
          count > max.count ? { name: phase, count } : max
          , { name: '', count: 0 });

      // Find phase with least projects
      const smallestPhase = Object.entries(phaseDistribution)
        .reduce((min, [phase, count]) =>
          count < min.count ? { name: phase, count } : min
          , { name: '', count: Infinity });

      // Calculate growth
      const earliestTotal = Object.entries(earliestData)
        .filter(([key]) => key !== 'date')
        .reduce((sum, [_, count]) => sum + (count as number), 0);

      const growthRate = {
        absolute: totalProjects - earliestTotal,
        timeSpan: `${formatDate(earliestData.date)} - ${formatDate(latestData.date)}`
      };

      // Time Analysis
      const timeAnalysis = {
        averageMonthlyGrowth: 0,
        fastestGrowingPhase: {
          name: '',
          growthRate: 0
        },
        peakTotal: {
          count: 0,
          date: ''
        },
        monthlyTrend: {
          increasing: false,
          rate: 0
        }
      };

      // Calculate peak total
      chartData.forEach(dataPoint => {
        const total = Object.entries(dataPoint)
          .filter(([key]) => key !== 'date')
          .reduce((sum, [_, count]) => sum + (count as number), 0);

        if (total > timeAnalysis.peakTotal.count) {
          timeAnalysis.peakTotal = {
            count: total,
            date: dataPoint.date
          };
        }
      });

      // Calculate monthly growth rates for each phase
      const phaseGrowthRates: { [key: string]: number } = {};
      uniquePhases.forEach(phase => {
        const firstValue = chartData[0][phase] || 0;
        const lastValue = chartData[chartData.length - 1][phase] || 0;
        const monthsDiff = (new Date(chartData[chartData.length - 1].date).getTime() -
          new Date(chartData[0].date).getTime()) / (1000 * 60 * 60 * 24 * 30);

        const growthRate = monthsDiff > 0 ? ((lastValue - firstValue) / monthsDiff) : 0;
        phaseGrowthRates[phase] = growthRate;

        if (growthRate > timeAnalysis.fastestGrowingPhase.growthRate) {
          timeAnalysis.fastestGrowingPhase = {
            name: phase,
            growthRate: growthRate
          };
        }
      });

      // Calculate overall monthly trend
      const recentMonths = chartData.slice(-3); // Look at last 3 data points
      const monthlyTrend = recentMonths.map(point =>
        Object.entries(point)
          .filter(([key]) => key !== 'date')
          .reduce((sum, [_, count]) => sum + (count as number), 0)
      );

      timeAnalysis.monthlyTrend = {
        increasing: monthlyTrend[monthlyTrend.length - 1] > monthlyTrend[0],
        rate: (monthlyTrend[monthlyTrend.length - 1] - monthlyTrend[0]) / 3
      };

      // Calculate average monthly growth
      const totalMonths = (new Date(chartData[chartData.length - 1].date).getTime() -
        new Date(chartData[0].date).getTime()) / (1000 * 60 * 60 * 24 * 30);
      timeAnalysis.averageMonthlyGrowth = growthRate.absolute / totalMonths;

      return {
        totalProjects,
        phaseDistribution,
        largestPhase,
        smallestPhase,
        growthRate,
        timeAnalysis
      };
    }, [chartData, uniquePhases]);

    if (!stats) return null;

    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Users size={16} color="#666" />
                <Typography variant="body2" color="text.secondary">Total Projects</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 0.5 }}>{stats.totalProjects}</Typography>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Award size={16} color="#666" />
                <Typography variant="body2" color="text.secondary">Largest Phase</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <Typography variant="h4">{stats.largestPhase.count}</Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>{stats.largestPhase.name}</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Target size={16} color="#666" />
                <Typography variant="body2" color="text.secondary">Smallest Phase</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                <Typography variant="h4" sx={{ mt: 0.5 }}>{stats.smallestPhase.count}</Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>{stats.smallestPhase.name}</Typography>
              </Box>
            </Grid>
            <Grid item xs={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Clock size={16} color="#666" />
                <Typography variant="body2" color="text.secondary">Time Span</Typography>
              </Box>
              <Typography variant="h4" sx={{ mt: 0.5 }}>{stats.growthRate.timeSpan}</Typography>
            </Grid>
          </Grid>

          <Box sx={{
            mt: 2,
            p: 1.5,
            bgcolor: 'grey.50',
            borderRadius: 1,
            border: '1px solid',
            borderColor: 'grey.200',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Grid
              container
              spacing={1}
              sx={{
                maxWidth: 'md',
                justifyContent: 'center'
              }}
            >
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title="Average number of new projects added per month across all phases">
                  <Box sx={{
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <TrendingUp size={14} color="primary.main" />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ lineHeight: 1 }}>
                        {stats.timeAnalysis.averageMonthlyGrowth.toFixed(1)}
                        <Typography component="span" variant="caption" color="text.secondary">/mo</Typography>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Monthly Growth
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title={`${stats.timeAnalysis.fastestGrowingPhase.name} is growing the fastest at ${stats.timeAnalysis.fastestGrowingPhase.growthRate.toFixed(1)} projects per month`}>
                  <Box sx={{
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <Zap size={14} color="primary.main" />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ lineHeight: 1 }}>
                        {stats.timeAnalysis.fastestGrowingPhase.growthRate.toFixed(1)}
                        <Typography component="span" variant="caption" color="text.secondary">/mo</Typography>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Fastest Phase
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title={`Highest total project count reached on ${formatDate(stats.timeAnalysis.peakTotal.date)}`}>
                  <Box sx={{
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <ArrowUpRight size={14} color="primary.main" />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ lineHeight: 1 }}>
                        {stats.timeAnalysis.peakTotal.count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Peak Total
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Tooltip title={`Project count is ${stats.timeAnalysis.monthlyTrend.increasing ? 'increasing' : 'decreasing'} by ${Math.abs(stats.timeAnalysis.monthlyTrend.rate).toFixed(1)} projects per month`}>
                  <Box sx={{
                    p: 1.5,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1
                  }}>
                    <Activity size={14} color="primary.main" />
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ lineHeight: 1 }}>
                        {stats.timeAnalysis.monthlyTrend.increasing ? '↑' : '↓'} {Math.abs(stats.timeAnalysis.monthlyTrend.rate).toFixed(1)}
                        <Typography component="span" variant="caption" color="text.secondary">/mo</Typography>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        Recent Trend
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={1} sx={{ mt: 1 }}>
            {Object.entries(stats.phaseDistribution)
              .sort(([phaseA], [phaseB]) => {
                const orderA = data.find(p => p.PhaseName === phaseA)?.SortOrder ?? 0;
                const orderB = data.find(p => p.PhaseName === phaseB)?.SortOrder ?? 0;
                return orderA - orderB;
              })
              .map(([phase, count], index) => (
                <Grid item xs={6} sm={4} md={3} key={phase}>
                  <Box sx={{
                    p: 1,
                    bgcolor: 'background.paper',
                    borderRadius: 1,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: 3,
                      bgcolor: getPhaseColor(phase, uniquePhases).main
                    }
                  }}>
                    <Box sx={{ pl: 1 }}>
                      <Typography variant="h6" sx={{ lineHeight: 1 }}>
                        {count}
                        <Typography
                          component="span"
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 0.5 }}
                        >
                          ({((count / stats.totalProjects) * 100).toFixed(0)}%)
                        </Typography>
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {phase}
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              ))}
          </Grid>
        </Grid>
      </Paper>
    );
  };

  // Create a new component for phase transition analysis
  const PhaseTransitionAnalysis: React.FC<{ transitions: PhaseTransition[] }> = ({ transitions }) => {
    if (!transitions.length) return null;

    const bottleneckAnalysis = calculateBottleneck(transitions);
    const { metrics } = bottleneckAnalysis;

    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          mb: 3
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Clock size={16} />
            <Typography variant="h6">Phase Duration Details</Typography>
          </Box>

          <Box
            onClick={() => setModalOpen(true)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: '#ff9800',
              color: 'white',
              py: 1,
              px: 2,
              borderRadius: 2,
              gap: 1,
              cursor: 'pointer',
              '&:hover': {
                bgcolor: '#f57c00'
              }
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              Bottleneck: {bottleneckAnalysis.PhaseName}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Avg: {Math.round(bottleneckAnalysis.AvgDaysInPhase)} days
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Med: {Math.round(bottleneckAnalysis.MedDaysInPhase)} days
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Projects: {bottleneckAnalysis.ProjectCount}
            </Typography>
          </Box>
        </Box>

        {/* Phase Duration Line Charts - in main view */}
        <Grid container spacing={1}>
          {transitions.map(phase => (
            <Grid item xs={12} key={phase.PhaseId}>
              <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                <Typography variant="body2" sx={{ width: 200 }} noWrap>
                  {phase.PhaseName}
                </Typography>
                <Typography variant="caption" sx={{ width: 120, color: 'text.secondary' }}>
                  {Math.round(phase.MinDaysInPhase)} - {Math.round(phase.MaxDaysInPhase)} days
                </Typography>
                <Tooltip
                  title={
                    <Box sx={{ p: 0.5 }}>
                      <Typography variant="body2" gutterBottom>
                        {phase.PhaseName} Phase Statistics:
                      </Typography>
                      <Typography variant="caption" component="div">
                        • Average Duration: {Math.round(phase.AvgDaysInPhase)} days
                        <br />
                        • Median Duration: {Math.round(phase.MedDaysInPhase)} days
                        <br />
                        • Range: {Math.round(phase.MinDaysInPhase)} - {Math.round(phase.MaxDaysInPhase)} days
                        <br />
                        • Project Count: {phase.ProjectCount}
                        <br />
                        • Variability: {Math.round((phase.MaxDaysInPhase - phase.MinDaysInPhase) / phase.AvgDaysInPhase * 100)}%
                      </Typography>
                    </Box>
                  }
                >
                  <Box sx={{ flex: 1, mx: 2, height: 8, bgcolor: 'grey.100', borderRadius: 4 }}>
                    <Box
                      sx={{
                        width: `${(phase.AvgDaysInPhase / Math.max(...transitions.map(t => t.MaxDaysInPhase))) * 100}%`,
                        height: '100%',
                        bgcolor: getPhaseColor(phase.PhaseName, uniquePhases).main,
                        borderRadius: 4
                      }}
                    />
                  </Box>
                </Tooltip>
                <Typography variant="caption" sx={{ width: 100, color: 'text.secondary' }}>
                  Avg: {Math.round(phase.AvgDaysInPhase)} days
                </Typography>
                <Typography variant="caption" sx={{ width: 100, color: 'text.secondary' }}>
                  Med: {Math.round(phase.MedDaysInPhase)} days
                </Typography>
                <Typography variant="caption" sx={{ width: 100, color: 'text.secondary' }}>
                  Project Count: {phase.ProjectCount}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* Modal with detailed analysis */}
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          aria-labelledby="bottleneck-analysis-modal"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 600,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 4,
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Bottleneck Analysis</Typography>
              <IconButton onClick={() => setModalOpen(false)} size="small">
                <X size={20} />
              </IconButton>
            </Box>

            <Typography variant="body1" gutterBottom>
              {bottleneckAnalysis.PhaseName} phase has been identified as a bottleneck
              with a score of {(bottleneckAnalysis.score * 100).toFixed(0)}%.
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Typography variant="subtitle1" gutterBottom>Contributing Factors</Typography>

            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Tooltip title="Measures how long projects stay in this phase relative to other phases. Higher duration indicates potential bottleneck.
                    Formula: (Avg Days in Phase / Max Avg Days across phases) * 30%">
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Duration Impact</Typography>
                      <Typography variant="h4">
                        {(metrics.durationScore / 0.3 * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Tooltip>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Tooltip title="Considers the number of projects currently in this phase. More projects increase bottleneck severity.
                    Formula: (Current Projects / Max Projects in any phase) * 25%">
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Volume Impact</Typography>
                      <Typography variant="h4">
                        {(metrics.volumeScore / 0.25 * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Tooltip>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Tooltip title="Measures inconsistency in phase duration. High variability suggests process issues.
                    Formula: (Max Days - Min Days) / (Max Variability across phases) * 25%">
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Variability</Typography>
                      <Typography variant="h4">
                        {(metrics.variabilityScore / 0.25 * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Tooltip>
                </Paper>
              </Grid>

              <Grid item xs={6}>
                <Paper sx={{ p: 2 }}>
                  <Tooltip title="Measures how quickly projects move through this phase. Lower throughput indicates bottleneck.
                    Formula: (1 - (Projects per day / Max Projects per day across phases)) * 20%">
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Throughput</Typography>
                      <Typography variant="h4">
                        {(metrics.throughputScore / 0.2 * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Tooltip>
                </Paper>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>Recommendations</Typography>
              <Typography variant="body2">
                • Consider reviewing processes in this phase to reduce average duration
                <br />
                • Monitor resource allocation to handle the current volume
                <br />
                • Investigate causes of high variability in completion times
                <br />
                • Look for opportunities to improve throughput
              </Typography>
            </Box>
          </Box>
        </Modal>
      </Paper>
    );
  };

  // Analyze quarterly patterns
  const quarterlyTrends = React.useMemo(() => {
    const quarterData: { [quarter: string]: number[] } = {
      'Q1': [], 'Q2': [], 'Q3': [], 'Q4': []
    };

    chartData.forEach(point => {
      const date = new Date(point.date);
      const quarter = Math.floor(date.getMonth() / 3);
      const total = Object.entries(point)
        .filter(([key]) => key !== 'date')
        .reduce((sum, [_, count]) => sum + (count as number), 0);

      quarterData[`Q${quarter + 1}`].push(total);
    });

    return Object.entries(quarterData).map(([quarter, values]) => ({
      quarter,
      average: values.reduce((a, b) => a + b, 0) / values.length
    }));
  }, [chartData]);

  // Update the useEffect for project details
  useEffect(() => {
    if (selectedProgramId === "Any" && selectedStatusId === "Any") {
      setProjectDetails([]);
      return;
    }

    axios.get('http://127.0.0.1:5000/api/projects')
      .then(response => {
        console.log('Full API response:', response); // Log the full response
        let filtered = response.data.projects || []; // Ensure it's an array

        // Log for debugging
        console.log('All projects:', filtered);

        if (selectedProgramId !== "Any") {
          filtered = filtered.filter((p: any) => {
            console.log('Comparing:', p.ProgramName, 'with', PROGRAM_MAPPINGS.find(m => m.id.toString() === selectedProgramId)?.name);
            return p.ProgramName === PROGRAM_MAPPINGS.find(m => m.id.toString() === selectedProgramId)?.name;
          });
        }
        if (selectedStatusId !== "Any") {
          filtered = filtered.filter((p: any) => p.ProjectStatus === STATUS_MAPPINGS.find(s => s.id.toString() === selectedStatusId)?.name);
        }

        // Log filtered results
        console.log('Filtered projects:', filtered);

        setProjectDetails(filtered.map((p: any) => ({
          ProjectId: parseInt(p.ProjectId),
          ProjectName: p.ProjectName || '',
          ProgramName: p.ProgramName || '',
          CurrentPhase: p.PhaseName || 'Unknown',
          DaysInPhase: p.DaysInPhase || 0, // Ensure this is correctly assigned
          Status: p.ProjectStatus || 'Unknown'
        })));
      })
      .catch(error => {
        console.error('Error fetching projects:', error);
      });
  }, [selectedProgramId, selectedStatusId]);

  // Add this component after PhaseTransitionAnalysis
  const ProjectTable: React.FC<{ projects: ProjectDetails[] }> = ({ projects }) => {
    const [selectedCurrentPhase, setSelectedCurrentPhase] = useState<string | null>('Any');

    // Get unique phases for the filter
    const uniquePhases = [...new Set(projects.map(project => project.CurrentPhase))];

    // Filter projects based on selected current phase
    const filteredProjects = selectedCurrentPhase === 'Any' 
      ? projects 
      : projects.filter(project => project.CurrentPhase === selectedCurrentPhase);

    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BarChart2 size={16} />
          <Typography variant="h6">Project Details</Typography>
        </Box>

        {/* Current Phase Filter */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} lg={3}>
            <Select
              value={selectedCurrentPhase || ''}
              onChange={(e) => setSelectedCurrentPhase(e.target.value)}
              displayEmpty
              fullWidth
            >
              <MenuItem value="Any">Any Current Phase</MenuItem>
              {uniquePhases.map(phase => (
                <MenuItem key={phase} value={phase}>
                  {phase}
                </MenuItem>
              ))}
            </Select>
          </Grid>
        </Grid>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>Program</TableCell>
                <TableCell>Current Phase</TableCell>
                <TableCell>Days in Current Phase</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProjects.map((project) => (
                <TableRow
                  key={project.ProjectId}
                  hover
                  onClick={() => setSelectedProjectId(project.ProjectId)}
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                >
                  <TableCell>{project.ProjectName}</TableCell>
                  <TableCell>{project.ProgramName}</TableCell>
                  <TableCell>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: getPhaseColor(project.CurrentPhase, uniquePhases).main
                        }}
                      />
                      {project.CurrentPhase}
                    </Box>
                  </TableCell>
                  <TableCell>{project.DaysInPhase} days</TableCell>
                  <TableCell>{project.Status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    );
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      gap: 2,
      p: 2
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <Activity size={24} />
        <Typography variant="h5">Program Phase Summary</Typography>
      </Box>

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

      {!loading && selectedProgramId === "16" && (
        <TEASServiceSummary />
      )}

      {!loading && selectedProgramId !== "Any" && selectedProgramId !== "16" && chartData.length > 0 && (
        <>
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
                  left: 40,
                  bottom: 40  // Increased bottom margin for angled labels
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  angle={-45}
                  textAnchor="end"
                  height={70}  // Increased height for angled labels
                  interval="preserveStartEnd"  // Show first and last labels
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                />
                <YAxis />
                <RechartsTooltip<ValueType, NameType>
                  content={({ active, payload, label }) => (
                    <CustomTooltip
                      active={active}
                      payload={payload}
                      label={label}
                      phases={phaseData}
                    />
                  )}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: getPhaseColor(value as string, uniquePhases).main }}>
                      {value}
                    </span>
                  )}
                />
                {uniquePhases.map((phase, index) => (
                  <Area
                    key={phase}
                    type="monotone"
                    dataKey={phase}
                    stackId="1"
                    fill={getPhaseColor(phase, uniquePhases).main}
                    stroke={getPhaseColor(phase, uniquePhases).dark}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </Box>
          <StatsSummary data={phaseData} chartData={chartData} />
          <PhaseTransitionAnalysis transitions={transitionData} />
          <ProjectTable projects={projectDetails} />
        </>
      )}

      {!loading && selectedProgramId === "Any" && selectedStatusId === "Any" && (
        <Typography sx={{ textAlign: 'center', mt: 4 }}>
          Please select a Program or Status to view the phase summary
        </Typography>
      )}

      {/* Add the ProjectSummary modal at the end of your main render */}
      <Modal
        open={!!selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
        aria-labelledby="project-details-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '95%',
          maxWidth: 1600,
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
        }}>
          {selectedProjectId && <ProjectSummary projectId={selectedProjectId} />}
        </Box>
      </Modal>
    </Box>
  );
};

export default ProgramSummary;
