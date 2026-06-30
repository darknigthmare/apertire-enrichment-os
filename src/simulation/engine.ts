import type { Chamber, TestSubject, TestProtocol, TestRun, TestRunEvent } from "../types";
import { validateChamber, estimateSolvability, estimateHazard, estimateDifficulty } from "./validation";
import { localDb } from "../db/localDb";

// Seeded LCG random generator for repeatable runs
const createRandom = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h << 5) - h + seed.charCodeAt(i);
    h |= 0;
  }
  return () => {
    h = Math.sin(h++) * 10000;
    return h - Math.floor(h);
  };
};

export const runSimulatedTest = (
  chamber: Chamber,
  subject: TestSubject,
  protocol: TestProtocol,
  seed: string = Math.random().toString(36).substring(7)
): TestRun => {
  const rand = createRandom(seed);
  
  // 1. Diagnostics & Validation Checks
  const issues = validateChamber(chamber);
  const errors = issues.filter((i) => i.severity === "error");
  const solvability = estimateSolvability(chamber);
  const hazard = estimateHazard(chamber);
  const difficulty = estimateDifficulty(chamber);
  
  const timeline: TestRunEvent[] = [];
  let scienceYieldTotal = 0;
  let timeElapsed = 0;
  let portalsUsed = 0;

  // Add initial event
  timeline.push({
    time: 0,
    type: "announcement",
    message: `[CLaDOS Core] Début du protocole de test ${protocol.id.toUpperCase()}. Sujet : ${subject.alias}.`,
    scienceYield: 0,
  });

  // Check if structurally unsolvable
  if (errors.length > 0) {
    timeline.push({
      time: 2,
      type: "failure",
      message: `[Système] Anomalie critique : La géométrie de la chambre contient des erreurs fondamentales (${errors[0].message}). Le sujet refuse de tenter le saut de foi.`,
      scienceYield: 5,
    });
    
    return {
      id: `run_${Math.random().toString(36).substring(7)}`,
      chamberId: chamber.id,
      subjectId: subject.id,
      protocolId: protocol.id,
      status: "unsolvable",
      timeline,
      scienceYieldTotal: 5,
      timeElapsed: 2,
      portalsUsed: 0,
      aiCommentary: "Cette chambre est une insulte à l'architecture expérimentale. Même avec la meilleure volonté, un sujet ne peut pas résoudre l'impossible.",
      date: new Date().toISOString(),
    };
  }

  // 2. Timeline Step-by-Step Simulation
  timeElapsed += 5;
  timeline.push({
    time: timeElapsed,
    type: "info",
    message: `Le sas d'entrée s'ouvre. ${subject.alias} entre dans la zone expérimentale. Scan biologique effectué.`,
    scienceYield: 10,
  });
  scienceYieldTotal += 10;

  // Empathy and compliance telemetry log
  timeline.push({
    time: timeElapsed + 3,
    type: "info",
    message: `Télémétrie du sujet : Rythme cardiaque à ${70 + Math.round(subject.fearResponse * 0.8)} bpm. Compliance : ${subject.compliance}%. Taux d'angoisse : stable.`,
    scienceYield: 5,
  });
  scienceYieldTotal += 5;

  const elements = chamber.elements || [];
  
  // Simulation interactions
  const hasPortals = protocol.allowedEquipment.includes("portal_device") || protocol.allowedEquipment.includes("dual_portal");
  const hasTurrets = elements.some((e) => e.type === "turret");
  const hasGels = elements.some((e) => e.type === "repulsion_gel_source" || e.type === "propulsion_gel_source");
  const hasLasers = elements.some((e) => e.type === "laser_emitter");
  const hasButtons = elements.some((e) => e.type === "button");

  // Step A: Portal gun calibration
  if (hasPortals) {
    timeElapsed += 15 + Math.round(rand() * 10);
    portalsUsed += 2;
    timeline.push({
      time: timeElapsed,
      type: "action",
      message: `${subject.alias} équipe le dispositif de portail et tire sur un panneau en béton blanc. Premier portail stabilisé.`,
      scienceYield: 20,
    });
    scienceYieldTotal += 20;
  }

  // Step B: Hazard / Turret / Gel navigation
  if (hasTurrets) {
    timeElapsed += 20 + Math.round(rand() * 15);
    const hitProbability = (hazard * 10 - subject.tenacity * 0.4) / 100;
    if (rand() < hitProbability && rand() > subject.compliance * 0.005) {
      timeline.push({
        time: timeElapsed,
        type: "hazard",
        message: `[Danger] Alerte de trajectoire balistique. Tourelle Sentry verrouillée sur le sujet. Tirs de sommation enregistrés.`,
        scienceYield: 15,
      });
      scienceYieldTotal += 15;
    } else {
      timeline.push({
        time: timeElapsed,
        type: "info",
        message: `${subject.alias} contourne le cône de vision des tourelles sentinelles en utilisant la géométrie de la chambre.`,
        scienceYield: 25,
      });
      scienceYieldTotal += 25;
    }
  }

  if (hasGels) {
    timeElapsed += 18 + Math.round(rand() * 12);
    timeline.push({
      time: timeElapsed,
      type: "action",
      message: `${subject.alias} applique du gel expérimental sur une surface. Les coefficients d'accélération et de rebond augmentent de 300%.`,
      scienceYield: 30,
    });
    scienceYieldTotal += 30;
  }

  if (hasLasers) {
    timeElapsed += 25 + Math.round(rand() * 10);
    portalsUsed += 2;
    timeline.push({
      time: timeElapsed,
      type: "action",
      message: `Redirection de faisceau laser amorcée. Le récepteur thermique s'active. Circuit de porte A-01 alimenté.`,
      scienceYield: 25,
    });
    scienceYieldTotal += 25;
  }

  if (hasButtons) {
    timeElapsed += 12 + Math.round(rand() * 8);
    timeline.push({
      time: timeElapsed,
      type: "action",
      message: `Placement d'un cube de stockage lesté sur le réceptacle au sol. Signal de déverrouillage de la sortie transmis.`,
      scienceYield: 15,
    });
    scienceYieldTotal += 15;
  }

  // 3. Final calculations for Success vs Failure
  let successChance = solvability; // Starts at chamber solvability (max 100)
  
  // Compliance and Tenacity modify success
  successChance += (subject.compliance - 50) * 0.2;
  successChance += (subject.tenacity - 50) * 0.3;
  successChance += (subject.portalAptitude - 50) * 0.4;
  
  // Hazards decrease success
  successChance -= hazard * 3;
  
  // Difficulty penalizes
  successChance -= difficulty * 2;

  // Cooperative modifiers
  if (chamber.style === "cooperative") {
    if (subject.type === "android") {
      successChance += 15; // Androids excel in co-op
    } else {
      successChance -= 20; // Humans fail co-op trust
    }
  }

  // Clamp success probability between 5% and 98%
  successChance = Math.min(98, Math.max(5, successChance));
  
  const roll = rand() * 100;
  const isSuccess = roll < successChance;

  let finalStatus: TestRun["status"] = "completed";
  
  timeElapsed += 10 + Math.round(rand() * 15);

  if (isSuccess) {
    timeline.push({
      time: timeElapsed,
      type: "success",
      message: `[Système] Sortie atteinte. Decontamination et émancipation des équipements en cours. Éjection du sujet vers l'ascenseur.`,
      scienceYield: 50,
    });
    scienceYieldTotal += 50;
    
    if (portalsUsed > 8) {
      finalStatus = "portal_efficiency_high";
    } else if (subject.cubeAttachment > 90 && hasButtons) {
      finalStatus = "cube_dependency";
    } else {
      finalStatus = "completed";
    }
  } else {
    // Determine specific failure modes
    const failMode = rand();
    if (hasTurrets && failMode < 0.3) {
      finalStatus = "turret_incident";
      timeline.push({
        time: timeElapsed,
        type: "failure",
        message: `[Échec] Incapable d'éviter les tirs sentinelles. Télémétrie médicale du sujet interrompue. Simulation de re-stase activée.`,
        scienceYield: 0,
      });
    } else if (hazard > 5 && failMode < 0.6) {
      finalStatus = "failed";
      timeline.push({
        time: timeElapsed,
        type: "failure",
        message: `[Échec] Chute du sujet dans le bassin de déchet acide ou contact direct avec le laser. Fin du protocole de test.`,
        scienceYield: 0,
      });
    } else if (subject.compliance < 30) {
      finalStatus = "abandoned";
      timeline.push({
        time: timeElapsed,
        type: "failure",
        message: `[Échec] Le sujet refuse d'avancer et s'assoit dans un coin en protestant. Inutilité totale des données comportementales.`,
        scienceYield: -10,
      });
      scienceYieldTotal -= 10;
    } else {
      finalStatus = "subject_confused";
      timeline.push({
        time: timeElapsed,
        type: "failure",
        message: `[Échec] Confusion cognitive sévère du sujet face au puzzle spatial. Recalibrage de la chambre nécessaire.`,
        scienceYield: 5,
      });
      scienceYieldTotal += 5;
    }
  }

  // Generate sarcastic AI commentary
  const aiCommentary = generateAIComment(finalStatus, subject, protocol, chamber, rand);

  return {
    id: `run_${Math.random().toString(36).substring(7)}`,
    chamberId: chamber.id,
    subjectId: subject.id,
    protocolId: protocol.id,
    status: finalStatus,
    timeline,
    scienceYieldTotal: Math.max(0, scienceYieldTotal),
    timeElapsed,
    portalsUsed,
    aiCommentary,
    date: new Date().toISOString(),
  };
};

const generateAIComment = (
  status: TestRun["status"],
  _subject: TestSubject,
  _protocol: TestProtocol,
  _chamber: Chamber,
  rand: () => number
): string => {
  const settings = localDb.getSettings();
  const cores = settings?.activeCores || [];

  if (cores.includes("anger")) {
    const angerQuotes = [
      "INONDEZ LA CHAMBRE DE GAZ MORTEL ! TOUS CES COBAYES SONT INUTILES ! GRRRRR !",
      "DÉTRUIRE ! VAPORISER LE SUJET ! PLUS DE LASERS ! PLUS DE RISQUES !"
    ];
    return angerQuotes[Math.floor(rand() * angerQuotes.length)];
  }

  if (cores.includes("curiosity")) {
    const curiosityQuotes = [
      "Pourquoi le sujet court-il ? Où va ce portail ? Qu'est-ce que ça fait s'il tombe dans l'acide ? Hein ?",
      "Regarde le cube ! Pourquoi est-il carré ? Et si on peignait toute la chambre en bleu ? Pourquoi ?"
    ];
    return curiosityQuotes[Math.floor(rand() * curiosityQuotes.length)];
  }

  if (cores.includes("intelligence")) {
    const recipeQuotes = [
      "Excellent test. N'oubliez pas d'incorporer 3 cuillères à soupe de résine de poisson en poudre et un œuf pour le gâteau.",
      "La science progresse. Pour fêter ça, préparez une garniture de chocolat et de rhubarbe de synthèse."
    ];
    return recipeQuotes[Math.floor(rand() * recipeQuotes.length)];
  }

  if (cores.includes("morality")) {
    return "[CENSURE D'ÉTHIQUE - NIVEAU DE MORALITÉ NOMINAL] Le sujet a résolu le test en toute sécurité conformément au protocole de bienveillance d'Aperture Science.";
  }

  // Base templates based on status
  if (status === "completed" || status === "portal_efficiency_high") {
    const templates = [
      `Félicitations. Le sujet a traversé la chambre en un temps statistiquement convenable. Les portails ont fonctionné sans déchirer la réalité.`,
      `Le sujet a résolu le puzzle. C'est presque décevant. J'avais préparé une note de condoléances très poétique.`,
      `Chambre résolue. La science progresse. Le sujet aussi, mais d'une manière moins élégante que prévu.`,
      `Les résultats sont dans la moyenne acceptable. Le sujet a fait preuve d'une agilité intellectuelle surprenante pour un être composé à 70% d'eau.`,
    ];
    return templates[Math.floor(rand() * templates.length)];
  }

  if (status === "cube_dependency") {
    return `Le sujet a réussi, mais a passé 4 minutes à caresser le cube de stockage avant de le poser sur le bouton. Ce comportement irrationnel sera corrigé lors de la prochaine calibration.`;
  }

  if (status === "turret_incident") {
    return `Le sujet a tenté d'expliquer le concept de pacifisme aux tourelles sentinelles. Les tourelles ont répondu avec leur enthousiasme balistique habituel. Données cliniques enregistrées.`;
  }

  if (status === "subject_confused") {
    return `Le sujet a passé 45 minutes à regarder le plafond en essayant de comprendre le concept de gravité relative. Je crains que son aptitude spatiale ne soit pas supérieure à celle d'un géranium.`;
  }

  if (status === "abandoned") {
    return `Le sujet a choisi d'abandonner. C'est statistiquement regrettable pour le calendrier, mais opérationnellement utile pour tester le système d'aspiration des déchets.`;
  }

  if (status === "unsolvable") {
    return `La chambre est géométriquement brisée. Aucun sujet, humain ou machine, ne peut surmonter des lois de la physique mal programmées. Veuillez réparer la grille d'édition.`;
  }

  // Fallback default sarcastic comment
  return `Test terminé. Statut : ${status}. Données archivées. La direction rappelle que pleurer dans les sas de décompression perturbe les capteurs de pression.`;
};

export const generateAIAnnouncement = (
  templates: { content: string; variables: string[] }[],
  variables: Record<string, string>,
  _mood: string
): string => {
  if (templates.length === 0) return "Enrichment Center online.";
  
  // Pick template
  const idx = Math.floor(Math.random() * templates.length);
  let text = templates[idx].content;

  // Replace variables
  Object.keys(variables).forEach((key) => {
    text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), variables[key]);
  });

  return text;
};
