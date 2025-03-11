import React from 'react';
import { List, ListItem, ListItemText, Typography, Box, Tooltip } from '@mui/material';
import ExpandableCard from './ExpandableCard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

interface CurrentPhaseAttributes {
  ProjectId: number;
  Label: string;
  ControlType: string;
  Required: number;
  SortOrder: number;
  AttributeValue: string | null;
  UpdatedAt: string;
  UpdatedBy: string | null;
  PhaseName: string;
  ProgramAttributeId: number;
  AssignedUser: string | null;
}

interface AttributesCurrentProps {
  attributes: CurrentPhaseAttributes[];
}

const AttributesCurrent: React.FC<AttributesCurrentProps> = ({ attributes }) => {
  const sortedAttributes = [...attributes].sort((a, b) => a.SortOrder - b.SortOrder);
  
  // Calculate the count of filled attributes
  const filledAttributesCount = sortedAttributes.filter(attr => attr.AttributeValue && attr.AttributeValue.trim() !== '').length;
  const totalAttributesCount = attributes.length;
  const remainingAttributesCount = totalAttributesCount - filledAttributesCount;

  return (
    <ExpandableCard 
      title={totalAttributesCount > 0 ? sortedAttributes[0].PhaseName : "Current Attributes"}
      count={remainingAttributesCount}
      emptyMessage="No attributes filled for the selected time range."
      defaultHeight="600px"
    >
      <List>
        {sortedAttributes.map((attribute) => (
          <ListItem key={`${attribute.ProjectId}-${attribute.ProgramAttributeId}-${attribute.SortOrder}`} alignItems="flex-start">
            <Box sx={{ display: 'flex', alignItems: 'center', marginRight: 1 }}>
              {attribute.AttributeValue ? <CheckCircleIcon color="success" /> : <AccessTimeIcon color="warning" />}
            </Box>
            <ListItemText
              primary={
                <span
                  dangerouslySetInnerHTML={{
                    __html: `
                      <strong>${attribute.Label}</strong>: ${attribute.AttributeValue || 'N/A'}
                    `
                  }}
                />
              }
              secondary={
                <Tooltip title={attribute.UpdatedAt !== "None" ? new Date(attribute.UpdatedAt).toLocaleDateString() : 'Date not available'} arrow>
                  <Typography component="span" variant="body2" color="text.primary">
                    Assigned User: {attribute.AssignedUser || 'No assigned user'}
                  </Typography>
                </Tooltip>
              }
            />
          </ListItem>
        ))}
      </List>
    </ExpandableCard>
  );
};

export default AttributesCurrent;