import React, { useState, useEffect } from "react";
import { localDb } from "../db/localDb";
import type { Chamber, TestSubject } from "../types";
import { ApertureButton } from "../components/ApertureButton";
import { playSuccess, playBeep } from "../components/soundSynth";

const ANNOUNCEMENT_TEMPLATES = {
  intro: [
    "Chambre {{chamberName}} prête. {{subjectAlias}} a été informé que la panique n'améliore pas la précision des données.",
    "Bienvenue dans la chambre {{chamberName}}. N'oubliez pas que l'appareil de portail coûte plus cher que le produit intérieur brut de votre pays d'origine.",
    "Début de l'exercice dans la chambre {{chamberName}}. La présence de tourelles sentinelles est destinée à stimuler vos réflexes de conservation. Ne les décevez pas.",
    "Chambre {{chamberName}} initialisée. Les surfaces portalables ont été nettoyées. Veuillez ignorer les bruits de frottement dans les conduits de ventilation."
  ],
  success: [
    "Félicitations, {{subjectAlias}}. Vous avez résolu la chambre {{chamberName}}. Les données indiquent une conformité satisfaisante de 98%.",
    "Test complété. Les gâteaux de récompense sont actuellement indisponibles en raison de contraintes budgétaires simulées.",
    "Excellent travail. Les capteurs enregistrent un niveau d'autosatisfaction élevé chez le sujet. C'est scientifiquement inutile, mais mignon.",
    "Chambre résolue. Votre score d'efficacité dépasse les prévisions de 1.4%. Vous pouvez en être fier, ou éprouver la sensation chimique équivalente."
  ],
  failure: [
    "Le sujet {{subjectAlias}} a cessé de fournir des signes vitaux dans la chambre {{chamberName}}. Motif : {{failureReason}}.",
    "Échec du test. Rappel amical : la toxine liquide au sol n'est pas une piscine de relaxation. Veuillez ne pas y nager.",
    "Protocole interrompu. Échec causé par : {{failureReason}}. La logistique va procéder au nettoyage pneumatique de la chambre.",
    "Le sujet a échoué. Les données recueillies avant l'incident indiquent une mauvaise appréciation des lois cinétiques de base."
  ],
  safety: [
    "Rappel de sécurité : le cube compagnon ne ressent aucune douleur. Contrairement à vous, qui insistez pour exprimer des plaintes verbales inutiles.",
    "Attention. La grille d'émancipation moléculaire à la sortie peut causer une légère desquamation des implants dentaires. Clignez des yeux au moins deux fois.",
    "Consigne de laboratoire : Ne regardez pas directement le canal opérationnel de l'appareil de portail. Ne le dirigez pas vers vos collègues. Ne l'utilisez pas pour attraper des objets distants."
  ]
};

const DUMMY_HAZARDS = [
  "Rencontre inopinée avec une tourelle sentinelle",
  "Contact prolongé avec le fluide toxique acide",
  "Défaillance de trajectoire sur plaque de foi aérienne",
  "Erreur de calcul dans l'angle de réfraction laser",
  "Tentative d'ingestion de gel de propulsion orange"
];

export const AnnouncementConsole: React.FC = () => {
  const [chambers, setChambers] = useState<Chamber[]>([]);
  const [subjects, setSubjects] = useState<TestSubject[]>([]);
  const [category, setCategory] = useState<keyof typeof ANNOUNCEMENT_TEMPLATES>("intro");
  const [selectedChamber, setSelectedChamber] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [customFailure, setCustomFailure] = useState(DUMMY_HAZARDS[0]);
  const [generatedText, setGeneratedText] = useState("");
  const [isBroadcasted, setIsBroadcasted] = useState(false);

  useEffect(() => {
    const chs = localDb.getChambers();
    const subjs = localDb.getSubjects();
    setChambers(chs);
    setSubjects(subjs);
    
    if (chs.length > 0) setSelectedChamber(chs[0].name);
    if (subjs.length > 0) setSelectedSubject(subjs[0].alias);
  }, []);

  const handleGenerate = () => {
    const templates = ANNOUNCEMENT_TEMPLATES[category];
    const template = templates[Math.floor(Math.random() * templates.length)];
    
    let text = template
      .replace("{{chamberName}}", selectedChamber || "Chambre Générique")
      .replace("{{subjectAlias}}", selectedSubject || "Sujet Anonyme")
      .replace("{{failureReason}}", customFailure);

    setGeneratedText(text);
    setIsBroadcasted(false);
    playSuccess();
  };

  const handleBroadcast = () => {
    if (!generatedText) return;
    
    // Play announcement chimes (low to high chimes)
    playBeep(440, 0.15, "triangle");
    setTimeout(() => playBeep(554.37, 0.15, "triangle"), 150);
    setTimeout(() => playBeep(659.25, 0.25, "triangle"), 300);

    localDb.addLog("sys_reactor", "ANNOUNCEMENT", `Diffusion vocale effectuée : "${generatedText.substring(0, 50)}..."`, "info");
    setIsBroadcasted(true);
  };

  return (
    <div className="announcements-view log-line" style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
      
      {/* Parameter Selection (5 cols) */}
      <div className="aperture-panel" style={{ gridColumn: "span 5" }}>
        <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          Paramètres du Générateur Vocal
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Template Category */}
          <div>
            <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
              Catégorie d'Annonce
            </label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value as any)}
              style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
            >
              <option value="intro">Début de test (Briefing)</option>
              <option value="success">Succès du test (Débriefing)</option>
              <option value="failure">Échec du sujet (Statistiques)</option>
              <option value="safety">Sécurité & Protocoles (Mémos)</option>
            </select>
          </div>

          {/* Chamber Target */}
          {category !== "safety" && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                Chambre Expérimentale Cible
              </label>
              <select 
                value={selectedChamber} 
                onChange={(e) => setSelectedChamber(e.target.value)}
                style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
              >
                {chambers.map((ch) => (
                  <option key={ch.id} value={ch.name}>Chambre {ch.number} - {ch.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Subject target */}
          {(category === "intro" || category === "success" || category === "failure") && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                Sujet Concerné
              </label>
              <select 
                value={selectedSubject} 
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.alias}>{s.alias}</option>
                ))}
              </select>
            </div>
          )}

          {/* Failure reason selection */}
          {category === "failure" && (
            <div>
              <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                Motif Fictif de l'Échec
              </label>
              <select 
                value={customFailure} 
                onChange={(e) => setCustomFailure(e.target.value)}
                style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
              >
                {DUMMY_HAZARDS.map((h, i) => (
                  <option key={i} value={h}>{h}</option>
                ))}
              </select>
            </div>
          )}

          <div style={{ marginTop: "10px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
            <ApertureButton variant="blue" style={{ width: "100%" }} onClick={handleGenerate}>
              Générer la Transcription
            </ApertureButton>
          </div>

        </div>
      </div>

      {/* Output / Console Viewport (7 cols) */}
      <div style={{ gridColumn: "span 7", display: "flex", flexDirection: "column", gap: "20px" }}>
        
        {/* Terminal output */}
        <div className="aperture-panel orange" style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "260px" }}>
          <h3 style={{ margin: "0 0 14px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
            Moniteur Vocal - Transcription
          </h3>

          <div 
            style={{ 
              flex: 1, 
              backgroundColor: "var(--bg-primary)", 
              border: "1px solid var(--border-color)",
              padding: "16px",
              fontFamily: "var(--font-mono)",
              fontSize: "13.5px",
              lineHeight: "1.6",
              color: "var(--text-terminal)",
              borderRadius: "4px",
              overflowY: "auto",
              position: "relative",
            }}
          >
            {generatedText ? (
              <span className="log-line">{generatedText}</span>
            ) : (
              <span style={{ color: "var(--text-muted)" }}>[En attente de génération d'annonce...]</span>
            )}
            {generatedText && !isBroadcasted && <span className="cursor-blink"></span>}
          </div>

          <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {isBroadcasted ? "STATUT : DIFFUSÉE SUR LE RÉSEAU" : "STATUT : EN ATTENTE DE SIGNAL"}
            </span>
            
            <ApertureButton 
              variant="success" 
              disabled={!generatedText} 
              onClick={handleBroadcast}
            >
              Diffuser l'Annonce
            </ApertureButton>
          </div>
        </div>

        {/* Integration details */}
        <div className="aperture-panel">
          <h4 style={{ margin: "0 0 8px 0", textTransform: "uppercase", fontSize: "12px", color: "var(--text-primary)" }}>
            Adaptateur LLM local (Ollama)
          </h4>
          <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
            L'intégration optionnelle LLM local permet de générer des textes inédits en temps réel via des modèles tournant hors-ligne (ex: Llama3, Mistral).
          </p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", fontFamily: "var(--font-mono)" }}>
            <span style={{ color: "var(--status-offline)" }}>STATUT : DÉCONNECTÉ (Templates hors-ligne actifs)</span>
            <ApertureButton variant="secondary" style={{ padding: "4px 8px", fontSize: "10px" }} disabled>
              Configurer Ollama
            </ApertureButton>
          </div>
        </div>

      </div>

    </div>
  );
};
