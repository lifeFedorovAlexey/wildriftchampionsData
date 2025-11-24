// ui/src/components/MenuReturn.jsx
export default function MenuReturn({ onBack }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 10,
      }}
    >
      <button
        type="button"
        onClick={onBack}
        style={{
          border: "none",
          borderRadius: 999,
          padding: "4px 10px",
          fontSize: 13,
          cursor: "pointer",
          background: "rgba(15,23,42,0.9)",
          color: "inherit",
        }}
      >
        Меню
      </button>
    </div>
  );
}
