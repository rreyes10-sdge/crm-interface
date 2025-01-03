"use client";

import * as React from 'react';
import { PieChart } from '@mui/x-charts/PieChart';
import { useDrawingArea } from '@mui/x-charts/hooks';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { getProjectStatusCounts } from '../data/staticData';
import CircularProgress from '@mui/material/CircularProgress';

// Define colors based on our base color #001689
const statusColors = [
  'hsl(227, 100%, 80%)',  // Lightest shade
  'hsl(227, 100%, 60%)',
  'hsl(227, 100%, 40%)',
  'hsl(227, 100%, 30%)',
  'hsl(227, 100%, 20%)',  // Darkest shade
];

interface StyledTextProps {
  variant: 'primary' | 'secondary';
}

const StyledText = styled('text', {
  shouldForwardProp: (prop) => prop !== 'variant',
})<StyledTextProps>(({ theme }) => ({
  textAnchor: 'middle',
  dominantBaseline: 'central',
  fill: theme.palette.text.secondary,
  variants: [
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontSize: theme.typography.h5.fontSize,
      },
    },
    {
      props: ({ variant }) => variant !== 'primary',
      style: {
        fontSize: theme.typography.body2.fontSize,
      },
    },
    {
      props: {
        variant: 'primary',
      },
      style: {
        fontWeight: theme.typography.h5.fontWeight,
      },
    },
    {
      props: ({ variant }) => variant !== 'primary',
      style: {
        fontWeight: theme.typography.body2.fontWeight,
      },
    },
  ],
}));

interface PieCenterLabelProps {
  primaryText: string;
  secondaryText: string;
}

function PieCenterLabel({ primaryText, secondaryText }: PieCenterLabelProps) {
  const drawingArea = useDrawingArea();
  const { width, height, left, top } = drawingArea;
  const primaryY = top + height / 2 - 10;
  const secondaryY = primaryY + 24;

  return (
    <React.Fragment>
      <StyledText variant="primary" x={left + width / 2} y={primaryY}>
        {primaryText}
      </StyledText>
      <StyledText variant="secondary" x={left + width / 2} y={secondaryY}>
        {secondaryText}
      </StyledText>
    </React.Fragment>
  );
}

export default function ChartProjectSubmissions() {
  interface ProjectStatus {
    status: string;
    value: number;
  }

  const [projectStatuses, setProjectStatuses] = React.useState<ProjectStatus[]>([]);
  const [totalProjects, setTotalProjects] = React.useState(0);

  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getProjectStatusCounts();
        setProjectStatuses(data);
        setTotalProjects(data.reduce((sum, item) => sum + item.value, 0));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="400px">
        <CircularProgress />
      </Box>
    );
  }

  // Calculate percentage for each status
  const getPercentage = (value: number) => {
    return Math.round((value / totalProjects) * 100);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Project Submissions
      </Typography>

      <Card
        variant="outlined"
        sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, width: '280px' }}
      >
        <CardContent>
          <br></br>
          {/* <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <PieChart
            colors={statusColors}
            margin={{
              left: 80,
              right: 80,
              top: 80,
              bottom: 80,
            }}
            series={[
              {
                data: projectStatuses.map(item => ({
                  label: item.status,
                  value: item.value,
                })),
                innerRadius: 75,
                outerRadius: 100,
                paddingAngle: 0,
                highlightScope: { faded: 'global', highlighted: 'item' },
              },
            ]}
            height={260}
            width={260}
            slotProps={{
              legend: { hidden: true },
            }}
          >
            <PieCenterLabel 
              primaryText={totalProjects.toString()} 
              secondaryText="Total" 
            />
          </PieChart>
        </Box> */}
          {projectStatuses.map((item, index) => (
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
                    {item.status}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    {item.value} ({getPercentage(item.value)}%)
                  </Typography>
                </Stack>
                <LinearProgress
                  variant="determinate"
                  aria-label="Number of projects by status"
                  value={getPercentage(item.value)}
                  sx={{
                    [`& .${linearProgressClasses.bar}`]: {
                      backgroundColor: statusColors[index],
                    },
                  }}
                />
              </Stack>
            </Stack>
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
