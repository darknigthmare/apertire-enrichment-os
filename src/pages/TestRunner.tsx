import React, { useState, useEffect, useRef } from "react";
import { localDb } from "../db/localDb";
import type { Chamber, ElementType, TestSubject, TestProtocol, TestRun, TestRunEvent } from "../types";
import { ApertureButton } from "../components/ApertureButton";
import { runSimulatedTest } from "../simulation/engine";
import { playSuccess, playBeep, playWarningAlarm } from "../components/soundSynth";
import { Chamber3DView } from "../components/Chamber3DView";
import { subjectPortraits } from "../data/visualAssets";

interface TestRunnerProps {
  initialChamberId?: string;
  onNavigate: (page: string, params?: any) => void;
}

const ELEMENT_ICONS: Record<ElementType, string> = {
  floor: "·",
  wall: "🧱",
  portalable_panel: "□",
  non_portalable_panel: "■",
  glass: "◇",
  goo: "🧪",
  emancipation_grill: "≋",
  entrance: "🚪",
  exit: "🏁",
  button: "🔴",
  cube: "📦",
  companion_cube: "💖",
  cube_dropper: "⬇",
  turret: "🤖",
  camera: "📹",
  laser_emitter: "🚨",
  laser_receiver: "🎯",
  redirection_cube: "💎",
  faith_plate: "🔼",
  hard_light_bridge: "🌁",
  excursion_funnel: "🌀",
  funnel_reversal_button: "↩",
  repulsion_gel_source: "🔵",
  propulsion_gel_source: "🟠",
  conversion_gel_source: "⚪",
  cleanser: "💧",
  moving_panel: "↔",
  observation_window: "🪟",
  incinerator: "🔥",
  elevator: "⇅",
  signage: "⚠",
  monitor: "🖥",
  damaged_panel: "💥",
  vegetation: "🌿",
  old_aperture_pipe: "〰",
};

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
  const [previewMode, setPreviewMode] = useState<"2d" | "3d">("2d");

  // Live 2D pathing animation coordinates states
  const [subjectCoords, setSubjectCoords] = useState<{ x: number; y: number } | null>(null);
  const [portalBeams, setPortalBeams] = useState<{ start: { x: number; y: number }; end: { x: number; y: number }; color: string }[]>([]);
  const [laserBeams, setLaserBeams] = useState<{ start: { x: number; y: number }; end: { x: number; y: number } }[]>([]);

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

    const runResult = runSimulatedTest(ch, sub, protocol);
    
    setCurrentRun(runResult);
    setVisibleEvents([]);
    setIsSimulating(true);
    setProgressVal(0);

    let idx = 0;
    const interval = setInterval(() => {
      if (idx < runResult.timeline.length) {
        const ev = runResult.timeline[idx];
        setVisibleEvents((prev) => [...prev, ev]);
        setProgressVal(Math.round(((idx + 1) / runResult.timeline.length) * 100));

        // Animate 2D positions step by step
        const entrance = ch.elements.find(e => e.type === "entrance");
        const exit = ch.elements.find(e => e.type === "exit");
        const cube = ch.elements.find(e => e.type === "cube" || e.type === "redirection_cube" || e.type === "companion_cube");
        const button = ch.elements.find(e => e.type === "button" || e.type === "laser_receiver");

        const path = [];
        if (entrance) path.push({ x: entrance.x, y: entrance.y });
        if (cube) path.push({ x: cube.x, y: cube.y });
        if (button) path.push({ x: button.x, y: button.y });
        if (exit) path.push({ x: exit.x, y: exit.y });

        if (path.length > 0) {
          const pathIdx = Math.min(path.length - 1, idx);
          setSubjectCoords(path[pathIdx]);

          // Portal beams lines drawing
          if (idx > 0 && idx < runResult.timeline.length - 1 && (equipment.includes("portal_device") || equipment.includes("dual_portal"))) {
            const panels = ch.elements.filter(e => e.type === "portalable_panel");
            if (panels.length > 0) {
              const panel1 = panels[0];
              const panel2 = panels[1] || panels[0];
              setPortalBeams([
                { start: path[pathIdx], end: { x: panel1.x, y: panel1.y }, color: "var(--portal-blue)" },
                ...(equipment.includes("dual_portal") ? [{ start: path[pathIdx], end: { x: panel2.x, y: panel2.y }, color: "var(--portal-orange)" }] : [])
              ]);
            }
          } else {
            setPortalBeams([]);
          }
        }

        // Active laser lines drawing
        const laserEmitter = ch.elements.find(e => e.type === "laser_emitter");
        const laserReceiver = ch.elements.find(e => e.type === "laser_receiver");
        if (laserEmitter && laserReceiver) {
          setLaserBeams([{ start: { x: laserEmitter.x, y: laserEmitter.y }, end: { x: laserReceiver.x, y: laserReceiver.y } }]);
        }

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
        setPortalBeams([]);
        setLaserBeams([]);
        
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

  const activeChamber = chambers.find((c) => c.id === selectedChamberId);
  const activeSubject = subjects.find((subject) => subject.id === selectedSubjectId);
  const activeSubjectPortrait = activeSubject ? subjectPortraits[activeSubject.id] : undefined;

  return (
    <div className="test-runner-view log-line">
      
      {!currentRun ? (
        /* PHASE 1: COMPOSER DE PROTOCOLE */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
          
          <div className="aperture-panel" style={{ gridColumn: "span 6" }}>
            <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              1. Choix du Sujet & Environnement
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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

          <div className="aperture-panel orange" style={{ gridColumn: "span 6" }}>
            <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              2. Paramètres du Protocole Expérimental
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
        /* PHASE 2: RUNNER TIMELINE & CHARTS WITH LIVE 2D GRID BOARD */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
          
          <div className="aperture-panel" style={{ gridColumn: "span 8", display: "flex", flexDirection: "column", minHeight: "450px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <h3 style={{ margin: 0, textTransform: "uppercase", fontSize: "13px" }}>
                  Console de Test Actif & Télémétrie
                </h3>
                <div style={{ display: "flex", gap: "4px" }}>
                  <ApertureButton 
                    variant={previewMode === "2d" ? "blue" : "secondary"} 
                    style={{ padding: "3px 6px", fontSize: "9px" }} 
                    onClick={() => setPreviewMode("2d")}
                  >
                    2D Live
                  </ApertureButton>
                  <ApertureButton 
                    variant={previewMode === "3d" ? "blue" : "secondary"} 
                    style={{ padding: "3px 6px", fontSize: "9px" }} 
                    onClick={() => {
                      setPreviewMode("3d");
                      playSuccess();
                    }}
                  >
                    3D Replay
                  </ApertureButton>
                </div>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Progression : {progressVal}%
              </div>
            </div>

            {/* Split layout: logs console on the left, visual grid on the right */}
            <div style={{ display: "flex", gap: "16px", flex: 1, overflow: "hidden", marginBottom: "16px" }}>
              
              <div 
                style={{ 
                  flex: 1, 
                  backgroundColor: "var(--bg-primary)",
                  border: "1px solid var(--border-color)",
                  padding: "16px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "12px",
                  lineHeight: "1.5",
                  color: "var(--text-terminal)",
                  borderRadius: "4px",
                  overflowY: "auto",
                  maxHeight: "340px",
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

              {/* Visual 2D Replay Board or 3D viewport */}
              {activeChamber && (
                <div 
                  style={{ 
                    flex: 1.2, 
                    border: "1px solid var(--border-color)", 
                    borderRadius: "4px",
                    backgroundColor: "var(--bg-primary)",
                    position: "relative",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px",
                    overflow: "hidden"
                  }}
                >
                  {previewMode === "2d" ? (
                    <div 
                      className="editor-grid-bg"
                      style={{
                        width: "100%",
                        height: "100%",
                        maxHeight: "340px",
                        aspectRatio: `${activeChamber.width} / ${activeChamber.height}`,
                        position: "relative",
                        display: "grid",
                        gridTemplateColumns: `repeat(${activeChamber.width}, 1fr)`,
                        gridTemplateRows: `repeat(${activeChamber.height}, 1fr)`,
                        gap: "1px",
                        border: "1px solid rgba(255,255,255,0.03)"
                      }}
                    >
                      {/* Grid elements */}
                      {Array.from({ length: activeChamber.height }).map((_, y) => 
                        Array.from({ length: activeChamber.width }).map((_, x) => {
                          const el = activeChamber.elements.find(e => e.x === x && e.y === y);
                          const glyph = el ? ELEMENT_ICONS[el.type] : null;
                          
                          return (
                            <div 
                              key={`${x}-${y}`}
                              style={{
                                gridColumn: x + 1,
                                gridRow: y + 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "12px",
                                backgroundColor: el?.type === "wall" ? "var(--border-color)" : el?.type === "goo" ? "rgba(0,255,102,0.15)" : "transparent"
                              }}
                            >
                              {glyph}
                            </div>
                          );
                        })
                      )}

                      {/* Lasers and portals overlay */}
                      <svg 
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: "100%",
                          pointerEvents: "none",
                          zIndex: 40
                        }}
                      >
                        {portalBeams.map((beam, i) => {
                          const x1 = ((beam.start.x + 0.5) / activeChamber.width) * 100;
                          const y1 = ((beam.start.y + 0.5) / activeChamber.height) * 100;
                          const x2 = ((beam.end.x + 0.5) / activeChamber.width) * 100;
                          const y2 = ((beam.end.y + 0.5) / activeChamber.height) * 100;
                          return (
                            <line 
                              key={i}
                              x1={`${x1}%`}
                              y1={`${y1}%`}
                              x2={`${x2}%`}
                              y2={`${y2}%`}
                              stroke={beam.color}
                              strokeWidth="2"
                              strokeDasharray="4,4"
                              style={{ filter: "drop-shadow(0 0 3px rgba(0,162,255,0.8))" }}
                            />
                          );
                        })}

                        {laserBeams.map((beam, i) => {
                          const x1 = ((beam.start.x + 0.5) / activeChamber.width) * 100;
                          const y1 = ((beam.start.y + 0.5) / activeChamber.height) * 100;
                          const x2 = ((beam.end.x + 0.5) / activeChamber.width) * 100;
                          const y2 = ((beam.end.y + 0.5) / activeChamber.height) * 100;
                          return (
                            <line 
                              key={i}
                              x1={`${x1}%`}
                              y1={`${y1}%`}
                              x2={`${x2}%`}
                              y2={`${y2}%`}
                              stroke="var(--status-critical)"
                              strokeWidth="2"
                              style={{ filter: "drop-shadow(0 0 2px var(--status-critical))" }}
                            />
                          );
                        })}
                      </svg>

                      {/* Subject avatar */}
                      {subjectCoords && (
                        <div 
                          style={{
                            position: "absolute",
                            left: `${(subjectCoords.x / activeChamber.width) * 100}%`,
                            top: `${(subjectCoords.y / activeChamber.height) * 100}%`,
                            width: `${100 / activeChamber.width}%`,
                            height: `${100 / activeChamber.height}%`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            zIndex: 50,
                            backgroundColor: "rgba(0, 162, 255, 0.15)",
                            borderRadius: "50%",
                            border: "1.5px solid var(--portal-blue)",
                            boxShadow: "0 0 6px var(--portal-blue-glow)",
                            overflow: "hidden",
                            transition: "all 0.5s ease"
                          }}
                        >
                          {activeSubjectPortrait ? (
                            <img
                              src={activeSubjectPortrait}
                              alt={`Portrait du sujet actif ${activeSubject?.alias ?? "inconnu"}`}
                              loading="lazy"
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "block",
                                objectFit: "cover",
                                objectPosition: "center 28%",
                              }}
                            />
                          ) : (
                            <svg
                              role="img"
                              aria-label="Sujet actif"
                              viewBox="0 0 24 24"
                              style={{ width: "72%", height: "72%" }}
                            >
                              <circle cx="12" cy="7" r="3.2" fill="var(--portal-blue)" />
                              <path d="M7 21v-4.2c0-3.2 2.1-5.8 5-5.8s5 2.6 5 5.8V21z" fill="var(--portal-blue)" />
                            </svg>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Chamber3DView 
                      chamber={activeChamber} 
                      subjectCoords={subjectCoords}
                      portalBeams={portalBeams}
                      laserBeams={laserBeams}
                    />
                  )}
                </div>
              )}
            </div>

            {isSimulating && (
              <div className="boot-progress-bar" style={{ margin: 0 }}>
                <span className="boot-progress-fill" style={{ width: `${progressVal}%` }}></span>
              </div>
            )}

            {!isSimulating && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                  Test Clôturé. Statut final : <span style={{ fontWeight: "bold", textTransform: "uppercase", color: currentRun.status.includes("completed") ? "var(--status-nominal)" : "var(--status-critical)" }}>{currentRun.status}</span>
                </span>
                
                <div style={{ display: "flex", gap: "10px" }}>
                  <ApertureButton variant="secondary" onClick={() => { setCurrentRun(null); setSubjectCoords(null); }}>
                    Nouveau Test
                  </ApertureButton>
                  <ApertureButton variant="blue" onClick={() => onNavigate("reports")}>
                    Voir Rapport Clinique
                  </ApertureButton>
                </div>
              </div>
            )}
          </div>

          <div style={{ gridColumn: "span 4", display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="aperture-panel orange" style={{ minHeight: "180px", display: "flex", flexDirection: "column" }}>
              <h4 style={{ margin: "0 0 10px 0", textTransform: "uppercase", fontSize: "11px", color: "var(--portal-orange)", fontFamily: "var(--font-mono)" }}>
                Rétroaction de l'IA
              </h4>
              <p style={{ margin: 0, fontSize: "13px", color: "var(--text-primary)", fontStyle: "italic", lineHeight: "1.5" }}>
                "{currentRun.aiCommentary}"
              </p>
            </div>

            <div className="aperture-panel" style={{ flex: 1, minHeight: "220px", display: "flex", flexDirection: "column" }}>
              <h4 style={{ margin: "0 0 10px 0", textTransform: "uppercase", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                Flux de Rendement de Données
              </h4>

              <div style={{ flex: 1, position: "relative", backgroundColor: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "4px", padding: "6px" }}>
                <svg width="100%" height="120" viewBox="0 0 320 120" preserveAspectRatio="none">
                  <line x1="0" y1="30" x2="320" y2="30" stroke="var(--grid-line)" strokeDasharray="2" />
                  <line x1="0" y1="60" x2="320" y2="60" stroke="var(--grid-line)" strokeDasharray="2" />
                  <line x1="0" y1="90" x2="320" y2="90" stroke="var(--grid-line)" strokeDasharray="2" />
                  
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
