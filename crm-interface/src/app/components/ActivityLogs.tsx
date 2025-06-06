import React from 'react';
import { List, ListItem, ListItemText, Box, Typography } from '@mui/material';
import ExpandableCard from './ExpandableCard';

interface ActivityLog {
  UserId: string;
  Text: string;
  CreatedAt: string;
  ActivityType: string;
  Duration: number;
  PhaseName: string;
  ProjectId: number;
  ProjectNumber: string;
  ProjectName: string;
  OrgName: string;
  PhaseId: number;
}

interface ActivityLogsProps {
  logs: ActivityLog[];
}

const ActivityLogs: React.FC<ActivityLogsProps> = ({ logs }) => {
  // Sort logs in descending order based on CreatedAt date
  const sortedLogs = logs.sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
  
  return (
    <ExpandableCard 
      title="Activity Logs" 
      count={logs.length}
      emptyMessage="No activity logs for the selected time range."
      defaultHeight="600px"
      emptyStateHeight="100px"
    >
      <List>
        {sortedLogs.map((log, index) => (
          <ListItem key={index} alignItems="flex-start">
            <ListItemText
              primary={
                <>
                  <a
                    href={`https://ctsolutions.sempra.com/projects/${log.ProjectId}?phase=${log.PhaseId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <strong>{log.ProjectNumber} - {log.OrgName}</strong>
                  </a>
                  <br />
                  <Box
                    sx={{
                      border: '1px solid grey',
                      borderRadius: '4px',
                      padding: '8px',
                      marginTop: '8px',
                      backgroundColor: '#f9f9f9'
                    }}
                    dangerouslySetInnerHTML={{ __html: log.Text }}
                  />
                </>
              }
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary">
                    {new Date(log.CreatedAt).toLocaleDateString()}
                  </Typography>
                  <br />
                  Phase: {log.PhaseName} {log.ActivityType && ` | Activity Type: ${log.ActivityType}`} {log.Duration > 0 && ` | Duration: ${log.Duration} mins`}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </ExpandableCard>
  );
};

export default ActivityLogs;