import './NoteCard.css';

export default function NoteCard({ note, onShare, onDelete, isSelected }) {
  const createdDate = note.createdAt?.toDate
    ? note.createdAt.toDate()
    : new Date(note.createdAt);

  const formattedDate = createdDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const timeAgo = getTimeAgo(createdDate);
  const type = detectType(note.content);

  return (
    <div className={`note-card card animate-fade-in-up ${isSelected ? 'note-card--selected' : ''}`}>
      <div className="note-card__header">
        <h3 className="note-card__title" title={note.title}>{note.title}</h3>
        <span className="note-card__date" title={formattedDate}>{timeAgo}</span>
      </div>

      <p className="note-card__preview">
        {truncate(note.content, 140)}
      </p>

      <div className="note-card__footer">
        <div className="note-card__tags">
          <span className={`tag tag--${type.toLowerCase()}`}>
            {type === 'Markdown' && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}>
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            )}
            {type}
          </span>
        </div>
        <div className="note-card__actions">
          <button
            className="note-card__btn note-card__btn--share"
            onClick={(e) => { e.stopPropagation(); onShare(note); }}
            title="Copy share link"
            aria-label="Share note"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
          </button>
          <button
            className="note-card__btn note-card__btn--delete"
            onClick={(e) => { e.stopPropagation(); onDelete(note); }}
            title="Delete note"
            aria-label="Delete note"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

function truncate(str, max) {
  if (!str) return '';
  // Remove markdown symbols from preview for cleaner look
  const clean = str.replace(/[#*`_~]/g, '').trim();
  return clean.length > max ? clean.substring(0, max).trim() + '…' : clean;
}

function detectType(content) {
  if (!content) return 'Text';
  if (/^#{1,6}\s|^\*\*|^\-\s|^\d+\.\s|```|\[.+\]\(.+\)/m.test(content)) return 'Markdown';
  return 'Text';
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
