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
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>Project Timeline</Typography>
      <Box sx={{ display: 'flex', overflowX: 'auto' }}>
        <Timeline
          position="right"
          sx={{
            [`& .${timelineOppositeContentClasses.root}`]: {
              flex: 0.2,
            },
          }}
        >
          {promotions.map((promo, index) => (
            <TimelineItem key={index}>
              <TimelineOppositeContent color="text.secondary">
                <Typography>{new Date(promo.PromotionDate).toLocaleDateString()}</Typography>
                <Typography>Days in Phase: {promo.DaysInPhase}</Typography>
              </TimelineOppositeContent>
              <TimelineSeparator>
                <TimelineDot style={{ backgroundColor: getDotColor(promo.PhaseName) }} />
                {index < promotions.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="h6">{promo.PhaseName}</Typography>
                <Typography>{promo.ActionType}</Typography>
                {promo.DaysBeforeFirstPromotion !== undefined && promo.DaysBeforeFirstPromotion > 0 && (
                  <Typography>Days Before First Promotion: {promo.DaysBeforeFirstPromotion}</Typography>
                )}
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