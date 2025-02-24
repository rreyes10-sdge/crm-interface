import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Typography, Select, MenuItem, Box, Grid, Paper } from '@mui/material';
import PromotionHistory from './PromotionHistory';
import ProjectTimelineView from './ProjectTimelineView';

interface Project {
  ProjectId: string;
  ProjectName: string;
  ProgramName: string;
  ProjectStatus: string;
  OrgName: string;
  ProjectLead: string;
  ProjectNumber: string;
  ProjectCreationDate: string;
}

interface Promotion {
  ActionType: string;
  DaysInPhase: number;
  NextPromotionDate: string | null;
  PhaseName: string;
  PromotedByUser: string;
  PromotionDate: string;
  SortOrder: number;
  FinalPhase: number;
  DaysBeforeFirstPromotion: number;
}

interface Overview {
  project_info: Project[];
  promotion: Promotion[];
}

interface ProjectSummaryProps {
  projectId?: number;
}

const ProjectSummary: React.FC<ProjectSummaryProps> = ({ projectId }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projectId?.toString() ?? null);
  const [selectedProgramName, setSelectedProgramName] = useState<string | null>('Any');
  const [selectedProjectStatus, setSelectedProjectStatus] = useState<string | null>('Any');
  const [selectedProjectLead, setSelectedProjectLead] = useState<string | null>('Any');
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    axios.get('http://127.0.0.1:5000/api/projects')
      .then(response => {
        const sortedProjects = response.data.projects.sort((a: Project, b: Project) => {
          if (a.ProjectName < b.ProjectName) {
            return -1;
          }
          if (a.ProjectName > b.ProjectName) {
            return 1;
          }
          return 0;
        });
        setProjects(sortedProjects);
        setFilteredProjects(sortedProjects);
      })
      .catch(error => {
        console.error('Error fetching projects:', error);
      });
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      axios.get(`http://127.0.0.1:5000/api/project-overview?project_id=${selectedProjectId}`)
        .then(response => {
          setOverview(response.data.overview);
        })
        .catch(error => {
          console.error('Error fetching project overview:', error);
        });
    }
  }, [selectedProjectId]);

  useEffect(() => {
    let filtered = projects;

    if (selectedProgramName && selectedProgramName !== 'Any') {
      filtered = filtered.filter(project => project.ProgramName === selectedProgramName);
    }

    if (selectedProjectStatus && selectedProjectStatus !== 'Any') {
      filtered = filtered.filter(project => project.ProjectStatus === selectedProjectStatus);
    }
  
    if (selectedProjectLead && selectedProjectLead !== 'Any') {
      filtered = filtered.filter(project => project.ProjectLead === selectedProjectLead);
    }

    setFilteredProjects(filtered);
  }, [selectedProgramName, selectedProjectStatus, selectedProjectLead, projects]);

  const uniqueProgramNames = [...Array.from(new Set(projects.map(project => project.ProgramName)))];
  const uniqueProjectStatuses = [...Array.from(new Set(projects.map(project => project.ProjectStatus)))];
  const uniqueProjectLeads = [...Array.from(new Set(projects.map(project => project.ProjectLead)))];

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '100%' }, mx: 'auto' }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        Project Overview
      </Typography>
      <Grid container spacing={2} columns={12} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Select
            value={selectedProgramName || ''}
            onChange={(e) => setSelectedProgramName(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="Any">Any</MenuItem>
            {uniqueProgramNames.map(programName => (
              <MenuItem key={programName} value={programName}>
                {programName}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Select
            value={selectedProjectStatus || ''}
            onChange={(e) => setSelectedProjectStatus(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="Any">Any</MenuItem>
            {uniqueProjectStatuses.map(projectStatus => (
              <MenuItem key={projectStatus} value={projectStatus}>
                {projectStatus}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Select
            value={selectedProjectLead || ''}
            onChange={(e) => setSelectedProjectLead(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="Any">Any</MenuItem>
            {uniqueProjectLeads.map(projectLead => (
              <MenuItem key={projectLead} value={projectLead}>
                {projectLead}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Select
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>Select a project</MenuItem>
            {filteredProjects.map(project => (
              <MenuItem key={project.ProjectId} value={project.ProjectId}>
                {project.ProjectNumber} - {project.ProjectName}
              </MenuItem>
            ))}
          </Select>
        </Grid>
      </Grid>
      {overview && overview.project_info && overview.promotion && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6">Project Information</Typography>
            {overview.project_info.map(info => (
              <Box key={info.ProjectId} sx={{ mt: 2 }}>
                <Typography><strong>Organization:</strong> {info.OrgName}</Typography>
                <Typography><strong>Program Name:</strong> {info.ProgramName}</Typography>
                <Typography><strong>Project Name:</strong> {info.ProjectName}</Typography>
                <Typography><strong>Project Status:</strong> {info.ProjectStatus}</Typography>
                <Typography>
                    <strong>Project Created:</strong> {new Date(info.ProjectCreationDate).toLocaleDateString()}
                </Typography>
                <Typography><strong>Project Lead:</strong> {info.ProjectLead}</Typography>
              </Box>
            ))}
          </Paper>
          <ProjectTimelineView promotions={overview.promotion} />
          <PromotionHistory promotions={overview.promotion} />
        </Box>
      )}
    </Box>
  );
};

export default ProjectSummary;