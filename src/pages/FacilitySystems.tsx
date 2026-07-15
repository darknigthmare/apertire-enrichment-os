import React, { useState, useEffect } from "react";
import { localDb } from "../db/localDb";
import type { FacilitySystem, SystemLogEntry } from "../types";
import { ApertureButton } from "../components/ApertureButton";
import { playSuccess, playWarningAlarm } from "../components/soundSynth";
import { facilityVisuals } from "../data/visualAssets";

export const FacilitySystems: React.FC = () => {
  const [systems, setSystems] = useState<FacilitySystem[]>([]);
  const [logs, setLogs] = useState<SystemLogEntry[]>([]);
  const [selectedSystem, setSelectedSystem] = useState<FacilitySystem | null>(null);

  useEffect(() => {
    setSystems(localDb.getSystems());
    setLogs(localDb.getLogs());
  }, []);

  const refreshData = () => {
    setSystems(localDb.getSystems());
    setLogs(localDb.getLogs());
    if (selectedSystem) {
      const updated = localDb.getSystems().find((s) => s.id === selectedSystem.id);
      if (updated) setSelectedSystem(updated);
    }
  };

  const handleDiagnoseAll = () => {
    playSuccess();
    systems.forEach((sys) => {
      localDb.addLog(sys.id, "DIAGNOSTIC", `Supervision automatique : ${sys.name} à ${sys.integrity}% d'intégrité.`, "info");
    });
    refreshData();
  };

  const handleSystemAction = (systemId: string, action: string) => {
    const sys = systems.find((s) => s.id === systemId);
    if (!sys) return;

    let message = "";
    let type: SystemLogEntry["type"] = "info";
    let integrityChange = 0;
    let statusChange: FacilitySystem["status"] = sys.status;

    if (action === "run_diagnose") {
      message = `Diagnostic manuel forcé. Intégrité de ${sys.name} : ${sys.integrity}%. Énergie : ${sys.powerDraw}MW.`;
      type = sys.integrity < 80 ? "warning" : "success";
      playSuccess();
    } else if (action === "recalibrate") {
      message = `Calibration pneumatique effectuée sur [${sys.name}]. Ajustement micrométrique des actuateurs.`;
      type = "success";
      integrityChange = Math.min(100 - sys.integrity, Math.round(Math.random() * 8) + 4);
      statusChange = sys.integrity + integrityChange >= 90 ? "nominal" : sys.status;
      playSuccess();
    } else if (action === "lockdown") {
      message = `CONFINEMENT CRITIQUE ACTIVÉ : Les sas de [${sys.name}] sont scellés magnétiquement.`;
      type = "critical";
      statusChange = "critical";
      playWarningAlarm();
    } else if (action === "toggle_online") {
      if (sys.status === "offline") {
        message = `Démarrage de la séquence d'initialisation pour [${sys.name}]. Raccordement au réseau.`;
        statusChange = "nominal";
        type = "success";
        playSuccess();
      } else {
        message = `Arrêt contrôlé de [${sys.name}]. Isolement énergétique.`;
        statusChange = "offline";
        type = "warning";
        playWarningAlarm();
      }
    }

    localDb.updateSystem({ 
      id: systemId, 
      integrity: Math.min(100, sys.integrity + integrityChange),
      status: statusChange
    });
    
    localDb.addLog(systemId, action.toUpperCase(), message, type);
    refreshData();
  };

  const totalPowerDraw = systems.reduce((acc, s) => acc + (s.status !== "offline" ? s.powerDraw : 0), 0);
  const averageIntegrity = Math.round(systems.reduce((acc, s) => acc + s.integrity, 0) / systems.length);

  return (
    <div className="systems-view log-line">
      {/* Metrics Banner */}
      <div 
        className="aperture-panel" 
        style={{ 
          marginBottom: "20px", 
          display: "grid", 
          gridTemplateColumns: "repeat(3, 1fr)", 
          gap: "20px",
          backgroundColor: "var(--bg-tertiary)"
        }}
      >
        <div style={{ textAlign: "center", borderRight: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
            Charge Énergétique Active
          </div>
          <div style={{ fontSize: "28px", fontFamily: "var(--font-mono)", color: "var(--portal-blue)", fontWeight: "bold" }}>
            {totalPowerDraw} <span style={{ fontSize: "14px", color: "var(--text-muted)" }}>MW</span>
          </div>
        </div>

        <div style={{ textAlign: "center", borderRight: "1px solid var(--border-color)" }}>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>
            Intégrité Moyenne Réseau
          </div>
          <div style={{ fontSize: "28px", fontFamily: "var(--font-mono)", color: "var(--status-nominal)", fontWeight: "bold" }}>
            {averageIntegrity}%
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <ApertureButton variant="blue" style={{ width: "80%" }} onClick={handleDiagnoseAll}>
            Lancer Scan Global
          </ApertureButton>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
        
        {/* Systems Grid List (7 cols) */}
        <div style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", gap: "12px" }}>
          {systems.map((sys) => (
            <div 
              key={sys.id}
              className={`aperture-panel ${sys.status === "offline" ? "" : sys.status === "warning" ? "amber" : sys.status === "critical" ? "red" : "green"}`}
              style={{ 
                cursor: "pointer",
                backgroundColor: selectedSystem?.id === sys.id ? "var(--bg-active)" : "var(--bg-secondary)",
                padding: "14px 18px",
              }}
              onClick={() => setSelectedSystem(sys)}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h4 style={{ margin: "0 0 4px 0", color: "var(--text-primary)", fontSize: "14px" }}>{sys.name}</h4>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Dernière maintenance : {sys.lastMaintenance} | Énergie : {sys.powerDraw}MW
                  </div>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-primary)", fontWeight: "bold" }}>
                      {sys.integrity}%
                    </span>
                    <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase" }}>Intégrité</span>
                  </div>
                  <span className={`status-dot ${sys.status}`}></span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Selected System Control Panel (5 cols) */}
        <div style={{ gridColumn: "span 5" }}>
          {selectedSystem ? (
            <div className="aperture-panel blue" style={{ minHeight: "350px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "10px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)", textTransform: "uppercase" }}>
                  Contrôle : {selectedSystem.name}
                </h3>
                <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span className={`status-dot ${selectedSystem.status}`}></span>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: `var(--status-${selectedSystem.status})` }}>
                    {selectedSystem.status}
                  </span>
                </span>
              </div>

              <img
                src={facilityVisuals.overview}
                alt=""
                aria-hidden="true"
                width={1200}
                height={480}
                className="facility-overview-visual"
              />

              <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
                {selectedSystem.description}
              </p>

              {/* Progress representation */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Stabilité Matérielle</span>
                  <span style={{ color: "var(--text-primary)" }}>{selectedSystem.integrity}%</span>
                </div>
                <div className="boot-progress-bar" style={{ margin: 0 }}>
                  <span className="boot-progress-fill" style={{ width: `${selectedSystem.integrity}%`, backgroundColor: `var(--status-${selectedSystem.status})` }}></span>
                </div>
              </div>

              {/* Grid detail stats */}
              <div 
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(2, 1fr)", 
                  gap: "12px", 
                  fontFamily: "var(--font-mono)", 
                  fontSize: "11px", 
                  color: "var(--text-secondary)",
                  marginBottom: "24px",
                  border: "1px solid var(--border-color)",
                  padding: "10px",
                  backgroundColor: "var(--bg-tertiary)"
                }}
              >
                <div>ID: {selectedSystem.id}</div>
                <div>Charge: {selectedSystem.powerDraw} MW</div>
                <div>Maintenance: {selectedSystem.lastMaintenance}</div>
                <div>Alerte: {selectedSystem.warningLevel.toUpperCase()}</div>
              </div>

              {/* Actions */}
              <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", gap: "10px" }}>
                  <ApertureButton variant="blue" style={{ flex: 1 }} onClick={() => handleSystemAction(selectedSystem.id, "run_diagnose")}>
                    Lancer Diagnostic
                  </ApertureButton>
                  {selectedSystem.integrity < 98 && (
                    <ApertureButton variant="success" style={{ flex: 1 }} onClick={() => handleSystemAction(selectedSystem.id, "recalibrate")}>
                      Recalibrer
                    </ApertureButton>
                  )}
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <ApertureButton variant="secondary" style={{ flex: 1 }} onClick={() => handleSystemAction(selectedSystem.id, "toggle_online")}>
                    {selectedSystem.status === "offline" ? "Mettre en ligne" : "Arrêter le Système"}
                  </ApertureButton>
                  {selectedSystem.status !== "critical" && selectedSystem.id !== "sys_reactor" && (
                    <ApertureButton variant="danger" style={{ flex: 1 }} onClick={() => handleSystemAction(selectedSystem.id, "lockdown")}>
                      Confinement
                    </ApertureButton>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div 
              className="aperture-panel" 
              style={{ 
                minHeight: "350px", 
                display: "flex", 
                flexDirection: "column",
                alignItems: "center", 
                justifyContent: "center",
                gap: "16px",
                color: "var(--text-muted)",
                fontSize: "13px",
                textAlign: "center"
              }}
            >
              <img
                src={facilityVisuals.overview}
                alt=""
                aria-hidden="true"
                width={1200}
                height={480}
                className="facility-overview-visual"
              />
              Sélectionnez un composant d'infrastructure pour ouvrir le terminal de contrôle.
            </div>
          )}
        </div>

      </div>

      {/* Terminal log panel at bottom */}
      <div className="aperture-panel" style={{ marginTop: "20px" }}>
        <h3 style={{ margin: "0 0 12px 0", textTransform: "uppercase", fontSize: "13px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
          Flux Réseau - Journaux de Diagnostics
        </h3>
        
        <div 
          style={{ 
            maxHeight: "180px", 
            overflowY: "auto", 
            fontFamily: "var(--font-mono)", 
            fontSize: "11px",
            display: "flex",
            flexDirection: "column",
            gap: "6px"
          }}
        >
          {logs.map((log) => (
            <div key={log.id} style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--text-muted)", width: "130px" }}>[{new Date(log.timestamp).toLocaleString()}]</span>
              <span style={{ color: "var(--portal-blue)", width: "100px", textTransform: "uppercase" }}>{log.action}</span>
              <span style={{ color: `var(--status-${log.type === "critical" ? "critical" : log.type})`, width: "80px", textTransform: "uppercase" }}>{log.type}</span>
              <span style={{ color: "var(--text-primary)", flex: 1 }}>{log.message}</span>
              <span style={{ color: "var(--text-muted)", textAlign: "right" }}>{log.systemId}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
