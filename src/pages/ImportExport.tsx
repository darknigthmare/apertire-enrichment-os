import React, { useState } from "react";
import { localDb } from "../db/localDb";
import { ApertureButton } from "../components/ApertureButton";
import { playSuccess, playErrorSound } from "../components/soundSynth";

export const ImportExport: React.FC = () => {
  const [jsonText, setJsonText] = useState("");
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);

  const handleExport = () => {
    const raw = localDb.exportData();
    setJsonText(raw);
    playSuccess();
    setMessage({ text: "Données exportées avec succès dans le panneau ci-dessous.", error: false });
  };

  const handleDownloadFile = () => {
    const raw = localDb.exportData();
    const blob = new Blob([raw], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `aperture_facility_backup_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    playSuccess();
  };

  const handleImport = () => {
    if (!jsonText.trim()) {
      playErrorSound();
      setMessage({ text: "Erreur : Le champ JSON est vide.", error: true });
      return;
    }

    if (window.confirm("Importer ces données écrasera la configuration actuelle du Complexe (chambres, cobayes, historiques). Continuer ?")) {
      const res = localDb.importData(jsonText);
      if (res.success) {
        playSuccess();
        setMessage({ text: "Restauration système réussie. Base de données synchronisée.", error: false });
        localDb.addLog("sys_reactor", "IMPORT", "Restauration globale effectuée à partir d'un fichier de sauvegarde.", "success");
      } else {
        playErrorSound();
        setMessage({ text: `Échec de l'import : ${res.error || "Format de données invalide."}`, error: true });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setJsonText(text);
      playSuccess();
      setMessage({ text: `Fichier "${file.name}" chargé dans l'éditeur. Prêt pour l'importation.`, error: false });
    };
    reader.readAsText(file);
  };

  return (
    <div className="import-export-view log-line" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
      
      {/* Description & Action panel (5 cols) */}
      <div className="aperture-panel" style={{ gridColumn: "span 5" }}>
        <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          Transfert de Données Globales
        </h3>

        <p style={{ margin: "0 0 18px 0", fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
          Ce module permet de sauvegarder l'intégralité du Complexe sous forme de fichier JSON ou d'importer une configuration externe.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
          
          <ApertureButton variant="blue" onClick={handleExport}>
            Générer Code de Sauvegarde
          </ApertureButton>

          <ApertureButton variant="secondary" onClick={handleDownloadFile}>
            Télécharger Fichier de Sauvegarde (.json)
          </ApertureButton>

          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "14px" }}>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px", fontFamily: "var(--font-mono)" }}>
              Charger un fichier de sauvegarde
            </label>
            <input 
              type="file" 
              accept=".json"
              onChange={handleFileUpload}
              style={{ fontSize: "12px", color: "var(--text-secondary)" }}
            />
          </div>

          <ApertureButton variant="success" onClick={handleImport} style={{ marginTop: "10px" }}>
            Valider et Restaurer
          </ApertureButton>

        </div>

        {message && (
          <div 
            style={{ 
              padding: "10px", 
              border: `1px solid var(--status-${message.error ? "critical" : "nominal"})`,
              backgroundColor: `rgba(${message.error ? "255, 59, 48" : "0, 255, 102"}, 0.05)`,
              color: `var(--status-${message.error ? "critical" : "nominal"})`,
              fontFamily: "var(--font-mono)",
              fontSize: "11.5px",
              borderRadius: "2px"
            }}
          >
            {message.text}
          </div>
        )}
      </div>

      {/* JSON Viewer Text Area (7 cols) */}
      <div className="aperture-panel orange" style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", minHeight: "400px" }}>
        <h3 style={{ margin: "0 0 14px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          Console d'Échange JSON
        </h3>

        <textarea 
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{\n  "chambers": [],\n  "subjects": [],\n  "systems": []\n}'
          style={{ 
            flex: 1, 
            backgroundColor: "var(--bg-primary)", 
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            padding: "16px",
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            borderRadius: "4px",
            resize: "none",
            lineHeight: "1.4"
          }}
        />

        <div style={{ marginTop: "12px", fontSize: "10px", color: "var(--text-muted)", fontFamily: "var(--font-mono)", textAlign: "right" }}>
          NOTE: Veillez à ne modifier aucun ID sous peine de corrompre les liaisons logiques des boutons/lasers.
        </div>
      </div>

    </div>
  );
};
