import React, { useState, useEffect } from "react";
import { localDb } from "../db/localDb";
import type { Chamber, TestSubject, FacilitySystem } from "../types";
import { ApertureButton } from "../components/ApertureButton";
import { playSuccess } from "../components/soundSynth";

export const Reporting: React.FC = () => {
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [subjects, setSubjects] = useState<TestSubject[]>([]);
  const [systems, setSystems] = useState<FacilitySystem[]>([]);
  const [reportType, setReportType] = useState("calibration");
  const [reportContent, setReportContent] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setChambers(localDb.getChambers());
    setSubjects(localDb.getSubjects());
    setSystems(localDb.getSystems());
  }, []);

  const handleGenerateReport = () => {
    playSuccess();
    setCopied(false);

    let md = "";
    const dateStr = new Date().toLocaleString();

    if (reportType === "calibration") {
      md = `# APERTURE SCIENCE ENRICHMENT CENTER
## RAPPORT DE CALIBRATION DES CHAMBRES DE TEST
**Date :** ${dateStr}
**Généré par :** CLaDOS Central Core

---

### 1. RÉSUMÉ DES INFRASTRUCTURES
* **Total des chambres enregistrées :** ${chambers.length}
* **Chambres Calibrées (Prêtes) :** ${chambers.filter((c) => c.status === "calibrated").length}
* **Chambres Condamnées (Instables) :** ${chambers.filter((c) => c.status === "condemned").length}
* **Chambres Draft (En cours de conception) :** ${chambers.filter((c) => c.status === "draft").length}

### 2. DÉTAIL DES COMPOSANTS LOGIQUES EXPÉRIMENTAUX
| ID | Nom | Style | Difficulté | Danger | Statut |
| :--- | :--- | :--- | :---: | :---: | :---: |
${chambers
  .map(
    (c) =>
      `| ${c.number} | ${c.name} | ${c.style} | ${c.difficulty}/10 | ${c.hazardLevel}/10 | ${c.status} |`
  )
  .join("\n")}

### 3. RECOMMENDATIONS DE L'INTELLIGENCE CENTRALE
* **Taux de rotation :** Il est conseillé de dupliquer les chambres à haut danger pour optimiser le recueil de données de résistance au stress.
* **Warning géométrique :** Les chambres en mode "Draft" doivent être finalisées sous peine d'interruption du calendrier scientifique.
`;
    } else if (reportType === "subject") {
      md = `# APERTURE SCIENCE ENRICHMENT CENTER
## RAPPORT DE RENDEMENT DES COBAYES
**Date :** ${dateStr}
**Généré par :** CLaDOS Central Core

---

### 1. ÉTAT DES UNITÉS DANS LE CRYOPODE
* **Total des sujets :** ${subjects.length}
* **Sujets Humains actifs :** ${subjects.filter((s) => s.type === "human").length}
* **Unités Co-op Androïdes :** ${subjects.filter((s) => s.type === "android").length}
* **Anomalies de confinement :** ${subjects.filter((s) => s.type === "unknown").length}

### 2. ANALYSE STATISTIQUE DES PROFILS
| Sujet ID | Compliance | Ténacité | Aptitude Portail | Attachement au Cube | Proba. Survie |
| :--- | :---: | :---: | :---: | :---: | :---: |
${subjects
  .map(
    (s) =>
      `| ${s.alias} | ${s.compliance}% | ${s.tenacity}% | ${s.portalAptitude}% | ${s.cubeAttachment}% | ${s.survivalProbability}% |`
  )
  .join("\n")}

### 3. DIAGNOSTIC COMPORTEMENTAL
* **Alerte Dépendance :** L'attachement affectif aux cubes de stockage lestés reste élevé chez certains sujets humains (ex: Subject 117). Des séances de rappel cinétique (incinération simulée) sont planifiées.
* **Optimisation Robotique :** Les androïdes affichent un taux de compliance de 100%. Il est recommandé de privilégier les cycles co-op pour limiter l'accumulation de restes organiques dans les sas de sortie.
`;
    } else if (reportType === "facility") {
      md = `# APERTURE SCIENCE ENRICHMENT CENTER
## DIAGNOSTIC DU RÉSEAU DE CONTRÔLE ET ENERGIE
**Date :** ${dateStr}
**Généré par :** CLaDOS Central Core

---

### 1. BILAN ÉNERGÉTIQUE ET INTEGRITÉ
* **Nombre de sous-systèmes :** ${systems.length}
* **Intégrité moyenne :** ${Math.round(systems.reduce((acc, s) => acc + s.integrity, 0) / systems.length)}%
* **Consommation Totale active :** ${systems.reduce((acc, s) => acc + (s.status !== "offline" ? s.powerDraw : 0), 0)} MW

### 2. INVENTAIRE DES COMPOSANTS INFRASTRUCTURES
| Système | Statut | Stabilité | Charge Énergétique | Maintenance |
| :--- | :---: | :---: | :---: | :--- |
${systems
  .map(
    (s) =>
      `| ${s.name} | ${s.status.toUpperCase()} | ${s.integrity}% | ${s.powerDraw} MW | ${s.lastMaintenance} |`
  )
  .join("\n")}

### 3. INCIDENTS RÉSEAU
* **Pression des Fluides :** Les stations de pompage de gels affichent des alertes récurrentes de viscosité. recalibrer périodiquement.
* **Module Toxique :** Le générateur de neurotoxine simulée est verrouillé conformément au protocole de sécurité strict de l'administrateur.
`;
    }

    setReportContent(md);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(reportContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="reporting-view log-line" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
      
      {/* Parameters (5 cols) */}
      <div className="aperture-panel" style={{ gridColumn: "span 5" }}>
        <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          Paramètres du Rapporteur
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
              Type de Diagnostic
            </label>
            <select 
              value={reportType} 
              onChange={(e) => setReportType(e.target.value)}
              style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
            >
              <option value="calibration">Calibration des Chambres (Registre)</option>
              <option value="subject">Performance des Sujets (Cobayes)</option>
              <option value="facility">Intégrité Réseau (Infrastructure)</option>
            </select>
          </div>

          <ApertureButton variant="blue" onClick={handleGenerateReport}>
            Générer Rapport Markdown
          </ApertureButton>
        </div>
      </div>

      {/* Output (7 cols) */}
      <div className="aperture-panel orange" style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", minHeight: "400px" }}>
        <h3 style={{ margin: "0 0 14px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          Visualisation du Rapport
        </h3>

        <textarea 
          readOnly
          value={reportContent}
          placeholder="# APERTURE REPORT TERMINAL\n[Cliquez sur 'Générer' pour compiler les données cliniques...]"
          style={{ 
            flex: 1, 
            backgroundColor: "var(--bg-primary)", 
            color: "var(--text-primary)",
            border: "1px solid var(--border-color)",
            padding: "16px",
            fontSize: "12.5px",
            fontFamily: "var(--font-mono)",
            borderRadius: "4px",
            resize: "none",
            lineHeight: "1.5"
          }}
        />

        <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <ApertureButton variant="secondary" disabled={!reportContent} onClick={handleCopy}>
            {copied ? "COPIÉ !" : "COPIER DANS PRESSE-PAPIER"}
          </ApertureButton>
        </div>
      </div>

    </div>
  );
};
