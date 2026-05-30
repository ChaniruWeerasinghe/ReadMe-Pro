import { useState, useEffect, useRef } from 'react';
import {
  collection as fbCollection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  deleteDoc,
  updateDoc,
  serverTimestamp
} from 'firebase/firestore';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { db } from '../config/firebase';
import { useToast } from './Toast';
import './ShareModal.css';

const ShareIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </svg>
);

const CopyIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const LoaderIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default function ShareModal({ isOpen, onClose, item, type }) {
  const toast = useToast();
  const overlayRef = useRef(null);

  const [sharesMap, setSharesMap] = useState({});
  const [isPublic, setIsPublic] = useState(item?.isPublic ?? false);
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [actionLevel, setActionLevel] = useState(null);

  const shareUrl = `${window.location.origin}/${type === 'note' ? 'share' : 'collection'}/${item?.id}`;

  useEffect(() => {
    if (item) setIsPublic(item.isPublic ?? false);
  }, [item]);

  useEffect(() => {
    if (!isOpen || !item?.id) return;

    const q = query(
      fbCollection(db, 'shares'),
      where('itemId', '==', item.id)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        map[data.accessLevel] = d.id;
      });
      setSharesMap(map);
    });

    return () => unsubscribe();
  }, [isOpen, item?.id]);

  const handleTogglePrivacy = async () => {
    const newPublicState = !isPublic;
    setIsPublic(newPublicState);
    setIsUpdatingPrivacy(true);

    try {
      const colName = type === 'note' ? 'notes' : 'collections';
      if (!item?.id) throw new Error('Item ID missing');

      await updateDoc(doc(db, colName, item.id), {
        isPublic: newPublicState
      });
      toast.success(`Access set to ${newPublicState ? 'Public' : 'Private'}`);
    } catch (err) {
      console.error('Update privacy error:', err);
      setIsPublic(!newPublicState);
      toast.error('Failed to update privacy.');
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const handleToggleAccess = async (level) => {
    const existingId = sharesMap[level];
    if (existingId) {
      try {
        await deleteDoc(doc(db, 'shares', existingId));
        toast.info(`${getLevelLabel(level)} access revoked.`);
      } catch (err) {
        console.error('Revoke access error:', err);
        toast.error('Failed to revoke access.');
      }
    } else {
      setActionLevel(level);
      try {
        await addDoc(fbCollection(db, 'shares'), {
          itemId: item.id,
          itemType: type,
          accessLevel: level,
          ownerId: item.ownerId,
          createdAt: serverTimestamp()
        });
        toast.success(`${getLevelLabel(level)} link enabled!`);
      } catch (err) {
        console.error('Generate access error:', err);
        toast.error('Failed to enable access.');
      } finally {
        setActionLevel(null);
      }
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const getLevelLabel = (level) => {
    if (level === 'view') return 'View Only';
    if (level === 'download') return 'View & Download';
    if (level === 'edit') return 'Full Edit';
    return level;
  };

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="modal-overlay"
          ref={overlayRef}
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="share-modal"
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            <div className="modal__header">
              <div className="modal__title-group">
                <div className="modal__icon-circle">
                  <ShareIcon />
                </div>
                <h2 className="modal__title">Share {type === 'note' ? 'Note' : 'Collection'}</h2>
              </div>
              <button className="modal__close" onClick={onClose} aria-label="Close modal">
                &times;
              </button>
            </div>

            <div className="modal__body">
              <LayoutGroup>
                <motion.div 
                  layout="position"
                  className={`share-modal__section ${isPublic ? 'share-modal__section--active' : ''}`}
                >
                  <div className="share-modal__config-item">
                    <div className="share-modal__config-info">
                      <span className="share-modal__config-title">Public Link Access</span>
                      <span className="share-modal__config-desc">
                        Best for quick sharing. Anyone with this link can view.
                      </span>
                    </div>
                    <label className="toggle">
                      <input
                        type="checkbox"
                        checked={isPublic}
                        onChange={handleTogglePrivacy}
                        disabled={isUpdatingPrivacy}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>

                  <AnimatePresence>
                    {isPublic && (
                      <motion.div
                        className="share-modal__direct"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="share-modal__link-group">
                          <input type="text" className="share-modal__input" value={shareUrl} readOnly />
                          <button
                            className="share-modal__copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(shareUrl);
                              toast.success('Public link copied!');
                            }}
                          >
                            <CopyIcon />
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                <motion.button
                  layout="position"
                  className={`share-modal__advanced-toggle ${showAdvanced ? 'active' : ''}`}
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  type="button"
                >
                  <span>Advanced Sharing Options</span>
                  <motion.div
                    animate={{ rotate: showAdvanced ? 180 : 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </motion.div>
                </motion.button>

                <motion.div
                  layout="position"
                  className="share-modal__advanced-outer"
                  initial={false}
                  animate={{
                    height: showAdvanced ? "auto" : 0,
                    opacity: showAdvanced ? 1 : 0
                  }}
                  transition={{
                    height: { duration: 0.3, ease: "easeOut" },
                    opacity: { duration: 0.2 }
                  }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="share-modal__advanced-inner">
                    <span className="share-modal__label">Secure Access Links</span>

                    <div className="share-modal__links-grid">
                      {[
                        { level: 'view', desc: 'Recipients can only read the content.' },
                        { level: 'download', desc: 'Allows reading and exporting/printing.' },
                        { level: 'edit', desc: 'Grants collaborative edit permissions.' }
                      ].map((opt) => {
                        const shareId = sharesMap[opt.level];
                        const secureUrl = `${window.location.origin}/s/${shareId}`;

                        return (
                          <motion.div
                            layout="position"
                            key={opt.level}
                            className={`share-access-card ${shareId ? 'share-access-card--active' : ''}`}
                          >
                            <div className="share-access-card__main">
                              <div className="share-access-card__info">
                                <span className="share-access-card__label">{getLevelLabel(opt.level)}</span>
                                <span className="share-access-card__desc">{opt.desc}</span>
                              </div>
                              <label className="toggle">
                                <input
                                  type="checkbox"
                                  checked={!!shareId}
                                  onChange={() => handleToggleAccess(opt.level)}
                                  disabled={actionLevel === opt.level}
                                />
                                <span className="toggle-slider"></span>
                              </label>
                            </div>

                            <AnimatePresence>
                              {shareId && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0, scale: 0.98 }}
                                  animate={{ height: 'auto', opacity: 1, scale: 1, marginTop: 16 }}
                                  exit={{ height: 0, opacity: 0, scale: 0.98, marginTop: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="share-access-card__link"
                                >
                                  <div className="share-modal__link-group">
                                    <input type="text" className="share-modal__input" value={secureUrl} readOnly />
                                    <button
                                      className="share-modal__copy-btn"
                                      onClick={() => {
                                        navigator.clipboard.writeText(secureUrl);
                                        toast.success(`${getLevelLabel(opt.level)} link copied!`);
                                      }}
                                    >
                                      {actionLevel === opt.level ? <LoaderIcon /> : <CopyIcon />}
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        );
                      })}
                    </div>

                    <div className="share-modal__disclaimer">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.7 }}>
                        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
                      </svg>
                      <span>Secure links remain active even if Public Access is turned off.</span>
                    </div>
                  </div>
                </motion.div>
              </LayoutGroup>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
