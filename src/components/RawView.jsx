import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import './RawView.css';

const EditIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const SaveIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const CancelIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default function RawView({ content, isOwner, onSave, isSaving }) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [localContent, setLocalContent] = useState(content);
  const textareaRef = useRef(null);

  useEffect(() => {
    setLocalContent(content || '');
  }, [content]);

  // Handle Save
  const handleSave = async () => {
    const success = await onSave(localContent);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setLocalContent(content || '');
    setIsEditing(false);
  };

  // Split lines robustly using Regex for all line break types
  const lines = useMemo(() => {
    return (localContent || '').split(/\r\n|\r|\n/);
  }, [localContent]);

  // Auto-resize textarea to exactly match the scrolling content height
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, localContent]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(localContent || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      try {
        const textarea = document.createElement('textarea');
        textarea.value = localContent || '';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* silently fail */ }
    }
  }, [localContent]);

  return (
    <div className={`raw-view ${isEditing ? 'raw-view--editing' : ''}`}>
      <div className="raw-view__toolbar">
        <div className="raw-view__left">
          <span className="raw-view__label">{isEditing ? 'Editor' : 'Raw Content'}</span>
          {isSaving && <span className="raw-view__saving">Saving...</span>}
        </div>
        
        <div className="raw-view__actions">
          {!isEditing ? (
            <>
              {isOwner && (
                <button className="raw-view__btn raw-view__btn--edit" onClick={() => setIsEditing(true)}>
                  <EditIcon />
                  <span>Edit</span>
                </button>
              )}
              <button
                className={`raw-view__btn raw-view__btn--copy ${copied ? 'raw-view__btn--done' : ''}`}
                onClick={handleCopy}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </>
          ) : (
            <>
              <button className="raw-view__btn raw-view__btn--cancel" onClick={handleCancel} disabled={isSaving}>
                <CancelIcon />
                <span>Cancel</span>
              </button>
              <button className="raw-view__btn raw-view__btn--save" onClick={handleSave} disabled={isSaving}>
                <SaveIcon />
                <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="raw-view__content">
        {/* Pixel-Perfect Line Numbers Column */}
        <div className="raw-view__lines" aria-hidden="true">
          {lines.map((_, i) => (
            <span key={i} className="raw-view__line-num">{i + 1}</span>
          ))}
        </div>
        
        {/* Code / Editor Area with Syncronized Padding */}
        <div className="raw-view__code-container">
          {isEditing ? (
            <textarea
              ref={textareaRef}
              className="raw-view__editor"
              value={localContent}
              onChange={(e) => setLocalContent(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              spellCheck="false"
              autoFocus
            />
          ) : (
            <pre className="raw-view__code">
              {localContent || 'No content yet.'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
