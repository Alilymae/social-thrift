export const compressImage = (base64Str: string, maxWidth = 800, maxHeight = 800, quality = 0.7): Promise<string> => {
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
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
  });
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

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return canvas.toDataURL('image/jpeg');
};

export const downloadOutfit = async (outfit: any, bgColor = '#ffffff') => {
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Fill background
  ctx.fillStyle = outfit.backgroundColor || bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Load and draw each item
  for (const item of outfit.items) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = item.imageUrl;
    await new Promise((resolve) => {
      img.onload = () => {
        ctx.save();
        // The items are positioned relative to 800x800
        // We need to account for the scale and rotation
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

  const link = document.createElement('a');
  link.download = `outfit-${outfit.id || 'style'}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};
