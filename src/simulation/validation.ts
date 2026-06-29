import type { Chamber, ValidationIssue } from "../types";

export const validateChamber = (chamber: Chamber): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const elements = chamber.elements || [];

  // 1. Entrance check
  const hasEntrance = elements.some((e) => e.type === "entrance");
  if (!hasEntrance) {
    issues.push({
      severity: "error",
      message: "Absence de sas d'entrée détectée. Les sujets ne peuvent pas entrer, ce qui économise l'air mais empêche toute récolte de données.",
    });
  }

  // 2. Exit check
  const hasExit = elements.some((e) => e.type === "exit");
  if (!hasExit) {
    issues.push({
      severity: "error",
      message: "Absence de sas de sortie détectée. Les sujets risquent de s'établir ici à long terme. La science exige une conclusion.",
    });
  }

  // 3. Portalable surface check
  const hasPortalable = elements.some((e) => e.type === "portalable_panel");
  if (!hasPortalable) {
    issues.push({
      severity: "warning",
      message: "Aucune surface portalable détectée. Cette chambre teste probablement la patience physique ou la force musculaire brute.",
    });
  }

  // 4. Linked triggers check (locks)
  const exitElement = elements.find((e) => e.type === "exit");
  if (exitElement && exitElement.linkedTo && exitElement.linkedTo.length > 0) {
    // Exit is locked, verify if the trigger source elements exist and are active
    const triggerSources = elements.filter(
      (e) => e.linkedTo && e.linkedTo.includes(exitElement.id)
    );
    if (triggerSources.length === 0) {
      issues.push({
        severity: "error",
        message: "Sas de sortie verrouillé, mais aucun bouton, récepteur ou déclencheur n'est connecté pour l'ouvrir. Sujet confiné à perpétuité.",
      });
    }
  }

  // 5. Buttons linked to something
  const buttons = elements.filter((e) => e.type === "button");
  buttons.forEach((btn) => {
    const isLinked = elements.some((e) => e.id === btn.id && e.linkedTo && e.linkedTo.length > 0);
    if (!isLinked) {
      issues.push({
        severity: "warning",
        elementId: btn.id,
        message: `Bouton [${btn.label || "Non-nommé"}] posé mais relié à aucun récepteur ni porte. Un excellent test d'espoir infondé.`,
      });
    }
  });

  // 6. Laser receivers without emitters
  const receivers = elements.filter((e) => e.type === "laser_receiver");
  const emitters = elements.filter((e) => e.type === "laser_emitter");
  if (receivers.length > 0 && emitters.length === 0) {
    issues.push({
      severity: "warning",
      message: "Récepteur laser installé mais aucun émetteur laser n'est présent. Le sujet passera beaucoup de temps à attendre la lumière.",
    });
  }

  // 7. Turrets and cover check
  const turrets = elements.filter((e) => e.type === "turret");
  const wallsAndCubes = elements.filter(
    (e) => e.type === "wall" || e.type === "cube" || e.type === "redirection_cube" || e.type === "companion_cube"
  );
  if (turrets.length >= 3 && wallsAndCubes.length === 0) {
    issues.push({
      severity: "warning",
      message: `Cette chambre contient ${turrets.length} tourelles sentinelles sans aucune couverture ou cube de protection. La science approuve, le comité d'éthique (si disponible) protesterait.`,
    });
  }

  // 8. Gel without compatibility
  const gelSources = elements.filter(
    (e) => e.type === "repulsion_gel_source" || e.type === "propulsion_gel_source" || e.type === "conversion_gel_source"
  );
  if (gelSources.length > 0 && !hasPortalable) {
    issues.push({
      severity: "warning",
      message: "Gel de conversion ou de propulsion présent sans panneau portalable. Attendez-vous à des trajectoires cinétiques chaotiques et salissantes.",
    });
  }

  // 9. Danger score assessment
  let dangerScore = 0;
  elements.forEach((e) => {
    if (e.type === "turret") dangerScore += 2;
    if (e.type === "goo") dangerScore += 3;
    if (e.type === "laser_emitter") dangerScore += 1;
    if (e.type === "incinerator") dangerScore += 4;
  });
  if (dangerScore > 8) {
    issues.push({
      severity: "warning",
      message: `Indice de létalité élevé détecté (${dangerScore} pts). Taux de remplacement des combinaisons à réajuster à la hausse.`,
    });
  }

  return issues;
};

// Estimators
export const estimateDifficulty = (chamber: Chamber): number => {
  const elements = chamber.elements || [];
  let score = 1;

  score += elements.filter((e) => e.type === "turret").length * 1.0;
  score += elements.filter((e) => e.type === "laser_emitter").length * 0.8;
  score += elements.filter((e) => e.type === "goo").length * 0.5;
  score += elements.filter((e) => e.type === "button").length * 0.5;
  score += elements.filter((e) => e.type === "portalable_panel").length * 0.2;
  score += elements.filter((e) => e.type === "faith_plate" || e.type === "excursion_funnel" || e.type === "hard_light_bridge").length * 1.2;

  // Bound from 1 to 10
  return Math.min(10, Math.max(1, Math.round(score)));
};

export const estimateHazard = (chamber: Chamber): number => {
  const elements = chamber.elements || [];
  let score = 0;

  elements.forEach((e) => {
    if (e.type === "goo") score += 2.5;
    if (e.type === "turret") score += 2.0;
    if (e.type === "incinerator") score += 3.5;
    if (e.type === "laser_emitter") score += 1.0;
    if (e.type === "damaged_panel") score += 0.5;
  });

  return Math.min(10, Math.max(0, Math.round(score)));
};

export const estimateSolvability = (chamber: Chamber): number => {
  const issues = validateChamber(chamber);
  const errors = issues.filter((i) => i.severity === "error").length;
  const warnings = issues.filter((i) => i.severity === "warning").length;

  if (errors > 0) return 0; // Unsolvable due to broken structural rules

  let base = 100;
  base -= warnings * 8;
  
  // Complexity penalty
  const complexity = chamber.elements?.length || 0;
  if (complexity > 20) {
    base -= (complexity - 20) * 1.5;
  }

  return Math.min(100, Math.max(10, Math.round(base)));
};
