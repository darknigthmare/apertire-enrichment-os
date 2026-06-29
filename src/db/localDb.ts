import type { Chamber, TestSubject, FacilitySystem, ArchiveDocument, PersonaSettings, TestRun, SystemLogEntry } from "../types";
import { seedChambers, seedSubjects, seedSystems, seedArchives, defaultSettings } from "../data/seedData";

const KEYS = {
  CHAMBERS: "aeos_chambers",
  SUBJECTS: "aeos_subjects",
  SYSTEMS: "aeos_systems",
  ARCHIVES: "aeos_archives",
  SETTINGS: "aeos_settings",
  RUNS: "aeos_runs",
  LOGS: "aeos_logs",
  INITIALIZED: "aeos_initialized",
};

export const initializeDb = (force = false) => {
  if (!localStorage.getItem(KEYS.INITIALIZED) || force) {
    localStorage.setItem(KEYS.CHAMBERS, JSON.stringify(seedChambers));
    localStorage.setItem(KEYS.SUBJECTS, JSON.stringify(seedSubjects));
    localStorage.setItem(KEYS.SYSTEMS, JSON.stringify(seedSystems));
    localStorage.setItem(KEYS.ARCHIVES, JSON.stringify(seedArchives));
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(defaultSettings));
    localStorage.setItem(KEYS.RUNS, JSON.stringify([]));
    
    // Set initial logs
    const initialLogs: SystemLogEntry[] = [
      {
        id: "l1",
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        systemId: "sys_reactor",
        action: "Startup",
        message: "Antimatter core ignition successful. Empathy module bypass detected.",
        type: "success",
      },
      {
        id: "l2",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        systemId: "sys_gel",
        action: "Calibrate",
        message: "Gel pump pressure spike in sector D. Viscosity dampening recommended.",
        type: "warning",
      },
      {
        id: "l3",
        timestamp: new Date().toISOString(),
        systemId: "sys_neurotoxin",
        action: "Security Check",
        message: "Lethal vent systems simulated and locked out. Safety overrides active.",
        type: "info",
      }
    ];
    localStorage.setItem(KEYS.LOGS, JSON.stringify(initialLogs));
    
    localStorage.setItem(KEYS.INITIALIZED, "true");
  }
};

// Generic storage accessors
const getStorageItem = <T>(key: string, defaultValue: T): T => {
  const item = localStorage.getItem(key);
  if (!item) return defaultValue;
  try {
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Failed to parse storage key: ${key}`, e);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

// API Methods
export const localDb = {
  // Reset
  reset: () => {
    initializeDb(true);
  },

  // Chambers
  getChambers: (): Chamber[] => getStorageItem(KEYS.CHAMBERS, []),
  saveChambers: (chambers: Chamber[]) => setStorageItem(KEYS.CHAMBERS, chambers),
  getChamber: (id: string): Chamber | undefined => {
    return localDb.getChambers().find((c) => c.id === id);
  },
  saveChamber: (chamber: Chamber) => {
    const chambers = localDb.getChambers();
    const idx = chambers.findIndex((c) => c.id === chamber.id);
    if (idx >= 0) {
      chambers[idx] = chamber;
    } else {
      chambers.push(chamber);
    }
    localDb.saveChambers(chambers);
  },
  deleteChamber: (id: string) => {
    const chambers = localDb.getChambers();
    localDb.saveChambers(chambers.filter((c) => c.id !== id));
  },

  // Subjects
  getSubjects: (): TestSubject[] => getStorageItem(KEYS.SUBJECTS, []),
  saveSubjects: (subjects: TestSubject[]) => setStorageItem(KEYS.SUBJECTS, subjects),
  getSubject: (id: string): TestSubject | undefined => {
    return localDb.getSubjects().find((s) => s.id === id);
  },
  saveSubject: (subject: TestSubject) => {
    const subjects = localDb.getSubjects();
    const idx = subjects.findIndex((s) => s.id === subject.id);
    if (idx >= 0) {
      subjects[idx] = subject;
    } else {
      subjects.push(subject);
    }
    localDb.saveSubjects(subjects);
  },

  // Systems
  getSystems: (): FacilitySystem[] => getStorageItem(KEYS.SYSTEMS, []),
  saveSystems: (systems: FacilitySystem[]) => setStorageItem(KEYS.SYSTEMS, systems),
  updateSystem: (system: Partial<FacilitySystem> & { id: string }) => {
    const systems = localDb.getSystems();
    const idx = systems.findIndex((s) => s.id === system.id);
    if (idx >= 0) {
      systems[idx] = { ...systems[idx], ...system } as FacilitySystem;
      localDb.saveSystems(systems);
    }
  },

  // Settings
  getSettings: (): PersonaSettings => getStorageItem(KEYS.SETTINGS, defaultSettings),
  saveSettings: (settings: PersonaSettings) => setStorageItem(KEYS.SETTINGS, settings),

  // Runs
  getRuns: (): TestRun[] => getStorageItem(KEYS.RUNS, []),
  saveRuns: (runs: TestRun[]) => setStorageItem(KEYS.RUNS, runs),
  addRun: (run: TestRun) => {
    const runs = localDb.getRuns();
    runs.unshift(run); // Keep latest at top
    localDb.saveRuns(runs);
  },

  // Archives
  getArchives: (): ArchiveDocument[] => getStorageItem(KEYS.ARCHIVES, []),
  saveArchives: (archives: ArchiveDocument[]) => setStorageItem(KEYS.ARCHIVES, archives),

  // Logs
  getLogs: (): SystemLogEntry[] => getStorageItem(KEYS.LOGS, []),
  addLog: (systemId: string, action: string, message: string, type: SystemLogEntry["type"] = "info") => {
    const logs = localDb.getLogs();
    const newLog: SystemLogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      systemId,
      action,
      message,
      type,
    };
    logs.unshift(newLog);
    // Cap at 200 logs
    if (logs.length > 200) logs.pop();
    setStorageItem(KEYS.LOGS, logs);
  },

  // Export / Import JSON
  exportData: (): string => {
    const data = {
      chambers: localDb.getChambers(),
      subjects: localDb.getSubjects(),
      systems: localDb.getSystems(),
      archives: localDb.getArchives(),
      settings: localDb.getSettings(),
      runs: localDb.getRuns(),
      logs: localDb.getLogs(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData: (jsonStr: string): { success: boolean; error?: string } => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data || typeof data !== "object") {
        return { success: false, error: "Invalid JSON format" };
      }
      
      // Basic checks for expected tables
      if (data.chambers && Array.isArray(data.chambers)) {
        localDb.saveChambers(data.chambers);
      }
      if (data.subjects && Array.isArray(data.subjects)) {
        localDb.saveSubjects(data.subjects);
      }
      if (data.systems && Array.isArray(data.systems)) {
        localDb.saveSystems(data.systems);
      }
      if (data.archives && Array.isArray(data.archives)) {
        localDb.saveArchives(data.archives);
      }
      if (data.settings && typeof data.settings === "object") {
        localDb.saveSettings(data.settings);
      }
      if (data.runs && Array.isArray(data.runs)) {
        localDb.saveRuns(data.runs);
      }
      if (data.logs && Array.isArray(data.logs)) {
        setStorageItem(KEYS.LOGS, data.logs);
      }
      
      localStorage.setItem(KEYS.INITIALIZED, "true");
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to parse file" };
    }
  }
};
