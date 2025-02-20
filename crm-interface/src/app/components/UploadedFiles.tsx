import React from 'react';
import { List, ListItem, ListItemText, Box, Typography } from '@mui/material';
import ExpandableCard from './ExpandableCard';

interface UploadedFile {
  AttachmentId: string;
  Title: string | null;
  TimeStored: string;
  StoredByUserId: string;
  Filename: string;
  Description: string | null;
  PhaseName: string | null;
  ProjectNumber: string | null;
  ProjectName: string | null;
  OrgName: string | null;
  Label: string | null;
  PhaseId: number | null;
  ProjectId: number | null;
}

interface UploadedFilesProps {
  files: UploadedFile[];
}

const UploadedFiles: React.FC<UploadedFilesProps> = ({ files }) => {
  const sortedFiles = files.sort((a, b) => new Date(b.TimeStored).getTime() - new Date(a.TimeStored).getTime());

  return (
    <ExpandableCard 
      title="Uploaded Files" 
      count={files.length}
      emptyMessage="No uploaded files for the selected time range."
      defaultHeight="600px"
    >
      <List>
        {sortedFiles.map((file, index) => (
          <ListItem key={index} alignItems="flex-start">
            <ListItemText
              primary={
                <>
                  {file.ProjectId !== null && !isNaN(file.ProjectId) ? (
                    <a
                      href={`https://ctsolutions.sempra.com/projects/${file.ProjectId}?phase=${file.PhaseId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <strong>{file.ProjectNumber || 'N/A'} - {file.OrgName || 'N/A'}</strong>
                    </a>
                  ) : (
                    <strong>{file.ProjectNumber || 'N/A'} - {file.OrgName || 'N/A'}</strong>
                  )}
                  <br />
                  <Box
                    sx={{
                      border: '1px solid grey',
                      borderRadius: '4px',
                      padding: '8px',
                      marginTop: '8px',
                      backgroundColor: '#f9f9f9'
                    }}
                    dangerouslySetInnerHTML={{ __html: file.Title || 'No Title' }}
                  />
                </>
              }
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary">
                    {new Date(file.TimeStored).toLocaleDateString()}
                  </Typography>
                  <br />
                  {file.PhaseName && `Phase: ${file.PhaseName}`} {file.Label && ` | Attribute Label: ${file.Label}`}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </ExpandableCard>
  );
};

export default UploadedFiles;