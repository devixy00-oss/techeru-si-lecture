"use client";

import { useState } from 'react';
import { UploadCloud, CheckCircle, AlertCircle } from 'lucide-react';

export default function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/ingestion/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors bg-white shadow-sm">
      <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Study Material</h3>
      <p className="text-sm text-gray-500 mb-4 text-center">Supports audio files (MP3, WAV) and PDF documents.</p>
      
      <input 
        type="file" 
        accept="audio/*, .pdf" 
        onChange={handleFileChange} 
        className="hidden" 
        id="file-upload" 
      />
      <label 
        htmlFor="file-upload" 
        className="cursor-pointer bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 transition mb-4"
      >
        Select File
      </label>

      {file && (
        <div className="text-sm text-gray-600 mb-4 truncate w-full text-center">
          Selected: <span className="font-medium">{file.name}</span>
        </div>
      )}

      <button 
        onClick={handleUpload} 
        disabled={!file || status === 'uploading'}
        className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === 'uploading' ? 'Uploading...' : 'Upload & Process'}
      </button>

      {status === 'success' && (
        <div className="mt-4 flex items-center text-green-600 text-sm">
          <CheckCircle className="w-4 h-4 mr-2" /> Upload successful!
        </div>
      )}
      {status === 'error' && (
        <div className="mt-4 flex items-center text-red-600 text-sm">
          <AlertCircle className="w-4 h-4 mr-2" /> Upload failed. Try again.
        </div>
      )}
    </div>
  );
}
