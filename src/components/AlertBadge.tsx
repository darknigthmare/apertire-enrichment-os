import React from "react";

interface AlertBadgeProps {
  severity: "error" | "warning" | "success" | "info";
  label?: string;
  className?: string;
}

export const AlertBadge: React.FC<AlertBadgeProps> = ({
  severity,
  label,
  className = "",
}) => {
  const badgeClass = severity === "error" ? "danger" : severity;
  const badgeLabel = label || (severity === "error" ? "CRITIQUE" : severity.toUpperCase());

  return (
    <span className={`alert-badge ${badgeClass} ${className}`}>
      {badgeLabel}
    </span>
  );
};
