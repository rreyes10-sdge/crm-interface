import React from 'react';
import { Calendar, User } from 'lucide-react';
import '../styles/Timeline.css';
import { Typography } from '@mui/material';

interface ProjectMilestones {
    ProjectNumber: string;
    ProjectId: string;
    ProjectName: string;
    OrganizationName: string;
    OrganizationId: string;
    PhaseId: string;
    PhaseName: string;
    DateName: string;
    Value: string;
    UpdatedBy: string;
    UpdatedAt: string;
}

interface TimelineProps {
    milestones: ProjectMilestones[];
}

interface TimelineEvent {
    id: number;
    projectId: number;
    updatedAt: string;
    label: string;
    updatedBy: string;
    phaseName: string;
    phaseSortOrder: number;
    labelSortOrder: number;
}

const baseColors = ['#001689', '#58B947', '#FED600', '#009BDA'];
const colorCache: { [key: string]: { dotColor: string, bgColor: string } } = {};


function generateClassFromPhase(phaseName: string): string {
    // Generate a class name based on the phase name
    return `phase-${phaseName.toLowerCase().replace(/\s+/g, '-')}`;
}

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

function getBackgroundColor(phaseName: string): string {
    if (!colorCache[phaseName]) {
        const { dotColor, bgColor } = generateColorsFromPhase(phaseName);
        colorCache[phaseName] = { dotColor, bgColor };
    }
    return colorCache[phaseName].bgColor;
}

const TimelineOld: React.FC<TimelineProps> = ({ milestones }) => {
    // Sort the milestones based on a relevant property, e.g., DateName
    const sortedMilestones = [...milestones].sort((a, b) => new Date(a.Value).getTime() - new Date(b.Value).getTime());

    return (
        <div className="timeline-container">
            <div className="container">
                <div className="timeline">
                    {sortedMilestones.map((milestone, index) => {
                        const isEven = index % 2 === 0;

                        return (
                            <div key={`${milestone.ProjectId}-${milestone.DateName}`} className="timeline-item">
                                <div
                                    className="timeline-dot"
                                    style={{ backgroundColor: getDotColor(milestone.PhaseName) }}
                                />

                                <div className={`timeline-content ${isEven ? 'even' : ''}`}>
                                    <div className="timeline-card">
                                        <div className="timeline-header">
                                            <div>
                                                <div className="attribute-name">
                                                    <strong>{milestone.DateName}</strong> 
                                                </div>
                                                <h3 className="card-title">{milestone.PhaseName}</h3>
                                                <div className="card-meta">
                                                    <Calendar size={14} />
                                                    <span>{new Date(milestone.Value).toLocaleDateString()}</span>
                                                    - {milestone.UpdatedBy}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TimelineOld;