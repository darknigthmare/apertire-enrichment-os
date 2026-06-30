export type ChamberStyle =
  | "clinical"
  | "reconstructed"
  | "decayed"
  | "rebuilding"
  | "old_aperture"
  | "chaotic_core"
  | "cooperative";

export type ChamberStatus =
  | "draft"
  | "calibrated"
  | "queued"
  | "active"
  | "completed"
  | "failed"
  | "locked"
  | "condemned";

export type ElementType =
  | "floor"
  | "wall"
  | "portalable_panel"
  | "non_portalable_panel"
  | "glass"
  | "goo"
  | "emancipation_grill"
  | "entrance"
  | "exit"
  | "button"
  | "cube"
  | "companion_cube"
  | "cube_dropper"
  | "turret"
  | "camera"
  | "laser_emitter"
  | "laser_receiver"
  | "redirection_cube"
  | "faith_plate"
  | "hard_light_bridge"
  | "excursion_funnel"
  | "funnel_reversal_button"
  | "repulsion_gel_source"
  | "propulsion_gel_source"
  | "conversion_gel_source"
  | "cleanser"
  | "moving_panel"
  | "observation_window"
  | "incinerator"
  | "elevator"
  | "signage"
  | "monitor"
  | "damaged_panel"
  | "vegetation"
  | "old_aperture_pipe";

export interface ChamberElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  rotation: number; // 0, 90, 180, 270
  active: boolean;
  linkedTo?: string[]; // IDs of other elements
  triggerCondition?: "on_press" | "on_release" | "laser_hit" | "laser_miss" | "immediate";
  hazardLevel?: number;
  label?: string;
  notes?: string;
  styleVariant?: string;
}

export interface Chamber {
  id: string;
  number: string;
  name: string;
  style: ChamberStyle;
  width: number;
  height: number;
  difficulty: number; // 1 to 10
  hazardLevel: number; // 1 to 10
  status: ChamberStatus;
  elements: ChamberElement[];
  objectives: string[];
  successConditions: string[];
  failureConditions: string[];
  notes: string;
  solvability?: number; // 0 to 100
  estimatedTime?: number; // in seconds
  estimatedPortals?: number;
  estimatedSteps?: number;
}

export interface TestProtocol {
  id: string;
  chamberId: string;
  objective: string;
  subjectType: "human" | "android" | "unknown" | "cooperative_pair";
  allowedEquipment: ("portal_device" | "dual_portal" | "none" | "cubes_only" | "gel_interaction" | "laser_interaction")[];
  successConditions: ("reach_exit" | "activate_receiver" | "place_cube_on_button" | "redirect_laser" | "avoid_turrets" | "use_funnel" | "use_gel" | "minimum_portals" | "maximum_time")[];
  failureConditions: ("subject_lost" | "cube_destroyed" | "turret_line_of_sight" | "laser_contact" | "goo_contact" | "chamber_timeout" | "protocol_violation")[];
  tone: "neutral" | "encouraging" | "passive_aggressive" | "ominous" | "old_aperture" | "cooperative_mockery" | "malfunctioning_core";
}

export interface TestSubject {
  id: string;
  type: "human" | "android" | "unknown";
  alias: string;
  status: "stasis" | "ready" | "testing" | "unavailable" | "released" | "unknown";
  compliance: number; // 0-100
  tenacity: number; // 0-100
  portalAptitude: number; // 0-100
  cubeAttachment: number; // 0-100
  fearResponse: number; // 0-100
  colorLabel?: "Blue" | "Orange" | "Gray" | "Custom"; // for androids
  teamworkIndex?: number; // for androids
  reassemblyCount?: number; // for androids
  gestureFrequency?: number; // for androids
  trustInstability?: number; // for androids
  portalSyncScore?: number; // for androids
  notes: string;
  lastChamber?: string;
  survivalProbability: number; // 0-100
}

export interface TestRunEvent {
  time: number; // seconds from start
  type: "info" | "action" | "hazard" | "announcement" | "success" | "failure";
  message: string;
  scienceYield: number;
}

export interface TestRun {
  id: string;
  chamberId: string;
  subjectId: string;
  protocolId: string;
  status:
    | "completed"
    | "failed"
    | "abandoned"
    | "subject_confused"
    | "cube_dependency"
    | "turret_incident"
    | "portal_efficiency_high"
    | "unsolvable"
    | "recalibration_required"
    | "anomalous_success";
  timeline: TestRunEvent[];
  scienceYieldTotal: number;
  timeElapsed: number;
  portalsUsed: number;
  aiCommentary: string;
  date: string;
}

export interface FacilitySystem {
  id: string;
  name: string;
  status: "nominal" | "warning" | "critical" | "offline";
  integrity: number; // 0-100
  powerDraw: number; // MW
  lastMaintenance: string;
  warningLevel: "none" | "low" | "medium" | "high";
  description: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  mood: string;
  category: string;
  timestamp: string;
}

export interface ArchiveDocument {
  id: string;
  title: string;
  date: string;
  era: "old_aperture" | "modern_aperture" | "reconstruction" | "core_transfer" | "cooperative";
  classification: string;
  content: string;
  relatedChamber?: string;
  relatedSystem?: string;
}

export interface PersonaSettings {
  name: string;
  sarcasmLevel: number; // 0-100
  empathyModule: "disabled" | "unstable" | "simulated" | "corrupted" | "suspiciously_functional";
  corporateDensity: number; // 0-100
  testObsession: number; // 0-100
  voiceStyle: "clinical" | "passive-aggressive" | "old-aperture" | "cooperative" | "malfunctioning" | "calm-threatening";
  language: "fr" | "en" | "bi";
  safetyMode: "strict" | "relaxed";
  bootSequenceEnabled: boolean;
  scanlineEnabled: boolean;
  soundEnabled: boolean;
  activeCores?: string[];
}

export interface ValidationIssue {
  severity: "error" | "warning";
  elementId?: string;
  message: string;
}

export interface SystemLogEntry {
  id: string;
  timestamp: string;
  systemId: string;
  action: string;
  message: string;
  type: "info" | "warning" | "success" | "critical";
}
