import { useState, useRef, useEffect } from 'react';
import { validateTitle, validateContent } from '../utils/validation';
import { WarningIcon } from './Icons';
import './AddNoteModal.css';

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 50000;
const ALLOWED_EXTENSIONS = ['.md', '.txt', '.markdown'];

export default function AddNoteModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const titleRef = useRef(null);
  const fileInputRef = useRef(null);
  const overlayRef = useRef(null);

  // Focus title on open
  useEffect(() => {
    if (isOpen && titleRef.current) {
      setTimeout(() => titleRef.current.focus(), 200);
    }
  }, [isOpen]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setContent('');
      setErrors({});
      setTouched({});
      setFileName('');
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // ── Unified Internal Validation Runner ──
  const runValidation = (type, val) => {
    let error = '';
    if (type === 'title') error = validateTitle(val, 'Title', MAX_TITLE_LENGTH);
    if (type === 'content') error = validateContent(val, 3, MAX_CONTENT_LENGTH);
    
    setErrors(prev => ({ ...prev, [type]: error }));
    return error;
  };

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    runValidation('title', val);
  };

  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    runValidation('content', val);
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    runValidation(field, field === 'title' ? title : content);
  };

  // ── File Upload ──
  const handleFileRead = (file) => {
    try {
      const ext = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setErrors((prev) => ({ ...prev, file: `Only ${ALLOWED_EXTENSIONS.join(', ')} files are allowed` }));
        return;
      }

      if (file.size > 500 * 1024) {
        setErrors((prev) => ({ ...prev, file: 'File size must be under 500KB' }));
        return;
      }

      setErrors((prev) => ({ ...prev, file: '' }));

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target.result;
          setContent(text);
          setFileName(file.name);
          
          if (!title.trim()) {
            const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
            // Limit filename if it's too long and strip numbers
            const safeName = nameWithoutExt.substring(0, MAX_TITLE_LENGTH).replace(/[0-9]/g, '');
            setTitle(safeName);
          }
          
          setTouched((prev) => ({ ...prev, content: true }));
          runValidation('content', text);
        } catch (innerErr) {
          console.error('File load error:', innerErr);
          setErrors(prev => ({ ...prev, file: 'Failed to process file content.' }));
        }
      };
      reader.onerror = () => {
        setErrors((prev) => ({ ...prev, file: 'Failed to read file. Please try again.' }));
      };
      reader.readAsText(file);
    } catch (err) {
      console.error('File read setup error:', err);
      setErrors((prev) => ({ ...prev, file: 'Unexpected error reading file.' }));
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  // ── Drag & Drop ──
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  };

  // ── Submit ──
  const handleSubmit = (e) => {
    e.preventDefault();

    const titleError = runValidation('title', title);
    const contentError = runValidation('content', content);

    setTouched({ title: true, content: true });

    if (titleError || contentError) return;

    try {
      onSubmit({ title: title.trim(), content });
    } catch (err) {
      console.error('Submit error:', err);
      setErrors(prev => ({ ...prev, submit: 'Failed to save note. System error.' }));
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay animate-fade-in"
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="modal animate-scale-in">
        <div className="modal__header">
          <h2 className="modal__title">New Note</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form" noValidate>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="note-title">
              Title <span className="form-required">*</span>
            </label>
            <input
              ref={titleRef}
              id="note-title"
              type="text"
              className={`input ${errors.title && (touched.title || title.length > 0) ? 'input-error' : ''}`}
              placeholder="e.g. Research Notes or Project Alpha"
              value={title}
              onChange={handleTitleChange}
              onBlur={() => handleBlur('title')}
              maxLength={MAX_TITLE_LENGTH + 10}
              disabled={isSubmitting}
              autoComplete="off"
            />
            <div className="form-footer">
              {(errors.title && (touched.title || title.length > 0)) ? (
                <span className="form-error">
                  <WarningIcon size={14} />
                  {errors.title}
                </span>
              ) : <div></div>}
              <span className={`form-counter ${(title.length > MAX_TITLE_LENGTH || (errors.title && touched.title)) ? 'text-danger' : ''}`}>
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="form-group">
            <label className="form-label">
              Import Content (Optional)
            </label>
            <div
              className={`file-drop ${isDragging ? 'file-drop--active' : ''} ${fileName ? 'file-drop--success' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.markdown"
                onChange={handleFileSelect}
                hidden
              />
              <div className="file-drop__icon-container">
                {fileName ? (
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="file-drop__icon">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="17 8 12 3 7 8" />
                    <line x1="12" y1="3" x2="12" y2="15" />
                  </svg>
                )}
              </div>
              <span className="file-drop__text">
                {fileName
                  ? <>Ready to import: <strong>{fileName}</strong></>
                  : <>Drop a <strong>.md</strong> or <strong>.txt</strong> file, or click to browse</>}
              </span>
            </div>
            {errors.file && <span className="form-error" style={{ marginTop: 8 }}><WarningIcon size={14} />{errors.file}</span>}
          </div>

          {/* Content */}
          <div className="form-group">
            <label className="form-label" htmlFor="note-content">
              Content <span className="form-required">*</span>
            </label>
            <textarea
              id="note-content"
              className={`textarea ${errors.content && (touched.content || content.length > 0) ? 'input-error' : ''}`}
              placeholder="Paste your markdown or text here..."
              value={content}
              onChange={handleContentChange}
              onBlur={() => handleBlur('content')}
              rows={6}
              disabled={isSubmitting}
              autoComplete="off"
            />
            <div className="form-footer">
              {(errors.content && (touched.content || content.length > 3)) ? (
                <span className="form-error">
                  <WarningIcon size={14} />
                  {errors.content}
                </span>
              ) : <div></div>}
              <span className={`form-counter ${content.length > MAX_CONTENT_LENGTH ? 'text-danger' : ''}`}>
                {content.length.toLocaleString()}/{MAX_CONTENT_LENGTH.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="modal__actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-solid"
              disabled={isSubmitting || !!errors.title || !!errors.content || !title.trim() || !content.trim()}
            >
              {isSubmitting ? (
                <>
                  <span className="login-spinner" style={{ width: 16, height: 16 }}></span>
                  Saving...
                </>
              ) : (
                'Create Note'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
