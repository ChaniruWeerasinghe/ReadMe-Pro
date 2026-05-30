import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  collection as fbCollection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useHeader } from '../context/HeaderContext';
import { useToast } from '../components/Toast';
import NoteCard from '../components/NoteCard';
import AddNoteModal from '../components/AddNoteModal';
import CreateCollectionModal from '../components/CreateCollectionModal';
import ShareModal from '../components/ShareModal';
import FloatingTabs from '../components/FloatingTabs';
import SystemAlert from '../components/SystemAlert';
import { LogoIcon, WarningIcon } from '../components/Icons';
import './DashboardPage.css';

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const CodeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const LinkIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
  </svg>
);

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

function LandingView({ onStart }) {
  return (
    <div className="landing-view animate-fade-in">
      <div className="landing-hero animate-fade-in-up">
        <h1 className="landing-hero__title">
          Share your notes <br />
          <span className="text-secondary">with zero friction.</span>
        </h1>
        <p className="landing-hero__subtitle">
          The minimalistic markdown sharing platform. Upload your notes, get a private link, and share beautifully formatted content instantly.
        </p>
        <div className="landing-hero__actions">
          <button className="btn btn-solid btn-lg" onClick={onStart}>
            Get Started
          </button>
        </div>
      </div>

      <div className="landing-features animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
        <div className="feature-card">
          <div className="feature-card__icon"><CodeIcon /></div>
          <h3>Markdown Ready</h3>
          <p>Full GFM support with syntax highlighting for code blocks.</p>
        </div>
        <div className="feature-card">
          <div className="feature-card__icon"><LinkIcon /></div>
          <h3>Instant Sharing</h3>
          <p>One-click links to share individual notes or entire collections.</p>
        </div>
        <div className="feature-card">
          <div className="feature-card__icon"><LockIcon /></div>
          <h3>Privacy First</h3>
          <p>Your notes are private by default. Only shared links are public.</p>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { setCenterContent } = useHeader();
  const [notes, setNotes] = useState([]);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteData, setDeleteData] = useState(null);
  const [activeView, setActiveView] = useState('notes');
  const [searchQuery, setSearchQuery] = useState('');
  const [indexError, setIndexError] = useState(false);

  // ── Sharing State ──
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareItem, setShareItem] = useState(null);
  const [shareType, setShareType] = useState('note');
  const [isUpdatingShare, setIsUpdatingShare] = useState(false);

  // ── Sync Header Tabs ──
  useEffect(() => {
    if (!user) {
      setCenterContent(null);
      return;
    }

    const tabs = [
      { id: 'notes', label: 'Notes' },
      { id: 'collections', label: 'Collections' },
    ];

    setCenterContent(
      <FloatingTabs
        tabs={tabs}
        activeTab={activeView}
        onTabChange={setActiveView}
      />
    );

    return () => setCenterContent(null);
  }, [user, activeView, setCenterContent]);

  // ── Fetch Notes ──
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setNotes([]);
      return;
    }

    setLoading(true);
    setIndexError(false);
    const q = query(
      fbCollection(db, 'notes'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setNotes(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      setLoading(false);
    }, (err) => {
      setLoading(false);
      console.error('Notes fetch error:', err);
      if (err.code === 'failed-precondition' || err.message.includes('index')) {
        setIndexError(true);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // ── Fetch Collections ──
  useEffect(() => {
    if (!user?.uid) {
      setCollectionsLoading(false);
      setCollections([]);
      return;
    }

    setCollectionsLoading(true);
    const q = query(
      fbCollection(db, 'collections'),
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCollections(snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() })));
      setCollectionsLoading(false);
    }, (err) => {
      console.error('Collections fetch error:', err);
      setCollectionsLoading(false);
      if (err.code === 'failed-precondition' || err.message.includes('index')) {
        setIndexError(true);
      }
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // ── Search Logic ──
  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) return notes;
    const lowSearch = searchQuery.toLowerCase();
    return notes.filter(n =>
      n.title.toLowerCase().includes(lowSearch) ||
      n.content.toLowerCase().includes(lowSearch)
    );
  }, [notes, searchQuery]);

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) return collections;
    const lowSearch = searchQuery.toLowerCase();
    return collections.filter(c => c.name.toLowerCase().includes(lowSearch));
  }, [collections, searchQuery]);

  // ── Handlers ──
  const handleCreateNote = async (data) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(fbCollection(db, 'notes'), {
        ...data,
        ownerId: user.uid,
        ownerName: user.displayName,
        isPublic: true,
        createdAt: serverTimestamp(),
      });
      setNoteModalOpen(false);
      toast.success('Note shared! Redirecting...');

      setTimeout(() => {
        navigate(`/share/${docRef.id}`, { state: { from: 'dashboard' } });
      }, 700);

    } catch (err) {
      console.error('Add note error:', err);
      toast.error('Failed to share note. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCollection = async (data) => {
    if (!user) {
      navigate('/login');
      return;
    }

    setSubmitting(true);
    try {
      const docRef = await addDoc(fbCollection(db, 'collections'), {
        ...data,
        ownerId: user.uid,
        ownerName: user.displayName,
        createdAt: serverTimestamp(),
      });
      setCollectionModalOpen(false);
      toast.success('Collection created!');

      navigate(`/collection/${docRef.id}`);
    } catch (err) {
      console.error('Add col error:', err);
      toast.error('Failed to create collection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShareNote = (note) => {
    setShareItem(note);
    setShareType('note');
    setShareModalOpen(true);
  };

  const handleShareCollection = (col) => {
    setShareItem(col);
    setShareType('collection');
    setShareModalOpen(true);
  };

  const handleUpdateShareSettings = async (id, settings) => {
    setIsUpdatingShare(true);
    try {
      const collectionName = shareType === 'note' ? 'notes' : 'collections';
      await updateDoc(doc(db, collectionName, id), settings);
      toast.success('Share settings updated.');
    } catch (err) {
      console.error('Update share error:', err);
      toast.error('Failed to update settings.');
      throw err;
    } finally {
      setIsUpdatingShare(false);
    }
  };

  const handleDeleteTrigger = (item, type) => {
    setDeleteData({ item, type });
  };

  const confirmDelete = async () => {
    if (!deleteData) return;
    setSubmitting(true);
    try {
      const collectionName = deleteData.type === 'note' ? 'notes' : 'collections';
      await deleteDoc(doc(db, collectionName, deleteData.item.id));
      toast.success('Deleted successfully.');
      setDeleteData(null);
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFabClick = (action) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (action === 'note') setNoteModalOpen(true);
    if (action === 'collection') setCollectionModalOpen(true);
  };

  // ── Render Helpers ──
  if (!user) {
    return (
      <div className="dashboard">
        <div className="dashboard__content">
          <LandingView onStart={() => navigate('/login')} />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard__content">

        {/* Index Error/Warning */}
        {indexError && (
          <div className="dashboard__warning animate-fade-in-up">
            <WarningIcon size={18} />
            <p className="text-secondary text-sm">
              Firestore indexing is still in progress or a composite index is missing. Some content may temporarily be hidden.
              Please check your console for the direct link to create the index.
            </p>
          </div>
        )}

        {/* Search Bar (Left aligned) */}
        {(notes.length > 0 || collections.length > 0) && (
          <div className="dashboard__search-row animate-fade-in">
            <div className={`search-box ${searchQuery ? 'search-box--active' : ''}`}>
              <SearchIcon />
              <input
                type="text"
                placeholder={`Search ${activeView}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-box__clear" onClick={() => setSearchQuery('')}>&times;</button>
              )}
            </div>
          </div>
        )}

        {loading || collectionsLoading ? (
          <div className="dashboard__loading">
            <div className="app-loading__spinner"></div>
            <p className="text-secondary text-sm">Fetching your content...</p>
          </div>
        ) : (
          activeView === 'notes' ? (
            /* ── Notes View ── */
            notes.length === 0 ? (
              <div className="dashboard__empty animate-fade-in-up">
                <div className="dashboard__empty-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                </div>
                <h2 className="dashboard__empty-title">No notes yet</h2>
                <p className="dashboard__empty-text text-secondary">
                  Create your first note and share it with friends!
                </p>
                <button className="btn btn-solid" onClick={() => handleFabClick('note')}>
                  Create Note
                </button>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="dashboard__empty dashboard__empty--search animate-fade-in">
                <p className="text-muted">No notes found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="dashboard__grid">
                {filteredNotes.map((note, index) => (
                  <div
                    key={note.id}
                    style={{ animationDelay: `${index * 0.05}s` }}
                    onClick={() => navigate(`/share/${note.id}`, { state: { from: 'dashboard' } })}
                    className="dashboard__card-wrapper"
                  >

                    <NoteCard
                      note={note}
                      onShare={handleShareNote}
                      onDelete={(n) => handleDeleteTrigger(n, 'note')}
                    />
                  </div>
                ))}
              </div>
            )
          ) : (
            /* ── Collections View ── */
            collections.length === 0 ? (
              <div className="dashboard__empty animate-fade-in-up">
                <div className="dashboard__empty-icon">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <h2 className="dashboard__empty-title">No collections</h2>
                <p className="dashboard__empty-text text-secondary">
                  Group your notes into collections for easy sharing!
                </p>
                <button
                  className="btn btn-solid"
                  onClick={() => handleFabClick('collection')}
                  disabled={notes.length === 0}
                >
                  Create Collection
                </button>
              </div>
            ) : filteredCollections.length === 0 ? (
              <div className="dashboard__empty dashboard__empty--search animate-fade-in">
                <p className="text-muted">No collections found matching "{searchQuery}"</p>
              </div>
            ) : (
              <div className="dashboard__grid">
                {filteredCollections.map((col, index) => {
                  const collectionNotes = (col.noteIds || []).map(id => notes.find(n => n.id === id)).filter(Boolean);

                  return (
                    <div
                      key={col.id}
                      className="card collection-card animate-fade-in-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => navigate(`/collection/${col.id}`)}
                    >
                      <div className="collection-card__header">
                        <h3 className="collection-card__name">{col.name}</h3>
                      </div>

                      <div className="collection-card__notes">
                        {collectionNotes.length > 0 ? (
                          collectionNotes.map(note => (
                            <div
                              key={note.id}
                              className="collection-card__note-item"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/share/${note.id}`, { state: { from: 'dashboard' } });
                              }}
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <polyline points="14 2 14 8 20 8" />
                              </svg>
                              <span>{note.title}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-muted text-xs">No notes added</span>
                        )}
                      </div>

                      <div className="collection-card__footer">
                        <button
                          className="note-card__btn"
                          onClick={(e) => { e.stopPropagation(); handleShareCollection(col); }}
                          title="Copy share link"
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
                          onClick={(e) => { e.stopPropagation(); handleDeleteTrigger(col, 'collection'); }}
                          title="Delete collection"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )
        )}
      </div>

      <div className="fab-group">
        <button
          className="fab fab--collection"
          onClick={() => handleFabClick('collection')}
          title="Create Collection"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            <line x1="12" y1="11" x2="12" y2="17" />
            <line x1="9" y1="14" x2="15" y2="14" />
          </svg>
        </button>
        <button
          className="fab fab--note"
          onClick={() => handleFabClick('note')}
          title="Create Note"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <AddNoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onSubmit={handleCreateNote}
        isSubmitting={submitting}
      />

      <CreateCollectionModal
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        onSubmit={handleCreateCollection}
        notes={notes}
        isSubmitting={submitting}
      />

      <SystemAlert
        isOpen={!!deleteData}
        type="danger"
        title={`Delete ${deleteData?.type === 'note' ? 'Note' : 'Collection'}?`}
        message={`Are you sure you want to delete "${deleteData?.item?.title || deleteData?.item?.name}"? This action cannot be undone.`}
        confirmText="Delete permanently"
        onConfirm={confirmDelete}
        onClose={() => setDeleteData(null)}
        isLoading={submitting}
      />

      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        item={shareItem}
        type={shareType}
      />
    </div>
  );
}
