// Mora atoms — buttons, chips, eyebrows, rules.
const { useState } = React;

function Eyebrow({ children, dot, color = "var(--mora-ember)" }) {
  return (
    <span className="m-eyebrow">
      {dot && <span className="m-eyebrow-dot" style={{ background: color }} />}
      {children}
    </span>
  );
}

function Rule({ ornament = false }) {
  return (
    <div className="m-rule">
      <span className="m-rule-line" />
      {ornament && <span className="m-rule-orn">˖</span>}
      <span className="m-rule-line" />
    </div>
  );
}

function Pill({ active, children, onClick }) {
  return (
    <button onClick={onClick} className={"m-pill " + (active ? "is-active" : "")}>
      {children}
    </button>
  );
}

function Tag({ children }) {
  return <span className="m-tag">#{children}</span>;
}

function SourceChip({ source }) {
  const map = {
    "Spotify":        { c: "moss" },
    "Pinterest":      { c: "ember" },
    "YouTube":        { c: "ochre" },
    "Mora · Journal": { c: "indigo" },
    "Nytimes":        { c: "ink" },
    "Are.na":         { c: "ink" },
    "Manual":         { c: "ink" },
  };
  const k = map[source] || { c: "ink" };
  return (
    <span className={"m-source m-source-" + k.c}>
      <span className="m-source-dot" />
      {source}
    </span>
  );
}

function IconBtn({ icon, label, onClick, active }) {
  return (
    <button onClick={onClick} className={"m-iconbtn " + (active ? "is-active" : "")} aria-label={label}>
      <i className={(active ? "ph-fill " : "ph ") + "ph-" + icon} />
    </button>
  );
}

function Btn({ kind = "secondary", children, onClick, icon }) {
  return (
    <button onClick={onClick} className={"m-btn m-btn-" + kind}>
      {icon && <i className={"ph ph-" + icon} />}
      {children}
    </button>
  );
}

Object.assign(window, { Eyebrow, Rule, Pill, Tag, SourceChip, IconBtn, Btn });
