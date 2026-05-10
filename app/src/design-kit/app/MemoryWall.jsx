// Memory Wall — daily resurface, biggest editorial moment.
function MemoryWall({ memories, onOpen }) {
  const featured = memories.find(m => m.id === "m2");
  const others = memories.filter(m => m.id !== featured.id).slice(0, 3);
  return (
    <div className="m-wall">
      <div class="m-wall-date">
        <span className="m-wall-day">Friday</span>
        <span className="m-wall-date-num">10</span>
        <span className="m-wall-month">May 2026</span>
      </div>
      <h1 className="m-wall-greeting">
        Good morning. Three things you might be ready to revisit.
      </h1>

      <article className="m-wall-feature" onClick={() => onOpen(featured.id)}>
        <Eyebrow color="var(--mora-ochre)" dot>YOU WROTE THIS LAST OCTOBER</Eyebrow>
        <blockquote>"{featured.title}"</blockquote>
        <p>{featured.body}</p>
        <div className="m-wall-feature-foot">
          <SourceChip source={featured.source} />
          <span className="m-wall-when">{featured.time}</span>
        </div>
      </article>

      <Rule ornament />

      <div className="m-wall-secondaries">
        {others.map(m => (
          <article key={m.id} className="m-wall-second" onClick={() => onOpen(m.id)}>
            <Eyebrow>{m.source.toUpperCase()}</Eyebrow>
            <h3>{m.title}</h3>
            <p>{m.body}</p>
            <span className="m-wall-when">{m.time}</span>
          </article>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { MemoryWall });
