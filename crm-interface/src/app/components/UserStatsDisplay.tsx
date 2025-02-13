import React from 'react';
import { Grid, Typography } from '@mui/material';
import SimpleStatCard from './SimpleStatCard';
import ActivityLogs from './ActivityLogs';
import UploadedFiles from './UploadedFiles';
import AttributesFilled from './AttributesFilled';
import ProjectTableValues from './ProjectTableValues';

interface UserStatsDisplayProps {
  stats: {
    activity_count: number;
    activity_logs: any[];
    uploaded_files_count: number;
    uploaded_files: any[];
    attributes_filled_count: number;
    attributes_filled: any[];
    project_table_values_count: number;
    project_table_values: any[];
  };
}

const UserStatsDisplay: React.FC<UserStatsDisplayProps> = ({ stats }) => {
//   console.log('UserStatsDisplay Props:', stats); // Debugging

  return (
    <Grid item xs={12} sm={12} lg={12} container spacing={2} >
      <Grid item xs={12} sm={6} md={3}>
        <Typography component="h2" variant="h6" sx={{ mt: 4 }} gutterBottom>
          Activity Logs ({stats.activity_count.toString()})
        </Typography>
        <ActivityLogs logs={stats.activity_logs} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Typography component="h2" variant="h6" sx={{ mt: 4 }} gutterBottom>
          Uploaded Files ({stats.uploaded_files_count.toString()})
        </Typography>
        <UploadedFiles files={stats.uploaded_files} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Typography component="h2" variant="h6" sx={{ mt: 4 }} gutterBottom>
          Attributes Entered ({stats.attributes_filled_count.toString()})
        </Typography>
        <AttributesFilled attributes={stats.attributes_filled} />
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Typography component="h2" variant="h6" sx={{ mt: 4 }} gutterBottom>
          Project Table Values ({stats.project_table_values_count.toString()})
        </Typography>
        <ProjectTableValues values={stats.project_table_values} />
      </Grid>
    </Grid>
  );
};

export default UserStatsDisplay;