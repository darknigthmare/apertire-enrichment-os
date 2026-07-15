import React, { useState, useEffect } from "react";
import { localDb } from "../db/localDb";
import type { FacilitySystem, Chamber, TestSubject, SystemLogEntry } from "../types";
import { ApertureButton } from "../components/ApertureButton";
import { playSuccess, playWarningAlarm } from "../components/soundSynth";
import { dashboardVisuals } from "../data/visualAssets";

interface DashboardProps {
  onNavigate: (page: string, params?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [systems, setSystems] = useState<FacilitySystem[]>([]);
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [subjects, setSubjects] = useState<TestSubject[]>([]);
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [scienceYield, setScienceYield] = useState({
    collected: 12450,
    confusion: 82,
    efficiency: 94,
    dependency: 12,
  });

  useEffect(() => {
    setSystems(localDb.getSystems());
    setChambers(localDb.getChambers());
    setSubjects(localDb.getSubjects());
    setLogs(localDb.getLogs().slice(0, 5));

    // Calculate aggregated stats from runs if any
    const runs = localDb.getRuns();
    if (runs.length > 0) {
      const totalYield = runs.reduce((acc, r) => acc + r.scienceYieldTotal, 12450);
      const confCount = runs.filter((r) => r.status === "subject_confused").length;
      const depCount = runs.filter((r) => r.status === "cube_dependency").length;
      
      setScienceYield({
        collected: totalYield,
        confusion: Math.min(100, 82 + confCount * 3),
        efficiency: Math.max(10, 94 - runs.filter((r) => r.status === "failed").length * 2),
        dependency: Math.min(100, 12 + depCount * 8),
      });
    }
  }, []);

  const handleSystemAction = (systemId: string, action: string) => {
    const sys = systems.find((s) => s.id === systemId);
    if (!sys) return;

    let message = "";
    let type: SystemLogEntry["type"] = "info";
    let integrityChange = 0;

    if (action === "diagnostic") {
      message = `Diagnostic effectué sur [${sys.name}]. Intégrité à ${sys.integrity}%.`;
      type = sys.integrity < 80 ? "warning" : "success";
      playSuccess();
    } else if (action === "recalibrate") {
      message = `Recalibrage des bobines de flux de [${sys.name}]. Augmentation de l'intégrité.`;
      type = "success";
      integrityChange = Math.min(100 - sys.integrity, Math.round(Math.random() * 5) + 3);
      playSuccess();
    } else if (action === "lockdown") {
      message = `Verrouillage d'urgence activé pour [${sys.name}]. Accès physique révoqué.`;
      type = "critical";
      playWarningAlarm();
    }

    // Save changes
    if (integrityChange > 0) {
      localDb.updateSystem({ id: systemId, integrity: sys.integrity + integrityChange });
      setSystems(localDb.getSystems());
    }

    localDb.addLog(systemId, action.toUpperCase(), message, type);
    setLogs(localDb.getLogs().slice(0, 5));
  };


  // Subjects status counts
  const getSubjectStatusCount = (status: TestSubject["status"]) => {
    return subjects.filter((s) => s.status === status).length;
  };

  const activeQueueChambers = chambers.filter((c) => c.status === "calibrated" || c.status === "queued" || c.status === "active").slice(0, 3);

  return (
    <div className="dashboard-view log-line">
      {/* Welcome Banner */}
      <div className="aperture-panel blue dashboard-welcome" style={{ marginBottom: "20px" }}>
        <div className="dashboard-welcome-copy">
        <h2 style={{ margin: "0 0 8px 0", color: "var(--text-primary)", textTransform: "uppercase" }}>
          CONSOLE D'ADMINISTRATION DES SÉQUENCES D'ENRICHMENT
        </h2>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13.5px" }}>
          Bienvenue, Administrateur Central. Les sujets de test respirent encore. Statistiquement regrettable, opérationnellement utile.
        </p>
        </div>
        <img
          src={dashboardVisuals.hero}
          alt=""
          aria-hidden="true"
          width={1200}
          height={480}
          className="dashboard-welcome-visual"
        />
      </div>

      {/* Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
        
        {/* FACILITY STATUS CARD (8 columns) */}
        <div className="aperture-panel" style={{ gridColumn: "span 8" }}>
          <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
            État des Infrastructures du Complexe
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            {systems.map((sys) => (
              <div 
                key={sys.id} 
                style={{ 
                  border: "1px solid var(--border-color)", 
                  borderRadius: "4px", 
                  padding: "12px",
                  backgroundColor: "var(--bg-tertiary)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontWeight: "bold", fontSize: "13px", color: "var(--text-primary)" }}>{sys.name}</span>
                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className={`status-dot ${sys.status}`}></span>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: `var(--status-${sys.status})` }}>{sys.status}</span>
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "10px", minHeight: "36px" }}>
                  {sys.description}
                </div>
                
                {/* Stats lines */}
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "12px" }}>
                  <span>Intégrité: {sys.integrity}%</span>
                  <span>Puissance: {sys.powerDraw} MW</span>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <ApertureButton variant="secondary" style={{ padding: "4px 8px", fontSize: "10px" }} onClick={() => handleSystemAction(sys.id, "diagnostic")}>
                    Diagnostic
                  </ApertureButton>
                  {sys.integrity < 95 && (
                    <ApertureButton variant="terminal" style={{ padding: "4px 8px", fontSize: "10px" }} onClick={() => handleSystemAction(sys.id, "recalibrate")}>
                      Ajuster
                    </ApertureButton>
                  )}
                  {sys.status !== "offline" && sys.id === "sys_neurotoxin" && (
                    <ApertureButton variant="danger" style={{ padding: "4px 8px", fontSize: "10px" }} onClick={() => handleSystemAction(sys.id, "lockdown")}>
                      Lockdown
                    </ApertureButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* METRICS & SCIENCE YIELD (4 columns) */}
        <div className="aperture-panel orange" style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "16px" }}>
          <h3 style={{ margin: "0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
            Rendement Scientifique Fictif
          </h3>
          
          <div>
            <div style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>Données Collectées</div>
            <div style={{ fontSize: "32px", fontFamily: "var(--font-mono)", color: "var(--portal-orange)", fontWeight: "bold" }}>
              {scienceYield.collected.toLocaleString()} <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>units</span>
            </div>
          </div>

          {/* Bar Metrics */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Indice de Confusion Humaine</span>
                <span style={{ color: "var(--text-primary)" }}>{scienceYield.confusion}%</span>
              </div>
              <div className="boot-progress-bar" style={{ margin: 0, height: "4px" }}>
                <span className="boot-progress-fill" style={{ width: `${scienceYield.confusion}%`, backgroundColor: "var(--portal-orange)" }}></span>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Efficacité des Portails</span>
                <span style={{ color: "var(--text-primary)" }}>{scienceYield.efficiency}%</span>
              </div>
              <div className="boot-progress-bar" style={{ margin: 0, height: "4px" }}>
                <span className="boot-progress-fill" style={{ width: `${scienceYield.efficiency}%`, backgroundColor: "var(--status-nominal)" }}></span>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Dépendance Affective (Cube)</span>
                <span style={{ color: "var(--text-primary)" }}>{scienceYield.dependency}%</span>
              </div>
              <div className="boot-progress-bar" style={{ margin: 0, height: "4px" }}>
                <span className="boot-progress-fill" style={{ width: `${scienceYield.dependency}%`, backgroundColor: "var(--status-critical)" }}></span>
              </div>
            </div>
          </div>

          <div style={{ marginTop: "auto", borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            NOTE: Toute tentative de câliner un cube de stockage réduira le score d'efficacité.
          </div>
        </div>

        {/* ACTIVE CHAMBERS QUEUE (6 columns) */}
        <div className="aperture-panel" style={{ gridColumn: "span 6" }}>
          <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
            File d'Attente Active des Chambres
          </h3>
          
          {activeQueueChambers.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "20px" }}>
              Aucune chambre calibrée ou prête en file d'attente. Visitez le registre pour en calibrer.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {activeQueueChambers.map((ch) => (
                <div 
                  key={ch.id} 
                  style={{ 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center", 
                    padding: "10px 12px", 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "4px",
                    backgroundColor: "var(--bg-tertiary)"
                  }}
                >
                  <div>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--portal-blue)", marginRight: "8px", fontWeight: "bold" }}>Chambre {ch.number}</span>
                    <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{ch.name}</span>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                      Difficulté: {ch.difficulty}/10 | Danger: {ch.hazardLevel}/10 | Style: {ch.style}
                    </div>
                  </div>
                  <ApertureButton variant="blue" style={{ padding: "6px 12px", fontSize: "11px" }} onClick={() => onNavigate("test-runner", { chamberId: ch.id })}>
                    Lancer Test
                  </ApertureButton>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end" }}>
            <ApertureButton variant="secondary" style={{ fontSize: "11px" }} onClick={() => onNavigate("chambers")}>
              Gérer le registre &rarr;
            </ApertureButton>
          </div>
        </div>

        {/* LOG SYSTEM & STATS (6 columns) */}
        <div className="aperture-panel" style={{ gridColumn: "span 6" }}>
          <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
            Journal Événementiel de Contrôle
          </h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontFamily: "var(--font-mono)", fontSize: "11px" }}>
            {logs.map((log) => (
              <div 
                key={log.id} 
                style={{ 
                  padding: "6px 10px", 
                  borderLeft: `2px solid var(--status-${log.type === "critical" ? "critical" : log.type})`,
                  backgroundColor: "rgba(255, 255, 255, 0.02)",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <span>
                  <span style={{ color: "var(--text-muted)" }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>{" "}
                  <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>{log.action}</span>: {log.message}
                </span>
                <span style={{ color: "var(--text-muted)" }}>{log.systemId.replace("sys_", "")}</span>
              </div>
            ))}
          </div>

          {/* Counts metrics */}
          <div style={{ marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
            <div style={{ textAlign: "center", padding: "8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "4px" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--text-primary)", fontFamily: "var(--font-mono)" }}>
                {chambers.length}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Chambres</div>
            </div>

            <div style={{ textAlign: "center", padding: "8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "4px" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--portal-blue)", fontFamily: "var(--font-mono)" }}>
                {getSubjectStatusCount("ready")}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>Sujets Prêts</div>
            </div>

            <div style={{ textAlign: "center", padding: "8px", backgroundColor: "var(--bg-tertiary)", borderRadius: "4px" }}>
              <div style={{ fontSize: "16px", fontWeight: "bold", color: "var(--portal-orange)", fontFamily: "var(--font-mono)" }}>
                {getSubjectStatusCount("stasis")}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", textTransform: "uppercase" }}>En Stase</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
