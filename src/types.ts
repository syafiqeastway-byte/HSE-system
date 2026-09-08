export type PageType = 
  | 'homePage' 
  | 'analyticsPage' 
  | 'documentViewPage' 
  | 'minuteMeetingPage' 
  | 'emergencyPlanPage' 
  | 'hirarcPage' 
  | 'sopPage' 
  | 'allIncidentsPage' 
  | 'safetyViolationPage';

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

export interface FireExtinguisherRecord {
  id: string;
  rowNumber: number;
  isHeader: boolean;
  no: string;
  location: string;
  typeABC: string;
  typeCO2: string;
  brand: string;
  serialNumber: string;
  month: string;
  year: string;
  certExpiryDate: string;
  remarks: string;
}

export interface InspectionRecord {
  id: string;
  date: string;
  day?: string;
  location?: string;
  typeOfInspection?: string;
  inspector?: string;
  remark?: string;
  documentUrl?: string;

  // Compatibility fields for legacy items
  locationFacility?: string;
  inspectorName?: string;
  type?: string;
  totalChecked?: number;
  compliantCount?: number;
  complianceRate?: string;
  status?: string;
}

export interface FirstAidCert {
  id: string;
  employeeId?: string;
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
  tempIpoh?: number;
  weatherIpoh?: string;
  tempJB?: number;
  weatherJB?: string;
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
