// Constellations — quiet tag clusters.
function Constellations({ memories, onOpen }) {
  const groups = window.MORA_DATA.constellations;
  return (
    <div className="m-constellations">
      <p className="m-constellations-intro">
        Threads that have run through your saving — tags that show up enough to feel like a chapter.
        Quiet collections, not algorithms.
      </p>
      <Rule ornament />
      {groups.map(g => {
        const items = memories.filter(m => (m.tags || []).includes(g.tag));
        return (
          <section key={g.tag} className="m-constellation">
            <header className="m-constellation-head">
              <h2 className="m-constellation-name">#{g.tag}</h2>
              <span className="m-constellation-count">{g.count} memories</span>
            </header>
            <p className="m-constellation-blurb">{g.blurb}</p>
            <ul className="m-constellation-list">
              {items.map(it => (
                <li key={it.id} onClick={() => onOpen(it.id)}>
                  <span className="m-cl-time">{it.time}</span>
                  <span className="m-cl-title">{it.title}</span>
                  <span className="m-cl-source">{it.source}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

Object.assign(window, { Constellations });
