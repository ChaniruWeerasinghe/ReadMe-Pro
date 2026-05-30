import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useHeader } from '../context/HeaderContext';
import { useToast } from '../components/Toast';
import FloatingTabs from '../components/FloatingTabs';
import MarkdownPreview from '../components/MarkdownPreview';
import RawView from '../components/RawView';
import CustomDropdown from '../components/CustomDropdown';
import { downloadNote, downloadCollectionZip } from '../utils/downloadUtils';
import { WarningIcon, PreviewIcon, CodeIcon } from '../components/Icons';
import ShareModal from '../components/ShareModal';
import './CollectionViewerPage.css';

const MoreVertical = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="1" />
    <circle cx="12" cy="5" r="1" />
    <circle cx="12" cy="19" r="1" />
  </svg>
);

export default function CollectionViewerPage() {
  const { collectionId } = useParams();
  const { user } = useAuth();
  const location = useLocation();
  const toast = useToast();
  const [collection, setCollection] = useState(null);
  const [share, setShare] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeNoteIndex, setActiveNoteIndex] = useState(0);
  const [viewMode, setViewMode] = useState('preview'); // 'raw' or 'preview'
  const [isSaving, setIsSaving] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);
  const [showDownloadOverlay, setShowDownloadOverlay] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const contentRef = useRef(null);

  const shareId = location.state?.shareId;

  const isOwner = useMemo(() => {
    return user && collection && user.uid === collection.ownerId;
  }, [user, collection]);

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

  const handleSaveNote = async (newContent) => {
    if (!canEdit || !activeNote) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'notes', activeNote.id), {
        content: newContent,
      });

      // Update local state
      const updatedNotes = [...notes];
      updatedNotes[activeNoteIndex] = { ...activeNote, content: newContent };
      setNotes(updatedNotes);

      toast.success('Note saved!');
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
    const activeNote = notes[activeNoteIndex];
    if (!activeNote) return;
    navigator.clipboard.writeText(activeNote.content);
    toast.success('Note content copied!');
  };

  const handleDownloadNote = (format) => {
    const activeNote = notes[activeNoteIndex];
    if (!activeNote) return;
    downloadNote(activeNote, format, contentRef.current);
    toast.success(`Downloading ${activeNote.title} as ${format.toUpperCase()}...`);
  };

  const handleDownloadCollection = async () => {
    if (!collection || notes.length === 0) return;
    try {
      await downloadCollectionZip(collection.name, notes);
      toast.success('Collection ZIP generated!');
    } catch (err) {
      console.error('ZIP Error:', err);
      toast.error('Failed to generate ZIP.');
    }
  };

  const downloadOptions = [
    { label: 'Markdown (.md)', value: 'md' },
    { label: 'Plain Text (.txt)', value: 'txt' },
    { label: 'PDF Document (.pdf)', value: 'pdf' },
  ];

  // Tab data for the note switcher
  const noteTabs = notes.map((n, i) => ({
    id: String(i),
    label: n.title,
  }));

  // Set header tabs on mount
  useEffect(() => {
    if (loading || error || notes.length <= 1) {
      setCenterContent(null);
    } else {
      setCenterContent(
        <FloatingTabs
          tabs={noteTabs}
          activeTab={String(activeNoteIndex)}
          onTabChange={(id) => setActiveNoteIndex(Number(id))}
        />
      );
    }

    return () => setCenterContent(null);
  }, [loading, error, notes, activeNoteIndex, setCenterContent]);

  // ── Sync Share Permissions (Real-Time) ──
  useEffect(() => {
    if (!shareId) return;
    const unsubscribe = onSnapshot(doc(db, 'shares', shareId), (snap) => {
      if (!snap.exists()) {
        setError('This share link has been revoked by the owner.');
      } else {
        setShare({ id: snap.id, ...snap.data() });
      }
    });
    return () => unsubscribe();
  }, [shareId]);

  // ── Sync Collection & Notes (Real-Time) ──
  useEffect(() => {
    if (!collectionId) {
      setError('Invalid collection link.');
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribeCol = onSnapshot(doc(db, 'collections', collectionId), async (snap) => {
      if (!snap.exists()) {
        setError('Collection not found.');
        setLoading(false);
        return;
      }

      const colData = snap.data();
      
      // Access check
      const hasAccess = (user && user.uid === colData.ownerId) || shareId || colData.isPublic;
      if (!hasAccess) {
        setError('This collection is private.');
        setLoading(false);
        return;
      }

      setCollection({ id: snap.id, ...colData });

      const noteIds = colData.noteIds || [];
      if (noteIds.length === 0) {
        setError('This collection has no notes.');
        setLoading(false);
        return;
      }

      // We'll use getDocs/onSnapshot for notes separately to keep it simple but real-time
      // For brevity in this refactor, I'll fetch them once per collection change
      // But adding multiple listeners would be more "real-time" for individual note content
      // Let's do a single listener for now that fetches all notes
      const fetchedNotes = [];
      for (const id of noteIds) {
        const noteSnap = await getDoc(doc(db, 'notes', id));
        if (noteSnap.exists()) fetchedNotes.push({ id: noteSnap.id, ...noteSnap.data() });
      }
      setNotes(fetchedNotes);
      setLoading(false);
    }, (err) => {
      console.error('Col sync error:', err);
      setError('Failed to load collection.');
      setLoading(false);
    });

    return () => unsubscribeCol();
  }, [collectionId, user?.uid, shareId]);

  const activeNote = notes[activeNoteIndex];

  // ── Loading ──
  if (loading) {
    return (
      <div className="col-viewer">
        <div className="col-viewer__loading">
          <div className="app-loading__spinner"></div>
          <p className="text-secondary text-sm">Loading collection...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="col-viewer">
        <div className="col-viewer__error animate-fade-in-up">
          <div className="col-viewer__error-icon">
            <WarningIcon />
          </div>
          <h2 className="col-viewer__error-title">Oops</h2>
          <p className="col-viewer__error-text">{error}</p>
          <Link to="/" className="btn btn-outline btn-sm" style={{ marginTop: 16 }}>Go Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="col-viewer">
      {/* Note Switcher (Top navigation is already in the header) */}

      {/* Content Area */}
      {activeNote && (
        <div className="col-viewer__content animate-fade-in-up" key={activeNote.id}>

          {/* Action Bar for Collection & Individual Note */}
          <div className="viewer-actions">
            {/* View Mode Switcher */}
            {canEdit && (
              <div className="view-mode-switcher">
                <button
                  className={`view-mode-btn ${viewMode === 'preview' ? 'active' : ''}`}
                  onClick={() => setViewMode('preview')}
                  title="Preview Mode"
                >
                  <PreviewIcon size={14} />
                  <span>Preview</span>
                </button>
                <button
                  className={`view-mode-btn ${viewMode === 'raw' ? 'active' : ''}`}
                  onClick={() => setViewMode('raw')}
                  title="Raw Mode"
                >
                  <CodeIcon size={14} />
                  <span>Raw</span>
                </button>
              </div>
            )}

            {/* Global Collection Download */}
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

            {canDownload && notes.length > 1 && (
              <button
                className="btn btn-outline btn-sm viewer-actions__btn desktop-only"
                onClick={handleDownloadCollection}
                title="Download entire collection as ZIP"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2-2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span>Download Bundle (.zip)</span>
              </button>
            )}

            <div style={{ flex: 1 }}></div>

            {/* Current Note Actions */}
            {canDownload && (
              <button
                className="btn btn-outline btn-sm viewer-actions__btn desktop-only"
                onClick={() => {
                  navigator.clipboard.writeText(activeNote.content);
                  toast.success('Note copied!');
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                <span>Copy Note</span>
              </button>
            )}

            {canDownload && (
              <div key={activeNote.id} className="desktop-only">
                <CustomDropdown
                  options={downloadOptions}
                  onChange={(format) => handleDownloadNote(format)}
                  placeholder="Download note..."
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
                        <span>Share Collection</span>
                      </button>
                    )}
                    {/* Collection Download ZIP */}
                    {(isOwner || collection?.allowDownload !== false) && notes.length > 1 && (
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          handleDownloadCollection();
                          setShowMoreActions(false);
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Download Bundle (.zip)</span>
                      </button>
                    )}

                    {/* Copy Active Note */}
                    {(isOwner || collection?.allowCopy !== false) && (
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(activeNote.content);
                          toast.success('Note copied!');
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

                    {/* Download Active Note */}
                    {(isOwner || collection?.allowDownload !== false) && (
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

          <div className="col-viewer__markdown-wrapper">
            <div style={{ display: viewMode === 'raw' && canEdit ? 'block' : 'none' }}>
              <RawView
                content={activeNote.content}
                isOwner={canEdit}
                onSave={handleSaveNote}
                isSaving={isSaving}
              />
            </div>

            <div style={{ display: viewMode === 'preview' || !canEdit ? 'block' : 'none' }}>
              <div className="card markdown-card animate-fade-in">
                <MarkdownPreview content={activeNote.content} ref={contentRef} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Download Overlay */}
      {showDownloadOverlay && (
        <div className="mobile-download-overlay" onClick={() => setShowDownloadOverlay(false)}>
          <div className="mobile-download-panel animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <div className="mobile-download-header">Select Format</div>
            
            <button className="mobile-download-option" onClick={() => { handleDownloadNote('md'); setShowDownloadOverlay(false); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Markdown (.md)</span>
            </button>

            <button className="mobile-download-option" onClick={() => { handleDownloadNote('txt'); setShowDownloadOverlay(false); }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span>Plain Text (.txt)</span>
            </button>

            <button className="mobile-download-option" onClick={() => { handleDownloadNote('pdf'); setShowDownloadOverlay(false); }}>
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
        item={collection}
        type="collection"
      />
    </div>
  );
}
