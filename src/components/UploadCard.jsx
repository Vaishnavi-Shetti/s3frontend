import { useState } from 'react';
import { uploadImage } from '../api';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE_MB = 10;

export default function UploadCard({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', message }

  function showAlert(type, message) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  function validateAndSet(selectedFile) {
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      showAlert('error', 'Only JPG and PNG files are allowed.');
      return;
    }
    if (selectedFile.size > MAX_SIZE_MB * 1024 * 1024) {
      showAlert('error', `File must be smaller than ${MAX_SIZE_MB} MB.`);
      return;
    }
    setFile(selectedFile);
    setAlert(null);
  }

  function handleFileChange(e) {
    validateAndSet(e.target.files[0]);
    // Reset input so the same file can be re-selected after removal
    e.target.value = '';
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    validateAndSet(e.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const savedName = await uploadImage(file);
      showAlert('success', `"${savedName}" uploaded successfully!`);
      setFile(null);
      onUploadSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed. Please try again.';
      showAlert('error', msg);
    } finally {
      setUploading(false);
    }
  }

  function formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  return (
    <div className="card">
      <h2 className="card-title">
        <span className="icon">⬆️</span> Upload Image
      </h2>

      {/* Drop zone */}
      <div
        className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        role="button"
        aria-label="Upload image drop zone"
      >
        <input
          id="file-input"
          type="file"
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          onChange={handleFileChange}
        />
        <span className="upload-zone-icon">🖼️</span>
        <p className="upload-zone-text">
          {dragOver ? 'Drop image here…' : 'Click or drag & drop an image'}
        </p>
        <p className="upload-zone-hint">Supports JPG, JPEG, PNG · Max 10 MB</p>
      </div>

      {/* Selected file preview */}
      {file && (
        <div className="selected-file">
          <span>📄</span>
          <span className="selected-file-name">{file.name}</span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
            {formatSize(file.size)}
          </span>
          <button
            className="btn btn-ghost"
            style={{ padding: '2px 8px', fontSize: '0.75rem' }}
            onClick={() => setFile(null)}
            aria-label="Remove selected file"
          >
            ✕
          </button>
        </div>
      )}

      {/* Alert */}
      {alert && (
        <div className={`alert alert-${alert.type}`} style={{ marginTop: '1rem' }}>
          <span>{alert.type === 'success' ? '✅' : '❌'}</span>
          {alert.message}
        </div>
      )}

      {/* Upload button */}
      <button
        id="upload-btn"
        className="btn btn-primary btn-block"
        onClick={handleUpload}
        disabled={!file || uploading}
        aria-label="Upload image button"
      >
        {uploading ? (
          <>
            <span className="spinner" />
            Uploading…
          </>
        ) : (
          <>⬆️ Upload Image</>
        )}
      </button>
    </div>
  );
}
