import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2, Check } from 'lucide-react';
import { uploadImage } from '../api';
import { UploadResponse } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  notePath: string;
  onClose: () => void;
  onSuccess: (uploadData: UploadResponse) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  notePath,
  onClose,
  onSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [customName, setCustomName] = useState('');
  const [caption, setCaption] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) return;
    setFile(selectedFile);
    setCustomName(selectedFile.name);
    setError(null);

    if (selectedFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file to upload.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const result = await uploadImage(file, notePath, customName, caption);
      onSuccess(result);
      handleClose();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setCustomName('');
    setCaption('');
    setPreviewUrl(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden font-sans">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Upload Image / Media Asset</h3>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800">
              {error}
            </div>
          )}

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Saving into folder: <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{notePath ? (notePath.includes('/') ? notePath.substring(0, notePath.lastIndexOf('/')) : 'root') : 'root'}</code>
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-950/20"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.svg,.pdf"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />

            {previewUrl ? (
              <div className="space-y-2">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-36 mx-auto rounded-lg shadow-xs object-contain"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400">{file?.name} ({Math.round((file?.size || 0) / 1024)} KB)</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-slate-400" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Click to browse or drag and drop an image
                </p>
                <p className="text-xs text-slate-400">PNG, JPG, SVG, WebP, GIF</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              File Name (Co-located on disk)
            </label>
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="e.g. coffee-grinder-cleaning.png"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Figure Caption (Optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="e.g. Figure 1: Disassembling the top burr assembly."
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-xs transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Insert Asset</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
