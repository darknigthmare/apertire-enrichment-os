import { useState, useEffect } from "react";
import "./styles/variables.css";
import "./styles/terminal.css";
import "./App.css";

import { initializeDb, localDb } from "./db/localDb";
import type { PersonaSettings } from "./types";

// Component / Page imports
import { BootSequence } from "./components/BootSequence";
import { Dashboard } from "./pages/Dashboard";
import { ChamberRegistry } from "./pages/ChamberRegistry";
import { ChamberEditor } from "./pages/ChamberEditor";
import { TestRunner } from "./pages/TestRunner";
import { SubjectDatabase } from "./pages/SubjectDatabase";
import { FacilitySystems } from "./pages/FacilitySystems";
import { AnnouncementConsole } from "./pages/AnnouncementConsole";
import { LoreSafeArchives } from "./pages/LoreSafeArchives";
import { Reporting } from "./pages/Reporting";
import { Settings } from "./pages/Settings";
import { ImportExport } from "./pages/ImportExport";
import { PersonalityCores } from "./pages/PersonalityCores";
import { TurretConsole } from "./pages/TurretConsole";

function App() {
  const [isBooted, setIsBooted] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>("dashboard");
  const [pageParams, setPageParams] = useState<any>({});
  const [settings, setSettings] = useState<PersonaSettings | null>(null);

  // Initialize DB on mount
  useEffect(() => {
    initializeDb();
    const currentSettings = localDb.getSettings();
    setSettings(currentSettings);
    
    if (!currentSettings.bootSequenceEnabled) {
      setIsBooted(true);
    }
  }, []);

  const handleNavigate = (page: string, params: any = {}) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  const handleRefreshSettings = () => {
    setSettings(localDb.getSettings());
  };

  if (!settings) {
    return <div style={{ color: "var(--text-muted)", padding: "20px", fontFamily: "var(--font-mono)" }}>Initialisation du Core...</div>;
  }

  if (!isBooted && settings.bootSequenceEnabled) {
    return <BootSequence onComplete={() => setIsBooted(true)} />;
  }

  // Render active view helper
  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "chambers":
        return <ChamberRegistry onNavigate={handleNavigate} />;
      case "editor":
        return <ChamberEditor chamberId={pageParams.id} onNavigate={handleNavigate} />;
      case "test-runner":
        return <TestRunner initialChamberId={pageParams.chamberId} onNavigate={handleNavigate} />;
      case "subjects":
        return <SubjectDatabase />;
      case "facility":
        return <FacilitySystems />;
      case "announcements":
        return <AnnouncementConsole />;
      case "archives":
        return <LoreSafeArchives />;
      case "reports":
        return <Reporting />;
      case "settings":
        return <Settings onSettingsChange={handleRefreshSettings} />;
      case "import-export":
        return <ImportExport />;
      case "cores":
        return <PersonalityCores />;
      case "turrets":
        return <TurretConsole />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className={`crt-screen`} style={{ display: "flex", flexDirection: "column", height: "100vh", backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* 1. CRT Scanlines scan filter */}
      {settings.scanlineEnabled && <div className="crt-overlay" />}

      {/* 2. Top Status Bar */}
      <div 
        style={{ 
          height: "var(--header-height)", 
          borderBottom: "1px solid var(--border-color)", 
          backgroundColor: "var(--bg-secondary)", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: "0 20px",
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Custom micro SVG log symbol */}
          <svg viewBox="0 0 100 100" width="24" height="24">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--portal-blue)" strokeWidth="8" />
            <path d="M 50 10 L 65 35 L 53 35 L 40 15 Z" fill="var(--text-primary)" />
            <path d="M 90 50 L 65 65 L 65 53 L 85 40 Z" fill="var(--text-primary)" transform="rotate(90 50 50)" />
            <path d="M 90 50 L 65 65 L 65 53 L 85 40 Z" fill="var(--text-primary)" transform="rotate(180 50 50)" />
            <path d="M 90 50 L 65 65 L 65 53 L 85 40 Z" fill="var(--text-primary)" transform="rotate(270 50 50)" />
          </svg>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: "bold", letterSpacing: "1px" }}>
            {settings.name.toUpperCase()} SYSTEM CORE
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "18px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="status-dot nominal"></span>
            CORE STATUS: ONLINE
          </span>
          <span style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: "12px" }}>
            EMPATHY: {settings.empathyModule.toUpperCase()}
          </span>
          <span style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: "12px" }}>
            SYSTEM CLOCK: {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
      
      {/* Tech Line dividing bar */}
      <div className="tech-header-line"></div>

      {/* 3. Main Workspace Shell Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        
        {/* Left Navigation Sidebar */}
        <div 
          style={{ 
            width: "var(--sidebar-width)", 
            backgroundColor: "var(--bg-secondary)", 
            borderRight: "1px solid var(--border-color)", 
            display: "flex", 
            flexDirection: "column",
            padding: "16px 0",
            zIndex: 10
          }}
        >
          {/* Navigation group */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px", flex: 1, padding: "0 10px" }}>
            {[
              { id: "dashboard", label: "Tableau de Bord", icon: "📊" },
              { id: "chambers", label: "Registre Chambres", icon: "🏁" },
              { id: "test-runner", label: "Simulateur de Tests", icon: "⚙️" },
              { id: "subjects", label: "Dossiers Cobayes", icon: "👥" },
              { id: "facility", label: "Systèmes Complexe", icon: "⚡" },
              { id: "announcements", label: "Console Vocale", icon: "🗣️" },
              { id: "archives", label: "Archives Mémos", icon: "📁" },
              { id: "reports", label: "Rapporteurs", icon: "📝" },
              { id: "cores", label: "Dock des Cœurs", icon: "🟢" },
              { id: "turrets", label: "Console Tourelles", icon: "🤖" },
              { id: "import-export", label: "Sauvegarde & Import", icon: "💾" },
              { id: "settings", label: "Configuration IA", icon: "🔧" }
            ].map((page) => (
              <button
                key={page.id}
                onClick={() => handleNavigate(page.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  backgroundColor: currentPage === page.id ? "var(--bg-active)" : "transparent",
                  color: currentPage === page.id ? "var(--portal-blue)" : "var(--text-secondary)",
                  border: "none",
                  borderLeft: currentPage === page.id ? "3px solid var(--portal-blue)" : "3px solid transparent",
                  borderRadius: "2px",
                  cursor: "pointer",
                  textAlign: "left",
                  fontSize: "12.5px",
                  fontFamily: "var(--font-sans)",
                  fontWeight: currentPage === page.id ? "bold" : "normal",
                  transition: "all 0.15s ease"
                }}
              >
                <span>{page.icon}</span>
                <span>{page.label}</span>
              </button>
            ))}
          </div>

          {/* Sarcastic footer note */}
          <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border-color)", fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", lineHeight: "1.4" }}>
            PROJET LOCAL PRIVÉ
            <br />
            Aucun asset officiel.
            <br />
            La science progresse.
          </div>
        </div>

        {/* Right Page Viewport Content Area */}
        <div style={{ flex: 1, padding: "24px", overflowY: "auto", backgroundColor: "var(--bg-primary)" }}>
          {renderPage()}
        </div>

      </div>
    </div>
  );
}

export default App;
