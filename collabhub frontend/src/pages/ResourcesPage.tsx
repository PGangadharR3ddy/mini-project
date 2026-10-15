import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { usePagination } from '../hooks/usePagination';
import {
  getResources,
  uploadResource,
  deleteResource,
} from '../api/resources';
import { Resource, ResourceType } from '../types';
import { ResourceCard } from '../components/resources/ResourceCard';
import { UploadResourceModal } from '../components/resources/UploadResourceModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import {
  FolderArchive,
  Plus,
  Search,
  Filter,
  FileText,
  Presentation,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

const RESOURCE_TYPES: { type: ResourceType | 'ALL'; label: string }[] = [
  { type: 'ALL', label: 'All Resources' },
  { type: 'NOTES', label: 'Lecture Notes' },
  { type: 'PPT', label: 'Slide Decks' },
  { type: 'ASSIGNMENT', label: 'Assignments' },
  { type: 'REFERENCE', label: 'Reference Papers' },
  { type: 'RECORDED_LECTURE', label: 'Recorded Lectures' },
];

export const ResourcesPage: React.FC = () => {
  const { user, isFaculty, isAdmin, classroomId, classroomName } = useAuth();
  const { success, error: showError } = useToast();
  const [searchParams] = useSearchParams();

  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedType, setSelectedType] = useState<ResourceType | 'ALL'>('ALL');
  const [selectedSubject, setSelectedSubject] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Delete dialog
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canUpload = isFaculty || isAdmin;

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getResources(
        classroomId || 'cls_cse_3a',
        selectedSubject,
        selectedType
      );
      setResources(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load learning resources');
    } finally {
      setLoading(false);
    }
  }, [classroomId, selectedSubject, selectedType, showError]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Extract unique subjects for subject filter dropdown
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set<string>();
    resources.forEach((r) => {
      if (r.subject) subjects.add(r.subject);
    });
    return Array.from(subjects);
  }, [resources]);

  // Client-side search
  const filteredResources = useMemo(() => {
    if (!searchQuery.trim()) return resources;
    const q = searchQuery.toLowerCase();
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.subject.toLowerCase().includes(q) ||
        (r.description && r.description.toLowerCase().includes(q)) ||
        r.uploadedByName.toLowerCase().includes(q) ||
        r.fileName.toLowerCase().includes(q)
    );
  }, [resources, searchQuery]);

  const {
    currentPage,
    totalPages,
    paginatedItems,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage,
    hasPrevPage,
    totalItems,
    startIndex,
    endIndex,
  } = usePagination(filteredResources, 20);

  const handleUploadSubmit = async (formData: FormData, metadataFallback: any) => {
    await uploadResource(formData, metadataFallback);
    success('Resource document uploaded and indexed');
    await loadResources();
  };

  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(resourceToDelete.id);
      success('Learning resource deleted');
      setResourceToDelete(null);
      await loadResources();
    } catch (err: any) {
      showError(err.message || 'Failed to delete resource');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="resources-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FolderArchive className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Learning Resources & Repository
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Course lecture slides, reference papers, and assignments for {classroomName || 'active section'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/ai-studio"
            id="ai-studio-btn"
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <Sparkles className="w-4 h-4 text-violet-200" />
            AI Studio & Transcribe
          </Link>

          {canUpload && (
            <button
              type="button"
              id="upload-resource-btn"
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              Upload File
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Type Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          {RESOURCE_TYPES.map((item) => (
            <button
              key={item.type}
              type="button"
              id={`filter-resource-${item.type.toLowerCase()}`}
              onClick={() => setSelectedType(item.type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedType === item.type
                  ? 'bg-white text-indigo-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          {/* Subject Filter */}
          {uniqueSubjects.length > 0 && (
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-white border border-slate-200 text-xs font-medium text-slate-700 px-3 py-2 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shrink-0"
            >
              <option value="ALL">All Subjects</option>
              {uniqueSubjects.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          )}

          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, filename, or author..."
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>
      </div>

      {/* Grid of Resource Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : paginatedItems.length === 0 ? (
        <EmptyState
          icon={FolderArchive}
          title="No resources found"
          description={
            searchQuery
              ? `No documents matching "${searchQuery}".`
              : 'No study materials or lecture notes uploaded under this filter yet.'
          }
          actionLabel={canUpload ? 'Upload First Resource' : undefined}
          onAction={canUpload ? () => setIsUploadOpen(true) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedItems.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              currentUserRole={user?.role}
              currentUserId={user?.userId}
              onDelete={(res) => setResourceToDelete(res)}
            />
          ))}
        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 text-xs text-slate-600">
          <span>
            Showing <span className="font-semibold">{startIndex}</span> to{' '}
            <span className="font-semibold">{endIndex}</span> of{' '}
            <span className="font-semibold">{totalItems}</span> documents
          </span>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={prevPage}
              disabled={!hasPrevPage}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 font-bold text-slate-800">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={nextPage}
              disabled={!hasNextPage}
              className="p-1.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <UploadResourceModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUpload={handleUploadSubmit}
        defaultClassroomId={classroomId || 'cls_cse_3a'}
        defaultClassroomName={classroomName || 'CSE - 3rd Year (Section A)'}
        defaultAuthorId={user?.userId || 'usr_faculty_01'}
        defaultAuthorName={user?.name || 'Dr. Ramesh Sharma'}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!resourceToDelete}
        onClose={() => setResourceToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Resource File"
        message={`Are you sure you want to delete "${resourceToDelete?.title}" (${resourceToDelete?.fileName})? This action cannot be undone.`}
        confirmLabel="Delete File"
        isLoading={isDeleting}
      />
    </div>
  );
};
