import React, { useState, useEffect } from 'react';
import { Grid, Typography, TextField, Box } from '@mui/material';
import ActivityLogs from './ActivityLogs';
import UploadedFiles from './UploadedFiles';
import AttributesFilled from './AttributesFilled';
import ProjectTableValues from './ProjectTableValues';
import UserMentions from './UserMentions';

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
    user_mention_count: number;
    user_mentions: any[];
  };
}

const UserStatsDisplay: React.FC<UserStatsDisplayProps> = ({ stats }) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('Stats:', stats);
  }, [stats]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value.toLowerCase());
  };

  const filterData = (data: any[]) => {
    return data.filter(item => JSON.stringify(item).toLowerCase().includes(searchTerm));
  };

  return (
    <Box>
      <TextField
        label="Search"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={handleSearchChange}
      />
      <Grid item xs={12} sm={12} lg={12} container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <UserMentions logs={filterData(stats.user_mentions)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <ActivityLogs logs={filterData(stats.activity_logs)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <UploadedFiles files={filterData(stats.uploaded_files)} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <AttributesFilled attributes={filterData(stats.attributes_filled)} />
        </Grid>
        <Grid item xs={12} sm={12} md={12} mt={4}>
          <ProjectTableValues values={filterData(stats.project_table_values)} />
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserStatsDisplay;