import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Typography, Chip, Box } from '@mui/material';
import { ProjectRow } from '../types';
import { differenceInBusinessDays, parseISO } from 'date-fns';

const PendingActions = ({ rows }: { rows: ProjectRow[] }) => {
    const pendingActions = rows.filter((row) => {
        const submissionPending = !row.VettingCall || row.VettingCall === 'None';
        const consultationPending = !row.ConsultationCall || row.ConsultationCall === 'None';
        return row.ProjectStatus === 'Active' && (submissionPending || consultationPending);
    });

    const columns: GridColDef[] = [
        {
            field: 'ProjectNumber',
            headerName: 'Project Number',
            width: 125,
            renderCell: (params) => (
                <a href={`https://ctsolutions.sempra.com/projects/${params.row.ProjectId}`} target="_blank" rel="noopener noreferrer">
                    {params.value}
                </a>
            ),
        },
        { field: 'OrganizationName', headerName: 'Organization', width: 250 },
        { field: 'PendingMilestone', headerName: 'Pending Milestone', width: 200 },
        {
            field: 'DaysElapsed',
            headerName: 'Days Elapsed',
            width: 150,
            renderCell: (params) => (
                <Chip
                    label={`${params.value} days`}
                    color={params.value > 7 ? 'error' : 'warning'}
                    size="small"
                />
            ),
        },
        { field: 'ProjectLead', headerName: 'Project Lead', width: 200 },
    ];

    const rowsWithPendingInfo = pendingActions.map((row) => {
        const submissionPending = !row.VettingCall || row.VettingCall === 'None';
        const consultationPending = !row.ConsultationCall || row.ConsultationCall === 'None';

        const pendingMilestone = submissionPending
            ? 'Submission to Vetting'
            : consultationPending
                ? 'Vetting to Consultation'
                : '';

        const daysElapsed = submissionPending
            ? (() => {
                const submissionDate = row.SubmissionDate;
                console.log('SubmissionDate:', submissionDate);
                if (!submissionDate) {
                    console.error('SubmissionDate is null');
                    return 'Invalid date';
                }
                const parsedSubmissionDate = parseISO(submissionDate);
                if (isNaN(parsedSubmissionDate.getTime())) {
                    console.error('Invalid SubmissionDate:', submissionDate);
                    return 'Invalid date';
                }
                return differenceInBusinessDays(new Date(), parsedSubmissionDate);
            })()
            : (() => {
                const vettingCall = row.VettingCall;
                const parsedVettingCall = vettingCall && vettingCall !== 'None' ? parseISO(vettingCall) : new Date();
                return differenceInBusinessDays(new Date(), parsedVettingCall);
            })();

        return {
            ...row,
            PendingMilestone: pendingMilestone,
            DaysElapsed: daysElapsed,
        };
    });

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
                Pending Actions
            </Typography>

            <Box sx={{ height: '400', width: '100%' }}>
                <DataGrid
                    rows={rowsWithPendingInfo}
                    columns={columns}
                    getRowId={(row) => row.ProjectId}
                    initialState={{
                        pagination: { paginationModel: { pageSize: 5 } },
                    }}
                    pageSizeOptions={[5, 10]}
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
                                        No pending actions for active projects.
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Try adjusting your filters to find what you're looking for
                                    </Typography>
                                </Box>
                            </Box>
                        ),
                    }}
                />
            </Box>
        </Box>
    );
};

export default PendingActions;