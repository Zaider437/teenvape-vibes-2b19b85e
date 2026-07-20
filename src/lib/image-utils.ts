import fs from 'fs';
import path from 'path';

const root = path.join(process.cwd(), 'teenvape-vibes-c6d2eb96-44cd13b30cf27d1a863e3eff340c5961f815f652', 'teenvape-vibes-c6d2eb96-44cd13b30cf27d1a863e3eff340c5961f815f652');
const imagesDir = path.join(root, 'public', 'assets', 'images');
const assetsDir = path.join(root, 'src', 'assets');

function getImageUrlFromLocal(imagePath: string): string | null {
  if (!imagePath) return null;
  
  const normalizedPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  const possiblePaths = [
    path.join(imagesDir, normalizedPath.split('/').pop()),
    path.join(imagesDir, normalizedPath),
    path.join(assetsDir, normalizedPath),
    path.join(assetsDir, normalizedPath.split('/').pop()),
  ];
  
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      return `/${normalizedPath}`;
    }
  }
  
  return null;
}

function buildImageUrl(p: {
  image_url?: string | null;
  image?: string | null;
  id?: string;
  name?: string;
  slug?: string;
}): string | null {
  // Direct image_url from Supabase first
  if (p.image_url) return p.image_url;
  
  // Fallback to Local /public/assets/images
  const directLocal = getImageUrlFromLocal(p.image_url || p.image || '');
  if (directLocal) return directLocal;
  
  // Professional fallback for various items using consistent naming pattern
  if (p.id) {
    const id = p.id;
    const lowerId = id.toLowerCase();
    
    // For device products with known IDs
    const localDeviceMapping: Record<string, string> = {
      'd1': 'default-device.png',
      'd2': 'product-01.png', 
      'd3': 'product-02.png',
      'd4': 'product-03.png',
    };
    if (localDeviceMapping[id]) {
      return `/assets/images/${localDeviceMapping[id]}`;
    }
    
    // For brand devices by name pattern
    const name = p.name || '';
    if (p.category === 'device') {
      const brandName = name.split(' ')[0];
      const safeName = brandName.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-device.png';
      return `/assets/images/${safeName}`;
    }
  }
  
  return null;
}

export { buildImageUrl };
