// Sidebar + TopBar
function Sidebar({ route, setRoute }) {
  const items = [
    { id: "library",       icon: "stack",                  label: "Library" },
    { id: "memorywall",    icon: "hourglass-medium",       label: "Memory Wall" },
    { id: "constellations",icon: "graph",                  label: "Constellations" },
    { id: "sources",       icon: "link-simple",            label: "Sources" },
    { id: "settings",      icon: "gear-six",               label: "Settings" },
  ];
  return (
    <aside className="m-sidebar">
      <div className="m-brand">
        <span className="m-brand-word">Mora</span>
        <span className="m-brand-dot" />
      </div>
      <button className="m-capture-cta" onClick={() => setRoute("compose")}>
        <i className="ph ph-feather" />
        Capture a thought
      </button>
      <nav className="m-nav">
        {items.map(it => (
          <button key={it.id}
            className={"m-nav-item " + (route === it.id ? "is-active" : "")}
            onClick={() => setRoute(it.id)}>
            <i className={"ph ph-" + it.icon} />
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="m-sidebar-foot">
        <div className="m-sidebar-quote">
          "A memory is a place you visit with footnotes."
        </div>
        <div className="m-sidebar-meta">— from your archive, page 17</div>
      </div>
    </aside>
  );
}

function TopBar({ eyebrow, title, count, onSearch, query }) {
  return (
    <header className="m-topbar">
      <div className="m-topbar-left">
        {eyebrow && <Eyebrow dot>{eyebrow}</Eyebrow>}
        <h1 className="m-page-title">{title}</h1>
        {typeof count === "number" && <span className="m-count">{count} kept</span>}
      </div>
      <div className="m-topbar-right">
        <div className="m-search">
          <i className="ph ph-magnifying-glass" />
          <input value={query} onChange={e => onSearch(e.target.value)} placeholder="Find a memory…" />
        </div>
        <div className="m-avatar" title="You" />
      </div>
    </header>
  );
}

Object.assign(window, { Sidebar, TopBar });
