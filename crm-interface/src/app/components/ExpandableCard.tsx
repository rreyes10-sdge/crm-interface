'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, Typography, IconButton, Box, Collapse } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { styled } from '@mui/material/styles';

interface ExpandableCardProps {
  title: string;
  count: number;
  children: React.ReactNode;
  emptyMessage?: string;
  defaultHeight?: string;
  collapsedSize?: string;
  emptyStateHeight?: string;
  statusIcon?: React.ReactNode;
}

const ExpandMore = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'expanded',
})<{ expanded: boolean }>(({ theme, expanded }) => ({
  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
  transition: theme.transitions.create('transform', {
    duration: theme.transitions.duration.shortest,
  }),
}));

const ExpandableCard: React.FC<ExpandableCardProps> = ({ 
  title, 
  count, 
  children, 
  emptyMessage = 'No items available.',
  defaultHeight = '300px',
  collapsedSize = '250px',
  emptyStateHeight = '100px',
  statusIcon
}) => {
  const [expanded, setExpanded] = useState(false);
  const [isExpandable, setIsExpandable] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Memoize the parsed collapsedSize
  const parsedCollapsedSize = useMemo(() => parseInt(collapsedSize), []);

  useEffect(() => {
    if (contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      setIsExpandable(contentHeight > parsedCollapsedSize);
    }
  }, [children, parsedCollapsedSize]);

  return (
    <Card 
      variant="outlined" 
      sx={{ 
        height: count === 0 ? emptyStateHeight : expanded ? 'auto' : defaultHeight, 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CardContent sx={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        ...(count === 0 && {
          justifyContent: 'center',
          alignItems: 'flex-start'
        })
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: count === 0 ? 1 : 2,
          width: '100%'
        }}>
          {statusIcon && <Box sx={{ marginRight: 1 }}>{statusIcon}</Box>}
          <Typography variant="h6" component="div">
            {title} ({count})
          </Typography>
          {isExpandable && count > 0 && (
            <ExpandMore
              expanded={expanded}
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              aria-label="show more"
            >
              <ExpandMoreIcon />
            </ExpandMore>
          )}
        </Box>
        {count === 0 ? (
          <Typography variant="body2" color="text.secondary">
            {emptyMessage}
          </Typography>
        ) : (
          <Collapse 
            in={expanded} 
            collapsedSize={collapsedSize}
            sx={{ 
              flex: 1,
              overflowY: 'auto',
              '& .MuiCollapse-wrapperInner': {
                height: '100%'
              }
            }}
          >
            <div ref={contentRef}>
              {children}
            </div>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpandableCard; 