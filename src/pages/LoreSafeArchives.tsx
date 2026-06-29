import React, { useState, useEffect } from "react";
import { localDb } from "../db/localDb";
import type { ArchiveDocument } from "../types";
import { playSuccess } from "../components/soundSynth";

export const LoreSafeArchives: React.FC = () => {
  const [archives, setArchives] = useState<ArchiveDocument[]>([]);
  const [selectedArch, setSelectedArch] = useState<ArchiveDocument | null>(null);
  const [filterEra, setFilterEra] = useState<string>("all");

  useEffect(() => {
    setArchives(localDb.getArchives());
  }, []);

  const filteredArchives = archives.filter((a) => {
    if (filterEra !== "all" && a.era !== filterEra) return false;
    return true;
  });

  const getEraLabel = (era: ArchiveDocument["era"]) => {
    switch (era) {
      case "old_aperture": return "Old Aperture (1950-1980)";
      case "modern_aperture": return "Modern Aperture";
      case "reconstruction": return "Post-Reconstruction";
      case "core_transfer": return "Core Transfer Audit";
      case "cooperative": return "Cooperative Initiative";
      default: return era;
    }
  };

  const handleSelect = (a: ArchiveDocument) => {
    setSelectedArch(a);
    playSuccess();
  };

  return (
    <div className="archives-view log-line" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
      
      {/* Sidebar List (5 cols) */}
      <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: "16px" }}>
        
        {/* Filter bar */}
        <div 
          className="aperture-panel" 
          style={{ 
            display: "flex", 
            flexDirection: "column", 
            gap: "8px",
            backgroundColor: "var(--bg-tertiary)",
            padding: "12px 14px"
          }}
        >
          <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Filtrer par Ère :</span>
          <select 
            value={filterEra} 
            onChange={(e) => setFilterEra(e.target.value)}
            style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "6px", fontSize: "12px", borderRadius: "2px" }}
          >
            <option value="all">Toutes les époques</option>
            <option value="old_aperture">Old Aperture (1950-1980)</option>
            <option value="modern_aperture">Modern Aperture</option>
            <option value="reconstruction">Reconstruction</option>
            <option value="core_transfer">Core Transfer</option>
            <option value="cooperative">Cooperative Testing</option>
          </select>
        </div>

        {/* List of archives */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "450px", overflowY: "auto" }}>
          {filteredArchives.map((a) => (
            <div 
              key={a.id}
              className="aperture-panel"
              style={{ 
                cursor: "pointer",
                backgroundColor: selectedArch?.id === a.id ? "var(--bg-active)" : "var(--bg-secondary)",
                borderColor: selectedArch?.id === a.id ? "var(--portal-blue)" : "var(--border-color)",
                padding: "12px 14px"
              }}
              onClick={() => handleSelect(a)}
            >
              <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "var(--text-primary)" }}>{a.title}</h4>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                <span>{a.date}</span>
                <span>{a.classification.split(" ")[0]}</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Reader Panel (7 cols) */}
      <div style={{ gridColumn: "span 7" }}>
        {selectedArch ? (
          <div className="aperture-panel orange" style={{ minHeight: "420px", display: "flex", flexDirection: "column" }}>
            {/* Header info */}
            <div style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "12px", marginBottom: "16px" }}>
              <span style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--portal-orange)", textTransform: "uppercase" }}>
                Classification: {selectedArch.classification}
              </span>
              <h2 style={{ margin: "6px 0", fontSize: "18px", color: "var(--text-primary)" }}>
                {selectedArch.title}
              </h2>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                <span>Date d'Archivage : {selectedArch.date}</span>
                <span>Époque : {getEraLabel(selectedArch.era)}</span>
              </div>
            </div>

            {/* Document Body */}
            <div 
              style={{ 
                flex: 1, 
                backgroundColor: "var(--bg-primary)",
                border: "1px solid var(--border-color)",
                padding: "16px",
                fontFamily: "var(--font-mono)",
                fontSize: "12.5px",
                lineHeight: "1.6",
                color: "var(--text-primary)",
                borderRadius: "4px",
                whiteSpace: "pre-line",
                overflowY: "auto",
                maxHeight: "350px"
              }}
            >
              {selectedArch.content}
            </div>

            {/* Relations */}
            {(selectedArch.relatedChamber || selectedArch.relatedSystem) && (
              <div style={{ marginTop: "16px", borderTop: "1px solid var(--border-color)", paddingTop: "12px", fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                Éléments liés : {selectedArch.relatedChamber ? `Chambre: ${selectedArch.relatedChamber}` : `Système: ${selectedArch.relatedSystem}`}
              </div>
            )}

          </div>
        ) : (
          <div 
            className="aperture-panel" 
            style={{ 
              minHeight: "420px", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              color: "var(--text-muted)",
              fontSize: "13px"
            }}
          >
            Sélectionnez une note ou un mémo d'archivage dans la liste latérale pour démarrer la lecture.
          </div>
        )}
      </div>

    </div>
  );
};
