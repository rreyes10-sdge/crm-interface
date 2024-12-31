import * as React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SparkLineChart, areaElementClasses } from '@mui/x-charts';
import { useState } from 'react';

export type StatCardProps = {
  title: string;
  value: string;
  interval: string;
  trend: 'up' | 'down' | 'neutral';
  percentageChange: number;
  data: number[];
};

function getLast30Days() {
  const dates = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    }));
  }
  return dates;
}

function AreaGradient({ color, id }: { color: string; id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor={color} stopOpacity={0.3} />
        <stop offset="100%" stopColor={color} stopOpacity={0} />
      </linearGradient>
    </defs>
  );
}

export default function StatCard({
  title,
  value,
  interval,
  trend,
  percentageChange,
  data,
}: StatCardProps) {
  const theme = useTheme();
  const [hoverData, setHoverData] = useState<{ value: number; date: string } | null>(null);
  const last30Days = getLast30Days();

  const trendColors = {
    up:
      theme.palette.mode === 'light'
        ? theme.palette.success.main
        : theme.palette.success.dark,
    down:
      theme.palette.mode === 'light'
        ? theme.palette.error.main
        : theme.palette.error.dark,
    neutral:
      theme.palette.mode === 'light'
        ? theme.palette.grey[400]
        : theme.palette.grey[700],
  };

  const labelColors = {
    up: 'success' as const,
    down: 'error' as const,
    neutral: 'default' as const,
  };

  const color = labelColors[trend];
  const chartColor = trendColors[trend];
  const trendValues = { up: 'Up', down: 'Down', neutral: 'Neutral' };

  return (
    <Card variant="outlined" sx={{ height: '100%', flexGrow: 1 }}>
      <CardContent>
        <Typography component="h2" variant="subtitle2" gutterBottom>
          {title}
        </Typography>
        <Stack
          direction="column"
          sx={{ justifyContent: 'space-between', flexGrow: '1', gap: 1 }}
        >
          <Stack sx={{ justifyContent: 'space-between' }}>
            <Stack
              direction="row"
              sx={{ justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Typography variant="h4" component="p">
                {value}
              </Typography>
              <Chip size="small" color={color} label={`${trendValues[trend]} (${percentageChange}%)`} />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {interval}
            </Typography>
          </Stack>
          <Box sx={{ width: '100%', height: 50, position: 'relative' }}>
            <SparkLineChart
              colors={[chartColor]}
              data={data}
              area
              showHighlight={true}
              showTooltip={false}
              slots={{
                area: (props) => (
                  <g
                    onMouseLeave={() => setHoverData(null)}
                  >
                    <rect
                      x={0}
                      y={0}
                      width="100%"
                      height="100%"
                      fill="transparent"
                      onMouseMove={(event) => {
                        const rect = event.currentTarget.getBoundingClientRect();
                        const relativeX = event.clientX - rect.left;
                        const dataIndex = Math.floor((relativeX / rect.width) * data.length);
                        
                        if (dataIndex >= 0 && dataIndex < data.length) {
                          setHoverData({
                            value: data[dataIndex],
                            date: last30Days[dataIndex]
                          });
                        }
                      }}
                      onMouseLeave={() => setHoverData(null)}
                    />
                    {props.children}
                  </g>
                )
              }}
              xAxis={{
                scaleType: 'band',
                data: last30Days,
              }}
              sx={{
                [`& .${areaElementClasses.root}`]: {
                  fill: `url(#area-gradient-${value})`,
                },
              }}
            >
              <AreaGradient color={chartColor} id={`area-gradient-${value}`} />
            </SparkLineChart>
            {hoverData !== null && (
              <Box
                sx={{ 
                  position: 'absolute',
                  top: -45,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 1,
                  boxShadow: theme.shadows[2],
                  minWidth: '80px',
                  overflow: 'hidden',
                }}
              >
                <Stack
                  spacing={0.5}
                  sx={{
                    p: 1,
                  }}
                >
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      display: 'block',
                      textAlign: 'center',
                    }}
                  >
                    {hoverData.date}
                  </Typography>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      fontWeight: 'medium',
                      textAlign: 'center',
                    }}
                  >
                    {hoverData.value}
                  </Typography>
                </Stack>
              </Box>
            )}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
