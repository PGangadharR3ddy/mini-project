import React, { useState, useEffect, useRef } from 'react';
import {
  FolderOpen,
  Upload,
  Search,
  Video,
  Download,
  Trash2,
  Edit2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getResources,
  uploadResource,
  updateResource,
  deleteResource,
} from '../../api/resources';
import { Resource, ResourceType } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CardSkeleton, EmptyState } from '../../components/Loader';
import { canCreateContent, canEditContent } from '../../utils/roleGuard';
import toast from 'react-hot-toast';

const RESOURCE_TYPES: { label: string; value: string }[] = [
  { label: 'All Resources', value: 'ALL' },
  { label: 'Lecture Notes', value: 'NOTES' },
  { label: 'Slide Decks (PPT)', value: 'PPT' },
  { label: 'Assignments', value: 'ASSIGNMENT' },
  { label: 'Recorded Lectures', value: 'RECORDED_LECTURE' },
  { label: 'Reference Materials', value: 'REFERENCE' },
];

export const ResourcesPage: React.FC = () => {
  const { role, user, classroomId } = useAuth();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchSubject, setSearchSubject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [previewVideo, setPreviewVideo] = useState<Resource | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: 'OS-301',
    type: 'NOTES' as ResourceType,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUpload = canCreateContent(role || undefined);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const pageResult = await getResources({
        classroomId,
        subject: searchSubject || undefined,
        type: selectedType,
      });
      setResources(pageResult.content);
    } catch (err) {
      console.error('Failed to load resources:', err);
      toast.error('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [classroomId, selectedType, searchSubject]);

  const handleOpenUpload = () => {
    setEditingResource(null);
    setSelectedFile(null);
    setFormData({
      title: '',
      description: '',
      subject: 'OS-301',
      type: 'NOTES',
    });
    setIsUploadModalOpen(true);
  };

  const handleOpenEdit = (res: Resource) => {
    setEditingResource(res);
    setFormData({
      title: res.title,
      description: res.description,
      subject: res.subject,
      type: res.type,
    });
    setIsUploadModalOpen(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingResource) {
        await updateResource(editingResource.id, formData);
        toast.success('Resource metadata updated');
      } else {
        if (!selectedFile) {
          toast.error('Please choose a file to upload');
          return;
        }
        await uploadResource(selectedFile, {
          classroomId,
          ...formData,
        });
        toast.success('Resource file uploaded successfully');
      }

      setIsUploadModalOpen(false);
      fetchResources();
    } catch (err) {
      toast.error('Failed to save resource');
    }
  };

  const handleDeleteResource = async () => {
    if (!resourceToDelete) return;
    try {
      await deleteResource(resourceToDelete.id);
      toast.success('Resource removed');
      setResourceToDelete(null);
      fetchResources();
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  const filteredList = resources.filter((res) => {
    const matchesSearch =
      !searchQuery ||
      res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
              Academic Archive
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Course Material, Slides & Code
            </span>
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
            Learning Resources
          </h1>
        </div>

        {canUpload && (
          <button
            onClick={handleOpenUpload}
            className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Material</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {RESOURCE_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setSelectedType(t.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedType === t.value
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <div className="relative min-w-[220px]">
            <input
              type="text"
              placeholder="Search course resources..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 pl-8 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
          </div>
        </div>
      </div>

      {/* Grid of Resource Cards */}
      {loading ? (
        <CardSkeleton count={4} />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="No resources found"
          description="There are currently no files or learning materials in this category."
          actionText={canUpload ? 'Upload First File' : undefined}
          onAction={canUpload ? handleOpenUpload : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredList.map((res) => {
            const isUserAuthor = canEditContent(role || undefined, res.uploadedBy, user?.name);

            return (
              <div
                key={res.id}
                className="bg-white border border-stone-200 hover:border-stone-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all"
              >
                <div>
                  {/* Card Header Badge & Code */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-medium text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      {res.subject}
                    </span>
                    <Badge type={res.type} size="sm" />
                  </div>

                  <h3 className="font-serif text-base font-semibold text-stone-900 leading-tight mb-2">
                    {res.title}
                  </h3>

                  <p className="text-xs text-stone-600 leading-relaxed mb-4 line-clamp-3">
                    {res.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-stone-100">
                  <div className="flex items-center justify-between text-[11px] text-stone-500 mb-4">
                    <span>{res.fileName || 'document.pdf'}</span>
                    <span>{res.fileSize || '2.4 MB'}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {res.type === 'RECORDED_LECTURE' ? (
                      <button
                        onClick={() => setPreviewVideo(res)}
                        className="flex-1 bg-stone-900 text-white hover:bg-stone-800 rounded-lg py-2 px-3 text-xs font-medium shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Watch Video</span>
                      </button>
                    ) : (
                      <a
                        href={res.fileUrl || '#'}
                        download
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success(`Downloading ${res.fileName}`);
                        }}
                        className="flex-1 bg-stone-50 hover:bg-stone-100 border border-stone-200 text-stone-800 rounded-lg py-2 px-3 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download</span>
                      </a>
                    )}

                    {isUserAuthor && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(res)}
                          className="p-2 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-900 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setResourceToDelete(res)}
                          className="p-2 hover:bg-rose-50 rounded-lg text-stone-400 hover:text-rose-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload / Edit Resource Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title={editingResource ? 'Edit Resource Details' : 'Upload Academic Resource'}
        subtitle="Publish study guides, slide decks, or lecture recordings"
      >
        <form onSubmit={handleSaveResource} className="space-y-4">
          {!editingResource && (
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Select File (PDF, PPTX, MP4, ZIP)
              </label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-300 hover:border-stone-400 bg-stone-50 hover:bg-stone-100/70 rounded-xl p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <Upload className="w-7 h-7 mx-auto mb-2 text-stone-400" />
                <p className="font-medium text-xs text-stone-900">
                  {selectedFile ? selectedFile.name : 'Click to Browse or Drag File'}
                </p>
                <p className="text-[11px] text-stone-500 mt-1">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
                    : 'Max 250MB • All academic formats supported'}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Course / Subject Code
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
                placeholder="e.g. OS-301 or CS-405"
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Resource Category
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as ResourceType })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              >
                <option value="NOTES">NOTES (Lecture Notes / PDF)</option>
                <option value="PPT">PPT (Slide Presentations)</option>
                <option value="ASSIGNMENT">ASSIGNMENT (Problem Set)</option>
                <option value="RECORDED_LECTURE">RECORDED_LECTURE (Video MP4)</option>
                <option value="REFERENCE">REFERENCE (Reference Material)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Resource Title
            </label>
            <input
              type="text"
              placeholder="e.g. Process Synchronization & Deadlock Notes"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Description & Topics Covered
            </label>
            <textarea
              rows={3}
              placeholder="Summarize key concepts, unit numbers, or assignment deadlines..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-4 py-2 border border-stone-200 bg-white hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              {editingResource ? 'Save Changes' : 'Upload Resource'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Video Player Modal */}
      {previewVideo && (
        <Modal
          isOpen={!!previewVideo}
          onClose={() => setPreviewVideo(null)}
          title={previewVideo.title}
          subtitle={`Video Lecture • ${previewVideo.subject}`}
          maxWidth="2xl"
        >
          <div className="space-y-4">
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <video
                controls
                autoPlay
                className="w-full h-full object-contain"
                src={previewVideo.fileUrl}
              >
                Your browser does not support HTML5 video streaming.
              </video>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              {previewVideo.description}
            </p>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!resourceToDelete}
        onClose={() => setResourceToDelete(null)}
        onConfirm={handleDeleteResource}
        title="Delete Resource"
        message={`Are you sure you want to delete "${resourceToDelete?.title}"? All enrolled students will lose access.`}
        confirmText="Delete Resource"
      />
    </div>
  );
};

