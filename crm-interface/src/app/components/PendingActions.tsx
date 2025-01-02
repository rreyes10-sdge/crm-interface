import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, Chip, Box } from '@mui/material';

const PendingActions = ({ rows }: { rows: ProjectRow[] }) => {
    const pendingActions = rows.filter((row) => {
        const submissionPending = !row.VettingCall || row.VettingCall === 'None';
        const consultationPending = !row.ConsultationCall || row.ConsultationCall === 'None';
        return row.ProjectStatus === 'Active' && (submissionPending || consultationPending);
    });

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h6" gutterBottom>
                Pending Actions
            </Typography>
            {pendingActions.length > 0 ? (
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Project Number</TableCell>
                                <TableCell>Organization</TableCell>
                                <TableCell>Pending Milestone</TableCell>
                                <TableCell>Days Elapsed</TableCell>
                                <TableCell>Project Lead</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {pendingActions.map((row) => {
                                const submissionPending = !row.VettingCall || row.VettingCall === 'None';
                                const consultationPending = !row.ConsultationCall || row.ConsultationCall === 'None';

                                const pendingMilestone = submissionPending
                                    ? 'Submission to Vetting'
                                    : consultationPending
                                        ? 'Vetting to Consultation'
                                        : '';

                                const daysElapsed = submissionPending
                                    ? calculateDaysBetween(row.SubmissionDate, new Date().toISOString())
                                    : calculateDaysBetween(row.VettingCall, new Date().toISOString());

                                return (
                                    <TableRow key={row.ProjectId}>
                                        <TableCell>
                                            <a href={`https://ctsolutions.sempra.com/projects/${row.ProjectId}`} target="_blank" rel="noopener noreferrer">
                                                {row.ProjectNumber}
                                            </a>
                                        </TableCell>
                                        <TableCell>{row.OrganizationName}</TableCell>
                                        <TableCell>{pendingMilestone}</TableCell>
                                        <TableCell>
                                            <Chip
                                                label={`${daysElapsed} days`}
                                                color={daysElapsed > 7 ? 'error' : 'warning'}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell>{row.ProjectLead}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : (
                <Typography variant="body2" color="text.secondary">
                    No pending actions for active projects.
                </Typography>
            )}
        </Box>
    );
};

export default PendingActions;