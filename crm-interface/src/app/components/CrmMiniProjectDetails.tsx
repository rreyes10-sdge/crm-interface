import React from 'react';
import { Box, Typography, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface CrmMiniProjectDetailsProps {
  project: any;
  onClose: () => void;
}

const CrmMiniProjectDetails: React.FC<CrmMiniProjectDetailsProps> = ({ project, onClose }) => {
  if (!project) {
    return (
      <Box p={3}>
        <Typography variant="h6">No project selected.</Typography>
      </Box>
    );
  }

  return (
    <Box p={3} width={"100%"}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h6">Project Details</Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="subtitle2" color="text.secondary">Project Number</Typography>
      <Typography variant="body1" mb={2}>{project.projectNumber}</Typography>
      <Typography variant="subtitle2" color="text.secondary">Project Name</Typography>
      <Typography variant="body1" mb={2}>{project.projectName}</Typography>
      <Typography variant="subtitle2" color="text.secondary">Organization Name</Typography>
      <Typography variant="body1" mb={2}>{project.organizationName}</Typography>
      <Typography variant="subtitle2" color="text.secondary">Project Status</Typography>
      <Typography variant="body1" mb={2}>{project.projectStatus}</Typography>
      <Typography variant="subtitle2" color="text.secondary">Current Phase</Typography>
      <Typography variant="body1" mb={2}>{project.currentPhase}</Typography>
      <Typography variant="subtitle2" color="text.secondary">Project Lead</Typography>
      <Typography variant="body1" mb={2}>{project.projectLead}</Typography>
    </Box>
  );
};

export default CrmMiniProjectDetails;
