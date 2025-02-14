import React, { useEffect, useState } from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

interface Promotion {
  ActionType: string;
  DaysInPhase: number;
  NextPromotionDate: string | null;
  PhaseName: string;
  PromotedByUser: string;
  PromotionDate: string;
  SortOrder: number;
  FinalPhase: number;
}

interface TimelineChartProps {
  promotions: Promotion[];
}

const TimelineChart: React.FC<TimelineChartProps> = ({ promotions }) => {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);

  const labels = promotions.map(promo => promo.PhaseName);
  const data = promotions.map(promo => promo.DaysInPhase);

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: 'Days in Phase',
        data: data,
        fill: false,
        borderColor: 'blue',
        tension: 0.1,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        title: {
          display: true,
          text: 'Phases',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Days in Phase',
        },
        beginAtZero: true,
      },
    },
  };

  useEffect(() => {
    // Initialize any additional functionality here
  }, []);

  const handleEventClick = (index: number) => {
    setSelectedEvent(index);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Project Timeline</Typography>
      <Box sx={{ height: '20%', width: '100%' }}>
        <Line data={chartData} options={options} />
      </Box>
      <Box>
        <ul>
          {promotions.map((promo, index) => (
            <li key={index} className={selectedEvent === index ? 'selected' : ''} onClick={() => handleEventClick(index)}>
              <h2>{promo.PhaseName}</h2>
              <em>{promo.PromotionDate}</em>
              <p>{promo.ActionType}</p>
            </li>
          ))}
        </ul>
      </Box>
    </Paper>
  );
};

export default TimelineChart;