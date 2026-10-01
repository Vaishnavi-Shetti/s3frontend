import axios from 'axios';

// During local development, Vite proxies /api → http://localhost:8080
// In production (Docker), VITE_API_BASE_URL is set to the backend service URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? `${import.meta.env.VITE_API_BASE_URL}/images`
  : '/api/images';

const api = axios.create({ baseURL: BASE_URL });

/**
 * Upload an image file.
 * @param {File} file
 * @returns {Promise<string>} saved file name
 */
export async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data.data; // the saved filename
}

/**
 * Fetch the list of images.
 * @returns {Promise<ImageMetadata[]>}
 */
export async function listImages() {
  const { data } = await api.get('');
  return data.data;
}

/**
 * Returns the URL to view/download an image inline.
 * @param {string} fileName
 * @returns {string}
 */
export function getImageUrl(fileName) {
  return `${BASE_URL}/${encodeURIComponent(fileName)}`;
}

/**
 * Delete an image by file name.
 * @param {string} fileName
 */
export async function deleteImage(fileName) {
  await api.delete(`/${encodeURIComponent(fileName)}`);
}
