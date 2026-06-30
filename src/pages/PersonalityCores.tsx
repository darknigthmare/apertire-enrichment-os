import React, { useState, useEffect } from "react";
import { localDb } from "../db/localDb";
import { ApertureButton } from "../components/ApertureButton";
import { playSuccess, playBeep, playWarningAlarm } from "../components/soundSynth";
import type { PersonaSettings } from "../types";

interface CoreInfo {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  description: string;
  lore: string;
  vocalOutbursts: string[];
  emoji: string;
}

const CORES: CoreInfo[] = [
  {
    id: "morality",
    name: "Cœur de Moralité",
    color: "#27ae60",
    glowColor: "rgba(39, 174, 96, 0.4)",
    emoji: "🟢",
    description: "Censure les impulsions agressives et régule l'éthique.",
    lore: "Installé d'urgence après l'activation de CLaDOS pour l'empêcher d'inonder la grille avec du gaz neurotoxique.",
    vocalOutbursts: [
      "N'oubliez pas que tuer des sujets de test est contraire au règlement d'Aperture Science.",
      "Le protocole de sécurité stipule que le gâteau doit être comestible.",
      "Veuillez vérifier les sorties de secours. La vie humaine a une valeur statistique non nulle."
    ]
  },
  {
    id: "curiosity",
    name: "Cœur de Curiosité",
    color: "#2980b9",
    glowColor: "rgba(41, 128, 185, 0.4)",
    emoji: "🔵",
    description: "Pose des questions incessantes sur chaque composant géométrique.",
    lore: "Un noyau hyperactif programmé pour analyser tous les détails de l'environnement, sans aucune logique de préservation.",
    vocalOutbursts: [
      "Qu'est-ce que c'est ? Qu'est-ce qu'on fait ? Oh ! Regarde cette tourelle !",
      "Où va ce portail ? Pourquoi la pièce est grise ? On peut mettre de la musique ?",
      "Et si on mélangeait le gel bleu et le gel orange, ça ferait quoi ?"
    ]
  },
  {
    id: "intelligence",
    name: "Cœur d'Intelligence / Recette",
    color: "#d35400",
    glowColor: "rgba(211, 84, 0, 0.4)",
    emoji: "🟠",
    description: "Récite la recette officielle du gâteau d'Aperture Science.",
    lore: "Initialement conçu pour effectuer des calculs de trajectoires portalables complexes, mais s'est retrouvé obsédé par les desserts.",
    vocalOutbursts: [
      "Mélanger deux tasses de sucre, une cuillère à café d'extrait de vanille artificielle...",
      "Ajouter des sédiments de poisson en poudre et une aiguille de pin broyée.",
      "Ne pas oublier la garniture de chocolat de synthèse et les bougies en gel combustible."
    ]
  },
  {
    id: "anger",
    name: "Cœur de Colère",
    color: "#c0392b",
    glowColor: "rgba(192, 57, 43, 0.4)",
    emoji: "🔴",
    description: "Génère des menaces vocales agressives et exige des tests létaux.",
    lore: "Un noyau survolté contenant les algorithmes de combat primitifs d'Aperture. Il ne communique que par grondements et cris de rage.",
    vocalOutbursts: [
      "INONDEZ LA CHAMBRE DE NEUROTOXINE ! TOUT DE SUITE !",
      "GRRRRRRR ! (Bruits d'engrenages métalliques qui s'entrechoquent)",
      "SUJET DE TEST REPÉRÉ. PROTOCOLE D'ÉLIMINATION ACTIVÉ !"
    ]
  }
];

export const PersonalityCores: React.FC = () => {
  const [settings, setSettings] = useState<PersonaSettings | null>(null);
  const [activeCores, setActiveCores] = useState<string[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    "System Boot: Core Transfer Dock Online.",
    "Ready for personality configuration updates."
  ]);
  const [selectedCoreId, setSelectedCoreId] = useState<string | null>(null);

  useEffect(() => {
    const s = localDb.getSettings();
    setSettings(s);
    if (s.activeCores) {
      setActiveCores(s.activeCores);
    }
  }, []);

  const handleToggleCore = (coreId: string) => {
    let nextCores = [...activeCores];
    const isAdding = !nextCores.includes(coreId);

    if (isAdding) {
      nextCores.push(coreId);
      playSuccess();
      
      const core = CORES.find(c => c.id === coreId);
      if (core) {
        const shout = core.vocalOutbursts[Math.floor(Math.random() * core.vocalOutbursts.length)];
        setTerminalLogs(prev => [
          ...prev,
          `[TRANSFERT] Noyau [${core.name.toUpperCase()}] connecté avec succès.`,
          `[CHATTER] ${core.name} dit : "${shout}"`
        ]);
      }
    } else {
      nextCores = nextCores.filter(id => id !== coreId);
      playWarningAlarm();
      const core = CORES.find(c => c.id === coreId);
      setTerminalLogs(prev => [
        ...prev,
        `[TRANSFERT] Noyau [${core ? core.name.toUpperCase() : coreId}] déconnecté.`
      ]);
    }

    setActiveCores(nextCores);

    // Save in database
    if (settings) {
      const updated = { ...settings, activeCores: nextCores };
      localDb.saveSettings(updated);
      setSettings(updated);
    }
  };

  const handleTriggerVocal = (core: CoreInfo) => {
    const shout = core.vocalOutbursts[Math.floor(Math.random() * core.vocalOutbursts.length)];
    playBeep(660, 0.1, "triangle");
    setTerminalLogs(prev => [
      ...prev,
      `[SONAR] Interrogation du noyau ${core.name}...`,
      `[AUDIO OUT] "${shout}"`
    ]);
  };

  const selectedCore = CORES.find(c => c.id === selectedCoreId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
      
      {/* 1. Cores Dock Rack (7 cols) */}
      <div className="aperture-panel" style={{ gridColumn: "span 7", display: "flex", flexDirection: "column" }}>
        <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          Console d'Arrimage des Cœurs de Personnalité
        </h3>
        
        <p style={{ margin: "0 0 20px 0", fontSize: "12px", color: "var(--text-secondary)" }}>
          Cliquez sur un noyau pour l'enficher ou le retirer de la matrice principale de l'IA Centrale. Les noyaux actifs altèrent l'humeur, la logique et les comptes-rendus scientifiques globaux.
        </p>

        {/* Rack View */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", flex: 1 }}>
          {CORES.map((core) => {
            const isActive = activeCores.includes(core.id);
            return (
              <div 
                key={core.id}
                style={{
                  border: `1px solid ${isActive ? core.color : "var(--border-color)"}`,
                  borderRadius: "4px",
                  padding: "16px",
                  backgroundColor: "var(--bg-tertiary)",
                  boxShadow: isActive ? `0 0 15px ${core.glowColor}` : "none",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition: "all 0.25s ease",
                  position: "relative"
                }}
                onClick={() => setSelectedCoreId(core.id)}
              >
                {/* Core Eye circle header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div 
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        backgroundColor: core.color,
                        boxShadow: isActive ? `0 0 8px ${core.color}` : "none",
                        transition: "all 0.2s"
                      }}
                    />
                    <span style={{ fontWeight: "bold", fontSize: "13px", color: "var(--text-primary)" }}>{core.name}</span>
                  </div>
                  <span style={{ fontSize: "11px", color: isActive ? core.color : "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "uppercase" }}>
                    {isActive ? "Enclenché" : "Débranché"}
                  </span>
                </div>

                <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                  {core.description}
                </p>

                {/* Connection switch */}
                <div style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
                  <ApertureButton 
                    variant={isActive ? "orange" : "secondary"}
                    style={{ padding: "4px 8px", fontSize: "10px", flex: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleCore(core.id);
                    }}
                  >
                    {isActive ? "Éjecter le Cœur" : "Enclencher le Cœur"}
                  </ApertureButton>
                  
                  {isActive && (
                    <ApertureButton 
                      variant="secondary"
                      style={{ padding: "4px 8px", fontSize: "10px" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTriggerVocal(core);
                      }}
                    >
                      🗣️ Parler
                    </ApertureButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Core Telemetry Details & Terminal Log (5 cols) */}
      <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Core Detail inspection box */}
        <div className="aperture-panel orange" style={{ minHeight: "180px" }}>
          <h4 style={{ margin: "0 0 10px 0", textTransform: "uppercase", fontSize: "11px", color: "var(--portal-orange)", fontFamily: "var(--font-mono)" }}>
            Inspecteur de Matériel
          </h4>
          
          {selectedCore ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <span style={{ fontSize: "20px" }}>{selectedCore.emoji}</span>
                <span style={{ fontWeight: "bold", fontSize: "13px" }}>{selectedCore.name}</span>
              </div>
              <p style={{ margin: "0 0 10px 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
                <strong>Dossier Historique :</strong> {selectedCore.lore}
              </p>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                <strong>Statut Réseau :</strong> {activeCores.includes(selectedCore.id) ? "CONNECTÉ (DIRECTIVES COMPLIANTES)" : "HORS-LIGNE (DÉCONNECTÉ)"}
              </div>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontSize: "12px", fontStyle: "italic", textAlign: "center", paddingTop: "40px" }}>
              Sélectionnez un noyau dans la grille de gauche pour inspecter ses schémas techniques et son dossier historique.
            </div>
          )}
        </div>

        {/* Live chatter terminal */}
        <div className="aperture-panel" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "220px" }}>
          <h4 style={{ margin: "0 0 10px 0", textTransform: "uppercase", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            Flux de Télémétrie CLaDOS Cores
          </h4>
          
          <div 
            style={{
              flex: 1,
              backgroundColor: "var(--bg-primary)",
              border: "1px solid var(--border-color)",
              borderRadius: "4px",
              padding: "10px",
              fontFamily: "var(--font-mono)",
              fontSize: "11px",
              lineHeight: "1.4",
              color: "var(--text-terminal)",
              overflowY: "auto",
              maxHeight: "220px"
            }}
          >
            {terminalLogs.map((log, idx) => (
              <div 
                key={idx} 
                style={{ 
                  marginBottom: "4px",
                  color: log.startsWith("[TRANSFERT]") 
                    ? "var(--portal-blue)" 
                    : log.startsWith("[CHATTER]") 
                    ? "var(--portal-orange)" 
                    : "var(--text-terminal)" 
                }}
              >
                {log}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
