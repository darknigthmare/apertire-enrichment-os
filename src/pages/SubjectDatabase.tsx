import React, { useState, useEffect } from "react";
import { localDb } from "../db/localDb";
import type { TestSubject } from "../types";
import { ApertureButton } from "../components/ApertureButton";
import { AlertBadge } from "../components/AlertBadge";
import { ApertureModal } from "../components/ApertureModal";
import { playSuccess } from "../components/soundSynth";
import { subjectPortraits } from "../data/visualAssets";

export const SubjectDatabase: React.FC = () => {
  const [subjects, setSubjects] = useState<TestSubject[]>([]);
  const [filterType, setFilterType] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [alias, setAlias] = useState("");
  const [type, setType] = useState<TestSubject["type"]>("human");
  const [compliance, setCompliance] = useState(50);
  const [tenacity, setTenacity] = useState(50);
  const [portalAptitude, setPortalAptitude] = useState(50);
  const [cubeAttachment, setCubeAttachment] = useState(10);
  const [fearResponse, setFearResponse] = useState(50);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setSubjects(localDb.getSubjects());
  }, []);

  const refreshSubjects = () => {
    setSubjects(localDb.getSubjects());
  };

  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias) return;

    const newSubj: TestSubject = {
      id: `subj_${Math.random().toString(36).substr(2, 9)}`,
      type,
      alias,
      status: "ready",
      compliance: Number(compliance),
      tenacity: Number(tenacity),
      portalAptitude: Number(portalAptitude),
      cubeAttachment: Number(cubeAttachment),
      fearResponse: Number(fearResponse),
      notes,
      survivalProbability: Math.round(
        (Number(compliance) * 0.3 + Number(tenacity) * 0.4 + Number(portalAptitude) * 0.3) *
          (1 - Number(fearResponse) * 0.003)
      ),
    };

    if (type === "android") {
      newSubj.colorLabel = Math.random() > 0.5 ? "Blue" : "Orange";
      newSubj.teamworkIndex = 70;
      newSubj.reassemblyCount = 0;
      newSubj.gestureFrequency = 50;
      newSubj.trustInstability = 40;
      newSubj.portalSyncScore = 90;
    }

    localDb.saveSubject(newSubj);
    localDb.addLog("sys_stasis", "REGISTER", `Nouveau sujet enregistré : ${alias} (${type.toUpperCase()}).`, "success");
    
    setIsModalOpen(false);
    refreshSubjects();
    playSuccess();

    // Reset form
    setAlias("");
    setCompliance(50);
    setTenacity(50);
    setPortalAptitude(50);
    setCubeAttachment(10);
    setFearResponse(50);
    setNotes("");
  };

  const filteredSubjects = subjects.filter((s) => {
    if (filterType !== "all" && s.type !== filterType) return false;
    return true;
  });

  return (
    <div className="subjects-view log-line">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", textTransform: "uppercase" }}>Registre des Sujets de Test</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>
            Consultez les indices de compliance, les profils psychologiques et l'aptitude cinétique des cobayes stockés.
          </p>
        </div>
        <ApertureButton variant="success" onClick={() => setIsModalOpen(true)}>
          + Enregistrer Cobaye
        </ApertureButton>
      </div>

      {/* Filter toolbar */}
      <div 
        className="aperture-panel" 
        style={{ 
          marginBottom: "20px", 
          display: "flex", 
          gap: "16px", 
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: "var(--bg-tertiary)"
        }}
      >
        <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Filtrer par Type :</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <ApertureButton variant={filterType === "all" ? "blue" : "secondary"} style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => setFilterType("all")}>
            Tous
          </ApertureButton>
          <ApertureButton variant={filterType === "human" ? "blue" : "secondary"} style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => setFilterType("human")}>
            Humains
          </ApertureButton>
          <ApertureButton variant={filterType === "android" ? "blue" : "secondary"} style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => setFilterType("android")}>
            Androïdes
          </ApertureButton>
          <ApertureButton variant={filterType === "unknown" ? "blue" : "secondary"} style={{ padding: "4px 10px", fontSize: "11px" }} onClick={() => setFilterType("unknown")}>
            Anomalies
          </ApertureButton>
        </div>
      </div>

      {/* Grid of Subject Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 360px), 1fr))", gap: "20px" }}>
        {filteredSubjects.map((s) => {
          const portrait = subjectPortraits[s.id];

          return (
            <div
              key={s.id}
              className={`aperture-panel ${s.type === "android" ? "blue" : s.type === "unknown" ? "red" : "orange"}`}
              style={{ display: "flex", flexDirection: "column", minHeight: "280px", overflow: "hidden" }}
            >
            {portrait && (
              <div
                style={{
                  width: "100%",
                  aspectRatio: "16 / 9",
                  maxHeight: "180px",
                  marginBottom: "14px",
                  overflow: "hidden",
                  border: "1px solid var(--border-color)",
                  borderRadius: "3px",
                  backgroundColor: "var(--bg-primary)",
                }}
              >
                <img
                  src={portrait}
                  alt={`Portrait de dossier généré pour ${s.alias}`}
                  loading="lazy"
                  decoding="async"
                  style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center 30%",
                  }}
                />
              </div>
            )}

            {/* Title card */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {!portrait && (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="var(--text-primary)" strokeWidth="2" aria-hidden="true">
                    {s.type === "human" ? (
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                    ) : s.type === "android" ? (
                      <rect x="3" y="11" width="18" height="10" rx="2" />
                    ) : (
                      <path d="M12 2L2 22h20L12 2zm0 14h.01M12 10v3" stroke="var(--status-critical)" />
                    )}
                  </svg>
                )}
                <h3 style={{ margin: 0, fontSize: "15px", color: "var(--text-primary)" }}>{s.alias}</h3>
              </div>
              <AlertBadge 
                severity={
                  s.status === "ready" 
                    ? "success" 
                    : s.status === "testing" 
                    ? "warning" 
                    : s.status === "stasis" 
                    ? "info" 
                    : "error"
                } 
                label={s.status} 
              />
            </div>

            {/* Sub-label */}
            <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "14px" }}>
              TYPE: {s.type} | SURVIE SIMULÉE: {s.survivalProbability}%
            </div>

            {/* Note text */}
            <p style={{ margin: "0 0 16px 0", fontSize: "12.5px", color: "var(--text-secondary)", flex: 1 }}>
              {s.notes}
            </p>

            {/* Telemetry charts */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
              
              {/* Compliance slider representation */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Compliance</span>
                  <span style={{ color: "var(--text-primary)" }}>{s.compliance}%</span>
                </div>
                <div className="boot-progress-bar" style={{ margin: 0, height: "4px" }}>
                  <span className="boot-progress-fill" style={{ width: `${s.compliance}%`, backgroundColor: "var(--portal-blue)" }}></span>
                </div>
              </div>

              {/* Tenacity */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                  <span style={{ color: "var(--text-muted)" }}>Ténacité</span>
                  <span style={{ color: "var(--text-primary)" }}>{s.tenacity}%</span>
                </div>
                <div className="boot-progress-bar" style={{ margin: 0, height: "4px" }}>
                  <span className="boot-progress-fill" style={{ width: `${s.tenacity}%`, backgroundColor: "var(--portal-orange)" }}></span>
                </div>
              </div>

              {/* Special android stats */}
              {s.type === "android" && (
                <div 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(3, 1fr)", 
                    gap: "8px", 
                    fontSize: "10px", 
                    fontFamily: "var(--font-mono)", 
                    marginTop: "6px",
                    color: "var(--text-secondary)",
                    backgroundColor: "rgba(0, 162, 255, 0.05)",
                    padding: "6px",
                    borderRadius: "2px"
                  }}
                >
                  <div>Reassemblies: {s.reassemblyCount}</div>
                  <div>Teamwork: {s.teamworkIndex}%</div>
                  <div>Sync Score: {s.portalSyncScore}%</div>
                </div>
              )}

            </div>
            </div>
          );
        })}
      </div>

      {/* Creation Modal */}
      <ApertureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Enregistrer un nouveau sujet de test">
        <form onSubmit={handleCreateSubject} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
              Alias / Matricule *
            </label>
            <input 
              type="text" 
              placeholder="Ex: Sujet 881, Android Unit Red" 
              value={alias} 
              onChange={(e) => setAlias(e.target.value)}
              style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
              required 
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
              Classification du Sujet
            </label>
            <select 
              value={type} 
              onChange={(e) => setType(e.target.value as TestSubject["type"])}
              style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
            >
              <option value="human">Human Test Subject (Combinaison Orange)</option>
              <option value="android">Android Cooperative Unit (Cœur métallique)</option>
              <option value="unknown">Unknown Class (Anomalie de stase)</option>
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px" }}>
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
                <span>Compliance</span>
                <span>{compliance}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={compliance} 
                onChange={(e) => setCompliance(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--portal-blue)" }}
              />
            </div>
            
            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
                <span>Ténacité</span>
                <span>{tenacity}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={tenacity} 
                onChange={(e) => setTenacity(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--portal-orange)" }}
              />
            </div>

            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
                <span>Aptitude Portails</span>
                <span>{portalAptitude}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={portalAptitude} 
                onChange={(e) => setPortalAptitude(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--portal-blue)" }}
              />
            </div>

            <div>
              <label style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
                <span>Réponse d'Angoisse</span>
                <span>{fearResponse}%</span>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={fearResponse} 
                onChange={(e) => setFearResponse(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--status-critical)" }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
              Attachement Affectif (Cube) : {cubeAttachment}%
            </label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={cubeAttachment} 
              onChange={(e) => setCubeAttachment(Number(e.target.value))}
              style={{ width: "100%", accentColor: "var(--portal-orange)" }}
            />
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
              Observations Cliniques
            </label>
            <textarea 
              rows={3} 
              placeholder="Ex: Montre des signes de docilité modérée mais panique en présence de lasers tactiles..." 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px", fontFamily: "var(--font-sans)", resize: "none" }}
            />
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <ApertureButton variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Annuler
            </ApertureButton>
            <ApertureButton variant="success" type="submit">
              Enregistrer
            </ApertureButton>
          </div>
        </form>
      </ApertureModal>
    </div>
  );
};
