import { ProjectRow } from '../types';

export const projectData: ProjectRow[] = [
  {
    ConsultationCall: "2024-07-03",
    OpenServices: 0,
    OrganizationId: '2261',
    OrganizationName: "EDCO Waste and Recycling",
    PercentCompleted: 100,
    ProjectId: '3204',
    ProjectLead: "Eva Brungardt",
    ProjectName: "224 S Las Posas Rd",
    ProjectNumber: "TE245001",
    ProjectStatus: "Complete",
    ServicesCompleted: 5,
    ServicesInProgress: 0,
    ServicesNotReady: 0,
    SubmissionDate: "2024-06-27",
    TotalDurationMins: 377,
    TotalServicesSelected: 5,
    USC: true,
    VettingCall: "2024-06-28"
  },
];

export const getProjectStatusCounts = async () => {
  let data;

  try {
    const response = await fetch('http://127.0.0.1:5000/api/data/summary'); // Replace with your API endpoint
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    data = await response.json();
  } catch (error) {
    console.error('Failed to fetch data from API, using static data:', error);
    data = projectData; // Fallback to static data
  }

  interface ProjectStatusCounts {
    [key: string]: number;
  }

  const statusCounts: ProjectStatusCounts = data.reduce((acc: ProjectStatusCounts, project: ProjectRow) => {
    acc[project.ProjectStatus] = (acc[project.ProjectStatus] || 0) + 1;
    return acc;
  }, {} as ProjectStatusCounts);

  return [
    { status: 'Active', value: statusCounts['Active'] || 0 },
    { status: 'Complete', value: statusCounts['Complete'] || 0 },
    { status: 'Canceled', value: statusCounts['Canceled'] || 0 },
    { status: 'Ineligible', value: statusCounts['Ineligible'] || 0 },
    { status: 'Duplicate', value: statusCounts['Duplicate'] || 0 },
  ];
};