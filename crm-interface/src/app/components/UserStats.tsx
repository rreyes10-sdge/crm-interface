import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Select, MenuItem, Typography, Grid } from '@mui/material';
import UserStatsDisplay from './UserStatsDisplay';
import FavoriteProjects from './FavoriteProjects';
import SavedFilters from './SavedFilters';

interface User {
  UserId: string;
  ProperName: string;
  RoleName: string;
  LastLoginAt: string;
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
  const [timeRange, setTimeRange] = useState<number>(30);
  const [stats, setStats] = useState<Stats | null>(null);
  const sortedUsers = users.sort((a, b) => {
    if (a.RoleName && !b.RoleName) return -1;
    if (!a.RoleName && b.RoleName) return 1;
    return 0;
  });

  useEffect(() => {
    // Fetch active users
    axios.get('http://127.0.0.1:5000/api/active-users')
      .then(response => {
        setUsers(response.data.active_users);
        setSelectedUser('RREYES10'); // Set default user after users are loaded
      })
      .catch(error => {
        console.error('Error fetching active users:', error);
      });
  }, []);

  useEffect(() => {
    if (selectedUser) {
      console.log('Selected User:', selectedUser); // Debugging
      console.log('Time Range:', timeRange); // Debugging
      // Fetch stats for selected user
      axios.get(`http://127.0.0.1:5000/api/stats?user_id=${selectedUser}&time_range=${timeRange}`)
        .then(response => {
        //   console.log('API Response:', response.data); // Debugging
          setStats(response.data.stats);
        })
        .catch(error => {
          console.error('Error fetching user stats:', error);
        });
    }
  }, [selectedUser, timeRange]);

  return (
    <Box sx={{ width: '100%', maxWidth: { xs: '100%', md: '100%' }, mx: 'auto' }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
        User Overview
      </Typography>
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