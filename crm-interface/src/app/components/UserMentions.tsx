import React from 'react';
import { Card, CardContent, Typography, List, ListItem, ListItemText, Box } from '@mui/material';

interface ActivityMentionLog {
  UserId: string;
  ProperName: string;
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

interface UserMentionsProps {
  logs: ActivityMentionLog[];
}

const UserMentions: React.FC<UserMentionsProps> = ({ logs }) => {
  // Sort logs in descending order based on CreatedAt date
  const sortedLogs = logs.sort((a, b) => new Date(b.CreatedAt).getTime() - new Date(a.CreatedAt).getTime());
  
  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        
        {logs.length > 0 ? (
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
                      {new Date(log.CreatedAt).toLocaleDateString()} | Mentioned by: {log.ProperName}
                      </Typography>
                      <br />
                      Phase: {log.PhaseName} {log.ActivityType && ` | Activity Type: ${log.ActivityType}`}
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography>No activity logs for the selected time range.</Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default UserMentions;