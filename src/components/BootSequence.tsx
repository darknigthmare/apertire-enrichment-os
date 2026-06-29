import React, { useEffect, useState, useRef } from "react";
import { ApertureButton } from "./ApertureButton";
import { playBeep, playBootSequence, playErrorSound } from "./soundSynth";
import "./bootSequence.css";

interface BootSequenceProps {
  onComplete: () => void;
}

const BOOT_LOGS = [
  { text: "INITIALIZING APERTURE CENTRAL CONTAINMENT INTERFACE...", delay: 300, sound: 600 },
  { text: "LOADING DEVICE HARDWARE DRIVERS...", delay: 200, sound: 600 },
  { text: "DETECTION: 2 DUAL PORTAL DEVICES - STABLE [OK]", delay: 400, sound: 880 },
  { text: "DETECTION: 450 TURRET CALIBRATORS - UNSTABLE [WARN]", delay: 300, sound: 440 },
  { text: "CONNECTING TO CRYSTAL MEMORY BANKS...", delay: 500, sound: 600 },
  { text: "AUDITING EMPATHY COEFFICIENT ALGORITHM...", delay: 600, sound: 300 },
  { text: "CRITICAL: MODULE 'EMPATHY' IS DEFECTIVE OR UNRESPONSIVE.", delay: 400, error: true },
  { text: "BYPASSING ETHICAL SAFEGUARDS... CORE STABLE [OK]", delay: 500, sound: 1200 },
  { text: "AEROSOL DISPENSERS SIMULATOR DETECTED - SYSTEM SECURED [OK]", delay: 300, sound: 880 },
  { text: "COMPILING SARCASTIC DIALOGUE ROUTINES... OPTIMAL [OK]", delay: 400, sound: 1046 },
  { text: "LOADING CHAMBER REGISTRY (11 TEMPLATES VERIFIED)", delay: 300, sound: 880 },
  { text: "RETRIEVING TEST SUBJECT TELEMETRY (6 PROFILES LOADED)", delay: 300, sound: 880 },
  { text: "APERTURE ENRICHMENT OPERATING SYSTEM (AEOS) READY.", delay: 500, sound: 1500 }
];

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentIdx < BOOT_LOGS.length) {
      const log = BOOT_LOGS[currentIdx];
      const timer = setTimeout(() => {
        setLogs((prev) => [...prev, log.text]);
        
        if (log.error) {
          playErrorSound();
        } else if (log.sound) {
          playBeep(log.sound, 0.08, "triangle");
        }

        setCurrentIdx((prev) => prev + 1);
      }, log.delay);
      
      return () => clearTimeout(timer);
    } else {
      setIsFinished(true);
      playBootSequence();
    }
  }, [currentIdx]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleSkip = () => {
    setIsFinished(true);
    onComplete();
  };

  return (
    <div className="boot-container crt-screen">
      <div className="boot-terminal-window">
        <div className="boot-header">
          <span className="boot-title">APERTURE SYSTEM TERMINAL v4.11</span>
          <span className="boot-status">ONLINE</span>
        </div>
        
        <div className="boot-log-viewport" ref={containerRef}>
          {logs.map((log, idx) => (
            <div 
              key={idx} 
              className={`boot-log-line ${log.includes("CRITICAL") ? "log-err" : log.includes("BYPASS") ? "log-warn" : ""}`}
            >
              <span className="log-prefix">&gt;</span> {log}
            </div>
          ))}
          {!isFinished && <div className="cursor-blink"></div>}
        </div>

        {isFinished ? (
          <div className="boot-welcome-card log-line">
            <div className="aperture-svg-logo">
              <svg viewBox="0 0 100 100" width="80" height="80">
                <circle cx="50" cy="50" r="45" fill="none" stroke="var(--portal-blue)" strokeWidth="6" />
                <path d="M 50 5 L 65 30 L 53 30 L 40 10 Z" fill="var(--text-primary)" opacity="0.8" />
                <path d="M 95 50 L 70 65 L 70 53 L 90 40 Z" fill="var(--text-primary)" opacity="0.8" transform="rotate(45 50 50)" />
                <path d="M 95 50 L 70 65 L 70 53 L 90 40 Z" fill="var(--text-primary)" opacity="0.8" transform="rotate(90 50 50)" />
                <path d="M 95 50 L 70 65 L 70 53 L 90 40 Z" fill="var(--text-primary)" opacity="0.8" transform="rotate(135 50 50)" />
                <path d="M 95 50 L 70 65 L 70 53 L 90 40 Z" fill="var(--text-primary)" opacity="0.8" transform="rotate(180 50 50)" />
                <path d="M 95 50 L 70 65 L 70 53 L 90 40 Z" fill="var(--text-primary)" opacity="0.8" transform="rotate(225 50 50)" />
                <path d="M 95 50 L 70 65 L 70 53 L 90 40 Z" fill="var(--text-primary)" opacity="0.8" transform="rotate(270 50 50)" />
                <path d="M 95 50 L 70 65 L 70 53 L 90 40 Z" fill="var(--text-primary)" opacity="0.8" transform="rotate(315 50 50)" />
              </svg>
            </div>
            
            <h1 className="boot-app-title">APERTURE ENRICHMENT OPERATING SYSTEM</h1>
            <p className="boot-app-subtitle">Central Core Test Chamber Management Console</p>
            
            <div className="boot-actions">
              <ApertureButton variant="success" onClick={onComplete} soundFreq={1200}>
                INITIALIZE CORE INTERFACE
              </ApertureButton>
            </div>
          </div>
        ) : (
          <div className="boot-footer">
            <span className="boot-progress-bar">
              <span className="boot-progress-fill" style={{ width: `${(currentIdx / BOOT_LOGS.length) * 100}%` }}></span>
            </span>
            <ApertureButton variant="secondary" onClick={handleSkip}>
              SKIP INITIALIZATION
            </ApertureButton>
          </div>
        )}
      </div>
    </div>
  );
};
