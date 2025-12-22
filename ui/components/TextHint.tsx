"use client";

export default function TextHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 13,
        opacity: 0.8,
        textAlign: "center",
        paddingTop: 6,
        paddingBottom: 6,
      }}
    >
      {children}
    </div>
  );
}
