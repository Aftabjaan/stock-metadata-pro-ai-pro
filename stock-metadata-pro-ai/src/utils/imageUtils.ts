export interface ProcessedUpload {
  originalFilename: string; // CRITICAL: EXACT file.name
  fileSize: number;
  mimeType: string;
  thumbnailUrl: string;
  aiBase64: string;
}

/**
 * Reads user uploaded File and creates:
 * 1. An ultra-lightweight thumbnail (max 320px) for preview rendering
 * 2. An optimized image (max 1280px, ~70-150KB) for fast, low-latency AI vision processing
 * 3. Preserves originalFilename STRICTLY as file.name
 */
export async function processUploadedFile(file: File): Promise<ProcessedUpload> {
  // CRITICAL FILENAME RULE: Never alter file.name
  const originalFilename = file.name;
  const fileSize = file.size;
  const mimeType = file.type || 'image/jpeg';

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => {
      reject(new Error(`Failed to read file "${originalFilename}".`));
    };

    reader.onload = () => {
      const img = new Image();
      img.onerror = () => {
        reject(new Error(`File "${originalFilename}" appears corrupted or is not a valid image.`));
      };

      img.onload = () => {
        try {
          // 1. Generate Thumbnail for UI cards/table (max 280px)
          const thumbCanvas = document.createElement('canvas');
          const thumbMax = 280;
          let tw = img.width;
          let th = img.height;

          if (tw > th) {
            if (tw > thumbMax) {
              th = Math.round((th * thumbMax) / tw);
              tw = thumbMax;
            }
          } else {
            if (th > thumbMax) {
              tw = Math.round((tw * thumbMax) / th);
              th = thumbMax;
            }
          }
          thumbCanvas.width = tw;
          thumbCanvas.height = th;
          const thumbCtx = thumbCanvas.getContext('2d');
          if (thumbCtx) {
            thumbCtx.imageSmoothingEnabled = true;
            thumbCtx.imageSmoothingQuality = 'medium';
            thumbCtx.drawImage(img, 0, 0, tw, th);
          }
          const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.8);

          // 2. Generate AI Vision Input (max 1200px) to balance high visual fidelity with rapid network upload
          const aiCanvas = document.createElement('canvas');
          const aiMax = 1200;
          let aw = img.width;
          let ah = img.height;

          if (aw > ah) {
            if (aw > aiMax) {
              ah = Math.round((ah * aiMax) / aw);
              aw = aiMax;
            }
          } else {
            if (ah > aiMax) {
              aw = Math.round((aw * aiMax) / ah);
              ah = aiMax;
            }
          }
          aiCanvas.width = aw;
          aiCanvas.height = ah;
          const aiCtx = aiCanvas.getContext('2d');
          if (aiCtx) {
            aiCtx.imageSmoothingEnabled = true;
            aiCtx.imageSmoothingQuality = 'high';
            aiCtx.drawImage(img, 0, 0, aw, ah);
          }
          const aiBase64 = aiCanvas.toDataURL('image/jpeg', 0.85);

          resolve({
            originalFilename,
            fileSize,
            mimeType,
            thumbnailUrl,
            aiBase64,
          });
        } catch (err) {
          reject(err);
        }
      };

      img.src = reader.result as string;
    };

    reader.readAsDataURL(file);
  });
}
