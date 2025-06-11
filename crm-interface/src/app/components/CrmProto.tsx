import React, { useRef, useState } from 'react';
import { Container, Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Drawer, Backdrop, CircularProgress, Chip, Stack, Tooltip, IconButton } from '@mui/material';
import CrmMiniProjectDetails from './CrmMiniProjectDetails';
import { useQuery, gql } from '@apollo/client';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const GET_PROJECT_OVERVIEW = gql`
  query GetProjectOverview($programId: Int, $projectStatus: String) {
    projectOverview(programId: $programId, projectStatus: $projectStatus) {
      projectName
      projectNumber
      programId
      servicesCompleted
      projectStatus
      organizationName
      projectLead
    }
  }
`;

const GET_PROGRAM_LIST = gql`
  query GetProgramList {
    programList {
      programId
      programName
      shortName
    }
  }
`;

const GET_PROJECT_STATUS_LIST = gql`
  query GetProjectStatusList {
    projectStatusList {
      projectStatusId
      projectStatusName
      projectStatusLongName
    }
  }
`;

const CrmProto: React.FC = () => {
    const [search, setSearch] = useState('');
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [detailsOpen, setDetailsOpen] = useState(false);
    const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('Active');
    const programScrollRef = useRef<HTMLDivElement>(null!);
    const statusScrollRef = useRef<HTMLDivElement>(null!);

    // Fetch programs for filter buttons
    const { data: programsData, loading: programsLoading } = useQuery(GET_PROGRAM_LIST);
    const programs = programsData?.programList || [];

    // Fetch project statuses for filter buttons
    const { data: statusData, loading: statusLoading } = useQuery(GET_PROJECT_STATUS_LIST);
    const statuses = statusData?.projectStatusList || [];

    // Fetch projects for the selected program and status
    const { data, loading, error } = useQuery(GET_PROJECT_OVERVIEW, {
      variables: { programId: selectedProgramId, projectStatus: selectedStatus },
    });
    const projects = data?.projectOverview || [];

    const filteredProjects = projects.filter((project: any) =>
      Object.values(project).some(value =>
        String(value).toLowerCase().includes(search.toLowerCase())
      )
    );

    const handleRowClick = (project: any) => {
      setSelectedProject(project);
      setDetailsOpen(true);
    };

    const handleCloseDetails = () => {
      setDetailsOpen(false);
      setSelectedProject(null);
    };

    const handleProgramFilter = (programId: number | null) => {
      setSelectedProgramId(programId);
    };

    const handleStatusFilter = (statusLongName: string | null) => {
      setSelectedStatus(statusLongName);
    };

    // Horizontal scroll logic for chip rows
    const scrollAmount = 200;
    // Program chips
    const [showLeft, setShowLeft] = useState(false);
    const [showRight, setShowRight] = useState(false);
    React.useEffect(() => {
      const checkScroll = () => {
        if (programScrollRef.current) {
          setShowLeft(programScrollRef.current.scrollLeft > 0);
          setShowRight(
            programScrollRef.current.scrollWidth > programScrollRef.current.clientWidth + programScrollRef.current.scrollLeft
          );
        }
      };
      checkScroll();
      if (programScrollRef.current) {
        programScrollRef.current.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
      }
      return () => {
        if (programScrollRef.current) {
          programScrollRef.current.removeEventListener('scroll', checkScroll);
        }
        window.removeEventListener('resize', checkScroll);
      };
    }, [programs]);
    // Status chips
    const [showStatusLeft, setShowStatusLeft] = useState(false);
    const [showStatusRight, setShowStatusRight] = useState(false);
    React.useEffect(() => {
      const checkScroll = () => {
        if (statusScrollRef.current) {
          setShowStatusLeft(statusScrollRef.current.scrollLeft > 0);
          setShowStatusRight(
            statusScrollRef.current.scrollWidth > statusScrollRef.current.clientWidth + statusScrollRef.current.scrollLeft
          );
        }
      };
      checkScroll();
      if (statusScrollRef.current) {
        statusScrollRef.current.addEventListener('scroll', checkScroll);
        window.addEventListener('resize', checkScroll);
      }
      return () => {
        if (statusScrollRef.current) {
          statusScrollRef.current.removeEventListener('scroll', checkScroll);
        }
        window.removeEventListener('resize', checkScroll);
      };
    }, [statuses]);

    const handleScrollLeft = (ref: React.RefObject<HTMLDivElement>) => {
      if (ref.current) {
        ref.current.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
      }
    };
    const handleScrollRight = (ref: React.RefObject<HTMLDivElement>) => {
      if (ref.current) {
        ref.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    };

    return (
      <Container maxWidth={false} sx={{ mt: 4, position: 'relative', px: 4 }}>
        <Typography variant="h4" gutterBottom>
          Project List
        </Typography>
        <Box mb={3}>
          <TextField
            label="Search Projects"
            variant="outlined"
            fullWidth
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </Box>
        {/* Program Filter Row */}
        <Box mb={2} sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {showLeft && (
            <IconButton onClick={() => handleScrollLeft(programScrollRef)} sx={{ position: 'absolute', left: 0, zIndex: 1, background: 'white' }}>
              <ChevronLeftIcon />
            </IconButton>
          )}
          <Box
            ref={programScrollRef}
            sx={{
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              flex: 1,
              mx: 4,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Stack direction="row" spacing={1}>
              <Chip
                label="All"
                clickable
                color={selectedProgramId === null ? 'primary' : 'default'}
                variant={selectedProgramId === null ? 'filled' : 'outlined'}
                onClick={() => handleProgramFilter(null)}
                sx={{ fontWeight: 500, fontSize: 16, borderRadius: 2, px: 2, py: 1 }}
              />
              {programsLoading ? (
                <Chip label="Loading..." />
              ) : (
                programs.map((program: any) => (
                  <Tooltip title={program.programName} key={program.programId} arrow>
                    <Chip
                      label={program.shortName || program.programName}
                      clickable
                      color={selectedProgramId === program.programId ? 'primary' : 'default'}
                      variant={selectedProgramId === program.programId ? 'filled' : 'outlined'}
                      onClick={() => handleProgramFilter(program.programId)}
                      sx={{ fontWeight: 500, fontSize: 16, borderRadius: 2, px: 2, py: 1 }}
                    />
                  </Tooltip>
                ))
              )}
            </Stack>
          </Box>
          {showRight && (
            <IconButton onClick={() => handleScrollRight(programScrollRef)} sx={{ position: 'absolute', right: 0, zIndex: 1, background: 'white' }}>
              <ChevronRightIcon />
            </IconButton>
          )}
        </Box>
        {/* Project Status Filter Row */}
        <Box mb={3} sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
          {showStatusLeft && (
            <IconButton onClick={() => handleScrollLeft(statusScrollRef)} sx={{ position: 'absolute', left: 0, zIndex: 1, background: 'white' }}>
              <ChevronLeftIcon />
            </IconButton>
          )}
          <Box
            ref={statusScrollRef}
            sx={{
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              flex: 1,
              mx: 4,
              scrollbarWidth: 'none',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <Stack direction="row" spacing={1}>
              <Chip
                label="All"
                clickable
                color={selectedStatus === null ? 'primary' : 'default'}
                variant={selectedStatus === null ? 'filled' : 'outlined'}
                onClick={() => handleStatusFilter(null)}
                sx={{ fontWeight: 500, fontSize: 16, borderRadius: 2, px: 2, py: 1 }}
              />
              {statusLoading ? (
                <Chip label="Loading..." />
              ) : (
                statuses.map((status: any) => (
                  <Chip
                    key={status.projectStatusId}
                    label={status.projectStatusLongName || status.projectStatusName}
                    clickable
                    color={selectedStatus === status.projectStatusLongName ? 'primary' : 'default'}
                    variant={selectedStatus === status.projectStatusLongName ? 'filled' : 'outlined'}
                    onClick={() => handleStatusFilter(status.projectStatusLongName)}
                    sx={{ fontWeight: 500, fontSize: 16, borderRadius: 2, px: 2, py: 1 }}
                  />
                ))
              )}
            </Stack>
          </Box>
          {showStatusRight && (
            <IconButton onClick={() => handleScrollRight(statusScrollRef)} sx={{ position: 'absolute', right: 0, zIndex: 1, background: 'white' }}>
              <ChevronRightIcon />
            </IconButton>
          )}
        </Box>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">Error loading projects.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project Number</TableCell>
                  <TableCell>Project Name</TableCell>
                  <TableCell>Organization Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Project Lead</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredProjects.map((project: any, idx: number) => (
                  <TableRow key={idx} hover style={{ cursor: 'pointer' }} onClick={() => handleRowClick(project)}>
                    <TableCell>{project.projectNumber}</TableCell>
                    <TableCell>{project.projectName}</TableCell>
                    <TableCell>{project.organizationName}</TableCell>
                    <TableCell>{project.projectStatusLongName || project.projectStatus}</TableCell>
                    <TableCell>{project.projectLead}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
        <Drawer
          anchor="right"
          open={detailsOpen}
          onClose={handleCloseDetails}
          PaperProps={{ sx: { width: 800 } }}
        >
          <CrmMiniProjectDetails project={selectedProject} onClose={handleCloseDetails} />
        </Drawer>
        <Backdrop open={detailsOpen} sx={{ zIndex: (theme) => theme.zIndex.drawer - 1, backgroundColor: 'rgba(0,0,0,0.3)' }} />
      </Container>
    );
}

export default CrmProto;