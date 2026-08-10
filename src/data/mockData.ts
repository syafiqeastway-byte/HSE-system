import {
  SOPItem,
  HIRARCItem,
  CompetentPerson,
  IncidentRecord,
  DemeritRecord,
  DemeritMatrix,
  InspectionRecord,
  FirstAidCert,
  MinuteMeeting
} from '../types';

export const INITIAL_DAYS_WITHOUT_INCIDENT = 438;

export const MOCK_SOPS: SOPItem[] = [
  { id: '1', code: 'SOP-EE-001', title: 'Visitors Safety Induction & Site Protocol', category: 'General HSE', description: 'Mandatory registration, briefing, and PPE requirements for all site visitors.', revisionDate: '2026-01-15', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-001/pub?embedded=true' },
  { id: '2', code: 'SOP-EE-002', title: 'Personal Protective Equipment (PPE) Compliance', category: 'Personal Safety', description: 'Specification, fitting, inspection, and maintenance of safety helmets, boots, and glasses.', revisionDate: '2026-01-20', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-002/pub?embedded=true' },
  { id: '3', code: 'SOP-EE-003', title: 'Working at Height & Fall Arrest Systems', category: 'High Risk Safety', description: 'Full harness inspection, double-lanyard anchor points, and 2m fall distance rule.', revisionDate: '2026-02-01', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-003/pub?embedded=true' },
  { id: '4', code: 'SOP-EE-004', title: 'Mobile Elevating Work Platform (MEWP) Usage', category: 'Equipment Operation', description: 'Pre-use inspection, ground condition checks, harness attachment, and tilt sensors.', revisionDate: '2026-01-18', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-004/pub?embedded=true' },
  { id: '5', code: 'SOP-EE-005', title: 'Forklift Operation & Material Stacking', category: 'Machinery Safety', description: 'Operator licensing, speed limits (10km/h), load center calculations, and horn alerts.', revisionDate: '2026-02-10', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-005/pub?embedded=true' },
  { id: '6', code: 'SOP-EE-006', title: 'Circular Saw & Abrasive Cutting Safety', category: 'Workshop Safety', description: 'Blade guarding, RPM rating verification, eye protection, and spark suppression.', revisionDate: '2026-01-25', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-006/pub?embedded=true' },
  { id: '7', code: 'SOP-EE-007', title: 'Scheduled Chemical & Hazardous Waste Management', category: 'Environmental Safety', description: 'SW204/SW305 containment, secondary bunding, labeling, and DOE e-SWIS logging.', revisionDate: '2026-02-05', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-007/pub?embedded=true' },
  { id: '8', code: 'SOP-EE-008', title: 'Chemical Handling & Safety Data Sheet (SDS)', category: 'Hazardous Materials', description: 'Storage segregation, spill kit deployment, chemical suit usage, and eyewash stations.', revisionDate: '2026-01-30', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-008/pub?embedded=true' },
  { id: '9', code: 'SOP-EE-009', title: 'Hot Work, Arc & TIG Welding Operations', category: 'Hot Work Safety', description: 'Hot Work Permit issuance, gas cylinder clearance, fire watch, and welding screens.', revisionDate: '2026-02-12', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-009/pub?embedded=true' },
  { id: '10', code: 'SOP-EE-010', title: 'Spray Painting & Solvent Exhaust Safety', category: 'Workshop Safety', description: 'Explosion-proof ventilation, organic vapor respirators, and grounding spray guns.', revisionDate: '2026-02-08', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-010/pub?embedded=true' },
  { id: '11', code: 'SOP-EE-011', title: 'Boom Support & Crane Rigging Safety', category: 'Lifting Operations', description: 'Rigging hardware inspection, sling angle factor charts, tag line controls, and outriggers.', revisionDate: '2026-01-22', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-011/pub?embedded=true' },
  { id: '12', code: 'SOP-EE-012', title: 'Oxy-Acetylene Cutting & Cylinder Storage', category: 'Hot Work Safety', description: 'Flashback arrestors at torch & regulator, upright cylinder chaining, and leak testing.', revisionDate: '2026-02-14', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-012/pub?embedded=true' },
  { id: '13', code: 'SOP-EE-013', title: 'Electrical Safety & Lockout/Tagout (LOTO)', category: 'Electrical Safety', description: 'Isolation valves, padlock placement, residual energy discharge, and voltage testing.', revisionDate: '2026-01-19', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-013/pub?embedded=true' },
  { id: '14', code: 'SOP-EE-014', title: 'MEWP Preventative Maintenance & Inspection', category: 'Equipment Maintenance', description: 'Hydraulic fluid pressure checks, emergency lowering valves, and limit switch tests.', revisionDate: '2026-02-18', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-014/pub?embedded=true' },
  { id: '15', code: 'SOP-EE-015', title: 'Cutting Tires & Scrap Disposal Protocol', category: 'Recycling & Waste', description: 'Heavy tire bead cutting machinery operation, face shield mandatory, scrap bunding.', revisionDate: '2026-01-28', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-015/pub?embedded=true' },
  { id: '16', code: 'SOP-EE-016', title: 'Hydraulic Hose Crimping & Pressure Testing', category: 'High Pressure Safety', description: 'Crimp diameter verification, burst pressure shielding, and whipcheck safety cables.', revisionDate: '2026-02-04', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-016/pub?embedded=true' },
  { id: '17', code: 'SOP-EE-017', title: 'Heavy Tow Truck Recovery & Transport', category: 'Transport & Field', description: 'Highway amber beacon deployment, wheel chocks, winching angle safety, and safety chains.', revisionDate: '2026-01-14', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-015/pub?embedded=true' },
  { id: '18', code: 'SOP-EE-018', title: 'Heavy Machinery Tire Replacement & Inflation', category: 'Tyre Workshop Safety', description: 'Safety inflation cage usage, remote air chuck, pneumatic impact gun safety.', revisionDate: '2026-02-11', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-018/pub?embedded=true' },
  { id: '19', code: 'SOP-EE-019', title: 'Machinery Loading & Unloading on Low Loaders', category: 'Heavy Equipment Logistics', description: 'Ramp slope safety checks, timber blocking, heavy turnbuckle lashing, and bankman role.', revisionDate: '2026-02-02', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-019/pub?embedded=true' },
  { id: '20', code: 'SOP-EE-020', title: 'Site Traffic Management & Flagman Guidance', category: 'Site Traffic', description: 'High-visibility LED batons, speed bumps, designated pedestrian walkways, and blind spots.', revisionDate: '2026-01-27', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-020/pub?embedded=true' },
  { id: '21', code: 'SOP-EE-021', title: 'Mobile Crane Lifting & Rigging Operations', category: 'Lifting Operations', description: 'Lifting Plan approval, wind speed anemometer limits (<10 m/s), load radius charts.', revisionDate: '2026-02-15', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-021/pub?embedded=true' },
  { id: '22', code: 'SOP-EE-022', title: 'General Workshop Housekeeping & Service Safety', category: 'General HSE', description: '5S standards, immediate oil spill cleanup, pathway clearance, and tool storage.', revisionDate: '2026-01-16', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-022/pub?embedded=true' },
  { id: '23', code: 'SOP-EE-023', title: 'Hydraulic Seal Kit Replacement & Bleeding', category: 'Mechanical Services', description: 'Pressure relief before disassembly, lint-free wiping, O-ring seal installation.', revisionDate: '2026-02-07', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-023/pub?embedded=true' },
  { id: '24', code: 'SOP-EE-024', title: 'Heavy Diesel Engine Overhaul & Servicing', category: 'Mechanical Services', description: 'Engine stand locking pin verification, hot coolant safety, hazardous waste drain pans.', revisionDate: '2026-02-16', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-024/pub?embedded=true' },
  { id: '25', code: 'SOP-EE-025', title: 'Accident & Incident Investigation & Reporting', category: 'Incident Management', description: 'Immediate notification within 2 hours, site preservation, DOSH JKP7 form submission.', revisionDate: '2026-01-10', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-025/pub?embedded=true' },
  { id: '26', code: 'SOP-EE-026', title: 'Confined Space Entry Protocol & Gas Monitoring', category: 'High Risk Safety', description: 'Entry Permit, multi-gas testing (O2, H2S, LEL, CO), continuous forced air ventilation.', revisionDate: '2026-02-17', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-026/pub?embedded=true' },
  { id: '27', code: 'SOP-EE-027', title: 'Emergency Evacuation Drill & Assembly Point', category: 'Emergency Preparedness', description: 'Biannual drill execution, warden sweep protocols, roll call verification, alarm sirens.', revisionDate: '2026-01-12', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-027/pub?embedded=true' },
  { id: '28', code: 'SOP-EE-028', title: 'Scaffolding Erection, Inspection & Green Tagging', category: 'High Risk Safety', description: 'Competent Scaffolder supervision, Green/Red Tag system, toe boards, and sole plates.', revisionDate: '2026-02-09', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-028/pub?embedded=true' },
  { id: '29', code: 'SOP-EE-029', title: 'Fire Extinguisher Operation & Hot Spot Watch', category: 'Fire Safety', description: 'PASS method (Pull, Aim, Squeeze, Sweep), annual inspection tags, 1m clearance.', revisionDate: '2026-01-31', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-029/pub?embedded=true' },
  { id: '30', code: 'SOP-EE-030', title: 'First Aid Emergency Response & Medical Triage', category: 'Medical Safety', description: 'First aid box replenishment, AED automated CPR guidance, trauma triage, ambulance dispatch.', revisionDate: '2026-02-13', documentUrl: 'https://docs.google.com/document/d/e/2PACX-1vSOP-EE-030/pub?embedded=true' }
];

export const MOCK_HIRARCS: HIRARCItem[] = [
  { id: '1', code: 'HIRARC-01', activityName: 'Mobile Elevating Work Platform (MEWP) Aerial Repairs', location: 'Fabrication Yard B', hazard: 'Platform overturn, fall from height, overhead electrical powerline contact.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Daily pre-use checklist, 2m exclusion zone, harness anchor to dedicated lanyard point, spotter with air horn.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-01/pubhtml?widget=true' },
  { id: '2', code: 'HIRARC-02', activityName: 'Overhead Gantry Crane Lifting (Up to 15 Tons)', location: 'Heavy Workshop A', hazard: 'Sling failure, dropped load, pinch points during rigging maneuvers.', initialRisk: 'Extreme', residualRisk: 'Low', controlMeasures: 'Annual DOSH PMA certificate, certified rigger tag lines, pre-lift load calculation, audio-visual siren.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-02/pubhtml?widget=true' },
  { id: '3', code: 'HIRARC-03', activityName: 'Chemical & Solvent Storage in SW Drums', location: 'Scheduled Waste Store', hazard: 'Toxic chemical vapor inhalation, skin contact burns, accidental fire ignition.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Ex-proof exhaust fans, spill bund capacity > 110%, SDS posted at entrance, chemical resistant apron and nitrile gloves.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-03/pubhtml?widget=true' },
  { id: '4', code: 'HIRARC-04', activityName: 'Heavy Structural Steel Hot Work & Gas Cutting', location: 'Welding Bay 3', hazard: 'UV radiation eye burn, flying sparks, gas hose rupture, fire outbreak.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Hot Work Permit, flashback arrestors at both ends, 10kg CO2 fire extinguisher on standby, auto-darkening welding helmet.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-04/pubhtml?widget=true' },
  { id: '5', code: 'HIRARC-05', activityName: 'Hydraulic Cylinder Demounting & Pressure Relief', location: 'Service Workshop', hazard: 'Pressurized hydraulic fluid injection, heavy mechanical crush hazard.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'LOTO pressure dump valves, steel toe boots, impact gloves, hydraulic pressure relief gauge check.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-05/pubhtml?widget=true' },
  { id: '6', code: 'HIRARC-06', activityName: 'Heavy Vehicle Tire Inflation & Mounting', location: 'Tire Bay', hazard: 'Explosive tire rim detachment, high decibel blast pressure, flying debris.', initialRisk: 'Extreme', residualRisk: 'Low', controlMeasures: 'Mandatory inflation safety cage, remote pneumatic clip-on chuck with 5m hose distance.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-06/pubhtml?widget=true' },
  { id: '7', code: 'HIRARC-07', activityName: 'Main Switchboard High Voltage Electrical Servicing', location: 'Substation Room', hazard: 'Arc flash, lethal electrocution, electrical fires.', initialRisk: 'Extreme', residualRisk: 'Low', controlMeasures: 'Authorized Wireman Grade A4 supervision, insulated gloves (10kV rated), dielectric mats, strict LOTO.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-07/pubhtml?widget=true' },
  { id: '8', code: 'HIRARC-08', activityName: 'Modular Tube & Fitting Scaffolding Erection', location: 'Site Construction Area', hazard: 'Structural scaffold collapse, falling tools onto lower level workers.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'DOSH registered Scaffolder Level 2, Green Tag signoff, toe boards, mesh netting below work platform.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-08/pubhtml?widget=true' },
  { id: '9', code: 'HIRARC-09', activityName: 'Highway Tow Truck Winching & Vehicle Recovery', location: 'Field Operations', hazard: 'Winch cable snapping under tension, passing highway traffic impact.', initialRisk: 'High', residualRisk: 'Medium', controlMeasures: 'Dyneema synthetic winch rope, heavy damper blanket on cable, LED traffic cones 100m upstream, flagman warning.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-09/pubhtml?widget=true' },
  { id: '10', code: 'HIRARC-10', activityName: 'Diesel Engine Block Machine Lapping & Grinding', location: 'Machine Shop', hazard: 'Metal shard eye injuries, high noise exposure (>85dBA), hand entanglement.', initialRisk: 'Medium', residualRisk: 'Low', controlMeasures: 'Emergency stop kick-bar, double eye protection (safety glasses + face shield), NRR 30dB ear defenders.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-10/pubhtml?widget=true' },
  { id: '11', code: 'HIRARC-11', activityName: 'Hydraulic Hose High Pressure Crimping', location: 'Hose Fitting Area', hazard: 'High pressure pinhole hydraulic oil skin injection, hose whip.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Polycarbonate machine safety shield, whipcheck safety cables installed on all pressure test rigs.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-11/pubhtml?widget=true' },
  { id: '12', code: 'HIRARC-12', activityName: 'Fuel Tank Inspection & Internal Confined Space Entry', location: 'Depot Tank Yard', hazard: 'Toxic hydrocarbon gas asphyxiation, explosive atmosphere ignition.', initialRisk: 'Extreme', residualRisk: 'Low', controlMeasures: 'Confined Space Permit, continuous 4-gas monitor, blower fan 1000 CFM, standby AGESP rescuer outside.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-12/pubhtml?widget=true' },
  { id: '13', code: 'HIRARC-13', activityName: 'Forklift Internal Yard Transport & Material Moving', location: 'Central Warehouse', hazard: 'Pedestrian collision, tip-over on ramp incline, blind spot hits.', initialRisk: 'Medium', residualRisk: 'Low', controlMeasures: 'Pedestrian blue spot safety light, speed governor set to 8km/h, 3m safety clearance rule.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-13/pubhtml?widget=true' },
  { id: '14', code: 'HIRARC-14', activityName: 'Industrial Spray Booth Automotive Painting', location: 'Paint Workshop', hazard: 'Inhalation of polyurethane paints & toxic isocyanates, static fire spark.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Air-supplied respirator hood, anti-static clothing, humidity control > 60%, explosion-proof LED lighting.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-14/pubhtml?widget=true' },
  { id: '15', code: 'HIRARC-15', activityName: 'Abrasive Sandblasting Structural Cleaning', location: 'Blasting Enclosure', hazard: 'Silica dust lung inhalation, high pressure grit skin abrasion.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Positive-pressure blasting helmet, leather blast suit, heavy blast hose deadman handle valve.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-15/pubhtml?widget=true' },
  { id: '16', code: 'HIRARC-16', activityName: 'Roof Maintenance & Gutter Replacement', location: 'Main Facility Roof', hazard: 'Fragile roof sheet breakage, falling 12m to concrete floor below.', initialRisk: 'Extreme', residualRisk: 'Low', controlMeasures: 'Permanent roof crawling boards, static lifeline wire installation, mandatory double lanyard fall harness.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-16/pubhtml?widget=true' },
  { id: '17', code: 'HIRARC-17', activityName: 'Used Engine Oil Drain & SW Storage Transfer', location: 'Maintenance Pit', hazard: 'Slippery oil spill slips, skin contact dermatitis, soil contamination.', initialRisk: 'Medium', residualRisk: 'Low', controlMeasures: 'Pneumatic oil suction drainer, oil resistant boots, spill kit absorption pads deployed.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-17/pubhtml?widget=true' },
  { id: '18', code: 'HIRARC-18', activityName: 'Heavy Equipment Chassis Fabrication & Assembly', location: 'Fabrication Bay 1', hazard: 'Heavy beam crush, overhead crane swing collision, pinched fingers.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Tack welding alignment clamps, clear voice radio signals between crane operator and fitters.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-18/pubhtml?widget=true' },
  { id: '19', code: 'HIRARC-19', activityName: 'Lead-Acid Battery Charging Station Maintenance', location: 'Battery Room', hazard: 'Hydrogen gas explosive accumulation, sulfuric acid splash hazards.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Continuous hydrogen gas sensor alarm, emergency eyewash shower within 5 seconds, acid neutralizing baking soda.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-19/pubhtml?widget=true' },
  { id: '20', code: 'HIRARC-20', activityName: 'Heavy Steel Plate Stacking & Racking Storage', location: 'Raw Material Store', hazard: 'Plate pile sliding collapse, foot crush injuries.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Vertical rack separators with safety locking pins, Metatarsal steel toe boots required.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-20/pubhtml?widget=true' },
  { id: '21', code: 'HIRARC-21', activityName: 'Angle Grinder Weld Seam Dressing', location: 'Workshop Bay 2', hazard: 'Grinding disc disintegration burst, metallic particle eye impact.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Wheel guard position verification, 80m/s speed rated disc matching grinder RPM, safety visor.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-21/pubhtml?widget=true' },
  { id: '22', code: 'HIRARC-22', activityName: 'Pneumatic Air Receiver Tank Hydro Testing', location: 'Testing Enclosure', hazard: 'Pressure vessel over-pressurization explosion, flying metal shards.', initialRisk: 'Extreme', residualRisk: 'Low', controlMeasures: 'Calibrated hydro test pump, DOSH UMK pressure vessel certificate, safety blast barricade wall.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-22/pubhtml?widget=true' },
  { id: '23', code: 'HIRARC-23', activityName: 'Old Facility Shed Demolition & Dismantling', location: 'East Perimeter Yard', hazard: 'Falling structural corrugated sheets, sharp rusty metal puncture wounds.', initialRisk: 'High', residualRisk: 'Medium', controlMeasures: 'Demolition Exclusion Zone barriers, Kevlar cut-resistant level 5 gloves, mobile hydraulic shear machine.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-23/pubhtml?widget=true' },
  { id: '24', code: 'HIRARC-24', activityName: 'Cable Trench Mechanical Excavation', location: 'Site Ground Works', hazard: 'Underground high voltage cable strike, trench wall collapse.', initialRisk: 'High', residualRisk: 'Low', controlMeasures: 'Cable Avoiding Tool (CAT) scan before digging, trench shoring box for depth > 1.5m.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-24/pubhtml?widget=true' },
  { id: '25', code: 'HIRARC-25', activityName: 'Facility Fire Alarm & Hydrant Pump Testing', location: 'Pump House', hazard: 'High pressure hose kickback, electrical short circuit in damp pump room.', initialRisk: 'Medium', residualRisk: 'Low', controlMeasures: 'Dual operator grip on 65mm fire hose, rubber insulated boots, monthly pressure gauge calibration.', documentUrl: 'https://docs.google.com/spreadsheets/d/e/2PACX-HIRARC-25/pubhtml?widget=true' }
];

export const MOCK_COMPETENT_PERSONS: CompetentPerson[] = [
  {
    id: 'CP-01',
    name: 'Ir. Ahmad Razali Bin Hassan',
    title: 'Safety & Health Officer (SHO)',
    category: 'DOSH Certified SHO',
    doshRegNo: 'HQ/15/SHO/00482',
    certExpiry: '2027-11-30',
    status: 'Active',
    qualifications: ['Green Book SHO DOSH', 'Certified Environmental Professional (CePBFO)', 'ISO 45001 Lead Auditor']
  },
  {
    id: 'CP-02',
    name: 'Tan Eng Kiat',
    title: 'Certified Scaffolding Supervisor',
    category: 'DOSH Competent Person',
    doshRegNo: 'JKKP/IS/12/381',
    certExpiry: '2027-08-15',
    status: 'Active',
    qualifications: ['DOSH Scaffolding Level 3 Master', 'Rigging & Slinging Specialist', 'Working at Height Trainer']
  },
  {
    id: 'CP-03',
    name: 'Suresh Subramaniam',
    title: 'Authorized Gas Tester & Entry Supervisor (AGESP)',
    category: 'Confined Space Expert',
    doshRegNo: 'JKKP/AGESP/09/1102',
    certExpiry: '2026-12-20',
    status: 'Active',
    qualifications: ['NIOSH AGESP Certified', '4-Gas Meter Calibration Certificate', 'Hazmat Emergency Responder']
  },
  {
    id: 'CP-04',
    name: 'Nurul Hidayah Binti Ismail',
    title: 'Lead First Aid Commander & Nurse',
    category: 'Medical & First Aid',
    doshRegNo: 'MRN/FA/2024/098',
    certExpiry: '2027-05-10',
    status: 'Active',
    qualifications: ['St. John Ambulance Certified First Aider', 'AED & CPR Instructor', 'Occupational Health Nurse']
  },
  {
    id: 'CP-05',
    name: 'Mohd Hafiz Bin Yusof',
    title: 'Crane & Heavy Lifting Inspector',
    category: 'Lifting Operations',
    doshRegNo: 'JKKP/PMA/18/774',
    certExpiry: '2026-10-30',
    status: 'Active',
    qualifications: ['DOSH Competent Crane Inspector', 'Rigging Load Factor Specialist', 'NDT Level II Inspector']
  }
];

export const MOCK_INCIDENT_RECORDS: IncidentRecord[] = [
  {
    id: 'INC-2025-001',
    incidentCode: 'INC-2025-001',
    date: '2025-03-12',
    location: 'Heavy Workshop A',
    category: 'First Aid',
    classification: 'Unsafe Condition',
    injuryType: 'Cut/Laceration',
    experienceLevel: '1-3 Years',
    status: 'Closed',
    description: 'Minor index finger laceration while replacing abrasive grinding wheel on hand grinder.',
    actionPlan: 'Enforced cut-resistant Kevlar glove usage during wheel changes and installed grinding wheel safety guard.'
  },
  {
    id: 'INC-2025-002',
    incidentCode: 'INC-2025-002',
    date: '2025-05-24',
    location: 'Fabrication Yard B',
    category: 'Near Miss',
    classification: 'Unsafe Act',
    injuryType: 'None',
    experienceLevel: '< 1 Year',
    status: 'Closed',
    description: 'Rigger stepped under suspended 2-ton beam during crane positioning maneuver.',
    actionPlan: 'Issued verbal warning, re-trained rigger on Tag Line control and 3m suspension exclusion zone.'
  },
  {
    id: 'INC-2025-003',
    incidentCode: 'INC-2025-003',
    date: '2025-08-10',
    location: 'Field Operations Site',
    category: 'Property Damage',
    classification: 'Equipment Failure',
    injuryType: 'None',
    experienceLevel: '5+ Years',
    status: 'Closed',
    description: 'Hydraulic hose burst on Boom Lift during boom extension causing minor oil spill on gravel.',
    actionPlan: 'Deployed spill kit immediately, replaced hydraulic hose assembly and reviewed hose crimp intervals.'
  },
  {
    id: 'INC-2025-004',
    incidentCode: 'INC-2025-004',
    date: '2025-11-05',
    location: 'Depot Fleet Workshop',
    category: 'Medical Treatment',
    classification: 'Unsafe Act',
    injuryType: 'Contusion/Bruise',
    experienceLevel: '3-5 Years',
    status: 'Closed',
    description: 'Worker sustained foot contusion when heavy impact socket slipped off pneumatic wrench.',
    actionPlan: 'Upgraded to heavy-duty impact socket retention pins and mandated metatarsal safety boots.'
  },
  {
    id: 'INC-2024-012',
    incidentCode: 'INC-2024-012',
    date: '2024-10-18',
    location: 'Scheduled Waste Store',
    category: 'Near Miss',
    classification: 'Environmental Hazard',
    injuryType: 'None',
    experienceLevel: '1-3 Years',
    status: 'Closed',
    description: 'Chemical solvent drum cap loosened during forklift transport; liquid contained in secondary bund.',
    actionPlan: 'Inspected drum torque specs before transport and installed drum clamping harness on forklift tines.'
  },
  {
    id: 'INC-2024-008',
    incidentCode: 'INC-2024-008',
    date: '2024-06-14',
    location: 'Heavy Workshop A',
    category: 'Lost Time Injury (LTI)',
    classification: 'Unsafe Act',
    injuryType: 'Musculoskeletal Strain',
    experienceLevel: '< 1 Year',
    status: 'Closed',
    description: 'Junior mechanic strained lower back trying to manually lift 45kg hydraulic pump without assist.',
    actionPlan: 'Mandated 20kg manual lifting limit, installed overhead 1-ton jib crane for pump workstation.'
  }
];

export const MOCK_DEMERIT_LOGS: DemeritRecord[] = [
  { id: 'DEM-001', date: '2026-01-18', workerId: 'EE-1042', workerName: 'Ahmad Faiz Bin Rosli', department: 'Fabrication', violation: 'Failure to wear safety harness while working on 3m MEWP platform', demeritPoints: 10, actionTaken: 'Mandatory Safety Retraining & Official Warning' },
  { id: 'DEM-002', date: '2026-01-29', workerId: 'EE-1188', workerName: 'Chong Wei Lun', department: 'Heavy Workshop', violation: 'Bypassing grinding machine eye shield guard during operation', demeritPoints: 5, actionTaken: 'Written Warning & Supervisor Counseling' },
  { id: 'DEM-003', date: '2026-02-03', workerId: 'EE-0955', workerName: 'M. Arumugam', department: 'Logistics', violation: 'Operating forklift at 18km/h in pedestrian walkway zone', demeritPoints: 15, actionTaken: '1-Week Forklift Operation Suspension & Safety Refresher' },
  { id: 'DEM-004', date: '2026-02-12', workerId: 'EE-1204', workerName: 'Zulkifli Bin Ahmad', department: 'Painting Bay', violation: 'Smoking near scheduled waste chemical drum storage area', demeritPoints: 20, actionTaken: 'Final Written Notice & Demerit Score Logged in HR File' }
];

export const MOCK_DEMERIT_MATRIX: DemeritMatrix[] = [
  { id: '1', violationType: 'Failure to Wear Essential PPE (Helmet, Boots, Glasses)', severityLevel: 'Minor', pointsDeducted: 3, penaltyRemediation: 'Verbal Warning & On-the-spot PPE Correction' },
  { id: '2', violationType: 'Bypassing Machine Safety Guards or Emergency Stops', severityLevel: 'Moderate', pointsDeducted: 5, penaltyRemediation: 'Written Warning & 2-hour Safety Refresher' },
  { id: '3', violationType: 'Working at Height (>2m) Without Fall Harness Anchor', severityLevel: 'Severe', pointsDeducted: 10, penaltyRemediation: 'Official Warning Letter & Re-induction Course' },
  { id: '4', violationType: 'Reckless Machinery Operation / Speeding in Yard', severityLevel: 'Severe', pointsDeducted: 15, penaltyRemediation: '7-Day Equipment Operation Suspension' },
  { id: '5', violationType: 'Smoking / Hot Work Near Chemical or Flammable Store', severityLevel: 'Critical', pointsDeducted: 20, penaltyRemediation: 'Immediate Disciplinary Review & HR Demerit Record' }
];

export const MOCK_INSPECTION_RECORDS: InspectionRecord[] = [
  { id: 'INSP-2026-01', date: '2026-02-01', locationFacility: 'Heavy Workshop A & B', inspectorName: 'Ir. Ahmad Razali (SHO)', type: 'Workplace', totalChecked: 45, compliantCount: 43, complianceRate: '95.6%', status: 'Passed' },
  { id: 'INSP-2026-02', date: '2026-02-02', locationFacility: 'Fabrication Yard & Warehouse', inspectorName: 'Nurul Hidayah (First Aid Officer)', type: 'First Aid Box', totalChecked: 12, compliantCount: 12, complianceRate: '100.0%', status: 'Passed' },
  { id: 'INSP-2026-03', date: '2026-02-04', locationFacility: 'Entire Site & Vehicles', inspectorName: 'Tan Eng Kiat (Safety Committee)', type: 'Fire Extinguisher', totalChecked: 38, compliantCount: 37, complianceRate: '97.4%', status: 'Action Required' },
  { id: 'INSP-2026-04', date: '2026-01-15', locationFacility: 'Scheduled Waste Store & Chemical Depot', inspectorName: 'Ir. Ahmad Razali (SHO)', type: 'Workplace', totalChecked: 25, compliantCount: 25, complianceRate: '100.0%', status: 'Passed' }
];

export const MOCK_FIRST_AID_CERTS: FirstAidCert[] = [
  { id: 'FA-01', name: 'Nurul Hidayah Binti Ismail', department: 'HSE & Medical', expiryDate: '10/05/2027', certLink: 'https://drive.google.com/file/d/1atnIb570BsXBjZpVe48QjDMVYmtHesgZ/view?usp=drive_link' },
  { id: 'FA-02', name: 'Ahmad Faiz Bin Rosli', department: 'Fabrication', expiryDate: '14/08/2027', certLink: 'https://drive.google.com/file/d/1atnIb570BsXBjZpVe48QjDMVYmtHesgZ/view?usp=drive_link' },
  { id: 'FA-03', name: 'Kow Chee Meng', department: 'Heavy Workshop', expiryDate: '20/11/2026', certLink: 'https://drive.google.com/file/d/1atnIb570BsXBjZpVe48QjDMVYmtHesgZ/view?usp=drive_link' },
  { id: 'FA-04', name: 'M. Arumugam', department: 'Logistics & Depot', expiryDate: '18/02/2027', certLink: 'https://drive.google.com/file/d/1atnIb570BsXBjZpVe48QjDMVYmtHesgZ/view?usp=drive_link' },
  { id: 'FA-05', name: 'Siti Sarah Binti Osman', department: 'Administration', expiryDate: '10/01/2028', certLink: 'https://drive.google.com/file/d/1atnIb570BsXBjZpVe48QjDMVYmtHesgZ/view?usp=drive_link' }
];

export const MOCK_MINUTE_MEETINGS: MinuteMeeting[] = [
  { id: '1', title: '1st Minute Meeting', location: 'IJOK', date: '06/10/2023', documentUrl: '' },
  { id: '2', title: '2nd Minute Meeting', location: 'ONLINE', date: '26/01/2024', documentUrl: '' },
];
