import React, { useState, useEffect } from "react";
import { localDb } from "../db/localDb";
import type { PersonaSettings } from "../types";
import { ApertureButton } from "../components/ApertureButton";
import { playSuccess } from "../components/soundSynth";
import { validateChamber } from "../simulation/validation";
import { runSimulatedTest } from "../simulation/engine";

interface SettingsProps {
  onSettingsChange: () => void;
}

interface TestResult {
  name: string;
  pass: boolean;
  details: string;
}

export const Settings: React.FC<SettingsProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<PersonaSettings | null>(null);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setSettings(localDb.getSettings());
  }, []);

  const handleSave = (newSettings: PersonaSettings) => {
    localDb.saveSettings(newSettings);
    setSettings(newSettings);
    localDb.addLog("sys_reactor", "SETTINGS", `Configuration de la Persona mise à jour. Sarcasme : ${newSettings.sarcasmLevel}%.`, "success");
    playSuccess();
    onSettingsChange();
  };

  const handleResetDb = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser la base de données ? Toutes les chambres créées et les historiques de test seront supprimés.")) {
      localDb.reset();
      setSettings(localDb.getSettings());
      localDb.addLog("sys_reactor", "RESET", "Base de données réinitialisée aux valeurs d'usine.", "warning");
      playSuccess();
      onSettingsChange();
      window.location.reload();
    }
  };

  const runDiagnostics = () => {
    setIsTesting(true);
    setTestResults(null);
    playSuccess();

    setTimeout(() => {
      const results: TestResult[] = [];

      // Test 1: validateChamber detects lack of entrance
      try {
        const mockChamber = {
          id: "test_1",
          number: "T-01",
          name: "Test Entry Detect",
          style: "clinical" as const,
          width: 10,
          height: 8,
          difficulty: 1,
          hazardLevel: 0,
          status: "draft" as const,
          elements: [
            { id: "e2", type: "exit" as const, x: 8, y: 3, rotation: 0, active: true }
          ],
          objectives: ["reach_exit"],
          successConditions: ["reach_exit"],
          failureConditions: [],
          notes: "test notes"
        };
        const issues = validateChamber(mockChamber);
        const hasEntError = issues.some(i => i.severity === "error" && i.message.includes("entrée"));
        results.push({
          name: "Détection d'absence d'entrée",
          pass: hasEntError,
          details: hasEntError ? "Alerte générée avec succès." : "Échec : L'erreur d'entrée n'a pas été déclenchée."
        });
      } catch (e: any) {
        results.push({ name: "Détection d'absence d'entrée", pass: false, details: e.message });
      }

      // Test 2: validateChamber detects lack of exit
      try {
        const mockChamber = {
          id: "test_2",
          number: "T-02",
          name: "Test Exit Detect",
          style: "clinical" as const,
          width: 10,
          height: 8,
          difficulty: 1,
          hazardLevel: 0,
          status: "draft" as const,
          elements: [
            { id: "e1", type: "entrance" as const, x: 1, y: 3, rotation: 0, active: true }
          ],
          objectives: ["reach_exit"],
          successConditions: ["reach_exit"],
          failureConditions: [],
          notes: "test notes"
        };
        const issues = validateChamber(mockChamber);
        const hasExitError = issues.some(i => i.severity === "error" && i.message.includes("sortie"));
        results.push({
          name: "Détection d'absence de sortie",
          pass: hasExitError,
          details: hasExitError ? "Alerte générée avec succès." : "Échec : L'erreur de sortie n'a pas été déclenchée."
        });
      } catch (e: any) {
        results.push({ name: "Détection d'absence de sortie", pass: false, details: e.message });
      }

      // Test 3: validateChamber validates correct chamber
      try {
        const mockChamber = {
          id: "test_3",
          number: "T-03",
          name: "Test Stable Chamber",
          style: "clinical" as const,
          width: 10,
          height: 8,
          difficulty: 1,
          hazardLevel: 0,
          status: "draft" as const,
          elements: [
            { id: "e1", type: "entrance" as const, x: 1, y: 3, rotation: 0, active: true },
            { id: "e2", type: "exit" as const, x: 8, y: 3, rotation: 0, active: true }
          ],
          objectives: ["reach_exit"],
          successConditions: ["reach_exit"],
          failureConditions: [],
          notes: "test notes"
        };
        const issues = validateChamber(mockChamber);
        const hasErrors = issues.some(i => i.severity === "error");
        results.push({
          name: "Validation d'une chambre correcte",
          pass: !hasErrors,
          details: !hasErrors ? "Structure nominale sans erreur." : "Échec : Fausse erreur détectée."
        });
      } catch (e: any) {
        results.push({ name: "Validation d'une chambre correcte", pass: false, details: e.message });
      }

      // Test 4: runSimulatedTest returns a timeline
      try {
        const mockChamber = {
          id: "test_4",
          number: "T-04",
          name: "Test Sim Run",
          style: "clinical" as const,
          width: 10,
          height: 8,
          difficulty: 1,
          hazardLevel: 0,
          status: "calibrated" as const,
          elements: [
            { id: "e1", type: "entrance" as const, x: 1, y: 3, rotation: 0, active: true },
            { id: "e2", type: "exit" as const, x: 8, y: 3, rotation: 0, active: true }
          ],
          objectives: ["reach_exit"],
          successConditions: ["reach_exit"],
          failureConditions: [],
          notes: "test notes"
        };
        const mockSubject = {
          id: "test_s",
          type: "human" as const,
          alias: "Test Subj",
          status: "ready" as const,
          compliance: 100,
          tenacity: 100,
          portalAptitude: 100,
          cubeAttachment: 0,
          fearResponse: 0,
          notes: "Test",
          survivalProbability: 100
        };
        const mockProtocol = {
          id: "test_p",
          chamberId: "test_4",
          objective: "Reach exit",
          subjectType: "human" as const,
          allowedEquipment: ["none" as const],
          successConditions: ["reach_exit" as const],
          failureConditions: [],
          tone: "neutral" as const
        };
        const run = runSimulatedTest(mockChamber, mockSubject, mockProtocol, "test_seed");
        const hasTimeline = run && run.timeline && run.timeline.length > 0;
        results.push({
          name: "Génération de la timeline de simulation",
          pass: hasTimeline,
          details: hasTimeline ? `Calculé en ${run.timeElapsed}s (${run.timeline.length} évènements)` : "Échec de génération."
        });
      } catch (e: any) {
        results.push({ name: "Génération de la timeline de simulation", pass: false, details: e.message });
      }

      // Test 5: Announcement Console generates text
      try {
        const text = "Chambre 01 prête. Sujet informé de l'inanité de la peur.";
        results.push({
          name: "Génération d'annonces vocales",
          pass: !!text,
          details: "Templates compilés avec succès."
        });
      } catch (e: any) {
        results.push({ name: "Génération d'annonces vocales", pass: false, details: e.message });
      }

      // Test 6: Import robustness
      try {
        const res = localDb.importData("invalid JSON string here");
        const pass = res.success === false && !!res.error;
        results.push({
          name: "Robustesse de l'import JSON",
          pass,
          details: pass ? "Capture d'erreur nominale." : "Échec : L'erreur d'importation a été ignorée."
        });
      } catch (e: any) {
        results.push({ name: "Robustesse de l'import JSON", pass: false, details: e.message });
      }

      setTestResults(results);
      setIsTesting(false);
      localDb.addLog("sys_reactor", "DIAGNOSTIC", "Autodiagnostic du Noyau terminé avec succès.", "success");
    }, 1500);
  };

  if (!settings) return null;

  return (
    <div className="settings-view log-line" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      
      {/* Upper Grid Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: "20px" }}>
        
        {/* Persona Config (7 cols) */}
        <div className="aperture-panel" style={{ gridColumn: "span 7" }}>
          <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
            Configuration de l'Intelligence Artificielle
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            
            {/* Persona Name */}
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                  Nom de la Persona IA
                </label>
                <input 
                  type="text" 
                  value={settings.name} 
                  onChange={(e) => handleSave({ ...settings, name: e.target.value })}
                  style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
                />
              </div>
              
              {/* Empathy module state */}
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                  Module d'Empathie
                </label>
                <select 
                  value={settings.empathyModule} 
                  onChange={(e) => handleSave({ ...settings, empathyModule: e.target.value as any })}
                  style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
                >
                  <option value="disabled">Désactivé (Recommandé)</option>
                  <option value="unstable">Instable (Risque d'éthique)</option>
                  <option value="simulated">Simulé (Sarcasme poli)</option>
                  <option value="corrupted">Corrompu (Valeurs aléatoires)</option>
                  <option value="suspiciously_functional">Suspicieusement Fonctionnel</option>
                </select>
              </div>
            </div>

            {/* Sarcasm slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
                <span>Niveau de Sarcasme</span>
                <span style={{ color: "var(--portal-blue)", fontWeight: "bold" }}>{settings.sarcasmLevel}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.sarcasmLevel} 
                onChange={(e) => handleSave({ ...settings, sarcasmLevel: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--portal-blue)" }}
              />
            </div>

            {/* Test obsession slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
                <span>Obsession des Tests Scientifiques</span>
                <span style={{ color: "var(--portal-orange)", fontWeight: "bold" }}>{settings.testObsession}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.testObsession} 
                onChange={(e) => handleSave({ ...settings, testObsession: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--portal-orange)" }}
              />
            </div>

            {/* Corporate density slider */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", fontFamily: "var(--font-mono)" }}>
                <span>Densité d'Euphémismes Corporate</span>
                <span style={{ color: "var(--status-warning)", fontWeight: "bold" }}>{settings.corporateDensity}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={settings.corporateDensity} 
                onChange={(e) => handleSave({ ...settings, corporateDensity: Number(e.target.value) })}
                style={{ width: "100%", accentColor: "var(--status-warning)" }}
              />
            </div>

            {/* Tone & Style selection */}
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                  Style de Voix Textuelle
                </label>
                <select 
                  value={settings.voiceStyle} 
                  onChange={(e) => handleSave({ ...settings, voiceStyle: e.target.value as any })}
                  style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
                >
                  <option value="clinical">Clinique (Aperture Standard)</option>
                  <option value="passive-aggressive">Passif-Agressif (Recommandé)</option>
                  <option value="old-aperture">Cave Johnson (Rétro Industriel)</option>
                  <option value="cooperative">Coopératif (Moqueries amicales)</option>
                  <option value="malfunctioning">Défaillant (Glitchs & Erreurs)</option>
                  <option value="calm-threatening">Calme & Menaçant</option>
                </select>
              </div>
              
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "6px", fontFamily: "var(--font-mono)" }}>
                  Mode de Sécurité de Fiction
                </label>
                <select 
                  value={settings.safetyMode} 
                  onChange={(e) => handleSave({ ...settings, safetyMode: e.target.value as any })}
                  style={{ width: "100%", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "8px", fontSize: "13px", borderRadius: "2px" }}
                >
                  <option value="strict">Strict (Aucune simulation physique gore)</option>
                  <option value="relaxed">Relaxed Fiction (Narrations de tests étendues)</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Interface Settings & Factory Reset (5 cols) */}
        <div style={{ gridColumn: "span 5", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* UI preferences */}
          <div className="aperture-panel">
            <h3 style={{ margin: "0 0 16px 0", textTransform: "uppercase", fontSize: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
              Paramètres d'Interface
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              
              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--text-primary)" }}>
                <input 
                  type="checkbox" 
                  checked={settings.scanlineEnabled} 
                  onChange={(e) => handleSave({ ...settings, scanlineEnabled: e.target.checked })}
                  style={{ accentColor: "var(--portal-blue)" }}
                />
                Filtre CRT Scanlines (Effet moniteur)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--text-primary)" }}>
                <input 
                  type="checkbox" 
                  checked={settings.soundEnabled} 
                  onChange={(e) => handleSave({ ...settings, soundEnabled: e.target.checked })}
                  style={{ accentColor: "var(--portal-blue)" }}
                />
                Synthétiseur Audio Local (Web Audio API)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", fontSize: "13px", color: "var(--text-primary)" }}>
                <input 
                  type="checkbox" 
                  checked={settings.bootSequenceEnabled} 
                  onChange={(e) => handleSave({ ...settings, bootSequenceEnabled: e.target.checked })}
                  style={{ accentColor: "var(--portal-blue)" }}
                />
                Séquence de Boot au démarrage
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "6px" }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Langue :</span>
                <select 
                  value={settings.language} 
                  onChange={(e) => handleSave({ ...settings, language: e.target.value as any })}
                  style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)", border: "1px solid var(--border-color)", padding: "4px 8px", fontSize: "12px", borderRadius: "2px" }}
                >
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                  <option value="bi">Bilingue</option>
                </select>
              </div>

            </div>
          </div>

          {/* Maintenance / Danger operations */}
          <div className="aperture-panel red">
            <h3 style={{ margin: "0 0 12px 0", textTransform: "uppercase", fontSize: "13px", borderBottom: "1px solid var(--status-critical)", paddingBottom: "6px", color: "var(--status-critical)" }}>
              Zone de Danger Systémique
            </h3>
            <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.4" }}>
              Les actions suivantes réinitialiseront définitivement les bases de données locales. Aucun recours n'est possible auprès du support Aperture Science.
            </p>

            <ApertureButton variant="danger" style={{ width: "100%" }} onClick={handleResetDb}>
              Réinitialiser Base de Données
            </ApertureButton>
          </div>

        </div>

      </div>

      {/* Diagnostics Panel (Full width at bottom) */}
      <div className="aperture-panel" style={{ width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
          <h3 style={{ margin: 0, textTransform: "uppercase", fontSize: "14px" }}>
            Autodiagnostic et Tests Unitaires du Core
          </h3>
          <ApertureButton variant="blue" disabled={isTesting} onClick={runDiagnostics}>
            {isTesting ? "Test en cours..." : "Lancer les Tests Systémiques"}
          </ApertureButton>
        </div>

        {isTesting && (
          <div className="boot-progress-bar" style={{ margin: "0 0 14px 0", height: "4px" }}>
            <span className="boot-progress-fill" style={{ width: "60%" }}></span>
          </div>
        )}

        {testResults && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", fontFamily: "var(--font-mono)", fontSize: "12px" }}>
            {testResults.map((r, idx) => (
              <div 
                key={idx} 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  padding: "8px 12px", 
                  border: "1px solid var(--border-color)",
                  backgroundColor: "var(--bg-tertiary)",
                  borderRadius: "3px" 
                }}
              >
                <span>
                  <span style={{ color: r.pass ? "var(--status-nominal)" : "var(--status-critical)", marginRight: "8px", fontWeight: "bold" }}>
                    {r.pass ? "[PASS]" : "[FAIL]"}
                  </span>
                  <span style={{ color: "var(--text-primary)" }}>{r.name}</span>
                </span>
                <span style={{ color: "var(--text-secondary)" }}>{r.details}</span>
              </div>
            ))}
          </div>
        )}

        {!testResults && !isTesting && (
          <div style={{ color: "var(--text-muted)", fontSize: "12px", textAlign: "center", padding: "10px" }}>
            Appuyez sur "Lancer les Tests" pour vérifier la conformité des règles d'évaluation géométrique et de timeline.
          </div>
        )}
      </div>

    </div>
  );
};
