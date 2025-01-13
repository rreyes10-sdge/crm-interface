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
    projectId: string; // Accepts projectId as a prop
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

function getPhaseClass(phaseName: string): string {
    const classMap: { [key: string]: string } = {
        'Interest List': 'phase-interest-list',
        'Initiation': 'phase-initiation',
        'Preliminary Eng & Design': 'phase-preliminary',
        'Final Design': 'phase-final-design',
        'Pre-Construction': 'phase-pre-construction',
        'Construction': 'phase-construction',
        'Close Out': 'phase-close-out'
    };
    return classMap[phaseName] || '';
}

function getDotColor(phaseName: string): string {
    const colorMap: { [key: string]: string } = {
      'Interest List': '#2563EB',
      'Initiation': '#7C3AED',
      'Preliminary Eng & Design': '#4F46E5',
      'Final Design': '#0891B2',
      'Pre-Construction': '#0D9488',
      'Construction': '#16A34A',
      'Close Out': '#059669'
    };
    return colorMap[phaseName] || '#2563EB';
  }

const Timeline: React.FC<TimelineProps> = ({ projectId }) => {
    const projectIdInt = parseInt(projectId, 10);
    console.log('Converted projectId:', projectIdInt); // Log the converted projectId

    // Fetch timeline data based on projectId
    const { loading, error, data } = useQuery(GET_PROJECT_TIMELINES, {
        variables: { projectId: projectIdInt || 30 } // Default to 0 if projectIdInt is not set
    });

    const phaseColors: { [key: string]: string } = {
        'Interest List': 'blue',
        'Initiation': 'purple',
        'Preliminary Eng & Design': 'indigo',
        'Final Design': 'cyan',
        'Pre-Construction': 'teal',
        'Construction': 'green',
        'Close Out': 'emerald',
    };

    // Handle loading state
    if (loading) return <p>Loading timeline...</p>;

    // Handle error state
    if (error) return <p>Error loading timeline: {error.message}</p>;

    // Sort the fetched data
    const timelineData: TimelineEvent[] = [...data.projectTimeline].sort(
        (a: TimelineEvent, b: TimelineEvent) =>
            b.phaseSortOrder - a.phaseSortOrder || b.labelSortOrder - a.labelSortOrder
    );

    return (
        <div className="timeline-container">
            <div className="container">
                <h1 className="title">Project Timeline</h1>

                <div className="timeline">
                    <div className="timeline-item" />

                    {timelineData.map((event, index) => {
                        const isEven = index % 2 === 0;
                        const phaseColor = phaseColors[event.phaseName] || 'gray';

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
                                            <span className={`phase-tag ${getPhaseClass(event.phaseName)}`}>
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

export default Timeline;