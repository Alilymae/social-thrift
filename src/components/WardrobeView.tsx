import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Shirt, Tag, Video, Trash2, Edit2, Save, X } from 'lucide-react';
import { Garment } from '../types';
import { cn } from '../lib/utils';

interface WardrobeViewProps {
  garments: Garment[];
  onAddGarment: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedGarment: Garment | null;
  setSelectedGarment: (garment: Garment | null) => void;
  isEditingGarment: boolean;
  setIsEditingGarment: (isEditing: boolean) => void;
  editGarmentData: { category: string; tags: string };
  setEditGarmentData: (data: { category: string; tags: string }) => void;
  onUpdateGarment: () => void;
  onSetUpcycleTag: (tag: string) => void;
  onSetActiveTab: (tab: any) => void;
  onSetItemToDelete: (item: { id: string; type: 'garment' }) => void;
}

export const WardrobeView: React.FC<WardrobeViewProps> = ({
  garments,
  onAddGarment,
  selectedGarment,
  setSelectedGarment,
  isEditingGarment,
  setIsEditingGarment,
  editGarmentData,
  setEditGarmentData,
  onUpdateGarment,
  onSetUpcycleTag,
  onSetActiveTab,
  onSetItemToDelete
}) => {
  return (
    <motion.div
      key="wardrobe"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-xs font-bold uppercase tracking-wider border border-orange-100">
            <Shirt size={14} />
            Personal Collection
          </div>
          <h2 className="text-6xl font-heading text-primary leading-none">My Wardrobe</h2>
          <p className="text-xl text-dark/50 font-medium max-w-xl">
            Your digital collection of thrifted and upcycled gems.
          </p>
        </div>
        <label className="bg-primary text-bg px-10 py-5 rounded-3xl font-heading text-2xl cursor-pointer flex items-center gap-3 hover:scale-105 transition-all shadow-2xl retro-shadow-pink">
          <Plus size={28} />
          Add Item
          <input type="file" accept="image/*" className="hidden" onChange={onAddGarment} />
        </label>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {garments.map((garment) => (
          <motion.div
            layout
            whileHover={{ y: -8 }}
            key={garment.id}
            onClick={() => setSelectedGarment(garment)}
            className="group relative aspect-[3/4] bg-card checkerboard rounded-[2rem] overflow-hidden border border-border hover:shadow-2xl transition-all duration-500 cursor-pointer"
          >
            <img src={garment.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Garment" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-6">
              <p className="text-white font-bold text-lg translate-y-4 group-hover:translate-y-0 transition-transform duration-300">{garment.category}</p>
              <div className="flex gap-1 mt-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-300 delay-75">
                {garment.tags.slice(0, 2).map((tag, i) => (
                  <span key={`${tag}-${i}`} className="text-[10px] text-white/80 font-medium">#{tag}</span>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
        {garments.length === 0 && (
          <div className="col-span-full py-32 text-center space-y-4">
            <div className="w-24 h-24 bg-card-hover rounded-full flex items-center justify-center mx-auto text-text-muted">
              <Shirt size={48} />
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-bold text-text">Your wardrobe is empty</p>
              <p className="text-zinc-400">Start adding items to build your digital collection!</p>
            </div>
          </div>
        )}
      </div>

      {/* garment detail modal */}
      <AnimatePresence>
        {selectedGarment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedGarment(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-[3rem] overflow-hidden max-w-4xl w-full flex flex-col md:flex-row shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="md:w-1/2 aspect-[3/4] bg-card-hover checkerboard relative group">
                <img src={selectedGarment.imageUrl} className="w-full h-full object-cover" alt="Garment" referrerPolicy="no-referrer" />
              </div>
              <div className="md:w-1/2 p-10 lg:p-12 space-y-8 flex flex-col">
                <div className="flex justify-between items-start">
                  <div className="space-y-1 flex-1">
                    {isEditingGarment ? (
                      <input
                        type="text"
                        value={editGarmentData.category}
                        onChange={(e) => setEditGarmentData({ ...editGarmentData, category: e.target.value })}
                        className="text-3xl font-heading text-primary bg-card-hover border border-border rounded-2xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                    ) : (
                      <h3 className="text-4xl font-heading text-primary leading-tight">{selectedGarment.category}</h3>
                    )}
                    <p className="text-zinc-400 text-sm font-medium">Added {selectedGarment.createdAt && typeof selectedGarment.createdAt.toDate === 'function' ? selectedGarment.createdAt.toDate().toLocaleDateString() : 'Just now'}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        if (isEditingGarment) {
                          onUpdateGarment();
                        } else {
                          setEditGarmentData({
                            category: selectedGarment.category,
                            tags: selectedGarment.tags.join(', ')
                          });
                          setIsEditingGarment(true);
                        }
                      }}
                      className="p-3 hover:bg-zinc-100 rounded-full text-zinc-400 hover:text-primary transition-colors"
                    >
                      {isEditingGarment ? <Save size={24} /> : <Edit2 size={24} />}
                    </button>
                    <button onClick={() => { setSelectedGarment(null); setIsEditingGarment(false); }} className="p-3 hover:bg-zinc-100 rounded-full text-zinc-400">
                      <X size={28} />
                    </button>
                  </div>
                </div>

                <div className="space-y-6 flex-1">
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                      <Tag size={14} />
                      Tags
                    </p>
                    {isEditingGarment ? (
                      <input
                        type="text"
                        value={editGarmentData.tags}
                        onChange={(e) => setEditGarmentData({ ...editGarmentData, tags: e.target.value })}
                        className="w-full bg-card-hover border border-border rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="e.g., vintage, denim, blue"
                      />
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedGarment.tags.length > 0 ? (
                          selectedGarment.tags.map((tag, i) => (
                            <span key={`${tag}-${i}`} className="px-4 py-1.5 bg-card-hover text-text-muted rounded-full text-xs font-bold border border-border">
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <p className="text-zinc-400 text-sm italic">No tags added yet.</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => {
                      const tag = selectedGarment.tags[0] || selectedGarment.category;
                      onSetUpcycleTag(tag);
                      onSetActiveTab('upcycle');
                      setSelectedGarment(null);
                    }}
                    className="w-full bg-green-support text-bg py-5 rounded-2xl font-heading text-2xl flex items-center justify-center gap-3 hover:scale-[1.02] transition-all shadow-xl retro-shadow-pink"
                  >
                    <Video size={24} />
                    Upcycle This Item
                  </button>
                  <button
                    onClick={async () => {
                      onSetItemToDelete({ id: selectedGarment.id, type: 'garment' });
                    }}
                    className="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={20} />
                    Remove from Wardrobe
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
