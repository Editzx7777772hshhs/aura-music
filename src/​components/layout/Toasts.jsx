import React from "react";

export default function Toasts({ toasts }) {
  return (
    <div className="toasts">
      {toasts.map((t) => (
        <div key={t.id} className="toast glass">
          <t.icon size={15} />
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
