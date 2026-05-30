import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useHeader } from '../context/HeaderContext';
import { useToast } from '../components/Toast';
import FloatingTabs from '../components/FloatingTabs';
import MarkdownPreview from '../components/MarkdownPreview';
import RawView from '../components/RawView';
import { LogoIcon, WarningIcon } from '../components/Icons';
import { validateContent } from '../utils/validation';
import CustomDropdown from '../components/CustomDropdown';
import { downloadNote } from '../utils/downloadUtils';
import ShareModal from '../components/ShareModal';
import './ViewerPage.css';

const MoreVertical = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

const PreviewIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const CodeIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const ChevronRight = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function ViewerPage() {
  const { noteId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { setCenterContent, setLeftContent } = useHeader();

  const [note, setNote] = useState(null);
  const [share, setShare] = useState(null);
  const [noteContent, setNoteContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('preview');
  const [isSaving, setIsSaving] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showDownloadOverlay, setShowDownloadOverlay] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const contentRef = useRef(null);

  const shareId = location.state?.shareId;

  const isOwner = useMemo(() => {
    return user && note && user.uid === note.ownerId;
  }, [user, note]);

  const accessLevel = useMemo(() => {
    if (isOwner) return 'edit';
    return share?.accessLevel || 'view';
  }, [isOwner, share]);

  const canEdit = useMemo(() => {
    return accessLevel === 'edit';
  }, [accessLevel]);

  const canDownload = useMemo(() => {
    return isOwner || accessLevel === 'download' || accessLevel === 'edit';
  }, [isOwner, accessLevel]);

  // Handle Save
  const handleSave = async (newContent) => {
    if (!canEdit) return;

    const validationError = validateContent(newContent);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'notes', noteId), {
        content: newContent,
      });
      setNote(prev => ({ ...prev, content: newContent }));
      setNoteContent(newContent);
      toast.success('Changes saved!');
      return true;
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save changes.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyContent = () => {
    if (!note) return;
    navigator.clipboard.writeText(note.content);
    toast.success('Content copied to clipboard!');
  };

  const handleDownload = (format) => {
    if (!note) return;
    downloadNote(note, format, contentRef.current);
    toast.success(`Downloading as ${format.toUpperCase()}...`);
  };

  const downloadOptions = [
    { label: 'Markdown (.md)', value: 'md' },
    { label: 'Plain Text (.txt)', value: 'txt' },
    { label: 'PDF Document (.pdf)', value: 'pdf' },
  ];

  // ── Header Left: Breadcrumbs — Context Aware ──
  useEffect(() => {
    if (!note) {
      setLeftContent(null);
      return;
    }

    const fromDashboard = location.state?.from === 'dashboard';

    setLeftContent(
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        {fromDashboard ? (
          <>
            <Link to="/" className="breadcrumb-item breadcrumb-brand">
              <LogoIcon size={16} />
              <span>Dashboard</span>
            </Link>
          </>
        ) : (
          <>
            <Link to="/" className="breadcrumb-item breadcrumb-brand">
              <LogoIcon size={16} />
              <span>ReadMe</span>
            </Link>
            <ChevronRight />
            <span className="breadcrumb-item breadcrumb-author">
              {isOwner ? 'You' : (note.ownerName || 'Guest')}
            </span>
          </>
        )}
        <ChevronRight />
        <div className="breadcrumb-item breadcrumb-title-wrapper">
          <button
            className={`breadcrumb-title ${showMeta ? 'breadcrumb-title--active' : ''}`}
            onClick={(e) => { e.stopPropagation(); setShowMeta(!showMeta); }}
            title="View document details"
          >
            {note.title}
          </button>

          {showMeta && (
            <>
              {/* Overlay to handle backdrop clicks */}
              <div className="popover-overlay" onClick={() => setShowMeta(false)} />
              <div className="breadcrumb-popover animate-fade-in-up">
                <div className="popover-meta">
                  <div className="popover-meta__header">Document Details</div>
                  <div className="popover-meta__item">
                    <span className="label">Publisher</span>
                    <span className="value">{note.ownerName || 'Guest User'}</span>
                  </div>
                  <div className="popover-meta__item">
                    <span className="label">Created At</span>
                    <span className="value">
                      {note.createdAt?.toDate ? note.createdAt.toDate().toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <div className="popover-meta__item">
                    <span className="label">Status</span>
                    <span className="value tag tag--success">Public Link</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </nav>
    );

    return () => setLeftContent(null);
  }, [note, showMeta, setLeftContent, location.state, isOwner]);


  // ── Sync Share Permissions (Real-Time) ──
  useEffect(() => {
    if (!shareId) return;
    
    const unsubscribe = onSnapshot(doc(db, 'shares', shareId), (snap) => {
      if (!snap.exists()) {
        setError('This share link has been revoked by the owner.');
      } else {
        setShare({ id: snap.id, ...snap.data() });
      }
    }, (err) => {
      console.error('Share sync error:', err);
      setError('Failed to sync permissions.');
    });

    return () => unsubscribe();
  }, [shareId]);

  // ── Sync Note Content (Real-Time) ──
  useEffect(() => {
    if (!noteId) {
      setError('Invalid note link.');
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(doc(db, 'notes', noteId), (snap) => {
      if (!snap.exists()) {
        setError('Note not found. It may have been deleted.');
        setLoading(false);
        return;
      }

      const data = snap.data();
      
      // Access Control: Must be owner, or have a valid shareId, or the note must be public
      const hasAccess = (user && user.uid === data.ownerId) || shareId || data.isPublic;
      
      if (!hasAccess) {
        setError('This note is private. Request access from the owner.');
        setLoading(false);
        return;
      }

      setNote({ id: snap.id, ...data });
      setNoteContent(data.content || '');
      setLoading(false);
    }, (err) => {
      console.error('Note sync error:', err);
      setError('Failed to load note content.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [noteId, user?.uid, shareId]);

  if (loading) {
    return (
      <div className="viewer-page">
        <div className="viewer-page__loading">
          <div className="app-loading__spinner"></div>
          <p className="text-secondary text-sm">Fetching document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="viewer-page">
        <div className="viewer-page__error animate-fade-in-up">
          <div className="viewer-page__error-icon">
            <WarningIcon size={48} />
          </div>
          <h2 className="viewer-page__error-title">Content Unavailable</h2>
          <p className="viewer-page__error-text">{error}</p>
          <Link to="/" className="btn btn-outline btn-sm" style={{ marginTop: 24 }}>Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="viewer-page">
      <div className="viewer-page__content animate-fade-in-up" style={{ paddingTop: '20px' }}>

        {/* Action Bar — Render if Owner or if permissions are granted */}
        {(isOwner || note.allowCopy !== false || note.allowDownload !== false) && (
          <div className="viewer-actions">
            {/* View Mode Switcher */}
            {canEdit && (
              <div className="view-mode-switcher">
                <button
                  className={`view-mode-btn ${activeTab === 'preview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('preview')}
                  title="Preview Mode"
                >
                  <PreviewIcon size={14} />
                  <span>Preview</span>
                </button>
                <button
                  className={`view-mode-btn ${activeTab === 'raw' ? 'active' : ''}`}
                  onClick={() => setActiveTab('raw')}
                  title="Raw Mode"
                >
                  <CodeIcon size={14} />
                  <span>Raw</span>
                </button>
              </div>
            )}

            {/* Right-aligned actions (Copy/Download) */}
            <div className="viewer-actions__right">
              {isOwner && (
                <button 
                  className="btn btn-outline btn-sm viewer-actions__btn"
                  onClick={() => setShareModalOpen(true)}
                  title="Manage Sharing"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                  </svg>
                  <span>Share</span>
                </button>
              )}

              {canDownload && (
                <button
                  className="btn btn-outline btn-sm viewer-actions__btn desktop-only"
                  onClick={handleCopyContent}
                  title="Copy note content"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy Content</span>
                </button>
              )}

              {canDownload && (
                <div key={note.id} className="desktop-only">
                  <CustomDropdown
                    options={downloadOptions}
                    placeholder="Download as..."
                    onChange={handleDownload}
                    btnSize="sm"
                    icon={() => (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    )}
                  />
                </div>
              )}

              {/* Mobile "More" Actions */}
              <div className="viewer-actions__more-wrapper mobile-only">
                <button 
                  className="viewer-actions__more-trigger"
                  onClick={() => setShowMoreActions(!showMoreActions)}
                  title="More Actions"
                >
                  <MoreVertical size={18} />
                </button>

                {showMoreActions && (
                  <>
                    <div className="popover-overlay" onClick={() => setShowMoreActions(false)} />
                    <div className="more-actions-panel animate-scale-in">
                      {isOwner && (
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setShareModalOpen(true);
                            setShowMoreActions(false);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                          </svg>
                          <span>Share Note</span>
                        </button>
                      )}

                      {canDownload && (
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            handleCopyContent();
                            setShowMoreActions(false);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </svg>
                          <span>Copy Note</span>
                        </button>
                      )}

                      {(isOwner || note.allowDownload !== false) && (
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setShowMoreActions(false);
                            setShowDownloadOverlay(true);
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                          <span>Download Note...</span>
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}



        <div style={{ display: activeTab === 'raw' && canEdit ? 'block' : 'none' }}>
          <RawView
            content={noteContent}
            isOwner={canEdit}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>

        <div style={{ display: activeTab === 'preview' || !canEdit ? 'block' : 'none' }}>
          <MarkdownPreview content={noteContent} ref={contentRef} />
        </div>
      </div>

      {/* Mobile Download Overlay - Moved out of animated container to bypass transform trap */}
      {showDownloadOverlay && (
        <div className="mobile-download-overlay" onClick={() => setShowDownloadOverlay(false)}>
          <div className="mobile-download-panel animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="mobile-download-header">Select Format</div>
            
            <button className="mobile-download-option" onClick={() => { handleDownload('md'); setShowDownloadOverlay(false); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Markdown (.md)</span>
            </button>

            <button className="mobile-download-option" onClick={() => { handleDownload('txt'); setShowDownloadOverlay(false); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Plain Text (.txt)</span>
            </button>

            <button className="mobile-download-option" onClick={() => { handleDownload('pdf'); setShowDownloadOverlay(false); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>PDF Document (.pdf)</span>
            </button>

            <button className="btn btn-outline btn-sm" style={{ marginTop: '8px', width: '100%' }} onClick={() => setShowDownloadOverlay(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
      {/* Share Modal */}
      <ShareModal 
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        item={note}
        type="note"
      />
    </div>
  );
}
