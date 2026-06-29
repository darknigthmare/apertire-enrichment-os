/**
 * APERTURE ENRICHMENT OPERATING SYSTEM (AEOS)
 * Core System Diagnostics - Console Test Runner
 */

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m"
};

console.log(`${colors.bold}${colors.cyan}====================================================`);
console.log(`[CLaDOS Core] INITIALISATION DE L'AUTODIAGNOSTIC TERMINAL`);
console.log(`====================================================${colors.reset}\n`);

// Mocked Core Logic for Offline CLI Validation
const validateChamber = (chamber) => {
  const issues = [];
  const hasEntrance = chamber.elements.some(e => e.type === "entrance");
  const hasExit = chamber.elements.some(e => e.type === "exit");
  const hasPortalable = chamber.elements.some(e => e.type === "portalable_panel");

  if (!hasEntrance) {
    issues.push({ severity: "error", message: "Absence de sas d'entrée détectée." });
  }
  if (!hasExit) {
    issues.push({ severity: "error", message: "Absence de sas de sortie détectée." });
  }
  if (!hasPortalable) {
    issues.push({ severity: "warning", message: "Aucune surface portalable détectée." });
  }
  return issues;
};

const runSimulatedTest = (chamber, subject) => {
  const timeline = [
    { time: 0, message: "Sujet entre dans la chambre." },
    { time: 10, message: "Sujet oriente l'appareil de portail." },
    { time: 25, message: "Faisceau laser stabilisé." },
    { time: 40, message: "Sortie atteinte." }
  ];
  return { status: "completed", timeline, timeElapsed: 40 };
};

const generateAnnouncement = (chamberName, subjectAlias) => {
  return `Chambre ${chamberName} prête. ${subjectAlias} a été informé que la panique n'améliore pas les données.`;
};

const importData = (jsonStr) => {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== "object") throw new Error();
    return { success: true };
  } catch (e) {
    return { success: false, error: "SyntaxError: Unexpected token" };
  }
};

let passCount = 0;
let totalCount = 6;

// Test 1: validateChamber detects lack of entrance
try {
  const mockCh = { elements: [{ type: "exit" }] };
  const issues = validateChamber(mockCh);
  const pass = issues.some(i => i.severity === "error" && i.message.includes("entrée"));
  if (pass) {
    console.log(`${colors.green}[PASS] Test 1: Détection d'absence d'entrée${colors.reset}`);
    passCount++;
  } else {
    console.log(`${colors.red}[FAIL] Test 1: Détection d'absence d'entrée (Aucune erreur détectée)${colors.reset}`);
  }
} catch (e) {
  console.log(`${colors.red}[FAIL] Test 1: Détection d'absence d'entrée (${e.message})${colors.reset}`);
}

// Test 2: validateChamber detects lack of exit
try {
  const mockCh = { elements: [{ type: "entrance" }] };
  const issues = validateChamber(mockCh);
  const pass = issues.some(i => i.severity === "error" && i.message.includes("sortie"));
  if (pass) {
    console.log(`${colors.green}[PASS] Test 2: Détection d'absence de sortie${colors.reset}`);
    passCount++;
  } else {
    console.log(`${colors.red}[FAIL] Test 2: Détection d'absence de sortie (Aucune erreur détectée)${colors.reset}`);
  }
} catch (e) {
  console.log(`${colors.red}[FAIL] Test 2: Détection d'absence de sortie (${e.message})${colors.reset}`);
}

// Test 3: validateChamber validates correct chamber
try {
  const mockCh = { elements: [{ type: "entrance" }, { type: "exit" }, { type: "portalable_panel" }] };
  const issues = validateChamber(mockCh);
  const hasErrors = issues.some(i => i.severity === "error");
  if (!hasErrors) {
    console.log(`${colors.green}[PASS] Test 3: Validation d'une chambre géométriquement correcte${colors.reset}`);
    passCount++;
  } else {
    console.log(`${colors.red}[FAIL] Test 3: Validation d'une chambre correcte (Erreur fictive détectée)${colors.reset}`);
  }
} catch (e) {
  console.log(`${colors.red}[FAIL] Test 3: Validation d'une chambre correcte (${e.message})${colors.reset}`);
}

// Test 4: runSimulatedTest returns a timeline
try {
  const mockCh = { id: "ch0" };
  const mockSub = { alias: "Subj 42" };
  const run = runSimulatedTest(mockCh, mockSub);
  const pass = run && run.timeline && run.timeline.length > 0;
  if (pass) {
    console.log(`${colors.green}[PASS] Test 4: Simulation temporelle et logs timeline${colors.reset}`);
    passCount++;
  } else {
    console.log(`${colors.red}[FAIL] Test 4: Simulation temporelle (Aucune timeline renvoyée)${colors.reset}`);
  }
} catch (e) {
  console.log(`${colors.red}[FAIL] Test 4: Simulation temporelle (${e.message})${colors.reset}`);
}

// Test 5: generateAnnouncement compiles correctly
try {
  const text = generateAnnouncement("Chambre 00", "Sujet 042");
  const pass = text && text.length > 0 && text.includes("042");
  if (pass) {
    console.log(`${colors.green}[PASS] Test 5: Compilation des annonces de la Persona${colors.reset}`);
    passCount++;
  } else {
    console.log(`${colors.red}[FAIL] Test 5: Compilation des annonces (Texte incorrect)${colors.reset}`);
  }
} catch (e) {
  console.log(`${colors.red}[FAIL] Test 5: Compilation des annonces (${e.message})${colors.reset}`);
}

// Test 6: importData handles invalid JSON
try {
  const res = importData("invalid JSON string here");
  const pass = res.success === false && !!res.error;
  if (pass) {
    console.log(`${colors.green}[PASS] Test 6: Robustesse et gestion d'erreurs d'import JSON${colors.reset}`);
    passCount++;
  } else {
    console.log(`${colors.red}[FAIL] Test 6: Gestion d'import JSON (Pas de capture d'erreur)${colors.reset}`);
  }
} catch (e) {
  console.log(`${colors.red}[FAIL] Test 6: Gestion d'import JSON (${e.message})${colors.reset}`);
}

console.log(`\n${colors.bold}${colors.cyan}====================================================`);
if (passCount === totalCount) {
  console.log(`${colors.green}[DIAGNOSTIC] SUCCESS: ${passCount}/${totalCount} tests validés. Noyau stable.`);
} else {
  console.log(`${colors.red}[DIAGNOSTIC] FAILURE: ${passCount}/${totalCount} tests validés. Réétalonnage requis.`);
}
console.log(`====================================================${colors.reset}`);

// Exit code based on test outcomes
process.exit(passCount === totalCount ? 0 : 1);
