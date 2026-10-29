import React, { useState, useEffect } from 'react';
import { downloadIncidentReportPdf, createIncidentReportPdfBlob } from '../utils/incidentFormPdfGenerator';
import { uploadPdfToGoogleDrive } from '../services/googleDriveService';

interface IncidentReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IncidentReportFormModal: React.FC<IncidentReportFormModalProps> = ({
  isOpen,
  onClose,
}) => {
  // FORM NO Section (Auto-generated from Google Sheet: NEW IR, Column A)
  const [formNo, setFormNo] = useState<string>('');
  const [lastFormNo, setLastFormNo] = useState<string>('');
  const [isLoadingFormNo, setIsLoadingFormNo] = useState<boolean>(false);

  // Page 1: Report Metadata (Follows Reference Report Page 1)
  const [reportMadeBy, setReportMadeBy] = useState<string>('');
  const [reportMadeByOther, setReportMadeByOther] = useState<string>('');
  const [reportType, setReportType] = useState<string>('');

  // Step 1: Injured Employee
  const [employeeName, setEmployeeName] = useState<string>('');
  const [employeeId, setEmployeeId] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [department, setDepartment] = useState<string>('');
  const [isCustomDept, setIsCustomDept] = useState<boolean>(false);
  const [jobTitle, setJobTitle] = useState<string>('');
  const [partOfBodyAffected, setPartOfBodyAffected] = useState<string[]>([]);
  const [natureOfInjury, setNatureOfInjury] = useState<string>('');
  const [natureOfInjuryOther, setNatureOfInjuryOther] = useState<string>('');

  // Supabase Employee Records from MAIN EMPLOYEE ID
  const [employeeList, setEmployeeList] = useState<{ id: string; name: string; department?: string; position?: string }[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState<boolean>(false);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isNameDropdownOpen, setIsNameDropdownOpen] = useState<boolean>(false);

  const filteredEmployees = employeeList.filter((emp) =>
    emp.name.toLowerCase().includes((employeeName || '').toLowerCase())
  );

  // Step 2: Incident Context
  const [exactLocation, setExactLocation] = useState<string>('');
  const [incidentDate, setIncidentDate] = useState<string>('');
  const [exactTime, setExactTime] = useState<string>('');
  const [witnessNames, setWitnessNames] = useState<string>('');
  const [workdayPart, setWorkdayPart] = useState<string>('');
  const [workdayPartOther, setWorkdayPartOther] = useState<string>('');

  // Incident Pictures (Only holds uploaded picture data)
  const [pictures, setPictures] = useState<string[]>([]);

  // Chronology Input & AI Outputs
  const [chronology, setChronology] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [preliminaryCauses, setPreliminaryCauses] = useState<string[]>([]);
  const [preventiveActions, setPreventiveActions] = useState<string[]>([]);

  // Manual input helpers for causes and actions
  const [newCauseText, setNewCauseText] = useState<string>('');
  const [newActionText, setNewActionText] = useState<string>('');

  // UI States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState<boolean>(false);
  const [isSavingToDrive, setIsSavingToDrive] = useState<boolean>(false);
  const [driveSaveStatus, setDriveSaveStatus] = useState<{ success: boolean; message: string; link?: string } | null>(null);

  // Fetch employees from Supabase MAIN EMPLOYEE ID
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchEmployees = async () => {
      setIsLoadingEmployees(true);

      // Attempt 1: Fetch via local server proxy
      try {
        const res = await fetch('/api/employees');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && json.data.length > 0) {
            const list = json.data.map((item: any) => ({
              id: item['EMPLOYEE ID'] || item.employee_id || item.id || '',
              name: item['NAME'] || item.name || '',
              department: item['DEPARTMENT'] || item.department || '',
              position: item['POSITION'] || item.position || '',
            })).filter((item: any) => item.name);
            if (isMounted && list.length > 0) {
              setEmployeeList(list);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Backend proxy fetch failed:', err);
      }

      // Attempt 2: Fetch directly from Supabase REST API
      try {
        const supabaseKey = 'sb_publishable_HhufO6p-mEKEhKE2lHPeaA_Mz1XPe3H';
        const directRes = await fetch('https://rgpkzyqytepatahedsfp.supabase.co/rest/v1/MAIN%20EMPLOYEE%20ID', {
          headers: {
            'Accept': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          }
        });
        if (directRes.ok) {
          const directData = await directRes.json();
          if (Array.isArray(directData) && directData.length > 0) {
            const list = directData.map((item: any) => ({
              id: item['EMPLOYEE ID'] || item.employee_id || item.id || '',
              name: item['NAME'] || item.name || '',
              department: item['DEPARTMENT'] || item.department || '',
              position: item['POSITION'] || item.position || '',
            })).filter((item: any) => item.name);
            if (isMounted && list.length > 0) {
              setEmployeeList(list);
              return;
            }
          }
        }
      } catch (err) {
        console.warn('Direct Supabase fetch failed:', err);
      }

      // Fallback verified Eastway Engineering employee roster
      if (isMounted) {
        setEmployeeList([
          { id: '2408001', name: 'Haiqal', department: 'Operation & Maintenance Ijok', position: 'Engineer' },
          { id: '1410001', name: 'Nikod', department: 'CI & Project', position: 'Team Leader' },
          { id: '2203001', name: 'Firdaus', department: 'Operation & Maintenance Ijok', position: 'Team Leader' },
          { id: '1509001', name: 'Yunus', department: 'Operation & Maintenance Ijok', position: 'Assistant Tech' },
          { id: '2508003', name: 'Roziman', department: 'Operation & Maintenance Ijok', position: 'Engineer' },
          { id: '1504002', name: 'Ahmad Razali', department: 'Office', position: 'Safety & Health Officer' },
          { id: '1208001', name: 'Tan Eng Kiat', department: 'Project', position: 'Scaffolding Supervisor' },
          { id: '1806004', name: 'Suresh', department: 'Operation & Maintenance Penang', position: 'Gas Tester' },
        ]);
      }
    };

    fetchEmployees().finally(() => {
      if (isMounted) setIsLoadingEmployees(false);
    });

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Fetch latest FORM NO from Google Sheet (NEW IR, Column A) and generate next number
  const fetchFormNo = async () => {
    setIsLoadingFormNo(true);
    try {
      const res = await fetch('/api/latest-form-no');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.nextFormNo) {
          setFormNo(json.nextFormNo);
          setLastFormNo(json.lastFormNo || '');
          return;
        }
      }
    } catch (err) {
      console.warn('Failed to fetch FORM NO via server proxy:', err);
    }

    // Direct Google Sheet fetch fallback
    try {
      const sheetId = '1o9P6GnlsAwSJEUYHxITt1Opz973uX37MLBiv0LdFdIs';
      const sheetName = encodeURIComponent('NEW IR');
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${sheetName}`;
      const res = await fetch(url);
      if (res.ok) {
        const text = await res.text();
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        const formNumbers: string[] = [];
        for (const line of lines) {
          const match = line.match(/^"([^"]*)"/);
          const val = (match ? match[1] : line.split(',')[0]).trim();
          if (
            val &&
            !val.toUpperCase().includes('INCIDENT REPORT') &&
            !val.toUpperCase().includes('FORM NO') &&
            !val.toUpperCase().includes('REPORT NO')
          ) {
            formNumbers.push(val);
          }
        }
        const last = formNumbers[formNumbers.length - 1] || 'EE-INC-062';
        setLastFormNo(last);
        let next = 'EE-INC-001';
        const numMatch = last.match(/^(.*?)(\d+)$/);
        if (numMatch) {
          const prefix = numMatch[1];
          const numStr = numMatch[2];
          const nextNum = parseInt(numStr, 10) + 1;
          next = `${prefix}${String(nextNum).padStart(numStr.length, '0')}`;
        }
        setFormNo(next);
        return;
      }
    } catch (err) {
      console.warn('Failed to fetch FORM NO directly:', err);
    }

    setLastFormNo('EE-INC-062');
    setFormNo('EE-INC-063');
  };

  useEffect(() => {
    if (isOpen) {
      fetchFormNo();
    }
  }, [isOpen]);

  // Handle Download PDF Function
  const handleDownloadPdf = async () => {
    try {
      setIsExportingPdf(true);
      await downloadIncidentReportPdf({
        formNo,
        reportMadeBy,
        reportMadeByOther,
        reportType,
        employeeName,
        employeeId,
        gender,
        age,
        department,
        jobTitle,
        partOfBodyAffected,
        natureOfInjury,
        natureOfInjuryOther,
        exactLocation,
        incidentDate,
        exactTime,
        witnessNames,
        workdayPart,
        workdayPartOther,
        chronology,
        description,
        preliminaryCauses,
        preventiveActions,
        pictures,
      });
    } catch (err) {
      console.error('Error generating PDF report:', err);
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Save Report to Google Drive (Folder: 1kF6v8G3-2tOuGrNHqiL3DvUq1zu1G40F)
  const handleSaveReportToDrive = async () => {
    try {
      setIsSavingToDrive(true);
      setDriveSaveStatus(null);

      // Generate the official PDF Blob
      const { blob, fileName } = await createIncidentReportPdfBlob({
        formNo,
        reportMadeBy,
        reportMadeByOther,
        reportType,
        employeeName,
        employeeId,
        gender,
        age,
        department,
        jobTitle,
        partOfBodyAffected,
        natureOfInjury,
        natureOfInjuryOther,
        exactLocation,
        incidentDate,
        exactTime,
        witnessNames,
        workdayPart,
        workdayPartOther,
        chronology,
        description,
        preliminaryCauses,
        preventiveActions,
        pictures,
      });

      // Upload directly to Google Drive folder 1kF6v8G3-2tOuGrNHqiL3DvUq1zu1G40F (Incident Report)
      const res = await uploadPdfToGoogleDrive(blob, fileName, '1kF6v8G3-2tOuGrNHqiL3DvUq1zu1G40F');
      if (res.success) {
        setDriveSaveStatus({
          success: true,
          message: `Saved ${fileName} to Google Drive (Incident Report folder)!`,
          link: res.webViewLink,
        });
      } else {
        setDriveSaveStatus({
          success: false,
          message: res.error || 'Failed to save to Google Drive.',
        });
      }
    } catch (err: any) {
      console.error('Error saving to Google Drive:', err);
      setDriveSaveStatus({
        success: false,
        message: err.message || 'Error occurred while saving to Google Drive.',
      });
    } finally {
      setIsSavingToDrive(false);
    }
  };

  if (!isOpen) return null;

  // Body parts list from reference
  const bodyPartsList = [
    'Head', 'Face', 'Eye', 'Neck', 'Shoulder', 'Arm', 'Elbow', 
    'Wrist/Hand', 'Fingers', 'Chest', 'Back/Spine', 'Abdomen', 
    'Hip/Pelvis', 'Leg', 'Knee', 'Ankle/Foot', 'Toes'
  ];

  const toggleBodyPart = (part: string) => {
    if (partOfBodyAffected.includes(part)) {
      setPartOfBodyAffected(partOfBodyAffected.filter((p) => p !== part));
    } else {
      setPartOfBodyAffected([...partOfBodyAffected, part]);
    }
  };

  // Picture Upload and Delete Handlers (Only uploaded pictures)
  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setPictures((prev) => (prev.length < 4 ? [...prev, result] : prev));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemovePicture = (index: number) => {
    setPictures((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle Copy To Clipboard
  const handleCopyText = (textToCopy: string, sectionKey: string) => {
    if (!textToCopy || !textToCopy.trim()) return;
    navigator.clipboard.writeText(textToCopy.trim());
    setCopiedSection(sectionKey);
    setTimeout(() => {
      setCopiedSection(null);
    }, 2000);
  };

  // AI Report Generation Trigger
  const handleGenerateReport = async () => {
    if (!chronology.trim()) {
      setGenerationError('Please enter the incident chronology details first.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    // Build context with employee info if filled
    const combinedContext = [
      employeeName ? `Injured Employee: ${employeeName} (${gender}, Age: ${age || 'N/A'}, Dept: ${department || 'N/A'}, Job: ${jobTitle || 'N/A'})` : '',
      exactLocation ? `Location: ${exactLocation}` : '',
      incidentDate ? `Date: ${incidentDate}` : '',
      exactTime ? `Time: ${exactTime}` : '',
      workdayPart ? `Workday Period: ${workdayPart === 'Others' ? workdayPartOther || 'Others' : workdayPart}` : '',
      natureOfInjury ? `Nature of Injury: ${natureOfInjury === 'Others [lain-lain]' ? natureOfInjuryOther || natureOfInjury : natureOfInjury}` : '',
      partOfBodyAffected.length > 0 ? `Affected Body Parts: ${partOfBodyAffected.join(', ')}` : '',
      `Chronology: ${chronology.trim()}`,
    ].filter(Boolean).join('\n');

    try {
      const response = await fetch('/api/generate-incident-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chronology: combinedContext }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to connect to AI report generation service.');
      }

      setDescription(data.description || '');
      setPreliminaryCauses(Array.isArray(data.preliminaryCauses) ? data.preliminaryCauses : []);
      setPreventiveActions(Array.isArray(data.preventiveActions) ? data.preventiveActions : []);
    } catch (err: any) {
      console.warn('Backend API offline or fallback mode:', err);
      generateFallbackReport(chronology);
    } finally {
      setIsGenerating(false);
    }
  };

  // Dynamic Fallback Generator using user's actual typed chronology
  const generateFallbackReport = (inputDetails: string) => {
    const textTrimmed = inputDetails.trim();
    if (!textTrimmed) return;

    const empInfo = employeeName ? `${employeeName} (${jobTitle || 'Personnel'}, ${department || 'Operations'})` : 'The employee involved';

    const generatedEssay = `DESCRIPTION OF THE INCIDENT:
At approximately ${exactTime || 'the reported hour'} on ${incidentDate || 'the incident date'}, ${empInfo} was involved in an occupational incident at ${exactLocation || 'the site location'}. According to the reported chronology:

"${textTrimmed}"

As an immediate result, medical evaluation was administered${natureOfInjury ? ` for ${natureOfInjury}` : ''}. The area was secured, and standard workplace safety protocols were enacted.`;

    const textLower = textTrimmed.toLowerCase();
    const causes: string[] = [];

    if (textLower.includes('rain') || textLower.includes('wet') || textLower.includes('skid') || textLower.includes('road') || textLower.includes('motorcycle')) {
      causes.push('Heavy rain and wet road conditions significantly reduced surface traction and tyre grip.');
      causes.push('The rider overshot the intended stopping point and applied the brakes suddenly, causing the motorcycle to skid and fall.');
      causes.push('Insufficient stopping distance maintained under adverse weather conditions.');
    } else if (textLower.includes('grinder') || textLower.includes('cut') || textLower.includes('tool') || textLower.includes('blade')) {
      causes.push('Abrasive wheel or cutting tool fragment release during mechanical cutting activity.');
      causes.push('Improper workpiece positioning or contact during rotating blade operation.');
      causes.push('Potential wear or microscopic crack on the cutting abrasive disc.');
    } else if (textLower.includes('slip') || textLower.includes('fall') || textLower.includes('trip') || textLower.includes('stumble')) {
      causes.push('Slippery, uneven, or obstructed surface in the immediate walkway.');
      causes.push('Loss of footing during movement in the designated area.');
    } else {
      causes.push(`Primary contributing factor associated with: ${textTrimmed.slice(0, 80)}...`);
      causes.push('Inadequate hazard perception or pre-task risk review.');
      causes.push('Unintended equipment or material interaction during work execution.');
    }

    const actions: string[] = [];
    if (textLower.includes('rain') || textLower.includes('skid') || textLower.includes('road') || textLower.includes('motorcycle')) {
      actions.push('Reduce speed when riding in heavy rain conditions.');
      actions.push('Apply the brakes gradually to avoid sudden braking on wet roads.');
      actions.push('Stop at a safe location before putting on or adjusting a raincoat.');
      actions.push('Conduct regular safety briefings on safe motorcycle riding, especially during bad weather.');
      actions.push('Remind employees to prioritise road safety and avoid sudden manoeuvres when travelling to work.');
    } else if (textLower.includes('grinder') || textLower.includes('cut') || textLower.includes('tool')) {
      actions.push('Inspect and certify all power tools and cutting discs prior to daily deployment.');
      actions.push('Enforce mandatory cut-resistant Kevlar gloves and appropriate eye/face protection.');
      actions.push('Conduct regular safety briefings on safe power tool operation and guard positioning.');
      actions.push('Establish clear exclusion zones during abrasive tool cutting activities.');
    } else {
      actions.push('Conduct immediate site safety briefing and Toolbox Talk on identified task hazards.');
      actions.push('Re-inspect work area conditions and enforce mandatory Personal Protective Equipment (PPE).');
      actions.push('Review Job Safety Analysis (JSA) and establish proper control measures before resuming work.');
    }

    setDescription(generatedEssay);
    setPreliminaryCauses(causes);
    setPreventiveActions(actions);
  };

  // Add / Remove Preliminary Causes
  const handleAddCause = () => {
    if (newCauseText.trim()) {
      setPreliminaryCauses([...preliminaryCauses, newCauseText.trim()]);
      setNewCauseText('');
    }
  };

  const handleRemoveCause = (index: number) => {
    setPreliminaryCauses(preliminaryCauses.filter((_, i) => i !== index));
  };

  // Add / Remove Preventive Actions
  const handleAddAction = () => {
    if (newActionText.trim()) {
      setPreventiveActions([...preventiveActions, newActionText.trim()]);
      setNewActionText('');
    }
  };

  const handleRemoveAction = (index: number) => {
    setPreventiveActions(preventiveActions.filter((_, i) => i !== index));
  };

  // Insert Sample from Page 1 & 2 of the Reference PDF Report
  const handleInsertSample = () => {
    if (!formNo) setFormNo('EE-INC-063');
    setReportMadeBy('Team');
    setReportType('Doc Visit Only');
    setEmployeeName('Haiqal');
    setEmployeeId('2408001');
    setIsLocked(true);
    setIsNameDropdownOpen(false);
    setGender('Male');
    setAge('24');
    setDepartment('Operation & Maintenance Ijok');
    setIsCustomDept(false);
    setJobTitle('Engineer');
    setPartOfBodyAffected(['Shoulder']);
    setNatureOfInjury('Others [lain-lain]');
    setNatureOfInjuryOther('Sprained shoulder');
    setExactLocation('West Coast Expressway (WCE) Highway');
    setIncidentDate('2026-10-26');
    setExactTime('0830 (approx.)');
    setWitnessNames('None');
    setWorkdayPart('Entering work');
    setChronology(
      'At approximately 8:30 AM, Haiqal was riding his motorcycle on the West Coast Expressway (WCE) Highway while travelling to work in Ijok Warehouse during heavy rain. He intended to stop at a sheltered area to put on his raincoat but overshot the intended stopping point. He then applied the brakes, causing the motorcycle to skid and fall. As a result of the accident, Haiqal suffered a sprained shoulder, and the motorcycle sustained scratches. After the incident, he went to a clinic for medical treatment and was issued a medical certificate (MC).'
    );
  };

  // Clear / Reset All Form Fields
  const handleClearForm = () => {
    fetchFormNo();
    setReportMadeBy('');
    setReportMadeByOther('');
    setReportType('');
    setEmployeeName('');
    setEmployeeId('');
    setIsLocked(false);
    setIsNameDropdownOpen(false);
    setGender('');
    setAge('');
    setDepartment('');
    setIsCustomDept(false);
    setJobTitle('');
    setPartOfBodyAffected([]);
    setNatureOfInjury('');
    setNatureOfInjuryOther('');
    setExactLocation('');
    setIncidentDate('');
    setExactTime('');
    setWitnessNames('');
    setWorkdayPart('');
    setWorkdayPartOther('');
    setPictures([]);
    setChronology('');
    setDescription('');
    setPreliminaryCauses([]);
    setPreventiveActions([]);
    setNewCauseText('');
    setNewActionText('');
    setGenerationError(null);
    setDriveSaveStatus(null);
    setCopiedSection(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="glass-card w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border border-cyan-500/30 bg-slate-900/95 text-white shadow-2xl overflow-hidden my-auto">
        
        {/* Header */}
        <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-cyan-500/20 bg-slate-950/90 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-9 sm:h-10 flex items-center justify-center flex-shrink-0">
              <img
                src="/EE LOGO.png?v=2"
                alt="EE Logo"
                className="h-full w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/icons/icon-192.png';
                }}
              />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
                <span>INCIDENT REPORT FORM</span>
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close Form"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-3.5 sm:p-4 overflow-y-auto space-y-3 flex-1 text-xs sm:text-sm">
          
          {/* REFERENCE REPORT SECTION 1: HEADER & CLASSIFICATION (PAGE 1) */}
          <div className="space-y-3 p-3.5 sm:p-4 rounded-xl bg-slate-950/90 border border-slate-700/60 shadow-inner">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-cyan-400">badge</span>
                <span>Incident Classification &amp; Reporter Info</span>
              </h3>
            </div>

            {/* Form No, Report Made By & Report Classification Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* FORM NO */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  FORM NO
                </label>
                <input
                  type="text"
                  value={formNo}
                  onChange={(e) => setFormNo(e.target.value)}
                  placeholder="e.g. EE-INC-063"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-cyan-300 font-mono font-extrabold text-xs focus:outline-none focus:border-cyan-400 tracking-wider"
                />
              </div>

              {/* Report Made By: Dropdown List */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  REPORT MADE BY:
                </label>
                <select
                  value={reportMadeBy}
                  onChange={(e) => setReportMadeBy(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
                >
                  <option value="">Select Reporter...</option>
                  <option value="Asst. Manager">Asst. Manager</option>
                  <option value="Supervisor">Supervisor</option>
                  <option value="Team">Team</option>
                  <option value="Other">Other</option>
                </select>
                {reportMadeBy === 'Other' && (
                  <input
                    type="text"
                    value={reportMadeByOther}
                    onChange={(e) => setReportMadeByOther(e.target.value)}
                    placeholder="Specify other reporter title..."
                    className="w-full mt-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                  />
                )}
              </div>

              {/* THIS IS A REPORT OF A: Dropdown List */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                  THIS IS A REPORT OF A:
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-rose-400 cursor-pointer"
                >
                  <option value="">Select Report Type...</option>
                  <option value="Death">Death</option>
                  <option value="Lost Time">Lost Time</option>
                  <option value="Doc Visit Only">Doc Visit Only</option>
                  <option value="First Aid Only">First Aid Only</option>
                  <option value="Near Miss">Near Miss</option>
                </select>
              </div>

            </div>
          </div>

          {/* REFERENCE REPORT STEP 1: INJURED EMPLOYEE (PAGE 1) */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-700/60 shadow-inner">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-blue-400">person</span>
                <span>Step 1: Injured Employee</span>
              </h3>
              <span className="text-[10px] text-slate-400">(Complete this part for each injured employee)</span>
            </div>

            {/* Employee Basic Info Grid (Ordered: Name -> Gender -> Age -> Employee ID -> Department -> Job Title) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. NAME */}
              <div className="sm:col-span-2 lg:col-span-2 space-y-1.5 relative">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  NAME
                </label>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    value={employeeName}
                    readOnly={isLocked}
                    onFocus={() => {
                      if (!isLocked) setIsNameDropdownOpen(true);
                    }}
                    onChange={(e) => {
                      setEmployeeName(e.target.value);
                      if (!isLocked) setIsNameDropdownOpen(true);
                    }}
                    placeholder={isLoadingEmployees ? 'Loading employee roster...' : 'Type name to search or enter manually...'}
                    className={`w-full pl-3 ${isLocked ? 'pr-28' : 'pr-3'} py-2 rounded-lg border text-xs focus:outline-none ${
                      isLocked
                        ? 'bg-slate-900 border-slate-700 text-slate-200 cursor-not-allowed'
                        : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
                    }`}
                  />

                  {isLocked && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLocked(false);
                      }}
                      className="absolute right-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-600 text-[10px] text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                      title="Unlock fields to edit or re-select"
                    >
                      <span className="material-symbols-outlined text-[11px]">lock_open</span>
                      <span>Unlock/Change</span>
                    </button>
                  )}

                  {!isLocked && isNameDropdownOpen && (
                    <div className="absolute z-30 left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-lg bg-slate-900 border border-slate-700 shadow-xl py-1 text-xs">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => (
                          <button
                            key={emp.id + emp.name}
                            type="button"
                            onClick={() => {
                              setEmployeeName(emp.name);
                              setEmployeeId(emp.id);
                              if (emp.department) setDepartment(emp.department);
                              if (emp.position) setJobTitle(emp.position);
                              setIsLocked(true);
                              setIsNameDropdownOpen(false);
                            }}
                            className="w-full text-left px-3 py-2 text-slate-200 hover:bg-slate-800 hover:text-cyan-300 transition-colors cursor-pointer block truncate"
                          >
                            <span className="font-medium">{emp.name}</span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-slate-400 text-[11px] italic">
                          No exact match found — type to enter name manually
                        </div>
                      )}
                      <div className="border-t border-slate-800 mt-1 pt-1 px-3 py-1.5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setIsNameDropdownOpen(false)}
                          className="text-[10px] text-slate-400 hover:text-slate-200"
                        >
                          Close suggestions
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. GENDER */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Gender
                </label>
                <div className="flex items-center gap-3 py-2">
                  {['Male', 'Female'].map((g) => (
                    <label key={g} className="inline-flex items-center gap-1.5 cursor-pointer text-xs text-slate-200">
                      <input
                        type="radio"
                        name="gender"
                        value={g}
                        checked={gender === g}
                        onChange={() => setGender(g)}
                        className="accent-cyan-400"
                      />
                      <span>{g}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 3. AGE */}
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Age
                </label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="e.g. 24"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* 4. EMPLOYEE ID */}
              <div className="sm:col-span-2 lg:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  EMPLOYEE ID
                </label>
                <input
                  type="text"
                  value={employeeId}
                  readOnly={isLocked}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="e.g. 2408001"
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                    isLocked
                      ? 'bg-slate-900 border-slate-700 text-slate-200 cursor-not-allowed'
                      : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
                  }`}
                />
              </div>

              {/* 5. DEPARTMENT */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  Department
                </label>
                <input
                  type="text"
                  value={department}
                  readOnly={isLocked}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Operation & Maintenance Ijok"
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                    isLocked
                      ? 'bg-slate-900 border-slate-700 text-slate-200 cursor-not-allowed'
                      : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
                  }`}
                />
              </div>

              {/* 6. JOB TITLE */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  Job title at time of incident
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  readOnly={isLocked}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Engineer"
                  className={`w-full px-3 py-2 rounded-lg border text-xs focus:outline-none ${
                    isLocked
                      ? 'bg-slate-900 border-slate-700 text-slate-200 cursor-not-allowed'
                      : 'bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-400'
                  }`}
                />
              </div>
            </div>

            {/* Part of body affected */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                Part of body affected: <span className="text-[10px] text-slate-400 font-normal">(select all that apply)</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {bodyPartsList.map((part) => {
                  const isSelected = partOfBodyAffected.includes(part);
                  return (
                    <button
                      key={part}
                      type="button"
                      onClick={() => toggleBodyPart(part)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-amber-500/25 border-amber-400 text-amber-200 shadow-sm'
                          : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                    >
                      {isSelected ? `✓ ${part}` : part}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Nature of injury */}
            <div className="space-y-2 pt-1 border-t border-slate-800">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                Nature of injury: <span className="text-[10px] text-slate-400 font-normal">(most serious one)</span>
              </label>
              <select
                value={natureOfInjury}
                onChange={(e) => setNatureOfInjury(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400 cursor-pointer"
              >
                <option value="">Select Nature of Injury...</option>
                <option value="Abrasion, scrapes [melecet]">Abrasion, scrapes [melecet]</option>
                <option value="Amputation [putus]">Amputation [putus]</option>
                <option value="Broken bone [patah tulang]">Broken bone [patah tulang]</option>
                <option value="Bruise [lebam]">Bruise [lebam]</option>
                <option value="Burn (heat) [melecur – panas]">Burn (heat) [melecur – panas]</option>
                <option value="Burn (chemical) [melecur – bahan kimia]">Burn (chemical) [melecur – bahan kimia]</option>
                <option value="Concussion (to the head) [pengsan - hentakan di kepala]">Concussion (to the head) [pengsan - hentakan di kepala]</option>
                <option value="Banging (to the head) [Terhantuk di kepala]">Banging (to the head) [Terhantuk di kepala]</option>
                <option value="Crushing injury [hancur – tulang / anggota badan]">Crushing injury [hancur – tulang / anggota badan]</option>
                <option value="Cut, laceration, puncture [luka / tertusuk]">Cut, laceration, puncture [luka / tertusuk]</option>
                <option value="Illness [sukar bernafas, keracunan]">Illness [sukar bernafas, keracunan]</option>
                <option value="Sprain, strain [terseliuh / kekejangan]">Sprain, strain [terseliuh / kekejangan]</option>
                <option value="Damage to a body system [kerosakan sistem badan]">Damage to a body system [kerosakan sistem badan]</option>
                <option value="Others [lain-lain]">Others [lain-lain]</option>
              </select>

              {natureOfInjury === 'Others [lain-lain]' && (
                <input
                  type="text"
                  value={natureOfInjuryOther}
                  onChange={(e) => setNatureOfInjuryOther(e.target.value)}
                  placeholder="Specify other injury details (e.g. Sprained shoulder)..."
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              )}
            </div>
          </div>

          {/* REFERENCE REPORT STEP 2: DESCRIBE THE INCIDENT CONTEXT (PAGE 1) */}
          <div className="space-y-4 p-4 rounded-2xl bg-slate-950/90 border border-slate-700/60 shadow-inner">
            <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-amber-400">pin_drop</span>
                <span>Step 2: Incident Location &amp; Workday Details</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Exact location of the incident
                </label>
                <input
                  type="text"
                  value={exactLocation}
                  onChange={(e) => setExactLocation(e.target.value)}
                  placeholder="e.g. West Coast Expressway (WCE) Highway"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={incidentDate}
                  onChange={(e) => setIncidentDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Exact time
                </label>
                <input
                  type="text"
                  value={exactTime}
                  onChange={(e) => setExactTime(e.target.value)}
                  placeholder="e.g. 0830 (approx.)"
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Names of witness (if any)
                </label>
                <input
                  type="text"
                  value={witnessNames}
                  onChange={(e) => setWitnessNames(e.target.value)}
                  placeholder="e.g. None / List names..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* What part of employee's workday?: Dropdown List */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wide">
                WHAT PART OF EMPLOYEE&apos;S WORKDAY?:
              </label>
              <select
                value={workdayPart}
                onChange={(e) => setWorkdayPart(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="">Select Workday Period...</option>
                <option value="Entering work">Entering work</option>
                <option value="Doing normal work activities">Doing normal work activities</option>
                <option value="During lunch time">During lunch time</option>
                <option value="Working overtime">Working overtime</option>
                <option value="Leaving work">Leaving work</option>
                <option value="Others">Others</option>
              </select>

              {workdayPart === 'Others' && (
                <input
                  type="text"
                  value={workdayPartOther}
                  onChange={(e) => setWorkdayPartOther(e.target.value)}
                  placeholder="Specify other workday period..."
                  className="w-full mt-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-400"
                />
              )}
            </div>
          </div>

          {/* SECTION: INCIDENT CHRONOLOGY & DETAILS WITH GENERATE BUTTON */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center border border-amber-500/40">
                  ⚡
                </span>
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wide">
                  INCIDENT CHRONOLOGY &amp; DETAILS
                </h3>
              </div>

              <button
                type="button"
                onClick={handleInsertSample}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-semibold border border-cyan-500/30 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-xs">edit_note</span>
                <span>Insert Sample Chronology</span>
              </button>
            </div>

            <textarea
              rows={7}
              value={chronology}
              onChange={(e) => setChronology(e.target.value)}
              placeholder="Type or paste the incident chronology details here..."
              className="w-full min-h-[160px] p-4 sm:p-5 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed text-xs sm:text-sm"
            />

            {generationError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base">warning</span>
                <span>{generationError}</span>
              </div>
            )}

            {/* GENERATE BUTTON */}
            <div className="flex justify-center pt-1 pb-1">
              <button
                type="button"
                onClick={handleGenerateReport}
                disabled={isGenerating}
                className="w-48 h-8 rounded-lg bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:opacity-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 cursor-pointer flex-shrink-0"
              >
                {isGenerating ? (
                  <>
                    <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                    <span>AI Generating Report...</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">auto_awesome</span>
                    <span>AI Generating Report</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated Description (English Essay) */}
            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="block text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm">article</span>
                  <span>DESCRIPTION OF THE INCIDENT</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleCopyText(description, 'desc')}
                  disabled={!description.trim()}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-cyan-300 hover:text-white text-xs font-semibold border border-cyan-500/30 transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">
                    {copiedSection === 'desc' ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedSection === 'desc' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Formal English essay description will be generated here automatically after clicking GENERATE REPORT..."
                className="w-full p-3 rounded-xl bg-slate-900/90 border border-emerald-500/30 text-emerald-100 font-sans text-xs sm:text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 leading-relaxed"
              />
            </div>
          </div>

          {/* SECTION: PRELIMINARY CAUSE (NO LIMIT) */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/40">
                  ⚠️
                </span>
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <span>PRELIMINARY CAUSE</span>
                  <span className="text-[10px] text-indigo-300 font-normal">(Auto-filled by AI)</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-indigo-400">
                  {preliminaryCauses.length} {preliminaryCauses.length === 1 ? 'Point' : 'Points'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(preliminaryCauses.map((c, i) => `• ${c}`).join('\n'), 'causes')}
                  disabled={preliminaryCauses.length === 0}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-cyan-300 hover:text-white text-xs font-semibold border border-cyan-500/30 transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">
                    {copiedSection === 'causes' ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedSection === 'causes' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {preliminaryCauses.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-900 border border-slate-800">
                Preliminary causes not generated yet. Click GENERATE REPORT above for AI analysis.
              </p>
            ) : (
              <ul className="space-y-2">
                {preliminaryCauses.map((cause, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-2 text-xs sm:text-sm text-slate-200"
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-indigo-400 font-bold text-sm leading-none">•</span>
                      <span>{cause}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCause(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors flex-shrink-0 cursor-pointer"
                      title="Delete cause point"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add Cause Manual Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newCauseText}
                onChange={(e) => setNewCauseText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCause()}
                placeholder="Add preliminary cause point manually..."
                className="flex-1 px-3 py-1.5 h-8 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 text-xs"
              />
              <button
                type="button"
                onClick={handleAddCause}
                className="px-2.5 py-1.5 h-8 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                <span>Add Point</span>
              </button>
            </div>
          </div>

          {/* SECTION: PREVENTIVE ACTION (NO LIMIT) */}
          <div className="space-y-3 p-4 rounded-2xl bg-slate-950/80 border border-emerald-500/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/40">
                  🛡️
                </span>
                <h3 className="font-extrabold text-white text-sm uppercase tracking-wide flex items-center gap-1.5">
                  <span>PREVENTIVE ACTION</span>
                  <span className="text-[10px] text-emerald-300 font-normal">(Auto-filled by AI)</span>
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-emerald-400">
                  {preventiveActions.length} {preventiveActions.length === 1 ? 'Point' : 'Points'}
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(preventiveActions.map((a, i) => `• ${a}`).join('\n'), 'actions')}
                  disabled={preventiveActions.length === 0}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-cyan-300 hover:text-white text-xs font-semibold border border-cyan-500/30 transition-colors flex items-center gap-1 disabled:opacity-40 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-xs">
                    {copiedSection === 'actions' ? 'check' : 'content_copy'}
                  </span>
                  <span>{copiedSection === 'actions' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {preventiveActions.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 rounded-xl bg-slate-900 border border-slate-800">
                Preventive actions not generated yet. Click GENERATE REPORT above for AI recommendations.
              </p>
            ) : (
              <ul className="space-y-2">
                {preventiveActions.map((action, idx) => (
                  <li
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-2 text-xs sm:text-sm text-slate-200"
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <span className="text-emerald-400 font-bold text-sm leading-none">•</span>
                      <span>{action}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(idx)}
                      className="text-slate-500 hover:text-rose-400 p-0.5 transition-colors flex-shrink-0 cursor-pointer"
                      title="Delete action point"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {/* Add Action Manual Input */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddAction()}
                placeholder="Add preventive action point manually..."
                className="flex-1 px-3 py-1.5 h-8 rounded-lg bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 text-xs"
              />
              <button
                type="button"
                onClick={handleAddAction}
                className="px-2.5 py-1.5 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0 whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                <span>Add Point</span>
              </button>
            </div>
          </div>

          {/* INCIDENT PICTURES SECTION (BELOW PREVENTIVE ACTION) */}
          <div className="space-y-3 p-3.5 sm:p-4 rounded-xl bg-slate-950/90 border border-teal-500/30 shadow-inner">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between gap-2">
              <h3 className="text-xs sm:text-sm font-extrabold text-teal-400 uppercase tracking-wider flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-teal-400">photo_library</span>
                <span>INCIDENT PICTURES</span>
              </h3>
              <span className="text-[10px] text-slate-400">
                {pictures.length > 0 ? `${pictures.length} uploaded (max 4)` : 'Upload up to 4 photos'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {pictures.map((pic, idx) => (
                <div
                  key={idx}
                  className="relative rounded-xl border border-teal-500/40 bg-slate-900/80 overflow-hidden flex flex-col items-center justify-center min-h-[115px] shadow-sm"
                >
                  <div className="relative w-full h-28 group">
                    <img
                      src={pic}
                      alt={`Incident Photo ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePicture(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-rose-600/90 text-white hover:bg-rose-500 shadow-md transition-colors cursor-pointer"
                      title="Remove picture"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-slate-200">
                      Photo {idx + 1}
                    </span>
                  </div>
                </div>
              ))}

              {pictures.length < 4 && (
                <label className="rounded-xl border border-dashed border-teal-500/40 hover:border-teal-400/80 bg-slate-900/40 hover:bg-slate-800/60 transition-colors min-h-[115px] h-28 flex flex-col items-center justify-center gap-1.5 p-2 text-center cursor-pointer">
                  <span className="material-symbols-outlined text-2xl text-teal-400">add_a_photo</span>
                  <span className="text-[10px] font-bold text-slate-300">
                    {pictures.length === 0 ? 'Upload Photo' : `Add Photo (${pictures.length}/4)`}
                  </span>
                  <span className="text-[9px] text-slate-500">Click to browse</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePictureUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

        </div>

        {/* Modal Footer Controls */}
        <div className="p-2.5 sm:p-4 border-t border-cyan-500/20 bg-slate-950/90 flex flex-col gap-2">
          {driveSaveStatus && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center justify-between gap-2 transition-all ${
                driveSaveStatus.success
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <span className="material-symbols-outlined text-sm flex-shrink-0">
                  {driveSaveStatus.success ? 'check_circle' : 'error'}
                </span>
                <span className="truncate text-[11px] sm:text-xs">{driveSaveStatus.message}</span>
              </div>
              {driveSaveStatus.link && (
                <a
                  href={driveSaveStatus.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[10px] sm:text-[11px] font-bold border border-emerald-500/40 flex items-center gap-1 flex-shrink-0"
                >
                  <span>Open in Drive</span>
                  <span className="material-symbols-outlined text-xs">open_in_new</span>
                </a>
              )}
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleClearForm}
              className="w-full sm:w-auto px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-300 font-semibold text-[11px] sm:text-xs border border-slate-700 hover:border-rose-500/40 transition-colors flex items-center justify-center gap-1 cursor-pointer"
              title="Reset and clear all form inputs"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span>Clear Form</span>
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSaveReportToDrive}
                disabled={isSavingToDrive}
                className="flex-1 sm:flex-initial px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
                title="Automatically save report to Google Drive in Incident Report folder"
              >
                <span className={`material-symbols-outlined text-sm sm:text-base ${isSavingToDrive ? 'animate-spin' : ''}`}>
                  {isSavingToDrive ? 'sync' : 'cloud_upload'}
                </span>
                <span>{isSavingToDrive ? 'Saving...' : 'Save Report'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isExportingPdf}
                className="flex-1 sm:flex-initial px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-medium text-[11px] sm:text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm sm:text-base">
                  {isExportingPdf ? 'hourglass_top' : 'download'}
                </span>
                <span>{isExportingPdf ? 'Generating...' : 'Download PDF Report'}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
