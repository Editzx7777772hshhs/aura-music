import React from "react";

export function Section({ title, icon: Icon, children, action }) {
  return (
    <section className="section">
      <div className="section-head">
        <h2>
          <Icon size={16} />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ icon: Icon, title, msg }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={26} />
      </div>
      <div className="empty-title">{title}</div>
      <div className="empty-msg">{msg}</div>
    </div>
  );
}
