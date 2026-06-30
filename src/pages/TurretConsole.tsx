import React, { useState } from "react";
import { ApertureButton } from "../components/ApertureButton";
import { playSuccess, playBeep, playWarningAlarm } from "../components/soundSynth";
import { localDb } from "../db/localDb";

interface TurretInfo {
  id: string;
  code: string;
  status: "sleeping" | "searching" | "target_locked" | "disassembled";
  ammo: number; // 0-100
  accuracy: number; // 0-100
  chamber: string;
  logs: string[];
}

const INITIAL_TURRETS: TurretInfo[] = [
  {
    id: "turret_01",
    code: "SENTRY-4809",
    status: "sleeping",
    ammo: 95,
    accuracy: 98,
    chamber: "07",
    logs: ["Status: Sleeping", "Directives: Active"]
  },
  {
    id: "turret_02",
    code: "SENTRY-9901",
    status: "searching",
    ammo: 65,
    accuracy: 85,
    chamber: "07",
    logs: ["Target lost", "Scanning coordinates x:4 y:2"]
  },
  {
    id: "turret_03",
    code: "SENTRY-0432",
    status: "target_locked",
    ammo: 40,
    accuracy: 99,
    chamber: "14",
    logs: ["Target acquired", "Engaging fire vectors"]
  },
  {
    id: "turret_04",
    code: "SENTRY-8811",
    status: "disassembled",
    ammo: 0,
    accuracy: 0,
    chamber: "09",
    logs: ["Structural collapse", "Warning: offline"]
  }
];

export const TurretConsole: React.FC = () => {
  const [turrets, setTurrets] = useState<TurretInfo[]>(INITIAL_TURRETS);
  const [selectedTurretId, setSelectedTurretId] = useState<string>("turret_01");
  const [globalLockdown, setGlobalLockdown] = useState(false);

  const handleCalibrate = (id: string) => {
    playSuccess();
    setTurrets((prev) => 
      prev.map((t) => {
        if (t.id === id) {
          return {
            ...t,
            accuracy: 100,
            status: t.status === "disassembled" ? "disassembled" : "sleeping",
            logs: [...t.logs, `[CALIBRATION] Alignement de visée réinitialisé à 100%.`]
          };
        }
        return t;
      })
    );
  };

  const handleSimulateVoice = (turret: TurretInfo) => {
    if (turret.status === "disassembled") {
      playBeep(220, 0.2, "sawtooth");
      return;
    }

    const quotes = [
      "Je vous vois.",
      "Qui est là ?",
      "Ne tirez pas.",
      "C'est vous ?",
      "Cible perdue.",
      "Je ne vous en veux pas."
    ];
    const phrase = quotes[Math.floor(Math.random() * quotes.length)];
    
    // Play dual high pitch beep to simulate turret vocalization
    playBeep(1200, 0.08, "sine");
    setTimeout(() => {
      playBeep(1300, 0.08, "sine");
    }, 90);

    setTurrets((prev) => 
      prev.map((t) => {
        if (t.id === turret.id) {
          return {
            ...t,
            logs: [...t.logs, `[VIRTUAL VOICE] "${phrase}"`]
          };
        }
        return t;
      })
    );
  };

  const handleTriggerLockdown = () => {
    playWarningAlarm();
    setGlobalLockdown((prev) => !prev);
    setTurrets((prev) => 
      prev.map((t) => {
        if (t.status === "disassembled") return t;
        return {
          ...t,
          status: !globalLockdown ? "target_locked" : "sleeping",
          logs: [...t.logs, !globalLockdown ? "[LOCKDOWN] Cible verrouillée globale." : "[STANDBY] Retour au repos."]
        };
      })
    );

    localDb.addLog(
      "sys_reactor",
      "SECURITY",
      `Alerte globale tourelles : ${!globalLockdown ? "VERROUILLAGE ACTIF" : "FIN DU CONFINEMENT"}`,
      !globalLockdown ? "critical" : "info"
    );
  };

  const selectedTurret = turrets.find((t) => t.id === selectedTurretId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
      
      {/* 1. Deployed Sentries Grid (8 cols) */}
      <div className="aperture-panel" style={{ gridColumn: "span 8", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          <h3 style={{ margin: 0, textTransform: "uppercase", fontSize: "14px" }}>
            Supervision de la Grille Défensive (Tourelles Sentinelles)
          </h3>
          
          <ApertureButton 
            variant={globalLockdown ? "orange" : "secondary"}
            style={{ padding: "4px 10px", fontSize: "11px" }}
            onClick={handleTriggerLockdown}
          >
            {globalLockdown ? "⚠️ Désactiver Alerte Rouge" : "🚨 Confinement Global"}
          </ApertureButton>
        </div>

        {/* Grid cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", flex: 1 }}>
          {turrets.map((turret) => {
            const isSelected = turret.id === selectedTurretId;
            const statusColors = {
              sleeping: "var(--status-nominal)",
              searching: "var(--portal-orange)",
              target_locked: "var(--status-critical)",
              disassembled: "var(--text-muted)"
            };

            return (
              <div 
                key={turret.id}
                className={`aperture-panel ${isSelected ? "orange" : ""}`}
                style={{
                  border: isSelected ? "1px solid var(--portal-orange)" : "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-tertiary)",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  padding: "16px",
                  transition: "all 0.15s ease"
                }}
                onClick={() => setSelectedTurretId(turret.id)}
              >
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontWeight: "bold", fontSize: "12px", color: "var(--text-primary)" }}>{turret.code}</span>
                    <span style={{ marginLeft: "8px", fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      Chambre {turret.chamber}
                    </span>
                  </div>
                  <span 
                    style={{ 
                      fontSize: "10px", 
                      fontWeight: "bold", 
                      color: statusColors[turret.status], 
                      textTransform: "uppercase",
                      fontFamily: "var(--font-mono)"
                    }}
                  >
                    {turret.status === "sleeping" ? "REPOS" : turret.status === "searching" ? "BALAYAGE" : turret.status === "target_locked" ? "VERROUILLE" : "HORS-SERVICE"}
                  </span>
                </div>

                {/* Ammo and Accuracy gauges */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      <span>Missions Munitions (20mm)</span>
                      <span>{turret.ammo}%</span>
                    </div>
                    <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${turret.ammo}%`, backgroundColor: turret.ammo > 30 ? "var(--portal-blue)" : "var(--status-critical)" }} />
                    </div>
                  </div>

                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      <span>Résolution de Cible (Précision)</span>
                      <span>{turret.accuracy}%</span>
                    </div>
                    <div style={{ height: "4px", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${turret.accuracy}%`, backgroundColor: "var(--status-nominal)" }} />
                    </div>
                  </div>
                </div>

                {/* Card footer buttons */}
                <div style={{ marginTop: "auto", display: "flex", gap: "8px" }}>
                  <ApertureButton 
                    variant="secondary" 
                    style={{ padding: "3px 6px", fontSize: "10px", flex: 1 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCalibrate(turret.id);
                    }}
                  >
                    ⚙️ Calibrer
                  </ApertureButton>
                  
                  <ApertureButton 
                    variant="secondary" 
                    style={{ padding: "3px 6px", fontSize: "10px" }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSimulateVoice(turret);
                    }}
                  >
                    🗣️ Parler
                  </ApertureButton>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Selected Turret Logs & Specifications (4 cols) */}
      <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Specifications panel */}
        <div className="aperture-panel orange" style={{ minHeight: "180px" }}>
          <h4 style={{ margin: "0 0 10px 0", textTransform: "uppercase", fontSize: "11px", color: "var(--portal-orange)", fontFamily: "var(--font-mono)" }}>
            Fiche Technique Tourelle
          </h4>
          
          {selectedTurret ? (
            <div style={{ fontSize: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div><strong>Matricule :</strong> {selectedTurret.code}</div>
              <div><strong>Module Acoustique :</strong> Synthèse Vocale Active</div>
              <div><strong>Capacité Munitions :</strong> 2000 cartouches blindées</div>
              <div><strong>Vitesse de Rotation :</strong> 450 degrés/seconde</div>
              <div><strong>Garantie Militaire :</strong> Approuvée Enrichment Center</div>
            </div>
          ) : (
            <div style={{ color: "var(--text-muted)", fontStyle: "italic", fontSize: "12px" }}>
              Sélectionnez une unité pour inspecter ses spécifications.
            </div>
          )}
        </div>

        {/* Selected turret active logs */}
        <div className="aperture-panel" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "220px" }}>
          <h4 style={{ margin: "0 0 10px 0", textTransform: "uppercase", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
            Logs de Fréquence
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
            {selectedTurret && selectedTurret.logs.map((log, idx) => (
              <div 
                key={idx} 
                style={{ 
                  marginBottom: "4px",
                  color: log.includes("VERROUILLE") || log.includes("Cible") 
                    ? "var(--status-critical)" 
                    : log.includes("VIRTUAL VOICE")
                    ? "var(--portal-blue)"
                    : "var(--text-terminal)" 
                }}
              >
                &gt; {log}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
