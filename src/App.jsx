import { useRef } from 'react';
import UploadCard from './components/UploadCard';
import GalleryCard from './components/GalleryCard';

export default function App() {
  const galleryRef = useRef(null);

  function handleUploadSuccess() {
    // Refresh the gallery after a successful upload
    if (GalleryCard.refresh) {
      GalleryCard.refresh();
    }
  }

  return (
    <div className="app-shell">
      {/* Header */}
      <header className="header">
        <div className="header-logo">☁️</div>
        <h1 className="header-title">S3 Image Manager</h1>
        <span className="header-subtitle">React → Spring Boot → AWS S3</span>
      </header>

      {/* Main */}
      <main className="main-content" ref={galleryRef}>
        <UploadCard onUploadSuccess={handleUploadSuccess} />
        <GalleryCard />
      </main>
    </div>
  );
}
