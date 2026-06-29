import React from "react";
import { playBeep } from "./soundSynth";
import "./components.css";

interface ApertureButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "warning" | "success" | "blue" | "orange" | "terminal";
  soundFreq?: number;
}

export const ApertureButton: React.FC<ApertureButtonProps> = ({
  children,
  variant = "primary",
  onClick,
  soundFreq = 880,
  className = "",
  ...props
}) => {
  const handleMouseDown = () => {
    if (!props.disabled) {
      playBeep(soundFreq, 0.05);
    }
  };

  return (
    <button
      className={`aperture-btn btn-${variant} ${className}`}
      onMouseDown={handleMouseDown}
      onClick={onClick}
      {...props}
    >
      <span className="btn-clip-accent"></span>
      <span className="btn-text">{children}</span>
    </button>
  );
};
