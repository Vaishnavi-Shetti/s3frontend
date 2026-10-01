import { useState, useEffect, useCallback } from 'react';
import { listImages, deleteImage, getImageUrl } from '../api';

export default function GalleryCard() {
  const [images, setImages]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [lightbox, setLightbox]   = useState(null); // fileName to show in lightbox
  const [deleting, setDeleting]   = useState(null); // fileName being deleted
  const [alert, setAlert]         = useState(null); // { type, message }

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  const fetchImages = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listImages();
      setImages(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load images.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  // Expose refresh function for parent (via prop drilling or context)
  GalleryCard.refresh = fetchImages;

  async function handleDelete(fileName) {
    if (!window.confirm(`Delete "${fileName}"? This cannot be undone.`)) return;
    setDeleting(fileName);
    try {
      await deleteImage(fileName);
      showAlert('success', `"${fileName}" deleted successfully.`);
      setImages(prev => prev.filter(img => img.fileName !== fileName));
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'Delete failed. Please try again.');
    } finally {
      setDeleting(null);
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  function formatDate(isoString) {
    if (!isoString) return '';
    return new Date(isoString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="gallery-controls">
        <h2 className="card-title" style={{ marginBottom: 0 }}>
          <span className="icon">🖼️</span> Images
        </h2>
        <button
          id="refresh-btn"
          className="btn btn-ghost"
          onClick={fetchImages}
          disabled={loading}
          aria-label="Refresh image list"
        >
          {loading ? <span className="spinner" style={{ borderTopColor: 'var(--color-primary)' }} /> : '🔄'} Refresh
        </button>
        <span className="gallery-count">{images.length} image{images.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Global alert for gallery actions */}
      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginBottom: '1rem' }}>
          <span>{alert.type === 'success' ? '✅' : '❌'}</span>
          {alert.message}
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="alert alert-error">
          <span>❌</span> {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="gallery-grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div className="skeleton" style={{ aspectRatio: '1', width: '100%' }} />
              <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <div className="skeleton" style={{ height: '14px', borderRadius: '4px' }} />
                <div className="skeleton" style={{ height: '12px', width: '60%', borderRadius: '4px' }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && images.length === 0 && (
        <div className="empty-state">
          <span className="empty-state-icon">📂</span>
          <p className="empty-state-text">No images uploaded yet.<br />Use the upload panel above to get started.</p>
        </div>
      )}

      {/* Gallery grid */}
      {!loading && images.length > 0 && (
        <div className="gallery-grid">
          {images.map(img => (
            <div className="image-card" key={img.fileName}>
              {/* Thumbnail */}
              <div
                className="image-thumb-wrapper"
                onClick={() => setLightbox(img.fileName)}
                role="button"
                aria-label={`View ${img.fileName} full size`}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && setLightbox(img.fileName)}
              >
                <img
                  className="image-thumb"
                  src={getImageUrl(img.fileName)}
                  alt={img.fileName}
                  loading="lazy"
                />
                <div className="image-thumb-overlay">🔍</div>
              </div>

              {/* Info */}
              <div className="image-info">
                <p className="image-name" title={img.fileName}>{img.fileName}</p>
                <p className="image-meta">{formatSize(img.sizeBytes)} · {formatDate(img.lastModified)}</p>
              </div>

              {/* Action buttons */}
              <div className="image-actions">
                <a
                  href={getImageUrl(img.fileName)}
                  download={img.fileName}
                  className="btn btn-ghost"
                  aria-label={`Download ${img.fileName}`}
                >
                  ⬇️ Download
                </a>
                <button
                  id={`delete-btn-${img.fileName.replace(/\./g, '-')}`}
                  className="btn btn-danger"
                  onClick={() => handleDelete(img.fileName)}
                  disabled={deleting === img.fileName}
                  aria-label={`Delete ${img.fileName}`}
                >
                  {deleting === img.fileName
                    ? <span className="spinner" />
                    : '🗑️'}
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox && (
        <div
          className="lightbox-backdrop"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button
              className="lightbox-close"
              onClick={() => setLightbox(null)}
              aria-label="Close preview"
            >
              ✕
            </button>
            <img
              className="lightbox-img"
              src={getImageUrl(lightbox)}
              alt={lightbox}
            />
          </div>
        </div>
      )}
    </div>
  );
}
