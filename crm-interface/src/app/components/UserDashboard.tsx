'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { Box, Typography, Select, MenuItem, Grid, CircularProgress } from '@mui/material';
import UserStatsDisplay from './UserStatsDisplay';
import FavoriteProjects from './FavoriteProjects';
import SavedFilters from './SavedFilters';

interface Stats {
  activity_count: number;
  activity_logs: any[];
  uploaded_files_count: number;
  uploaded_files: any[];
  attributes_filled_count: number;
  attributes_filled: any[];
  project_table_values_count: number;
  project_table_values: any[];
  user_saved_filters: any[];
  user_favorited_projects: any[];
  user_mention_count: number;
  user_mentions: any[];
}

const UserDashboard: React.FC = () => {
  const params = useParams();
  const userId = params?.userId as string;
  const [timeRange, setTimeRange] = useState<number>(7);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (userId) {
      setLoading(true);
      axios.get(`http://127.0.0.1:5000/api/stats?user_id=${userId}&time_range=${timeRange}`)
        .then(response => {
          setStats(response.data.stats);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching user stats:', error);
          setLoading(false);
        });
    }
  }, [userId, timeRange]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '100%' }, mx: 'auto', p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        User Dashboard - {userId}
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            fullWidth
          >
            <MenuItem value={7}>Last 7 Days</MenuItem>
            <MenuItem value={30}>Last 30 Days</MenuItem>
            <MenuItem value={60}>Last 60 Days</MenuItem>
            <MenuItem value={180}>Last 180 Days</MenuItem>
            <MenuItem value={360}>Last Year</MenuItem>
          </Select>
        </Grid>
      </Grid>

      {stats && (
        <>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FavoriteProjects favoriteProjects={stats.user_favorited_projects} />
            </Grid>
            <Grid item xs={12}>
              <SavedFilters savedFilters={stats.user_saved_filters} />
            </Grid>
            <Grid item xs={12}>
              <UserStatsDisplay stats={stats} />
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default UserDashboard;