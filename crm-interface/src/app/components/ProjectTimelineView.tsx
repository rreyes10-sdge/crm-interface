import React, { useEffect, useRef, useState } from 'react';
import { Timeline as VisTimeline } from 'vis-timeline/standalone';
import { Paper, Typography, Modal, Box, Divider } from '@mui/material';
import 'vis-timeline/styles/vis-timeline-graph2d.css';

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

interface ProjectTimelineViewProps {
  promotions: Promotion[];
}

interface SelectedPromotion extends Promotion {
  color?: string;
}

// Add type for timeline item
interface TimelineItem {
  id: string | number;
  content: string;
  start: Date;
  end: Date;
  style: string;
}

const ProjectTimelineView: React.FC<ProjectTimelineViewProps> = ({ promotions }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<VisTimeline | null>(null);
  const [selectedPromotion, setSelectedPromotion] = useState<SelectedPromotion | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  useEffect(() => {
    if (!timelineRef.current || promotions.length === 0) return;

    const firstPromotion = promotions[0];
    const items: TimelineItem[] = [];
    
    // Add pre-initiation phase if DaysBeforeFirstPromotion exists and is greater than 0
    if (typeof firstPromotion.DaysBeforeFirstPromotion === 'number' && firstPromotion.DaysBeforeFirstPromotion > 0) {
      const preInitiationStart = new Date(firstPromotion.PromotionDate);
      preInitiationStart.setDate(preInitiationStart.getDate() - firstPromotion.DaysBeforeFirstPromotion);
      
      items.push({
        id: 'pre-initiation',
        content: `
          <div style="padding: 8px; cursor: pointer;" class="timeline-item" data-phase-index="pre">
            <strong>Lead Generation</strong><br/>
            <small>Project Creation</small><br/>
            <small>${firstPromotion.DaysBeforeFirstPromotion} days</small>
          </div>
        `,
        start: preInitiationStart,
        end: new Date(firstPromotion.PromotionDate),
        style: `
          background-color: #808080; 
          color: white; 
          border-radius: 4px;
          transition: all 0.3s ease;
          cursor: pointer;
        `
      });
    }

    // Add existing phases
    items.push(...promotions.map((promotion, index) => ({
      id: index,
      content: `
        <div style="padding: 8px; cursor: pointer;" class="timeline-item" data-phase-index="${index}">
          <strong>${promotion.PhaseName}</strong><br/>
          <small>${promotion.ActionType}</small><br/>
          <small>${promotion.DaysInPhase} days</small>
        </div>
      `,
      start: new Date(promotion.PromotionDate),
      end: promotion.NextPromotionDate 
        ? new Date(promotion.NextPromotionDate)
        : new Date(),
      style: `
        background-color: ${getPhaseColor(index)}; 
        color: black; 
        border-radius: 4px;
        transition: all 0.3s ease;
        cursor: pointer;
      `
    })));

    const startDate = firstPromotion.DaysBeforeFirstPromotion && firstPromotion.DaysBeforeFirstPromotion > 0
      ? new Date(new Date(firstPromotion.PromotionDate).getTime() - (firstPromotion.DaysBeforeFirstPromotion * 24 * 60 * 60 * 1000))
      : new Date(firstPromotion.PromotionDate);

    const options = {
      height: 'auto',
      minHeight: 100,
      maxHeight: 800,
      stack: true,
      showCurrentTime: true,
      zoomable: true,
      moveable: true,
      orientation: { axis: 'top' },
      start: startDate,
      end: new Date(promotions[promotions.length - 1].NextPromotionDate || new Date()),
      selectable: true,
      multiselect: false,
      margin: { item: { horizontal: 10, vertical: 5 } },
      verticalScroll: true,
      stackSubgroups: true
    };

    const timeline = new VisTimeline(
      timelineRef.current,
      items,
      options
    );

    // Handle clicks for both regular phases and pre-initiation
    timeline.on('click', (properties: any) => {
      const itemId = properties.item;
      if (itemId !== null && itemId !== undefined) {
        if (itemId === 'pre-initiation' && firstPromotion.DaysBeforeFirstPromotion) {
          const preInitiationStart = new Date(firstPromotion.PromotionDate);
          preInitiationStart.setDate(preInitiationStart.getDate() - firstPromotion.DaysBeforeFirstPromotion);
          
          setSelectedPromotion({
            PhaseName: 'Lead Generation',
            ActionType: 'Project Creation',
            PromotionDate: preInitiationStart.toISOString(),
            NextPromotionDate: firstPromotion.PromotionDate,
            DaysInPhase: firstPromotion.DaysBeforeFirstPromotion,
            PromotedByUser: 'System',
            SortOrder: 0,
            FinalPhase: 0,
            color: '#808080'
          });
        } else {
          const numericId = Number(itemId);
          if (!isNaN(numericId) && promotions[numericId]) {
            const promotion = {
              ...promotions[numericId],
              color: getPhaseColor(numericId)
            };
            setSelectedPromotion(promotion);
          }
        }
        setIsModalOpen(true);
      }
    });

    // Add hover effects
    const element = timelineRef.current;
    if (element) {
      const style = document.createElement('style');
      style.textContent = `
        .timeline-item:hover {
          transform: scale(1.02);
          box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        }
        .vis-item {
          cursor: pointer !important;
        }
        .vis-item.vis-selected {
          /* Keep original background and add a subtle highlight */
          box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5) inset !important;
          /* Remove default selection styling */
          border-color: inherit !important;
          background-color: inherit !important;
        }
        .vis-item.vis-selected .timeline-item {
          /* Add a subtle zoom effect when selected */
          transform: scale(1.01);
        }
      `;
      element.appendChild(style);
    }

    timelineInstance.current = timeline;

    // Adjust container height after timeline is rendered
    setTimeout(() => {
      const container = timelineRef.current;
      if (container) {
        const contentHeight = container.querySelector('.vis-content')?.getBoundingClientRect().height;
        if (contentHeight) {
          timeline.setOptions({ height: contentHeight + 50 }); // Add some padding
        }
      }
    }, 100);

    return () => {
      if (timelineRef.current) {
        while (timelineRef.current.firstChild) {
          timelineRef.current.removeChild(timelineRef.current.firstChild);
        }
      }
      timelineInstance.current = null;
    };
  }, [promotions]);

  return (
    <>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Project Timeline</Typography>
        <div ref={timelineRef} />
      </Paper>

      <Modal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        aria-labelledby="phase-details-modal"
      >
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          p: 4,
          border: selectedPromotion ? `2px solid ${selectedPromotion.color}` : 'none'
        }}>
          {selectedPromotion && (
            <>
              <Typography variant="h6" component="h2" sx={{ 
                color: selectedPromotion.color,
                mb: 2 
              }}>
                {selectedPromotion.PhaseName}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography sx={{ mb: 1 }}>
                <strong>Action Type:</strong> {selectedPromotion.ActionType}
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Start Date:</strong> {formatDate(selectedPromotion.PromotionDate)}
              </Typography>
              {selectedPromotion.NextPromotionDate && (
                <Typography sx={{ mb: 1 }}>
                  <strong>End Date:</strong> {formatDate(selectedPromotion.NextPromotionDate)}
                </Typography>
              )}
              <Typography sx={{ mb: 1 }}>
                <strong>Duration:</strong> {selectedPromotion.DaysInPhase} days
              </Typography>
              <Typography sx={{ mb: 1 }}>
                <strong>Promoted By:</strong> {selectedPromotion.PromotedByUser}
              </Typography>
              {selectedPromotion.DaysBeforeFirstPromotion !== undefined && selectedPromotion.DaysBeforeFirstPromotion > 0 && (
                <Typography sx={{ mb: 1 }}>
                  <strong>Days Before First Promotion:</strong> {selectedPromotion.DaysBeforeFirstPromotion}
                </Typography>
              )}
            </>
          )}
        </Box>
      </Modal>
    </>
  );
};

export default ProjectTimelineView; 