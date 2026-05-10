// Library — the calm "saved" view. Editorial column-grid.

function MemoryCard({ memory, onOpen }) {
  const isImage = memory.type === "image" || memory.type === "video";
  const isNote  = memory.type === "note";
  const isSong  = memory.type === "song";

  return (
    <article className={"m-card m-card-" + memory.type} onClick={() => onOpen(memory.id)}>
      {memory.thumb && (
        <div className="m-card-thumb" style={{ background: memory.thumb }}>
          {memory.type === "video" && <span className="m-card-play"><i className="ph ph-play"/></span>}
          {memory.type === "song" && <span className="m-card-play"><i className="ph ph-music-notes"/></span>}
          <span className="m-card-grain" />
        </div>
      )}
      <div className="m-card-body">
        <SourceChip source={memory.source} />
        <h3 className={"m-card-title " + (isNote ? "is-quote" : "")}>
          {isNote ? "\u201C" : ""}{memory.title}{isNote ? "\u201D" : ""}
        </h3>
        {memory.body && !isImage && <p className="m-card-text">{memory.body}</p>}
        <div className="m-card-meta">
          <span>{memory.time}</span>
          {memory.tags && memory.tags.slice(0, 2).map(t => <span key={t} className="m-meta-tag">#{t}</span>)}
        </div>
      </div>
      {memory.kept && <i className="ph-fill ph-bookmark-simple m-card-keep" />}
    </article>
  );
}

function FilterBar({ filter, setFilter, sort, setSort }) {
  const filters = [
    { id: "all",      label: "Everything" },
    { id: "note",     label: "Notes" },
    { id: "song",     label: "Listening" },
    { id: "reading",  label: "Reading" },
    { id: "image",    label: "Images" },
    { id: "video",    label: "Watching" },
  ];
  return (
    <div className="m-filterbar">
      <div className="m-filters">
        {filters.map(f => (
          <Pill key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>{f.label}</Pill>
        ))}
      </div>
      <div className="m-sort">
        <span className="m-sort-label">arranged by</span>
        <button className={"m-sort-btn " + (sort === "feeling" ? "is-active" : "")} onClick={() => setSort("feeling")}>feeling</button>
        <span className="m-sort-sep">·</span>
        <button className={"m-sort-btn " + (sort === "recent" ? "is-active" : "")} onClick={() => setSort("recent")}>most recent</button>
      </div>
    </div>
  );
}

function ResurfaceBand({ memories, onOpen }) {
  const items = (window.MORA_DATA.resurface.items || []).map(id => memories.find(m => m.id === id)).filter(Boolean);
  if (!items.length) return null;
  return (
    <section className="m-resurface">
      <div className="m-resurface-head">
        <Eyebrow color="var(--mora-ochre)" dot>A LITTLE FROM THE PAST</Eyebrow>
        <p className="m-resurface-blurb">Three memories from the past, brought up by something you saved this week.</p>
      </div>
      <div className="m-resurface-row">
        {items.map(m => (
          <button key={m.id} className="m-resurface-card" onClick={() => onOpen(m.id)}>
            <span className="m-resurface-when">{m.time}</span>
            <span className="m-resurface-title">{m.title}</span>
            <span className="m-resurface-source"><SourceChip source={m.source} /></span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Library({ memories, onOpen, query, filter, setFilter, sort, setSort }) {
  let list = memories;
  if (filter !== "all") list = list.filter(m => m.type === filter);
  if (query) {
    const q = query.toLowerCase();
    list = list.filter(m =>
      m.title.toLowerCase().includes(q) ||
      (m.body || "").toLowerCase().includes(q) ||
      (m.tags || []).join(" ").toLowerCase().includes(q)
    );
  }
  return (
    <div className="m-library">
      <ResurfaceBand memories={memories} onOpen={onOpen} />
      <Rule ornament />
      <FilterBar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} />
      <div className="m-grid">
        {list.map(m => <MemoryCard key={m.id} memory={m} onOpen={onOpen} />)}
      </div>
      {list.length === 0 && (
        <div className="m-empty">
          <p>Nothing matches that. Try a softer search, or clear the filter.</p>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { Library, MemoryCard, FilterBar, ResurfaceBand });
