import React, { useState } from 'react';
import { GalleryItem, User } from '../types';
import { Search, Camera, Download, Share2, Eye, X, Upload, Check, AlertCircle } from 'lucide-react';

interface GalleryViewProps {
  gallery: GalleryItem[];
  currentUser: User | null;
  onUploadPhoto: (photoDetails: any) => Promise<GalleryItem>;
}

export default function GalleryView({ gallery, currentUser, onUploadPhoto }: GalleryViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Lightbox Modal state
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryItem | null>(null);

  // Admin upload states
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadCategory, setUploadCategory] = useState<'Opening Ceremony' | 'Competitions' | 'Audience' | 'Prize Distribution' | 'Closing Ceremony'>('Competitions');
  const [uploadPhotographer, setUploadPhotographer] = useState('');
  const [uploadBase64, setUploadBase64] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const categories = ['All', 'Opening Ceremony', 'Competitions', 'Audience', 'Prize Distribution', 'Closing Ceremony'];

  // Filter gallery items
  const filteredGallery = gallery.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = item.caption.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.photographer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Handle Photo Selection for base64 conversion
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadBase64 || !uploadCaption) return;

    setIsUploading(true);
    setUploadStatus('idle');

    try {
      await onUploadPhoto({
        imageUrl: uploadBase64,
        category: uploadCategory,
        caption: uploadCaption,
        photographer: uploadPhotographer || currentUser?.email.split('@')[0] || 'A. Karim',
        uploadedBy: currentUser?.id || 'u-admin'
      });

      setUploadStatus('success');
      // Reset inputs
      setUploadCaption('');
      setUploadPhotographer('');
      setUploadBase64('');
      // Auto-clear success message
      setTimeout(() => setUploadStatus('idle'), 4000);
    } catch (err) {
      console.error(err);
      setUploadStatus('error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 min-h-screen bg-[#F8FAFC]">
      
      {/* Header Title */}
      <div className="bg-slate-900 text-white p-8 sm:p-10 rounded-3xl relative overflow-hidden shadow-[0_10px_30px_rgba(79,70,229,0.15)] border border-slate-800">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
          <Camera className="h-64 w-64 text-white" />
        </div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />

        <div className="space-y-4 relative z-10 max-w-3xl">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center space-x-1.5">
            <Camera className="h-4.5 w-4.5 text-indigo-400 animate-pulse" />
            <span>FESTIVAL GALLERY SYSTEM</span>
          </span>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Nandi Arts Fest 2026 Stories
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Visual storytelling and creative records captured on campus during Darussalma Academy Nandi Arts Fest 2026. Browse moments, stages, and distributions.
          </p>
        </div>
      </div>

      {/* Categories Row */}
      <div className="flex flex-wrap justify-center gap-2 border-b border-slate-200/55 pb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
              activeCategory === cat 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search Photos Filter Bar */}
      <div className="bg-white p-4 border border-slate-100 rounded-2xl shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search photos, descriptions, photographers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
      </div>

      {/* Visual Masonry Grid */}
      {filteredGallery.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl shadow-[0_4px_20px_-2px_rgba(79,70,229,0.03)] text-slate-400 font-medium text-xs uppercase tracking-wider">
          No photos listed under this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 animate-in fade-in duration-200">
          {filteredGallery.map((item) => (
            <div 
              key={item.id}
              onClick={() => setSelectedPhoto(item)}
              className="group relative h-64 border border-slate-100 rounded-2xl shadow-[0_4px_15px_-2px_rgba(79,70,229,0.03)] hover:shadow-[0_12px_25px_-5px_rgba(79,70,229,0.12)] hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer bg-slate-50"
            >
              <img 
                src={item.imageUrl} 
                alt={item.caption} 
                className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-x-0 bottom-0 bg-white/95 backdrop-blur-sm border-t border-slate-100 p-3">
                <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full uppercase tracking-wider inline-block">
                  {item.category}
                </span>
                <p className="text-slate-900 text-xs font-bold truncate mt-1.5 uppercase">
                  {item.caption}
                </p>
                <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                  📸 {item.photographer.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Upload Zone */}
      <section id="admin-upload-zone" className="bg-white p-6 sm:p-8 border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgba(79,70,229,0.04)] max-w-2xl mx-auto space-y-6">
        <div className="border-b border-slate-100 pb-4 flex items-center space-x-2.5">
          <Upload className="h-5 w-5 text-indigo-600" />
          <h3 className="font-display font-extrabold text-base text-slate-900 uppercase tracking-tight">
            {currentUser?.role === 'admin' ? 'Admin Upload Zone' : 'Student Submission Corner'}
          </h3>
        </div>

        <form onSubmit={handleUploadSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category selection */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                Category
              </label>
              <select
                value={uploadCategory}
                onChange={(e) => setUploadCategory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 uppercase focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all cursor-pointer"
              >
                {categories.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {/* Photographer name */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
                Photographer Credit
              </label>
              <input
                type="text"
                required
                placeholder="Enter your name"
                value={uploadPhotographer}
                onChange={(e) => setUploadPhotographer(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

          </div>

          {/* Photo Caption */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
              Short Description / Caption
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Duff Muttu prelim choreography under progress..."
              value={uploadCaption}
              onChange={(e) => setUploadCaption(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
          </div>

          {/* Drag & Drop File Selector */}
          <div>
            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1.5">
              File Attachment (Image)
            </label>
            <div className="border border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50/50 transition relative cursor-pointer">
              <input
                type="file"
                accept="image/*"
                required={!uploadBase64}
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              {uploadBase64 ? (
                <div className="space-y-3">
                  <img src={uploadBase64} alt="Preview" className="h-28 mx-auto object-contain border border-slate-200 rounded-lg shadow-sm" />
                  <span className="block text-xs text-emerald-600 font-bold uppercase flex items-center justify-center space-x-1">
                    <Check className="h-4 w-4" />
                    <span>Image Selected Successfully</span>
                  </span>
                </div>
              ) : (
                <div className="space-y-2 text-xs text-slate-500 font-medium uppercase">
                  <Camera className="h-8 w-8 text-slate-400 mx-auto" />
                  <p className="font-bold text-slate-700">Drag & drop or click to browse</p>
                  <p className="text-[10px] text-slate-400 font-medium">Supports PNG, JPG, WebP. Up to 15MB.</p>
                </div>
              )}
            </div>
          </div>

          {/* Status alerts */}
          {uploadStatus === 'success' && (
            <div className="flex items-center space-x-2 text-xs bg-emerald-50 text-emerald-700 p-4 border border-emerald-100 rounded-xl font-semibold uppercase">
              <Check className="h-4 w-4 shrink-0" />
              <span>Photo successfully uploaded and published to festival gallery!</span>
            </div>
          )}
          {uploadStatus === 'error' && (
            <div className="flex items-center space-x-2 text-xs bg-rose-50 text-rose-700 p-4 border border-rose-100 rounded-xl font-semibold uppercase">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Upload failed. Please check parameters and try again.</span>
            </div>
          )}

          {/* Action submit btn */}
          <button
            type="submit"
            disabled={isUploading || !uploadBase64}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md hover:shadow-lg disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 disabled:shadow-none cursor-pointer"
          >
            {isUploading ? 'Uploading file...' : 'Publish Photo to Gallery'}
          </button>
        </form>
      </section>

      {/* 5. Lightbox Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-black border border-slate-200 w-full max-w-3xl overflow-hidden rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.25)] relative flex flex-col md:flex-row">
            
            {/* Left Big image */}
            <div className="md:w-3/5 bg-slate-900 flex items-center justify-center min-h-[300px] max-h-[500px] border-b md:border-b-0 md:border-r border-slate-200">
              <img 
                src={selectedPhoto.imageUrl} 
                alt={selectedPhoto.caption} 
                className="max-h-full max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Right Meta Column */}
            <div className="md:w-2/5 p-6 sm:p-8 flex flex-col justify-between space-y-6 bg-white">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-2.5 py-1 text-[10px] font-bold uppercase rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                    {selectedPhoto.category.toUpperCase()}
                  </span>
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 transition cursor-pointer"
                  >
                    <X className="h-4 w-4 text-slate-500" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">{selectedPhoto.date}</span>
                  <p className="text-sm text-slate-900 font-bold uppercase leading-relaxed">
                    {selectedPhoto.caption}
                  </p>
                </div>

                <div className="border-t border-b border-slate-100 py-3 flex items-center space-x-2 text-xs text-slate-500 uppercase font-medium">
                  <span>Credit:</span>
                  <strong className="text-slate-800 font-bold">{selectedPhoto.photographer.toUpperCase()}</strong>
                </div>
              </div>

              {/* Lightbox Modal actions */}
              <div className="space-y-3">
                <button
                  onClick={() => alert('Download requested! Image file successfully stored.')}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold uppercase rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md hover:shadow-lg cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Image</span>
                </button>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(selectedPhoto.imageUrl);
                    alert('Image link copied to clipboard!');
                  }}
                  className="w-full py-2.5 bg-white text-slate-700 hover:bg-slate-50 font-semibold uppercase border border-slate-200 rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Copy Share Link</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
