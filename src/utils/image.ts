export const compressImage = (
  base64Str: string, 
  maxWidth = 400, 
  maxHeight = 400, 
  quality = 0.7,
  format: 'image/png' | 'image/jpeg' = 'image/png'
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      if (format === 'image/jpeg') {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } else {
        // PNG ignores quality but we can reduce size via dimensions
        resolve(canvas.toDataURL('image/png'));
      }
    };
  });
};

export const generateOutfitPreview = async (outfit: any, size = 600): Promise<string> => {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = outfit.backgroundColor || '#f4f4f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const item of outfit.items) {
    const img = new Image();
    img.src = item.imageUrl;
    await new Promise((resolve) => {
      img.onload = () => {
        ctx.save();
        const sX = (item.scaleX !== undefined ? item.scaleX : item.scale) * (size / 800);
        const sY = (item.scaleY !== undefined ? item.scaleY : item.scale) * (size / 800);
        const drawX = (item.x / 800) * size;
        const drawY = (item.y / 800) * size;
        const baseWidth = item.width || 200;
        const baseHeight = item.height || 200;
        
        ctx.translate(drawX, drawY);
        ctx.rotate((item.rotation * Math.PI) / 180);
        ctx.scale(sX, sY);
        
        if (item.crop) {
          ctx.drawImage(
            img, 
            item.crop.x, item.crop.y, item.crop.width, item.crop.height,
            0, 0, baseWidth, baseHeight
          );
        } else {
          ctx.drawImage(img, 0, 0, baseWidth, baseHeight);
        }
        ctx.restore();
        resolve(null);
      };
      img.onerror = () => resolve(null);
    });
  }

  // REVERTED: Use PNG for outfit previews to ensure transparency/quality in community feed
  return canvas.toDataURL('image/png');
};

export const getCroppedImg = async (imageSrc: string, pixelCrop: { x: number, y: number, width: number, height: number }): Promise<string> => {
  const image = new Image();
  image.src = imageSrc;
  await new Promise((resolve) => {
    image.onload = resolve;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  // LIMIT: Ensure cropped images don't exceed a safe size for Firestore (1MB document limit)
  // 600px is a good balance for quality vs size for a PNG base64
  const MAX_SIZE = 600;
  let targetWidth = pixelCrop.width;
  let targetHeight = pixelCrop.height;

  if (targetWidth > MAX_SIZE || targetHeight > MAX_SIZE) {
    const ratio = Math.min(MAX_SIZE / targetWidth, MAX_SIZE / targetHeight);
    targetWidth = Math.floor(targetWidth * ratio);
    targetHeight = Math.floor(targetHeight * ratio);
  }

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    targetWidth,
    targetHeight
  );

  return canvas.toDataURL('image/png');
};

export const downloadOutfit = async (outfit: any, bgColor = '#ffffff') => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill background
    ctx.fillStyle = outfit.backgroundColor || bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (outfit.previewUrl) {
      // If there's a preview URL, draw it as the base
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = outfit.previewUrl;
      await new Promise((resolve) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 800, 800);
          resolve(null);
        };
        img.onerror = () => resolve(null);
      });
    } else if (outfit.items) {
      // Load and draw each item fallback
      for (const item of outfit.items) {
        if (!item.imageUrl) continue;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = item.imageUrl;
        await new Promise((resolve) => {
          img.onload = () => {
            ctx.save();
            const sX = item.scaleX !== undefined ? item.scaleX : item.scale;
            const sY = item.scaleY !== undefined ? item.scaleY : item.scale;
            const baseWidth = item.width || 200;
            const baseHeight = item.height || 200;
            
            ctx.translate(item.x, item.y);
            ctx.rotate((item.rotation * Math.PI) / 180);
            ctx.scale(sX < 0 ? -1 : 1, sY < 0 ? -1 : 1);
            
            if (item.crop) {
              ctx.drawImage(
                img, 
                item.crop.x, item.crop.y, item.crop.width, item.crop.height,
                0, 0, baseWidth, baseHeight
              );
            } else {
              ctx.drawImage(img, 0, 0, baseWidth, baseHeight);
            }
            ctx.restore();
            resolve(null);
          };
          img.onerror = () => resolve(null);
        });
      }
    }

    // Convert canvas to blob for a reliable download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `outfit-${outfit.id || 'style'}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  } catch (error) {
    console.error("Download failed:", error);
  }
};
