import React from 'react';
import { Calendar, User } from 'lucide-react';
import { gql, useQuery } from '@apollo/client';
import '../styles/Timeline.css';

// GraphQL Query to fetch project timeline based on projectId
const GET_PROJECT_TIMELINES = gql`
    query GetProjectTimelines($projectId: Int!) {
        projectTimeline(projectId: $projectId) {
            id
            projectId
            updatedAt
            label
            updatedBy
            phaseName
            phaseSortOrder
            labelSortOrder
        }
    }
`;

interface TimelineProps {
    projectId: string;
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

const TimelineOld: React.FC<TimelineProps> = ({ projectId }) => {
    const projectIdInt = parseInt(projectId, 10);

    const { loading, error, data } = useQuery(GET_PROJECT_TIMELINES, {
        variables: { projectId: projectIdInt || 30 } // Default to 30 if projectIdInt is not set
    });

    // Handle loading state
    if (loading) return <p>Loading timeline...</p>;

    // Handle error state
    if (error) return <p>Error loading timeline: {error.message}</p>;

    // Sort the fetched data
    const timelineData: TimelineEvent[] = [...data.projectTimeline].sort(
        (b: TimelineEvent, a: TimelineEvent) =>
            b.phaseSortOrder - a.phaseSortOrder || b.labelSortOrder - a.labelSortOrder
    );

    return (
        <div className="timeline-container">
            <div className="container">
                <h1 className="title">Project Summary</h1>

                <div className="timeline">
                    <div className="timeline-item" />

                    {timelineData.map((event, index) => {
                        const isEven = index % 2 === 0;

                        return (
                            <div key={event.id} className="timeline-item">
                                <div
                                    className="timeline-dot"
                                    style={{ backgroundColor: getDotColor(event.phaseName) }}
                                />

                                <div className={`timeline-content ${isEven ? 'even' : ''}`}>
                                    <div className="timeline-card">
                                        <div className="timeline-header">
                                            <div>
                                                <h3 className="card-title">{event.label}</h3>
                                                <div className="card-meta">
                                                    <Calendar size={14} />
                                                    <span>{new Date(event.updatedAt).toLocaleDateString()}</span>
                                                    <span>•</span>
                                                    <User size={14} />
                                                    <span>{event.updatedBy}</span>
                                                </div>
                                            </div>
                                            <span
                                                className={`phase-tag ${generateClassFromPhase(event.phaseName)}`}
                                                style={{ backgroundColor: getBackgroundColor(event.phaseName) }}
                                            >
                                                {event.phaseName}
                                            </span>
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