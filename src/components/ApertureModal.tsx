import React, { useEffect } from "react";
import "./components.css";

interface ApertureModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footerButtons?: React.ReactNode;
}

export const ApertureModal: React.FC<ApertureModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerButtons,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="aperture-modal-overlay" onClick={onClose}>
      <div className="aperture-modal" onClick={(e) => e.stopPropagation()}>
        <div className="aperture-modal-header">
          <div className="aperture-modal-title">{title}</div>
          <button className="aperture-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="aperture-modal-body">{children}</div>
        {footerButtons && <div className="aperture-modal-footer">{footerButtons}</div>}
      </div>
    </div>
  );
};
