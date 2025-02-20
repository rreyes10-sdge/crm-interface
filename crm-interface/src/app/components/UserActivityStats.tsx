'use client';

import React from 'react';
import { Card, CardContent, Stack, Typography, LinearProgress, linearProgressClasses, Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Define colors based on activity types
const activityColors = [
  'hsl(227, 100%, 80%)',  // Activities
  'hsl(227, 100%, 60%)',  // Uploads
  'hsl(227, 100%, 40%)',  // Attributes
  'hsl(227, 100%, 30%)',  // Table Values
  'hsl(227, 100%, 20%)',  // Mentions
];

interface Stats {
  activity_count: number;
  uploaded_files_count: number;
  attributes_filled_count: number;
  project_table_values_count: number;
  user_mention_count: number;
}

interface UserActivityStatsProps {
  stats: Stats;
}

const UserActivityStats: React.FC<UserActivityStatsProps> = ({ stats }) => {
  const totalActivities = 
    stats.activity_count +
    stats.uploaded_files_count +
    stats.attributes_filled_count +
    stats.project_table_values_count +
    stats.user_mention_count;

  const activities = [
    { label: 'Activities', value: stats.activity_count },
    { label: 'Uploads', value: stats.uploaded_files_count },
    { label: 'Attributes', value: stats.attributes_filled_count },
    { label: 'Table Values', value: stats.project_table_values_count },
    { label: 'Mentions', value: stats.user_mention_count },
  ];

  const getPercentage = (value: number) => {
    return totalActivities > 0 ? Math.round((value / totalActivities) * 100) : 0;
  };

  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Activity Overview
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Total Activities: {totalActivities}
        </Typography>

        {activities.map((item, index) => (
          <Stack
            key={index}
            direction="row"
            sx={{ alignItems: 'center', gap: 2, pb: 2 }}
          >
            <Stack sx={{ gap: 1, flexGrow: 1 }}>
              <Stack
                direction="row"
                sx={{
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: '500' }}>
                  {item.label}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {item.value} ({getPercentage(item.value)}%)
                </Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={getPercentage(item.value)}
                sx={{
                  [`& .${linearProgressClasses.bar}`]: {
                    backgroundColor: activityColors[index],
                  },
                }}
              />
            </Stack>
          </Stack>
        ))}
      </CardContent>
    </Card>
  );
};

export default UserActivityStats; 