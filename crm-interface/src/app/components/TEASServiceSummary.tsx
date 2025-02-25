import React, { useEffect, useState } from 'react';
import { Typography, Box, Grid, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Tooltip, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import { Users, ArrowRight } from 'lucide-react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import axios from 'axios';
import { gql, useQuery } from '@apollo/client';
import { differenceInBusinessDays, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

interface TEASService {
    ProjectId: number;
    ProjectNumber: string;
    ProjectName: string;
    OrganizationId: number;
    OrganizationName: string;
    ProjectStatus: string;
    ProjectLead: string;
    TotalServicesSelected: number;
    ServicesCompleted: number;
    ServicesInProgress: number;
    ServicesNotReady: number;
    OpenServices: number;
    PercentCompleted: number;
    USC: string; // "True" or "False"
    SubmissionDate: string; // Date string
    VettingCall: string; // Date string
    ConsultationCall: string; // Date string
    TotalDurationMins: number;
}

interface ProjectService {
    projectNumber: string;
    projectId: number;
    phaseId: string;
    projectName: string;
    organizationName: string;
    organizationId: number;
    coreName: string;
    serviceName: string;
    serviceStartDate: string; // Date string
    followUpDate: string; // Date string
    completeDate: string; // Date string
    totalDurationMins: number;
    latestActivity: string; // Date string or relevant type
    createdAt: string; // Date string or relevant type
    totalRequired: number;
    filledCount: number;
}

const GET_PROJECT_SERVICES = gql`
  query {
    projectServices {
      projectNumber
      projectId
      phaseId
      projectName
      organizationName
      organizationId
      coreName
      serviceName
      serviceStartDate
      followUpDate
      completeDate
      totalDurationMins
      latestActivity
      createdAt
      totalRequired
      filledCount
    }
  }
`;

const TEASServiceSummary: React.FC = () => {
    const [teasServices, setTeasServices] = useState<TEASService[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTEASServices = async () => {
            try {
                const response = await axios.get('http://127.0.0.1:5000/api/data/summary');
                setTeasServices(response.data);
            } catch (err) {
                setError('Error fetching TEAS services');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTEASServices();
    }, []);

    const { loading: loadingProjectServices, error: errorProjectServices, data: projectServicesData } = useQuery<{ projectServices: ProjectService[] }>(GET_PROJECT_SERVICES);

    if (loading || loadingProjectServices) return <Typography>Loading...</Typography>;
    if (error) return <Typography>{error}</Typography>;
    if (errorProjectServices) return <Typography>Error fetching project services: {errorProjectServices.message}</Typography>;

    const projectServices = projectServicesData?.projectServices || [];

    // Calculate stats directly for TEAS services
    const total = teasServices.length;
    const statusDistribution = teasServices.reduce((acc, item) => {
        if (!acc[item.ProjectStatus]) {
            acc[item.ProjectStatus] = { count: 0, percentage: '0' };
        }
        acc[item.ProjectStatus].count++;
        acc[item.ProjectStatus].percentage = ((acc[item.ProjectStatus].count / total) * 100).toFixed(1);
        return acc;
    }, {} as Record<string, { count: number; percentage: string }>);

    // Calculate milestone performance for TEAS services
    const milestoneSummary = teasServices.reduce((acc, service) => {
        const submissionDate = parseISO(service.SubmissionDate);
        const vettingCallDate = parseISO(service.VettingCall);
        const consultationCallDate = parseISO(service.ConsultationCall);

        // Submission to Vetting Call
        const submissionToVettingDays = differenceInBusinessDays(vettingCallDate, submissionDate);
        const isUSC = service.USC === "True";
        const submissionToVettingTarget = isUSC ? 1 : 2; // 1 day for USC Yes, 2 days for USC No
        const submissionToVettingKPI = submissionToVettingDays > submissionToVettingTarget;

        // Vetting Call to Consultation Call
        const vettingToConsultationDays = differenceInBusinessDays(consultationCallDate, vettingCallDate);
        const vettingToConsultationTarget = 7; // Always 7 days
        const vettingToConsultationKPI = vettingToConsultationDays > vettingToConsultationTarget;

        // Update summary counts and missed details
        if (submissionToVettingKPI) {
            acc.submissionToVettingMissed += 1;
            acc.missedSubmissionToVetting.push({ ...service, submissionToVettingDays }); // Store missed service details with business days
        } else {
            acc.submissionToVettingMet += 1;
        }

        if (vettingToConsultationKPI) {
            acc.vettingToConsultationMissed += 1;
            acc.missedVettingToConsultation.push({ ...service, vettingToConsultationDays }); // Store missed service details with business days
        } else {
            acc.vettingToConsultationMet += 1;
        }

        return acc;
    }, {
        submissionToVettingMet: 0,
        submissionToVettingMissed: 0,
        missedSubmissionToVetting: [] as (TEASService & { submissionToVettingDays: number })[], // Array to hold missed services with business days
        vettingToConsultationMet: 0,
        vettingToConsultationMissed: 0,
        missedVettingToConsultation: [] as (TEASService & { vettingToConsultationDays: number })[], // Array to hold missed services with business days
    });

    // Analyze Project-Service data and ensure uniqueness
    const uniqueProjectServices = Array.from(new Map(projectServices.map((service: ProjectService) => [service.projectId + '-' + service.phaseId, service])).values());

    const projectServiceAnalysis = uniqueProjectServices
        .filter(service =>
            service.serviceStartDate &&
            service.completeDate &&
            service.serviceStartDate.trim() !== '' &&
            service.completeDate.trim() !== '' &&
            service.serviceStartDate !== 'None' && // Exclude 'None'
            service.completeDate !== 'None' // Exclude 'None'
        )
        .map((service: ProjectService) => {
            const serviceStartDate = parseISO(service.serviceStartDate);
            const completeDate = parseISO(service.completeDate);
            const daysToComplete = completeDate && !isNaN(completeDate.getTime()) ? differenceInBusinessDays(completeDate, serviceStartDate) : null;
            return {
                projectNumber: service.projectNumber,
                serviceName: service.serviceName,
                projectId: service.projectId,
                phaseId: service.phaseId,
                daysToComplete,
                serviceStartDate: serviceStartDate.toISOString().split('T')[0], // Format date for x-axis
            };
        });

    // Group by phaseId and serviceName and calculate stats
    const groupedByPhaseAndService = projectServiceAnalysis.reduce((acc, service) => {
        const { phaseId, serviceName, daysToComplete } = service;
        const key = `${phaseId}-${serviceName}`;
        if (!acc[key]) {
            acc[key] = { count: 0, total: 0, min: Infinity, max: -Infinity, serviceName };
        }
        if (daysToComplete !== null) {
            acc[key].count += 1;
            acc[key].total += daysToComplete;
            acc[key].min = Math.min(acc[key].min, daysToComplete);
            acc[key].max = Math.max(acc[key].max, daysToComplete);
        }
        return acc;
    }, {} as Record<string, { count: number; total: number; min: number; max: number; serviceName: string; }>);

    // Prepare data for display
    const phaseStats = Object.entries(groupedByPhaseAndService).map(([key, stats]) => {
        const [phaseId, serviceName] = key.split('-');
        return {
            phaseId,
            serviceName: stats.serviceName,
            average: stats.count > 0 ? (stats.total / stats.count).toFixed(1) : 'N/A',
            min: stats.min === Infinity ? 'N/A' : stats.min,
            max: stats.max === -Infinity ? 'N/A' : stats.max,
            count: stats.count,
        };
    });

    return (
        <Grid container spacing={3}>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Service Status Distribution
                        </Typography>
                        <Grid container spacing={2}>
                            {Object.entries(statusDistribution)
                                .sort(([a], [b]) => a.localeCompare(b))
                                .map(([status, { count, percentage }]) => (
                                    <Grid item xs={12} sm={6} md={4} key={status}>
                                        <Box display="flex" alignItems="center" gap={1}>
                                            <ArrowRight size={20} />
                                            <Typography>{status}: {count} ({percentage}%)</Typography>
                                        </Box>
                                    </Grid>
                                ))}
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Milestone Performance Summary
                        </Typography>
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography>
                                    Submission to Vetting KPI: Met {milestoneSummary.submissionToVettingMet}, Missed {milestoneSummary.submissionToVettingMissed}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Project Number</TableCell>
                                                <TableCell>Project Name</TableCell>
                                                <TableCell>Submission Date</TableCell>
                                                <TableCell>Vetting Call Date</TableCell>
                                                <TableCell>Business Days</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {milestoneSummary.missedSubmissionToVetting.map(service => (
                                                <TableRow key={service.ProjectId}>
                                                    <TableCell>{service.ProjectNumber}</TableCell>
                                                    <TableCell>{service.ProjectName}</TableCell>
                                                    <TableCell>{service.SubmissionDate}</TableCell>
                                                    <TableCell>{service.VettingCall}</TableCell>
                                                    <TableCell>{service.submissionToVettingDays}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </AccordionDetails>
                        </Accordion>
                        <br />
                        <Accordion>
                            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Typography>
                                    Vetting to Consultation KPI: Met {milestoneSummary.vettingToConsultationMet}, Missed {milestoneSummary.vettingToConsultationMissed}
                                </Typography>
                            </AccordionSummary>
                            <AccordionDetails>
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Project Number</TableCell>
                                                <TableCell>Project Name</TableCell>
                                                <TableCell>Vetting Call Date</TableCell>
                                                <TableCell>Consultation Call Date</TableCell>
                                                <TableCell>Business Days</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {milestoneSummary.missedVettingToConsultation.map(service => (
                                                <TableRow key={service.ProjectId}>
                                                    <TableCell>{service.ProjectNumber}</TableCell>
                                                    <TableCell>{service.ProjectName}</TableCell>
                                                    <TableCell>{service.VettingCall}</TableCell>
                                                    <TableCell>{service.ConsultationCall}</TableCell>
                                                    <TableCell>{service.vettingToConsultationDays}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </AccordionDetails>
                        </Accordion>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12}>
                <Card>
                    <CardContent>
                        <Typography variant="h6" gutterBottom>
                            Project Service Duration Details
                        </Typography>
                        <Grid container spacing={1}>
                            {phaseStats.map(({ phaseId, serviceName, average, min, max, count }) => (
                                <Grid item xs={12} key={phaseId}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                                        <Typography variant="body2" sx={{ width: 310 }} noWrap>
                                            {serviceName}
                                        </Typography>
                                        <Typography variant="caption" sx={{ width: 120, color: 'text.secondary' }}>
                                            {String(min)} - {String(max)} days
                                        </Typography>
                                        <Tooltip
                                            title={
                                                <Box sx={{ p: 0.5 }}>
                                                    <Typography variant="body2" gutterBottom>
                                                        {serviceName} <br></br>Phase Statistics:
                                                    </Typography>
                                                    <Typography variant="caption" component="div">
                                                        • Average Duration: {String(average)} days
                                                        <br />
                                                        • Range: {String(min)} - {String(max)} days
                                                        <br />
                                                        • Count of Projects: {count}
                                                    </Typography>
                                                </Box>
                                            }
                                        >
                                            <Box sx={{ flex: 1, mx: 2, height: 8, bgcolor: 'grey.100', borderRadius: 4 }}>
                                                <Box
                                                    sx={{
                                                        width: `${(parseFloat(String(average)) / Math.max(...phaseStats.map(t => parseFloat(String(t.max)))) * 100) || 0}%`,
                                                        height: '100%',
                                                        bgcolor: '#ff9800',
                                                        borderRadius: 4
                                                    }}
                                                />
                                            </Box>
                                        </Tooltip>
                                        <Typography variant="caption" sx={{ width: 100, color: 'text.secondary' }}>
                                            Avg: {String(average)} days
                                        </Typography>
                                    </Box>
                                </Grid>
                            ))}
                        </Grid>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );
};

export default TEASServiceSummary;