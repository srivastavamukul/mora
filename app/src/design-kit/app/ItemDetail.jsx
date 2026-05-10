// Item Detail — focused editorial reading view.
function ItemDetail({ memory, onBack, onToggleKeep, related }) {
  if (!memory) return null;
  const isNote = memory.type === "note";

  return (
    <article className="m-detail">
      <button className="m-back" onClick={onBack}>
        <i className="ph ph-arrow-left" /> Back to library
      </button>

      {memory.thumb && (
        <figure className="m-detail-figure" style={{ background: memory.thumb }}>
          <span className="m-card-grain" />
          <figcaption>{memory.source} · {memory.time}</figcaption>
        </figure>
      )}

      <div className="m-detail-head">
        <SourceChip source={memory.source} />
        <span className="m-detail-time">{memory.time}</span>
      </div>

      {isNote ? (
        <blockquote className="m-detail-quote">
          {memory.title}
        </blockquote>
      ) : (
        <h1 className="m-detail-title">{memory.title}</h1>
      )}

      {memory.author && <p className="m-detail-author">{memory.author}</p>}

      <p className="m-detail-body">{memory.body}</p>

      <Rule />

      <div className="m-detail-actions">
        <Btn kind={memory.kept ? "kept" : "primary"} icon={memory.kept ? "bookmark-simple-fill" : "bookmark-simple"} onClick={onToggleKeep}>
          {memory.kept ? "Kept" : "Keep this"}
        </Btn>
        <Btn kind="secondary" icon="arrow-up-right">Open the original</Btn>
        <Btn kind="ghost" icon="pencil-simple">Edit</Btn>
        <Btn kind="ghost" icon="trash">Forget</Btn>
      </div>

      <section className="m-detail-tags">
        <Eyebrow>TAGS</Eyebrow>
        <div className="m-detail-tag-row">
          {(memory.tags || []).map(t => <Tag key={t}>{t}</Tag>)}
        </div>
      </section>

      <section className="m-detail-private">
        <Eyebrow>A NOTE TO YOURSELF</Eyebrow>
        <p className="m-detail-private-empty">You haven't written anything here yet. Press to add a private note — it stays between you and Mora.</p>
      </section>

      {related && related.length > 0 && (
        <section className="m-detail-related">
          <Eyebrow color="var(--mora-moss)" dot>NEAR THIS</Eyebrow>
          <h2 className="m-related-h">Other memories that share a thread</h2>
          <div className="m-related-list">
            {related.map(r => (
              <div key={r.id} className="m-related-item">
                <span className="m-related-time">{r.time}</span>
                <span className="m-related-title">{r.title}</span>
                <span className="m-related-source">{r.source}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

Object.assign(window, { ItemDetail });
