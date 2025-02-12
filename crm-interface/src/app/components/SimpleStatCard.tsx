import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';

interface SimpleStatCardProps {
  title: string;
  value: string;
}

const SimpleStatCard: React.FC<SimpleStatCardProps> = ({ title, value }) => {
  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" component="p">
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default SimpleStatCard;