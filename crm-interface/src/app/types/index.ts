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
  TotalDurationMins: number | null;
  ServicesNotReady: number | null;
  PercentCompleted: number | null;
  SubmissionDate: string | null;
  VettingCall: string | null;
  ConsultationCall: string | null;
} 

export interface ProjectServiceAttributes {
  ControlName: string;
  ControlType: string;
  Description: string;
  DisplayName: string;
  IsGatingItem: number;
  Label: string;
  PhaseId: number;
  ServiceName: string;
  ProjectId: number;
  ProjectNumber: string;
  UpdatedAt: string;
  UpdatedBy: string;
  Value: string;
  Initials: string;
}

export interface ProjectService {
  ProjectId: string;
  AttributeValue: string;
  CompleteDate: string;
  CoreName: string;
  FollowUpDate: string;
  ProjectNumber: string;
  ServiceName: string;
  ServiceStartDate: string;
}