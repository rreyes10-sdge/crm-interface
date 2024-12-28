export interface ProjectRow {
  ProjectNumber: string;
  ProjectId: string;
  ProjectName: string;
  OrganizationName: string;
  OrganizationId: string;
  ProjectStatus: string;
  ProjectLead: string | null;
  USC: boolean | null;
  TotalServicesSelected: number | null;
  ServicesCompleted: number;
  ServicesInProgress: number;
  OpenServices: number | null;
  ServicesNotReady: number | null;
  PercentCompleted: number | null;
} 