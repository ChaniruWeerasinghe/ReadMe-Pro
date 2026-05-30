import { useState, useEffect, useCallback } from 'react';
import { validateName } from '../utils/validation';
import { WarningIcon } from './Icons';
import './CreateCollectionModal.css';

export default function CreateCollectionModal({ isOpen, onClose, onSubmit, notes, isSubmitting }) {
  const [name, setName] = useState('');
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setSelectedNotes([]);
      setErrors({});
      setTouched({});
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

  // ── Validation Runners ──
  const runNameValidation = (val) => {
    const error = validateName(val, 'Collection Name');
    setErrors(prev => ({ ...prev, name: error }));
    return error;
  };

  const validateSelection = (sel) => {
    let error = '';
    if (sel.length < 1) error = 'Select at least 1 note';
    if (sel.length > 20) error = 'Maximum 20 notes per collection';
    setErrors(prev => ({ ...prev, notes: error }));
    return error;
  };

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    runNameValidation(val);
  };

  const handleNameBlur = () => {
    setTouched((prev) => ({ ...prev, name: true }));
    runNameValidation(name);
  };

  const toggleNote = useCallback((noteId) => {
    setSelectedNotes((prev) => {
      const next = prev.includes(noteId)
        ? prev.filter((id) => id !== noteId)
        : [...prev, noteId];

      validateSelection(next);
      return next;
    });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();

    const nameError = runNameValidation(name);
    const notesError = validateSelection(selectedNotes);

    setTouched({ name: true, notes: true });

    if (nameError || notesError) return;

    try {
      onSubmit({ name: name.trim(), noteIds: selectedNotes });
    } catch (err) {
      console.error('Submit error:', err);
      setErrors(prev => ({ ...prev, submit: 'Failed to create collection.' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay animate-fade-in" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal collection-modal animate-scale-in">
        <div className="modal__header">
          <h2 className="modal__title">New Collection</h2>
          <button className="modal__close" onClick={onClose} aria-label="Close modal">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal__form" noValidate>
          {/* Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="collection-name">
              Collection Name <span className="form-required">*</span>
            </label>
            <input
              id="collection-name"
              type="text"
              className={`input ${errors.name && (touched.name || name.length > 0) ? 'input-error' : ''}`}
              placeholder="e.g. Project Alpha Research"
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              maxLength={65}
              disabled={isSubmitting}
              autoComplete="off"
            />
            <div className="form-footer">
              {errors.name && (touched.name || name.length > 0) ? (
                <span className="form-error">
                  <WarningIcon size={14} />
                  {errors.name}
                </span>
              ) : <span></span>}
              <span className={`form-counter ${name.length > 60 ? 'text-danger' : ''}`}>
                {name.length}/65
              </span>
            </div>
          </div>

          {/* Note Selection */}
          <div className="form-group">
            <label className="form-label">
              Included Notes <span className="form-required">*</span>
              <span className={`form-counter ${selectedNotes.length >= 20 ? 'text-danger' : ''}`}>
                {selectedNotes.length}/20 selected
              </span>
            </label>

            {notes.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '32px 16px', background: 'var(--bg-hover)' }}>
                <p className="text-secondary text-sm">
                  No notes available to collect.
                </p>
                <p className="text-muted text-xs" style={{ marginTop: 8 }}>
                  Create some notes first!
                </p>
              </div>
            ) : (
              <div className="collection-notes-list">
                {notes.map((note) => {
                  const isSelected = selectedNotes.includes(note.id);
                  return (
                    <button
                      key={note.id}
                      type="button"
                      className={`collection-note-item ${isSelected ? 'collection-note-item--selected' : ''}`}
                      onClick={() => toggleNote(note.id)}
                      disabled={isSubmitting}
                    >
                      <div className="collection-note-item__check">
                        {isSelected && (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-fade-in">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span className="collection-note-item__title">{note.title}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <div className="form-footer">
              {errors.notes && (touched.notes || selectedNotes.length > 0) ? (
                <span className="form-error">
                  <WarningIcon size={14} />
                  {errors.notes}
                </span>
              ) : <span></span>}
            </div>
          </div>

          {/* Actions */}
          <div className="modal__actions">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-solid" 
              disabled={isSubmitting || notes.length === 0 || !!errors.name || !!errors.notes || !name.trim() || selectedNotes.length === 0}
            >
              {isSubmitting ? (
                <>
                  <span className="login-spinner" style={{ width: 16, height: 16 }}></span>
                  Creating...
                </>
              ) : (
                'Create Collection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
