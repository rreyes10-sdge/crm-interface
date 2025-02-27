import React from 'react';
import { List, ListItem, ListItemText, Typography } from '@mui/material';
import ExpandableCard from './ExpandableCard';

interface AttributeFilled {
  Id: number;
  OrgName: string;
  PhaseId: number;
  ProjectId: number;
  PhaseName: string;
  ProgramAttributeId: number;
  ProjectName: string;
  ProjectNumber: string;
  UpdatedAt: string;
  UpdatedBy: string;
  UserId: string;
  Value: string;
  Label: string;
}

interface AttributesFilledProps {
  attributes: AttributeFilled[];
}

const AttributesFilled: React.FC<AttributesFilledProps> = ({ attributes }) => {
  const sortedAttributes = attributes.sort((a, b) => new Date(b.UpdatedAt).getTime() - new Date(a.UpdatedAt).getTime());
  
  return (
    <ExpandableCard 
      title="Attributes Filled" 
      count={attributes.length}
      emptyMessage="No attributes filled for the selected time range."
      defaultHeight="600px"
    >
      <List>
        {sortedAttributes.map((attribute, index) => (
          <ListItem key={index} alignItems="flex-start">
            <ListItemText
              primary={
                <span
                  dangerouslySetInnerHTML={{
                    __html: `
                      <a
                        href="https://ctsolutions.sempra.com/projects/${attribute.ProjectId}?phase=${attribute.PhaseId}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="text-decoration: none; color: inherit;"
                      >
                        <strong>${attribute.ProjectNumber} - ${attribute.OrgName}</strong>
                      </a>
                      <br />
                      <strong>${attribute.Label}</strong>: ${attribute.Value}
                    `
                  }}
                />
              }
              secondary={
                <>
                  <Typography component="span" variant="body2" color="text.primary">
                    {new Date(attribute.UpdatedAt).toLocaleDateString()}
                  </Typography>
                  <br />
                  Phase: {attribute.PhaseName}
                </>
              }
            />
          </ListItem>
        ))}
      </List>
    </ExpandableCard>
  );
};

export default AttributesFilled;