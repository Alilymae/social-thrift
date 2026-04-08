import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCroppedImg } from '../utils/image';

interface CropModalProps {
  image: string;
  onCropComplete: (croppedImage: string) => void;
  onClose: () => void;
}

export const CropModal: React.FC<CropModalProps> = ({ image, onCropComplete, onClose }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropChange = (crop: { x: number, y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white rounded-3xl overflow-hidden max-w-2xl w-full flex flex-col shadow-2xl h-[80vh]"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-white z-10">
          <h3 className="text-xl font-bold">Crop Your Item</h3>
          <button onClick={onClose} disabled={isProcessing} className="p-2 hover:bg-zinc-100 rounded-full transition-colors disabled:opacity-50">
            <X size={24} />
          </button>
        </div>

        <div className="relative flex-1 bg-zinc-900">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={3 / 4}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
          />
        </div>

        <div className="p-6 bg-white space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-zinc-500">
              <span>Zoom</span>
              <span>{Math.round(zoom * 100)}%</span>
            </div>
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(Number(e.target.value))}
              disabled={isProcessing}
              className="w-full h-2 bg-zinc-100 rounded-lg appearance-none cursor-pointer accent-emerald-500 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isProcessing}
            className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200 disabled:opacity-50"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check size={20} />
            )}
            {isProcessing ? 'Processing...' : 'Apply Crop'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
