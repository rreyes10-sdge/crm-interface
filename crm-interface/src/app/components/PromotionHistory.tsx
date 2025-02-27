import React from 'react';
import { Typography, Box, Paper, Grid } from '@mui/material';

interface Promotion {
  ActionType: string;
  DaysInPhase: number;
  NextPromotionDate: string | null;
  PhaseName: string;
  PromotedByUser: string;
  PromotionDate: string;
  SortOrder: number;
  FinalPhase: number;
  DaysBeforeFirstPromotion: number;
}

interface PromotionHistoryProps {
  promotions: Promotion[];
}

const PromotionHistory: React.FC<PromotionHistoryProps> = ({ promotions }) => {
  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Grid container spacing={2}>
        {promotions.map((promo, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Box sx={{ 
              p: 2, 
              border: '1px solid #ddd', 
              borderRadius: '4px', 
              backgroundColor: promo.FinalPhase ? '#e0f7fa' : '#f9f9f9' 
            }}>
              <Typography><strong>Phase Name:</strong> {promo.PhaseName}</Typography>
              <Typography><strong>Action Type:</strong> {promo.ActionType}</Typography>
              <Typography sx={{ color: 'blue', fontWeight: 'bold' }}><strong>Days in Phase:</strong> {promo.DaysInPhase}</Typography>
              <Typography><strong>Promotion Date:</strong> {new Date(promo.PromotionDate).toLocaleDateString()}</Typography>
              <Typography><strong>Promoted By:</strong> {promo.PromotedByUser}</Typography>
              {promo.DaysBeforeFirstPromotion !== undefined && promo.DaysBeforeFirstPromotion > 0 && (
                <Typography sx={{ color: 'green', fontWeight: 'bold' }}>Days Before First Promotion: {promo.DaysBeforeFirstPromotion}</Typography>
              )}
              {promo.FinalPhase ? (
                <Typography sx={{ color: 'red', fontWeight: 'bold' }}>Final Phase</Typography>
              ) : (
                <Typography><strong>Next Promotion Date:</strong> {promo.NextPromotionDate ? new Date(promo.NextPromotionDate).toLocaleDateString() : 'N/A'}</Typography>
              )}
            </Box>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default PromotionHistory;