import React from 'react';
import { Typography, Box, Paper } from '@mui/material';
import { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineContent, TimelineDot, TimelineOppositeContent, timelineOppositeContentClasses } from '@mui/lab';

interface Promotion {
  ActionType: string;
  DaysInPhase: number;
  NextPromotionDate: string | null;
  PhaseName: string;
  PromotedByUser: string;
  PromotionDate: string;
  SortOrder: number;
  FinalPhase: number;
  DaysBeforeFirstPromotion?: number;
}

interface ProjectInfo {
  OrgName: string;
  PhaseId: number;
  PhaseName: string;
  ProgramName: string;
  ProjectCreationDate: string;
  ProjectId: number;
  ProjectName: string;
  ProjectNumber: string;
  ProjectStatus: string;
}

interface TimelineChartProps {
  projectInfo?: ProjectInfo[];
  promotions: Promotion[];
}

const baseColors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF5'];
const colorCache: { [key: string]: { dotColor: string, bgColor: string } } = {};

function generateColorsFromPhase(phaseName: string): { dotColor: string, bgColor: string } {
  const hash = Array.from(phaseName).reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  const baseColor = baseColors[Math.abs(hash) % baseColors.length];
  const dotColor = baseColor;
  const bgColor = hexToRgba(baseColor, 0.15);
  return { dotColor, bgColor };
}

function hexToRgba(hex: string, alpha: number): string {
    const bigint = parseInt(hex.slice(1), 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  
  function getDotColor(phaseName: string): string {
    if (!colorCache[phaseName]) {
      const { dotColor, bgColor } = generateColorsFromPhase(phaseName);
      colorCache[phaseName] = { dotColor, bgColor };
    }
    return colorCache[phaseName].dotColor;
  }

const TimelineChart: React.FC<TimelineChartProps> = ({ projectInfo = [], promotions }) => {
  const getPhaseColor = (index: number): string => {
    const colors = [
      '#FF5733', '#33FF57', '#3357FF', 
      '#FF33A1', '#A133FF', '#33FFF5'
    ];
    return colors[index % colors.length];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Project Timeline</Typography>
      <Box sx={{ display: 'flex', overflowX: 'auto', pb: 2 }}>
        <Timeline position="alternate">
          {promotions.map((promotion, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent color="textSecondary">
                <Typography variant="body2">
                  {formatDate(promotion.PromotionDate)}
                </Typography>
                {promotion.NextPromotionDate && (
                  <Typography variant="body2" color="text.secondary">
                    to {formatDate(promotion.NextPromotionDate)}
                  </Typography>
                )}
                <Typography variant="caption">
                  {promotion.DaysInPhase} days
                </Typography>
              </TimelineOppositeContent>
              
              <TimelineSeparator>
                <TimelineDot sx={{ bgcolor: getPhaseColor(index) }} />
                {index < promotions.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              
              <TimelineContent>
                <Box sx={{ 
                  p: 2, 
                  bgcolor: 'background.paper', 
                  borderRadius: 1,
                  boxShadow: 1,
                  '&:hover': {
                    boxShadow: 2,
                  }
                }}>
                  <Typography variant="h6" component="span">
                    {promotion.PhaseName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {promotion.ActionType}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Promoted by: {promotion.PromotedByUser}
                  </Typography>
                </Box>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </Box>
      <Box>
        {/* <Typography variant="h6" sx={{ mt: 2 }}>Project Information</Typography> */}
        {projectInfo.map((info, index) => (
          <Box key={index} sx={{ mt: 1 }}>
            <Typography>Organization: {info.OrgName}</Typography>
            <Typography>Project Name: {info.ProjectName}</Typography>
            <Typography>Project Number: {info.ProjectNumber}</Typography>
            <Typography>Program Name: {info.ProgramName}</Typography>
            <Typography>Project Status: {info.ProjectStatus}</Typography>
            <Typography>
              <strong>Project Created:</strong> {new Date(info.ProjectCreationDate).toLocaleDateString()}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default TimelineChart;