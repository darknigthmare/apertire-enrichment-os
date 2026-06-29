import React, { useState, useEffect, useRef } from "react";
import { localDb } from "../db/localDb";
import type { Chamber, TestSubject, TestProtocol, TestRun, TestRunEvent } from "../types";
import { ApertureButton } from "../components/ApertureButton";
import { runSimulatedTest } from "../simulation/engine";
import { playSuccess, playBeep, playWarningAlarm } from "../components/soundSynth";

interface TestRunnerProps {
  initialChamberId?: string;
  onNavigate: (page: string, params?: any) => void;
}

export const TestRunner: React.FC<TestRunnerProps> = ({ initialChamberId, onNavigate }) => {
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [subjects, setSubjects] = useState<TestSubject[]>([]);
  
  // Selection states
  const [selectedChamberId, setSelectedChamberId] = useState(initialChamberId || "");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  
  // Protocol builder states
  const [subjectType, setSubjectType] = useState<TestProtocol["subjectType"]>("human");
  const [equipment, setEquipment] = useState<TestProtocol["allowedEquipment"]>(["portal_device"]);
  const successConds: TestProtocol["successConditions"] = ["reach_exit"];
  const failureConds: TestProtocol["failureConditions"] = ["goo_contact", "turret_line_of_sight"];
  const [tone, setTone] = useState<TestProtocol["tone"]>("passive_aggressive");

  // Simulation execution states
  const [isSimulating, setIsSimulating] = useState(false);
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);
  const [visibleEvents, setVisibleEvents] = useState<TestRunEvent[]>([]);
  const [progressVal, setProgressVal] = useState(0);

  const consoleEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chs = localDb.getChambers();
    const subjs = localDb.getSubjects();
    setChambers(chs);
    setSubjects(subjs);

    if (chs.length > 0 && !selectedChamberId) {
      setSelectedChamberId(chs[0].id);
    }
    if (subjs.length > 0) {
      setSelectedSubjectId(subjs[0].id);
    }
  }, [initialChamberId]);

  useEffect(() => {
    if (selectedSubjectId) {
      const sub = subjects.find((s) => s.id === selectedSubjectId);
      if (sub) {
        setSubjectType(sub.type === "human" ? "human" : sub.type === "android" ? "android" : "unknown");
      }
    }
  }, [selectedSubjectId, subjects]);

  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [visibleEvents]);

  const handleEquipmentToggle = (item: any) => {
    setEquipment((prev) => 
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleStartSimulation = () => {
    const ch = chambers.find((c) => c.id === selectedChamberId);
    const sub = subjects.find((s) => s.id === selectedSubjectId);

    if (!ch || !sub) return;

    // Build mock protocol
    const protocol: TestProtocol = {
      id: `prot_${Math.random().toString(36).substr(2, 5)}`,
      chamberId: ch.id,
      objective: "Atteindre la sortie en évitant les risques.",
      subjectType,
      allowedEquipment: equipment,
      successConditions: successConds,
      failureConditions: failureConds,
      tone,
    };

    // Calculate final run result
    const runResult = runSimulatedTest(ch, sub, protocol);
    
    // Setup simulation interface states
    setCurrentRun(runResult);
    setVisibleEvents([]);
    setIsSimulating(true);
    setProgressVal(0);

    // Animate timeline logs incrementally (to feel like a live running script)
    let idx = 0;
    const interval = setInterval(() => {
      if (idx < runResult.timeline.length) {
        const ev = runResult.timeline[idx];
        setVisibleEvents((prev) => [...prev, ev]);
        setProgressVal(Math.round(((idx + 1) / runResult.timeline.length) * 100));

        // Sound cues
        if (ev.type === "success") {
          playSuccess();
        } else if (ev.type === "failure") {
          playWarningAlarm();
        } else {
          playBeep(880, 0.05, "sine");
        }

        idx++;
      } else {
        clearInterval(interval);
        setIsSimulating(false);
        // Save to DB logs and runs
        localDb.addRun(runResult);
        localDb.addLog(
          "sys_reactor", 
          "TEST_RUN", 
          `Test de la Chambre ${ch.number} résolu avec le statut [${runResult.status.toUpperCase()}].`, 
          runResult.status.includes("completed") || runResult.status.includes("efficiency") ? "success" : "critical"
        );
      }
    }, 1200);
  };

  // Compile coordinates to draw line in SVG chart
  const getChartPoints = () => {
    if (visibleEvents.length === 0) return "";
    
    const width = 300;
    const height = 120;
    const padding = 10;
    
    let currentTotal = 0;
    const pointsData = visibleEvents.map((ev, i) => {
      currentTotal += ev.scienceYield;
      return { x: i, y: currentTotal };
    });

    const maxVal = Math.max(10, ...pointsData.map((d) => d.y));
    const stepX = (width - padding * 2) / Math.max(1, visibleEvents.length - 1);
    
    return pointsData
      .map((d, i) => {
        const px = padding + i * stepX;
        const py = height - padding - (d.y / maxVal) * (height - padding * 2);
        return `${px},${py}`;
      })
      .join(" ");
  };

  return (
    <div className="test-runner-view log-line">
      
      {!currentRun ? (
        /* PHASE 1: COMPOSER DE PROTOCOLE */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
          
          {/* Chamber & Subject Choice (6 cols) */}
          <div className="aperture-panel" style={{ gridColumn: "span 6" }}>
            <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              1. Choix du Sujet & Environnement
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              
              {/* Select Chamber */}
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                  Chambre Expérimentale
                </label>
                <select 
                  value={selectedChamberId} 
                  onChange={(e) => setSelectedChamberId(e.target.value)}
                  style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
                >
                  {chambers.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      Chambre {ch.number} - {ch.name} (Solvabilité : {ch.solvability}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Subject */}
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                  Matricule du Sujet
                </label>
                <select 
                  value={selectedSubjectId} 
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.alias} ({sub.type.toUpperCase()}) | Compliance: {sub.compliance}%
                    </option>
                  ))}
                </select>
              </div>

              {/* Subject quick details */}
              {selectedSubjectId && (
                <div style={{ padding: "12px", border: "1px solid var(--border-color)", borderRadius: "4px", backgroundColor: "var(--bg-tertiary)", fontSize: "12px" }}>
                  <span style={{ fontWeight: "bold", color: "var(--text-primary)" }}>Observations : </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {subjects.find((s) => s.id === selectedSubjectId)?.notes}
                  </span>
                </div>
              )}

            </div>
          </div>

          {/* Equipment & Protocol rules (6 cols) */}
          <div className="aperture-panel orange" style={{ gridColumn: "span 6" }}>
            <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              2. Paramètres du Protocole Expérimental
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              
              {/* Allowed items checks */}
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                  Équipements Autorisés
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={equipment.includes("portal_device")} 
                      onChange={() => handleEquipmentToggle("portal_device")}
                      style={{ accentColor: "var(--portal-orange)" }}
                    />
                    Appareil de Portail Simple
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={equipment.includes("dual_portal")} 
                      onChange={() => handleEquipmentToggle("dual_portal")}
                      style={{ accentColor: "var(--portal-orange)" }}
                    />
                    Appareil de Portail Double
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={equipment.includes("cubes_only")} 
                      onChange={() => handleEquipmentToggle("cubes_only")}
                      style={{ accentColor: "var(--portal-orange)" }}
                    />
                    Cubes & Boutons uniquement
                  </label>

                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer" }}>
                    <input 
                      type="checkbox" 
                      checked={equipment.includes("gel_interaction")} 
                      onChange={() => handleEquipmentToggle("gel_interaction")}
                      style={{ accentColor: "var(--portal-orange)" }}
                    />
                    Liquides de Mobilité (Gels)
                  </label>
                </div>
              </div>

              {/* Tone settings */}
              <div>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                  Tonalité des Annonces Haut-Parleurs
                </label>
                <select 
                  value={tone} 
                  onChange={(e) => setTone(e.target.value as any)}
                  style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
                >
                  <option value="neutral">Neutre & Clinique</option>
                  <option value="passive_aggressive">Passif-Agressif (Standard)</option>
                  <option value="ominous">Menaçant / Sinistre</option>
                  <option value="old_aperture">Cave Johnson (Rétro motivant)</option>
                  <option value="malfunctioning_core">Noyau Défaillant (Wheatley-glitch)</option>
                </select>
              </div>

              <div style={{ marginTop: "12px", borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
                <ApertureButton variant="orange" style={{ width: "100%" }} onClick={handleStartSimulation}>
                  Lancer Simulation Expérimentale
                </ApertureButton>
              </div>

            </div>
          </div>

        </div>
      ) : (
        /* PHASE 2: RUNNER TIMELINE & CHARTS */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
          
          {/* Timeline Output Log (8 cols) */}
          <div className="aperture-panel" style={{ gridColumn: "span 8", display: "flex", flexDirection: "column", minHeight: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <h3 style={{ margin: 0, textTransform: "uppercase", fontSize: "13px" }}>
                Simulateur Temporel - Log Console
              </h3>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Progression : {progressVal}%
              </div>
            </div>

            {/* scrolling log viewport */}
            <div 
              style={{ 
                flex: 1, 
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                padding: "16px",
                fontFamily: "var(--font-mono)",
                fontSize: "12.5px",
                lineHeight: "1.6",
                color: "var(--text-terminal)",
                borderRadius: "4px",
                overflowY: "auto",
                maxHeight: "320px",
                marginBottom: "16px"
              }}
            >
              {visibleEvents.map((ev, i) => (
                <div 
                  key={i} 
                  className="log-line"
                  style={{ 
                    marginBottom: "4px",
                    color: ev.type === "success" 
                      ? "var(--status-nominal)" 
                      : ev.type === "failure" 
                      ? "var(--status-critical)" 
                      : ev.type === "announcement"
                      ? "var(--portal-orange)"
                      : "var(--text-terminal)" 
                  }}
                >
                  <span style={{ color: "var(--text-muted)" }}>[{ev.time}s]</span> {ev.message}
                </div>
              ))}
              <div ref={consoleEndRef} />
            </div>

            {/* Simulating progress bar */}
            {isSimulating && (
              <div className="boot-progress-bar" style={{ margin: 0 }}>
                <span className="boot-progress-fill" style={{ width: `${progressVal}%` }}></span>
              </div>
            )}

            {/* Post-simulation actions */}
            {!isSimulating && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Test Clôturé. Statut final : <span style={{ fontWeight: "bold", textTransform: "uppercase", color: currentRun.status.includes("completed") ? "var(--status-nominal)" : "var(--status-critical)" }}>{currentRun.status}</span>
                </span>
                
                <div style={{ display: "flex", gap: "10px" }}>
                  <ApertureButton variant="secondary" onClick={() => setCurrentRun(null)}>
                    Nouveau Test
                  </ApertureButton>
                  <ApertureButton variant="blue" onClick={() => onNavigate("reports")}>
                    Voir Rapport Clinique
                  </ApertureButton>
                </div>
              </div>
            )}

          </div>

          {/* Sarcastic Comment & Science Yield (4 cols) */}
          <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Sarcasm box */}
            <div className="aperture-panel orange" style={{ minHeight: "180px", display: "flex", flexDirection: "column" }}>
              <h4 style={{ margin: "0 0 10px 0", textTransform: "uppercase", fontSize: "11px", color: "var(--portal-orange)", fontFamily: "var(--font-mono)" }}>
                Rétroaction de l'IA
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", fontStyle: "italic", lineHeight: "1.5" }}>
                "{currentRun.aiCommentary}"
              </p>
            </div>

            {/* SVG yield plot */}
            <div className="aperture-panel" style={{ flex: 1, minHeight: "220px", display: "flex", flexDirection: "column" }}>
              <h4 style={{ margin: "0 0 10px 0", textTransform: "uppercase", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Flux de Rendement de Données
              </h4>

              <div style={{ flex: 1, position: "relative", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "4px", padding: "6px" }}>
                <svg width="100%" height="120" viewBox="0 0 320 120" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="30" x2="320" y2="30" stroke="var(--grid-line)" strokeDasharray="2" />
                  <line x1="0" y1="60" x2="320" y2="60" stroke="var(--grid-line)" strokeDasharray="2" />
                  <line x1="0" y1="90" x2="320" y2="90" stroke="var(--grid-line)" strokeDasharray="2" />
                  
                  {/* Line Chart */}
                  {visibleEvents.length > 1 && (
                    <polyline
                      fill="none"
                      stroke="var(--portal-blue)"
                      strokeWidth="2"
                      points={getChartPoints()}
                      style={{ transition: "stroke-dashoffset 0.5s ease" }}
                    />
                  )}
                </svg>
                
                <div style={{ position: "absolute", bottom: "4px", right: "6px", fontSize: "9px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                  Total récolté : {currentRun.scienceYieldTotal} units
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
