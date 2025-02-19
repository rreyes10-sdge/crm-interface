import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Select, MenuItem, Typography, Grid, CircularProgress } from '@mui/material';
import UserStatsDisplay from './UserStatsDisplay';
import FavoriteProjects from './FavoriteProjects';
import SavedFilters from './SavedFilters';
import UserStatsOverview from './UserStatsOverview';

interface User {
  UserId: string;
  ProperName: string;
  RoleName: string;
  LastLoginAt: string;
  activity_count: number;
  uploaded_files_count: number;
  attributes_filled_count: number;
  project_table_values_count: number;
  user_mention_count: number;
}

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

const UserStats: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(7);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [overallLoading, setOverallLoading] = useState<boolean>(true);
  const sortedUsers = users.sort((a, b) => {
    if (a.RoleName && !b.RoleName) return -1;
    if (!a.RoleName && b.RoleName) return 1;
    return 0;
  });

  useEffect(() => {
    // Fetch active users and overall stats
    setOverallLoading(true);
    axios.get(`http://127.0.0.1:5000/api/active-users?time_range=${timeRange}`)
      .then(response => {
        console.log('Active Users and Overall Stats Response:', response.data); // Debugging
        if (response.data && response.data.active_users) {
          setUsers(response.data.active_users);
          setOverallLoading(false);
        } else {
          console.error('Unexpected response structure:', response.data);
          setOverallLoading(false);
        }
      })
      .catch(error => {
        console.error('Error fetching active users and overall stats:', error);
        setOverallLoading(false);
      });
  }, [timeRange]);

  useEffect(() => {
    if (selectedUser) {
      console.log('Selected User:', selectedUser); // Debugging
      console.log('Time Range:', timeRange); // Debugging
      setLoading(true);
      // Fetch stats for selected user
      axios.get(`http://127.0.0.1:5000/api/stats?user_id=${selectedUser}&time_range=${timeRange}`)
        .then(response => {
          setStats(response.data.stats);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching user stats:', error);
          setLoading(false);
        });
    }
  }, [selectedUser, timeRange]);

  useEffect(() => {
    if (stats) {
      console.log('Stats:', stats); // Debugging
      console.log('Saved Filters:', stats.user_saved_filters); // Debugging
    }
  }, [stats]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '100%' }, mx: 'auto' }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        User Overview
      </Typography>
      {overallLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="400px">
          <CircularProgress />
        </Box>
      ) : users.length > 0 ? (
        <UserStatsOverview users={users} />
      ) : (
        <Typography sx={{ mb: 2 }}>Failed to load overall stats.</Typography>
      )}
      <br></br>
      <br></br>
      <Grid container spacing={2} columns={12} sx={{ mb: (theme) => theme.spacing(2) }}>
        <Grid item xs={12} sm={6} lg={3}>
          <Select
            value={selectedUser || ''}
            onChange={(e) => setSelectedUser(e.target.value)}
            displayEmpty
            fullWidth
          >
            <MenuItem value="" disabled>Select a user</MenuItem>
            {sortedUsers.map(user => (
              <MenuItem key={user.UserId} value={user.UserId}>
                {user.ProperName}
                {user.RoleName && ` - (${user.RoleName})`}
                {user.LastLoginAt !== 'Never logged in' ? ` | ${new Date(user.LastLoginAt).toLocaleDateString()}` : ' | N/A'}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(Number(e.target.value))}
            displayEmpty
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
      <Box sx={{ width: '100%', height: 5, backgroundColor: 'grey.300', mb: 0, mt: 4 }} />
      <Grid container spacing={2} columns={12} sx={{ mb: (theme) => theme.spacing(2) }}>
        {selectedUser ? (
          stats ? (
            <>
              <Grid item xs={12}>
                <FavoriteProjects favoriteProjects={stats.user_favorited_projects} />
              </Grid>
              <Grid item xs={12}>
                <SavedFilters savedFilters={stats.user_saved_filters} />
              </Grid>
              <Grid item xs={12}>
                <UserStatsDisplay stats={stats} />
              </Grid>
            </>
          ) : (
            <Typography sx={{ mb: 2 }}>Loading overview...</Typography>
          )
        ) : (
          <Typography>Please select a user to view their overview.</Typography>
        )}
      </Grid>
    </Box>
  );
};

export default UserStats;