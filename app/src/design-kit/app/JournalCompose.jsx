// Journal Compose — modal sheet, calm not "modal".
function JournalCompose({ onClose, onSave }) {
  const [text, setText] = React.useState("");
  const [tags, setTags] = React.useState("");
  return (
    <div className="m-compose-scrim" onClick={onClose}>
      <div className="m-compose" onClick={e => e.stopPropagation()}>
        <header className="m-compose-head">
          <Eyebrow color="var(--mora-moss)" dot>A THOUGHT, KEPT</Eyebrow>
          <button className="m-compose-close" onClick={onClose}>×</button>
        </header>
        <p className="m-compose-prompt">What's on your mind right now? You don't need a reason to write it down.</p>
        <textarea
          autoFocus
          className="m-compose-text"
          placeholder="Caught myself smiling at the way the kitchen smelled this morning…"
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <div className="m-compose-tags">
          <i className="ph ph-hash" />
          <input
            placeholder="tag with a thread (small things, mornings, from-aileen…)"
            value={tags}
            onChange={e => setTags(e.target.value)}
          />
        </div>
        <footer className="m-compose-foot">
          <span className="m-compose-meta">It stays between you and Mora.</span>
          <div className="m-compose-actions">
            <Btn kind="ghost" onClick={onClose}>Not now</Btn>
            <Btn kind="primary" icon="bookmark-simple" onClick={() => onSave(text, tags)}>Keep</Btn>
          </div>
        </footer>
      </div>
    </div>
  );
}

Object.assign(window, { JournalCompose });
