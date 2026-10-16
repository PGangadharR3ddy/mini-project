import React, { useState, useRef } from 'react';
import { Modal } from '../common/Modal';
import { Resource, ResourceType } from '../../types';
import { UploadCloud, File, X } from 'lucide-react';

interface UploadResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (formData: FormData, metadataFallback: any) => Promise<void>;
  defaultClassroomId: string;
  defaultClassroomName?: string;
  defaultAuthorId: string;
  defaultAuthorName: string;
}

const RESOURCE_TYPES: { type: ResourceType; label: string }[] = [
  { type: 'NOTES', label: 'Lecture Notes / PDF' },
  { type: 'PPT', label: 'Slide Deck / PPT' },
  { type: 'ASSIGNMENT', label: 'Assignment Brief' },
  { type: 'REFERENCE', label: 'Reference / Textbook' },
  { type: 'RECORDED_LECTURE', label: 'Recorded Video / Audio' },
];

export const UploadResourceModal: React.FC<UploadResourceModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  defaultClassroomId,
  defaultClassroomName = 'CSE - 3rd Year (Section A)',
  defaultAuthorId,
  defaultAuthorName,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('Distributed Systems');
  const [type, setType] = useState<ResourceType>('NOTES');
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!title) {
        // Autofill title from file name
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for the resource');
      return;
    }
    if (!subject.trim()) {
      setError('Please specify a subject');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      }
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('subject', subject.trim());
      formData.append('type', type);
      formData.append('classroomId', defaultClassroomId);

      const metadataFallback = {
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        type,
        classroomId: defaultClassroomId,
        classroomName: defaultClassroomName,
        uploadedById: defaultAuthorId,
        uploadedByName: defaultAuthorName,
        fileName: selectedFile?.name || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
        fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.4 MB',
      };

      await onUpload(formData, metadataFallback);
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to upload resource');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="upload-resource-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Learning Resource"
      subtitle="Share lecture notes, slides, problem sets, and references with students"
      maxWidth="lg"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="resource-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Uploading...' : 'Upload Resource'}
          </button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* File Dropzone */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Select or Drop Document</label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/70'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.ppt,.pptx,.doc,.docx,.zip,.mp4,.png,.jpg"
            />
            {selectedFile ? (
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs max-w-sm w-full">
                <File className="w-6 h-6 text-indigo-600 shrink-0" />
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold text-slate-900 truncate">{selectedFile.name}</p>
                  <p className="text-[11px] text-slate-400">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-2xs">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Click to browse <span className="font-normal text-slate-500">or drag and drop</span>
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">PDF, PPTX, DOCX, MP4, or ZIP up to 50MB</p>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Distributed Consensus & Paxos/Raft Architecture Slides"
            required
            className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Distributed Systems"
              required
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Resource Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ResourceType)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              {RESOURCE_TYPES.map((rt) => (
                <option key={rt.type} value={rt.type}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description (Optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Brief overview of the material or specific chapters covered..."
            className="w-full text-xs font-normal bg-slate-50 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
          />
        </div>
      </form>
    </Modal>
  );
};
