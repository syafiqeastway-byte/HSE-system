export type PageType = 'homePage' | 'analyticsPage' | 'documentViewPage' | 'minuteMeetingPage' | 'emergencyPlanPage' | 'hirarcPage' | 'sopPage' | 'allIncidentsPage';

export interface SOPItem {
  id: string;
  code: string;
  title: string;
  category: string;
  description: string;
  revisionDate: string;
  documentUrl: string;
}

export interface HIRARCItem {
  id: string;
  code: string;
  activityName: string;
  location: string;
  hazard: string;
  initialRisk: 'Low' | 'Medium' | 'High' | 'Extreme';
  residualRisk: 'Low' | 'Medium';
  controlMeasures: string;
  documentUrl: string;
}

export interface CompetentPerson {
  id: string;
  name: string;
  title: string;
  category: string;
  doshRegNo: string;
  certExpiry: string;
  status: 'Active' | 'Pending Renewal';
  avatarUrl?: string;
  qualifications: string[];
}

export interface IncidentRecord {
  id: string;
  incidentCode?: string;
  date: string;
  year?: string;
  location: string;
  description: string;
  occupationalIncident?: string;
  category: string;
  propertyDamage?: string;
  damageLevel?: string;
  classification: string;
  injuryType?: string;
  personInvolved?: string;
  experienceLevel?: string;
  reportedBy?: string;
  documentUrl?: string;
  status?: string;
  actionPlan?: string;
}

export interface DemeritRecord {
  id: string;
  date: string;
  workerId: string;
  workerName: string;
  department: string;
  violation: string;
  demeritPoints: number;
  actionTaken: string;
}

export interface DemeritMatrix {
  id: string;
  violationType: string;
  severityLevel: string;
  pointsDeducted: number;
  penaltyRemediation: string;
}

export interface InspectionRecord {
  id: string;
  date: string;
  locationFacility: string;
  inspectorName: string;
  type: 'Workplace' | 'First Aid Box' | 'Fire Extinguisher';
  totalChecked: number;
  compliantCount: number;
  complianceRate: string;
  status: 'Passed' | 'Action Required';
}

export interface FirstAidCert {
  id: string;
  name: string;
  department: string;
  expiryDate: string;
  certLink: string;
}

export interface MinuteMeeting {
  id: string;
  title: string;
  location: string;
  date: string;
  documentUrl: string;
}

export interface WeatherInfo {
  tempKL: number;
  weatherKL: string;
  tempPenang: number;
  weatherPenang: string;
  lastUpdated: string;
}

export interface DocumentViewContext {
  title: string;
  url: string;
  type: 'pdf' | 'doc' | 'sheet' | 'web';
  subtitle?: string;
}

export interface HIRARCRecord {
  id: string;
  title: string;
  date: string;
  revDate: string;
  documentUrl: string;
}

export interface SOPRecord {
  id: string;
  title: string;
  date: string;
  revDate: string;
  documentUrl: string;
}
