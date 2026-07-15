import React, { useState, useEffect } from "react";
import { localDb } from "../db/localDb";
import type { Chamber, ChamberStyle } from "../types";
import { ApertureButton } from "../components/ApertureButton";
import { AlertBadge } from "../components/AlertBadge";
import { ApertureModal } from "../components/ApertureModal";
import { playBeep, playSuccess } from "../components/soundSynth";
import { chamberThumbnails } from "../data/visualAssets";

interface ChamberRegistryProps {
  onNavigate: (page: string, params?: any) => void;
}

export const ChamberRegistry: React.FC<ChamberRegistryProps> = ({ onNavigate }) => {
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [filterStyle, setFilterStyle] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterHazard, setFilterHazard] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>("number");
  
  // Creation modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newChamberName, setNewChamberName] = useState("");
  const [newChamberNumber, setNewChamberNumber] = useState("");
  const [newChamberStyle, setNewChamberStyle] = useState<ChamberStyle>("clinical");
  const [newChamberWidth, setNewChamberWidth] = useState(12);
  const [newChamberHeight, setNewChamberHeight] = useState(8);

  useEffect(() => {
    setChambers(localDb.getChambers());
  }, []);

  const refreshChambers = () => {
    setChambers(localDb.getChambers());
  };

  const handleDuplicate = (ch: Chamber) => {
    const newNumber = `${ch.number}-DUP`;
    const duplicatedChamber: Chamber = {
      ...ch,
      id: `chamber_${Math.random().toString(36).substr(2, 9)}`,
      number: newNumber,
      name: `${ch.name} (Copy)`,
      status: "draft",
    };
    localDb.saveChamber(duplicatedChamber);
    localDb.addLog("sys_panels", "DUPLICATE", `Chambre ${ch.number} dupliquée en ${newNumber}.`, "info");
    refreshChambers();
    playSuccess();
  };

  const handleDelete = (id: string, number: string) => {
    if (window.confirm(`Confirmer la démolition de la Chambre ${number} ? Cette action est irréversible.`)) {
      localDb.deleteChamber(id);
      localDb.addLog("sys_panels", "DELETE", `Chambre ${number} démolie par l'administrateur.`, "warning");
      refreshChambers();
      playBeep(220, 0.2, "sawtooth");
    }
  };

  const handleArchive = (ch: Chamber) => {
    const updated: Chamber = { ...ch, status: "condemned" };
    localDb.saveChamber(updated);
    localDb.addLog("sys_panels", "LOCKDOWN", `Chambre ${ch.number} marquée comme condamnée (instable).`, "critical");
    refreshChambers();
    playBeep(330, 0.15, "triangle");
  };

  const handleCreateChamber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChamberName || !newChamberNumber) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    const newCh: Chamber = {
      id: `chamber_${Math.random().toString(36).substr(2, 9)}`,
      number: newChamberNumber,
      name: newChamberName,
      style: newChamberStyle,
      width: Number(newChamberWidth),
      height: Number(newChamberHeight),
      difficulty: 1,
      hazardLevel: 0,
      status: "draft",
      elements: [
        { id: "ent", type: "entrance", x: 1, y: Math.floor(newChamberHeight / 2), rotation: 90, active: true },
        { id: "exi", type: "exit", x: newChamberWidth - 2, y: Math.floor(newChamberHeight / 2), rotation: 270, active: true }
      ],
      objectives: ["reach_exit"],
      successConditions: ["reach_exit"],
      failureConditions: ["chamber_timeout"],
      notes: "Nouvelle grille expérimentale initialisée.",
      solvability: 100
    };

    localDb.saveChamber(newCh);
    localDb.addLog("sys_panels", "CREATE", `Grille de test ${newChamberNumber} créée en mode Draft.`, "success");
    setIsModalOpen(false);
    refreshChambers();
    playSuccess();

    // Redirect to editor
    onNavigate("editor", { id: newCh.id });
  };

  // Filter & Sort logic
  const filteredChambers = chambers
    .filter((ch) => {
      if (filterStyle !== "all" && ch.style !== filterStyle) return false;
      if (filterStatus !== "all" && ch.status !== filterStatus) return false;
      if (filterHazard) {
        // Must contain hazardous elements
        const hazards = ["turret", "goo", "incinerator", "laser_emitter"];
        return ch.elements?.some((e) => hazards.includes(e.type));
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "number") {
        return a.number.localeCompare(b.number, undefined, { numeric: true });
      }
      if (sortBy === "difficulty") {
        return b.difficulty - a.difficulty;
      }
      if (sortBy === "hazardLevel") {
        return b.hazardLevel - a.hazardLevel;
      }
      return 0;
    });

  const getStyleColorClass = (style: ChamberStyle) => {
    switch (style) {
      case "clinical": return "clinical";
      case "reconstructed": return "blue";
      case "decayed": return "amber";
      case "rebuilding": return "amber";
      case "old_aperture": return "orange";
      case "chaotic_core": return "red";
      case "cooperative": return "blue";
      default: return "";
    }
  };

  return (
    <div className="registry-view log-line">
      {/* Header with Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: "0 0 4px 0", textTransform: "uppercase" }}>Registre des Chambres de Test</h2>
          <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "13px" }}>
            Supervisez, éditez et clonez les modèles de configuration spatiale du Complexe.
          </p>
        </div>
        <ApertureButton variant="success" onClick={() => setIsModalOpen(true)}>
          + Nouvelle Chambre
        </ApertureButton>
      </div>

      {/* Filters Toolbar */}
      <div 
        className="aperture-panel" 
        style={{ 
          marginBottom: "20px", 
          display: "flex", 
          flexWrap: "wrap", 
          gap: "16px", 
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: "var(--bg-tertiary)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Style :</span>
          <select 
            value={filterStyle} 
            onChange={(e) => setFilterStyle(e.target.value)}
            style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", fontSize: "12px", borderRadius: "2px" }}
          >
            <option value="all">Tous les styles</option>
            <option value="clinical">Clinical (Portal 1)</option>
            <option value="reconstructed">Reconstructed (Portal 2)</option>
            <option value="decayed">Decayed (Végétation)</option>
            <option value="rebuilding">Rebuilding (En reconstruction)</option>
            <option value="old_aperture">Old Aperture (1950s-1980s)</option>
            <option value="chaotic_core">Chaotic Core (Wheatley)</option>
            <option value="cooperative">Cooperative (Co-op)</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Statut :</span>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", fontSize: "12px", borderRadius: "2px" }}
          >
            <option value="all">Tous les statuts</option>
            <option value="draft">Draft</option>
            <option value="calibrated">Calibrated</option>
            <option value="queued">Queued</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="locked">Locked</option>
            <option value="condemned">Condemned</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Trier par :</span>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", fontSize: "12px", borderRadius: "2px" }}
          >
            <option value="number">Numéro de chambre</option>
            <option value="difficulty">Difficulté</option>
            <option value="hazardLevel">Niveau de Danger</option>
          </select>
        </div>

        <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", fontSize: "12px", color: "var(--text-secondary)" }}>
          <input 
            type="checkbox" 
            checked={filterHazard} 
            onChange={(e) => setFilterHazard(e.target.checked)}
            style={{ accentColor: "var(--portal-blue)" }}
          />
          Éléments Dangereux uniquement
        </label>
      </div>

      {/* Grid of Chambers */}
      {filteredChambers.length === 0 ? (
        <div className="aperture-panel" style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)", fontSize: "14px" }}>
          Aucune chambre expérimentale ne correspond aux filtres appliqués.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 340px), 1fr))", gap: "20px" }}>
          {filteredChambers.map((ch) => {
            const thumbnail = chamberThumbnails[ch.id];
            
            return (
              <div 
                key={ch.id} 
                className={`aperture-panel ${getStyleColorClass(ch.style)}`}
                style={{ display: "flex", flexDirection: "column", minHeight: "220px" }}
              >
                {/* Card Title Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "12px" }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: "20px", fontWeight: "bold", fontFamily: "var(--font-mono)", color: "var(--text-primary)", marginRight: "8px" }}>
                      {ch.number}
                    </span>
                    <h3 style={{ display: "inline", margin: 0, fontSize: "14px", fontWeight: "bold", color: "var(--text-primary)", overflowWrap: "anywhere" }}>
                      {ch.name}
                    </h3>
                  </div>
                  <AlertBadge 
                    severity={
                      ch.status === "calibrated" || ch.status === "completed" 
                        ? "success" 
                        : ch.status === "condemned" || ch.status === "failed"
                        ? "error"
                        : ch.status === "draft"
                        ? "info"
                        : "warning"
                    }
                    label={ch.status}
                  />
                </div>

                {thumbnail && (
                  <img
                    src={thumbnail}
                    alt={`Apercu genere de la chambre ${ch.number} - ${ch.name}`}
                    loading="lazy"
                    decoding="async"
                    width={960}
                    height={540}
                    className="chamber-card-thumbnail"
                  />
                )}

                {/* Subtitle / Style tag */}
                <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginBottom: "10px" }}>
                  STYLE : {ch.style.replace("_", " ")} | TAILLE : {ch.width}x{ch.height}
                </div>

                <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "var(--text-secondary)", flex: 1, minHeight: "36px" }}>
                  {ch.notes || "Aucune note expérimentale disponible."}
                </p>

                {/* Metrics */}
                <div 
                  style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(3, 1fr)", 
                    gap: "8px", 
                    fontSize: "11px", 
                    fontFamily: "var(--font-mono)", 
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "10px",
                    marginBottom: "14px",
                    color: "var(--text-secondary)"
                  }}
                >
                  <div>
                    Difficulté: <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>{ch.difficulty}/10</span>
                  </div>
                  <div>
                    Danger: <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>{ch.hazardLevel}/10</span>
                  </div>
                  <div>
                    Objets: <span style={{ color: "var(--text-primary)", fontWeight: "bold" }}>{ch.elements?.length || 0}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  <ApertureButton variant="blue" style={{ padding: "6px 10px", fontSize: "11px" }} onClick={() => onNavigate("editor", { id: ch.id })}>
                    Éditer
                  </ApertureButton>
                  
                  {ch.status !== "condemned" && (
                    <ApertureButton variant="secondary" style={{ padding: "6px 10px", fontSize: "11px" }} onClick={() => onNavigate("test-runner", { chamberId: ch.id })}>
                      Tester
                    </ApertureButton>
                  )}

                  <ApertureButton variant="secondary" style={{ padding: "6px 10px", fontSize: "11px" }} onClick={() => handleDuplicate(ch)}>
                    Dupliquer
                  </ApertureButton>

                  {ch.status !== "condemned" && (
                    <ApertureButton variant="warning" style={{ padding: "6px 10px", fontSize: "11px" }} onClick={() => handleArchive(ch)}>
                      Condamner
                    </ApertureButton>
                  )}

                  <ApertureButton variant="danger" style={{ padding: "6px 10px", fontSize: "11px" }} onClick={() => handleDelete(ch.id, ch.number)}>
                    Démolir
                  </ApertureButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Creation Modal */}
      <ApertureModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Créer une nouvelle Grille Expérimentale">
        <form onSubmit={handleCreateChamber} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                Numéro *
              </label>
              <input 
                type="text" 
                placeholder="Ex: 08, X-04" 
                value={newChamberNumber} 
                onChange={(e) => setNewChamberNumber(e.target.value)}
                style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
                required 
              />
            </div>
            
            <div style={{ flex: 3 }}>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                Nom de la Chambre *
              </label>
              <input 
                type="text" 
                placeholder="Ex: Dispositif d'Impulsion Cinétique" 
                value={newChamberName} 
                onChange={(e) => setNewChamberName(e.target.value)}
                style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
                required 
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
              Style Visuel
            </label>
            <select 
              value={newChamberStyle} 
              onChange={(e) => setNewChamberStyle(e.target.value as ChamberStyle)}
              style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
            >
              <option value="clinical">Clinical (Aperture Standard v1)</option>
              <option value="reconstructed">Reconstructed (Aperture Standard v2)</option>
              <option value="decayed">Decayed (Ruines Végétales)</option>
              <option value="rebuilding">Rebuilding (Bras mobiles)</option>
              <option value="old_aperture">Old Aperture (Béton et Sel 1970)</option>
              <option value="chaotic_core">Chaotic Core (Erreurs de système)</option>
              <option value="cooperative">Cooperative Testing (Double sujet)</option>
            </select>
          </div>

          <div style={{ display: "flex", gap: "16px" }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                Largeur (Grille)
              </label>
              <input 
                type="number" 
                min="6" 
                max="24" 
                value={newChamberWidth} 
                onChange={(e) => setNewChamberWidth(Number(e.target.value))}
                style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
              />
            </div>
            
            <div style={{ flex: 1 }}>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                Hauteur (Grille)
              </label>
              <input 
                type="number" 
                min="6" 
                max="20" 
                value={newChamberHeight} 
                onChange={(e) => setNewChamberHeight(Number(e.target.value))}
                style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
              />
            </div>
          </div>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
            <ApertureButton variant="secondary" type="button" onClick={() => setIsModalOpen(false)}>
              Annuler
            </ApertureButton>
            <ApertureButton variant="success" type="submit">
              Initialiser
            </ApertureButton>
          </div>
        </form>
      </ApertureModal>
    </div>
  );
};
