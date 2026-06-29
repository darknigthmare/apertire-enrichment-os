import React, { useState, useEffect } from "react";
import { localDb } from "../db/localDb";
import type { Chamber, ChamberElement, ElementType, ValidationIssue } from "../types";
import { ApertureButton } from "../components/ApertureButton";
import { validateChamber, estimateSolvability, estimateHazard, estimateDifficulty } from "../simulation/validation";
import { playSuccess, playBeep, playPortalOpen } from "../components/soundSynth";

interface ChamberEditorProps {
  chamberId: string;
  onNavigate: (page: string, params?: any) => void;
}

const PALETTE_ITEMS: { type: ElementType; label: string; icon: string }[] = [
  { type: "wall", label: "Mur non-portalable", icon: "🧱" },
  { type: "portalable_panel", label: "Panneau Portalable", icon: "⬜" },
  { type: "non_portalable_panel", label: "Panneau Inactif", icon: "⬛" },
  { type: "goo", label: "Acide Mortel", icon: "🧪" },
  { type: "entrance", label: "Sas d'Entrée", icon: "🚪" },
  { type: "exit", label: "Sas de Sortie", icon: "🏁" },
  { type: "button", label: "Bouton Lesté", icon: "🔴" },
  { type: "cube", label: "Cube Lesté", icon: "📦" },
  { type: "companion_cube", label: "Cube Compagnon", icon: "💖" },
  { type: "turret", label: "Tourelle Sentinelle", icon: "🤖" },
  { type: "laser_emitter", label: "Émetteur Laser", icon: "🚨" },
  { type: "laser_receiver", label: "Récepteur Laser", icon: "🎯" },
  { type: "redirection_cube", label: "Cube Réflecteur", icon: "💎" },
  { type: "faith_plate", label: "Plaque de Foi", icon: "🔼" },
  { type: "hard_light_bridge", label: "Pont de Lumière", icon: "🌁" },
  { type: "excursion_funnel", label: "Funnel de Gravité", icon: "🌀" },
  { type: "repulsion_gel_source", label: "Gel Répulsif (Bleu)", icon: "🔵" },
  { type: "propulsion_gel_source", label: "Gel Propulsif (Orange)", icon: "🟠" },
  { type: "damaged_panel", label: "Panneau Cassé", icon: "💥" },
  { type: "vegetation", label: "Flore Envahissante", icon: "🌿" }
];

export const ChamberEditor: React.FC<ChamberEditorProps> = ({ chamberId, onNavigate }) => {
  const [chamber, setChamber] = useState<Chamber | null>(null);
  const [selectedTool, setSelectedTool] = useState<ElementType | "select" | "delete">("select");
  const [selectedElement, setSelectedElement] = useState<ChamberElement | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  useEffect(() => {
    const ch = localDb.getChamber(chamberId);
    if (ch) {
      setChamber(ch);
      setValidationIssues(validateChamber(ch));
    }
  }, [chamberId]);

  const handleCellClick = (x: number, y: number) => {
    if (!chamber) return;

    const existingIdx = chamber.elements.findIndex((e) => e.x === x && e.y === y);

    if (selectedTool === "select") {
      if (existingIdx >= 0) {
        setSelectedElement(chamber.elements[existingIdx]);
        playBeep(600, 0.05);
      } else {
        setSelectedElement(null);
      }
      return;
    }

    if (selectedTool === "delete") {
      if (existingIdx >= 0) {
        const deleted = chamber.elements[existingIdx];
        const updatedElements = chamber.elements.filter((_, i) => i !== existingIdx);
        
        // Remove links referencing this element
        const cleaned = updatedElements.map((el) => {
          if (el.linkedTo) {
            return { ...el, linkedTo: el.linkedTo.filter((id) => id !== deleted.id) };
          }
          return el;
        });

        updateChamberState({ ...chamber, elements: cleaned });
        setSelectedElement(null);
        playBeep(220, 0.15, "sawtooth");
      }
      return;
    }

    // Placing an item
    const newItem: ChamberElement = {
      id: `el_${Math.random().toString(36).substr(2, 9)}`,
      type: selectedTool,
      x,
      y,
      rotation: 0,
      active: true,
    };

    let updatedElements = [...chamber.elements];
    if (existingIdx >= 0) {
      // Overwrite existing cell item
      updatedElements[existingIdx] = newItem;
    } else {
      updatedElements.push(newItem);
    }

    updateChamberState({ ...chamber, elements: updatedElements });
    setSelectedElement(newItem);
    
    if (selectedTool === "portalable_panel") {
      playPortalOpen(false);
    } else {
      playBeep(880, 0.05, "sine");
    }
  };

  const updateChamberState = (updatedChamber: Chamber) => {
    // Recalculate metrics on state update
    const issues = validateChamber(updatedChamber);
    const solvability = estimateSolvability(updatedChamber);
    const hazard = estimateHazard(updatedChamber);
    const difficulty = estimateDifficulty(updatedChamber);

    const finalChamber = {
      ...updatedChamber,
      solvability,
      hazardLevel: hazard,
      difficulty,
    };

    setChamber(finalChamber);
    setValidationIssues(issues);
    localDb.saveChamber(finalChamber);
  };

  const handleUpdateElement = (updatedEl: Partial<ChamberElement>) => {
    if (!chamber || !selectedElement) return;

    const updatedElements = chamber.elements.map((el) => {
      if (el.id === selectedElement.id) {
        const newEl = { ...el, ...updatedEl };
        setSelectedElement(newEl);
        return newEl;
      }
      return el;
    });

    updateChamberState({ ...chamber, elements: updatedElements });
  };

  const handleStartLink = () => {
    if (!selectedElement) return;
    setIsLinking(true);
    playBeep(440, 0.1);
  };

  const handleSelectLinkTarget = (target: ChamberElement) => {
    if (!chamber || !selectedElement || !isLinking) return;

    if (target.id === selectedElement.id) {
      setIsLinking(false);
      return;
    }

    const currentLinks = selectedElement.linkedTo || [];
    let updatedLinks = [...currentLinks];
    
    if (updatedLinks.includes(target.id)) {
      // Remove linkage if exists
      updatedLinks = updatedLinks.filter((id) => id !== target.id);
    } else {
      updatedLinks.push(target.id);
    }

    handleUpdateElement({
      linkedTo: updatedLinks,
      triggerCondition: selectedElement.triggerCondition || "on_press"
    });

    setIsLinking(false);
    playSuccess();
  };

  if (!chamber) {
    return (
      <div className="aperture-panel" style={{ color: "var(--text-muted)", textAlign: "center", padding: "40px" }}>
        Chargement de l'éditeur spatial...
      </div>
    );
  }

  // Draw grid helper
  const gridCells = [];
  for (let y = 0; y < chamber.height; y++) {
    for (let x = 0; x < chamber.width; x++) {
      const element = chamber.elements.find((e) => e.x === x && e.y === y);
      const isSelected = selectedElement && selectedElement.x === x && selectedElement.y === y;
      
      gridCells.push(
        <div
          key={`${x}-${y}`}
          onClick={() => {
            if (isLinking && element) {
              handleSelectLinkTarget(element);
            } else {
              handleCellClick(x, y);
            }
          }}
          className={`grid-cell ${isSelected ? "selected" : ""} ${element ? `cell-${element.type}` : ""}`}
          style={{
            gridColumn: x + 1,
            gridRow: y + 1,
            border: "1px solid var(--border-color)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            cursor: "pointer",
            backgroundColor: isSelected ? "var(--bg-active)" : "transparent",
            transform: element ? `rotate(${element.rotation}deg)` : "none",
            transition: "all 0.1s ease",
            position: "relative"
          }}
          title={element ? `${element.type} (x:${x}, y:${y})` : `Case vide (x:${x}, y:${y})`}
        >
          {element ? (
            PALETTE_ITEMS.find((p) => p.type === element.type)?.icon || "❓"
          ) : (
            <span style={{ fontSize: "9px", color: "var(--border-color)", userSelect: "none" }}>+</span>
          )}
          
          {/* Linked connection markers */}
          {element && element.linkedTo && element.linkedTo.length > 0 && (
            <span style={{ position: "absolute", bottom: "1px", right: "2px", fontSize: "9px", color: "var(--portal-blue)" }}>🔗</span>
          )}
        </div>
      );
    }
  }

  return (
    <div className="editor-view log-line" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
      
      {/* 1. Left Side Element Palette (3 cols) */}
      <div className="aperture-panel" style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
        <h3 style={{ margin: "0 0 12px 0", textTransform: "uppercase", fontSize: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
          Palette d'Éléments
        </h3>

        {/* Global modes selection */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "6px", marginBottom: "12px" }}>
          <ApertureButton 
            variant={selectedTool === "select" ? "blue" : "secondary"} 
            style={{ padding: "6px", fontSize: "10px" }}
            onClick={() => setSelectedTool("select")}
          >
            SÉLECT.
          </ApertureButton>
          <ApertureButton 
            variant={selectedTool === "delete" ? "danger" : "secondary"} 
            style={{ padding: "6px", fontSize: "10px" }}
            onClick={() => setSelectedTool("delete")}
          >
            GOMME
          </ApertureButton>
          <ApertureButton 
            variant="terminal" 
            style={{ padding: "6px", fontSize: "10px" }}
            onClick={() => onNavigate("chambers")}
          >
            FERMER
          </ApertureButton>
        </div>

        {/* Scrollable list of components */}
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
          {PALETTE_ITEMS.map((item) => (
            <button
              key={item.type}
              onClick={() => {
                setSelectedTool(item.type);
                playBeep(880, 0.05);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px 10px",
                backgroundColor: selectedTool === item.type ? "var(--bg-active)" : "var(--bg-secondary)",
                color: selectedTool === item.type ? "var(--text-primary)" : "var(--text-secondary)",
                border: selectedTool === item.type ? "1px solid var(--portal-blue)" : "1px solid var(--border-color)",
                borderRadius: "3px",
                cursor: "pointer",
                textAlign: "left",
                fontSize: "12px",
                transition: "all 0.15s ease"
              }}
            >
              <span style={{ fontSize: "18px" }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Central Editor Canvas Grid (6 cols) */}
      <div 
        className="aperture-panel" 
        style={{ 
          gridColumn: "span 6", 
          display: "flex", 
          flexDirection: "column", 
          maxHeight: "80vh",
          overflow: "hidden" 
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0, textTransform: "uppercase", fontSize: "13px" }}>
            Chambre {chamber.number} - Grid ({chamber.width}x{chamber.height})
          </h3>
          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            Difficulté : {chamber.difficulty}/10 | Solvabilité : {chamber.solvability}%
          </div>
        </div>

        {/* Viewport viewport */}
        <div 
          className="editor-grid-bg"
          style={{ 
            flex: 1, 
            border: "1px solid var(--border-color)", 
            borderRadius: "4px",
            display: "grid",
            gridTemplateColumns: `repeat(${chamber.width}, 1fr)`,
            gridTemplateRows: `repeat(${chamber.height}, 1fr)`,
            gap: "1px",
            overflow: "auto",
            minHeight: "350px",
            padding: "8px"
          }}
        >
          {gridCells}
        </div>

        {/* Validation log details at bottom */}
        <div 
          style={{ 
            marginTop: "12px", 
            borderTop: "1px solid var(--border-color)", 
            paddingTop: "10px",
            maxHeight: "130px",
            overflowY: "auto"
          }}
        >
          <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
            Alertes de Calibrage IA :
          </span>
          {validationIssues.length === 0 ? (
            <div style={{ fontSize: "11px", color: "var(--status-nominal)", fontFamily: "var(--font-mono)" }}>
              &gt; Géométrie de chambre valide. Taux de survie théorique optimal.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {validationIssues.map((issue, idx) => (
                <div 
                  key={idx} 
                  style={{ 
                    fontSize: "11px", 
                    color: `var(--status-${issue.severity === "error" ? "critical" : "warning"})`, 
                    fontFamily: "var(--font-mono)" 
                  }}
                >
                  &gt; [{issue.severity.toUpperCase()}] {issue.message}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. Right Side Elements Properties panel (3 cols) */}
      <div className="aperture-panel" style={{ gridColumn: "span 3", display: "flex", flexDirection: "column", maxHeight: "80vh" }}>
        <h3 style={{ margin: "0 0 12px 0", textTransform: "uppercase", fontSize: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
          Propriétés Cellule
        </h3>

        {selectedElement ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px", flex: 1 }}>
            
            {/* Element Info header */}
            <div style={{ backgroundColor: "var(--bg-tertiary)", padding: "8px", borderRadius: "3px" }}>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", fontFamily: "var(--font-mono)" }}>Type Sélectionné</div>
              <div style={{ fontSize: "14px", color: "var(--text-primary)", fontWeight: "bold", display: "flex", alignItems: "center", gap: "6px" }}>
                <span>{PALETTE_ITEMS.find((p) => p.type === selectedElement.type)?.icon}</span>
                <span>{selectedElement.type.replace("_", " ")}</span>
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", marginTop: "4px" }}>
                Position: x:{selectedElement.x}, y:{selectedElement.y} | ID: {selectedElement.id.substring(0, 8)}
              </div>
            </div>

            {/* Custom Label input */}
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
                Label de l'Élément
              </label>
              <input 
                type="text" 
                value={selectedElement.label || ""} 
                placeholder="Ex: Porte Ascenseur"
                onChange={(e) => handleUpdateElement({ label: e.target.value })}
                style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "6px", fontSize: "12px", borderRadius: "2px" }}
              />
            </div>

            {/* Rotator controller */}
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                Orientation (Rotation)
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "4px" }}>
                {[0, 90, 180, 270].map((rot) => (
                  <ApertureButton 
                    key={rot} 
                    variant={selectedElement.rotation === rot ? "blue" : "secondary"}
                    style={{ padding: "4px", fontSize: "10px" }}
                    onClick={() => handleUpdateElement({ rotation: rot })}
                  >
                    {rot}°
                  </ApertureButton>
                ))}
              </div>
            </div>

            {/* Trigger linkage controller */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "12px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                Connexions & Logique Triggers
              </label>

              {isLinking ? (
                <div 
                  style={{ 
                    padding: "8px", 
                    border: "1px dashed var(--portal-orange)", 
                    borderRadius: "3px", 
                    fontSize: "11px", 
                    color: "var(--portal-orange)",
                    backgroundColor: "rgba(255, 123, 0, 0.05)",
                    textAlign: "center"
                  }}
                >
                  Sélectionnez la cellule cible sur la grille centrale...
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <ApertureButton variant="orange" style={{ width: "100%", fontSize: "11px", padding: "6px" }} onClick={handleStartLink}>
                    {selectedElement.linkedTo && selectedElement.linkedTo.length > 0 ? "Modifier les Liens" : "Lier à un composant"}
                  </ApertureButton>
                  
                  {selectedElement.linkedTo && selectedElement.linkedTo.length > 0 && (
                    <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                      <div>Cibles actives ({selectedElement.linkedTo.length}) :</div>
                      <ul style={{ margin: "4px 0", paddingLeft: "16px" }}>
                        {selectedElement.linkedTo.map((tid) => {
                          const target = chamber.elements.find((el) => el.id === tid);
                          return (
                            <li key={tid}>
                              {target ? `${target.type} (x:${target.x}, y:${target.y})` : `Inconnu (${tid.substring(0,4)})`}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Active/Inactive state toggle */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "12px", color: "var(--text-secondary)" }}>
                <input 
                  type="checkbox" 
                  checked={selectedElement.active} 
                  onChange={(e) => handleUpdateElement({ active: e.target.checked })}
                  style={{ accentColor: "var(--portal-blue)" }}
                />
                Composant actif par défaut
              </label>
            </div>

          </div>
        ) : (
          <div 
            style={{ 
              flex: 1, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              color: "var(--text-muted)", 
              fontSize: "12px",
              textAlign: "center",
              border: "1px dashed var(--border-color)",
              borderRadius: "4px"
            }}
          >
            Sélectionnez une case sur la grille en mode SÉLECT pour paramétrer ses propriétés.
          </div>
        )}
      </div>

    </div>
  );
};
