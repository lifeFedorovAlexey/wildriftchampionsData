// ui/src/components/RolesFilter.jsx
import React from "react";

/**
 * roles: Array<{ key: string, label: string }>
 * selectedRoles: string[]      // несколько ролей
 * onChange: (roleKeys: string[]) => void
 */
export function RolesFilter({ roles, selectedRoles, onChange }) {
  const handleClick = (key) => {
    if (selectedRoles.includes(key)) {
      // снять выбор
      onChange(selectedRoles.filter((k) => k !== key));
    } else {
      // добавить выбор
      onChange([...selectedRoles, key]);
    }
  };

  return (
    <div
      style={{
        height: 60,
        display: "flex",
        alignItems: "center",
        gap: 8,
        overflowX: "auto",
        padding: "0 14px",
      }}
    >
      {roles.map((role) => {
        const active = selectedRoles.includes(role.key);
        return (
          <button
            key={role.key}
            type="button"
            onClick={() => handleClick(role.key)}
            style={{
              flexShrink: 0,
              padding: "6px 10px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              fontSize: 12,
              whiteSpace: "nowrap",
              background: active ? "#3b82f6" : "#141824",
              color: "inherit",
            }}
          >
            {role.label}
          </button>
        );
      })}
    </div>
  );
}
