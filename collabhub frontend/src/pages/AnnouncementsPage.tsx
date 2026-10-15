import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { usePagination } from '../hooks/usePagination';
import {
  getAnnouncementsFeed,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../api/announcements';
import { Announcement, AnnouncementType } from '../types';
import { AnnouncementCard } from '../components/announcements/AnnouncementCard';
import { AnnouncementModal } from '../components/announcements/AnnouncementModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import {
  BellRing,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Pin,
  Megaphone,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export const AnnouncementsPage: React.FC = () => {
  const { user, isFaculty, isAdmin, classroomId, classroomName, department } = useAuth();
  const { success, error: showError } = useToast();
  const [searchParams] = useSearchParams();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [selectedType, setSelectedType] = useState<AnnouncementType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('search') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  // Delete dialog
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canPost = isFaculty || isAdmin;

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAnnouncementsFeed(
        classroomId || undefined,
        department || undefined,
        selectedType
      );
      setAnnouncements(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, [classroomId, department, selectedType, showError]);

  useEffect(() => {
    loadAnnouncements();
  }, [loadAnnouncements]);

  // Client-side search filtering
  const filteredAnnouncements = useMemo(() => {
    if (!searchQuery.trim()) return announcements;
    const q = searchQuery.toLowerCase();
    return announcements.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q) ||
        a.authorName.toLowerCase().includes(q)
    );
  }, [announcements, searchQuery]);

  // Pagination (page size 20 as specified in prompt)
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
  } = usePagination(filteredAnnouncements, 20);

  const handleSaveAnnouncement = async (data: Omit<Announcement, 'id' | 'createdAt'>) => {
    if (editingAnnouncement) {
      await updateAnnouncement(editingAnnouncement.id, data);
      success('Announcement updated successfully');
    } else {
      await createAnnouncement(data);
      success('Announcement published to feed');
    }
    await loadAnnouncements();
  };

  const handleConfirmDelete = async () => {
    if (!announcementToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAnnouncement(announcementToDelete.id);
      success('Announcement deleted');
      setAnnouncementToDelete(null);
      await loadAnnouncements();
    } catch (err: any) {
      showError(err.message || 'Failed to delete announcement');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div id="announcements-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BellRing className="w-5 h-5 text-indigo-600" />
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Classroom & Institutional Feed
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Combined feed of section notices, departmental broadcasts, and campus circulars
          </p>
        </div>

        {canPost && (
          <button
            type="button"
            id="create-announcement-btn"
            onClick={() => {
              setEditingAnnouncement(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            Post Announcement
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-100 p-1 rounded-xl border border-slate-200 shrink-0">
          {[
            { type: 'ALL', label: 'All Feed' },
            { type: 'SECTION' as AnnouncementType, label: 'Section Only' },
            { type: 'DEPARTMENT' as AnnouncementType, label: 'Department' },
            { type: 'GENERAL' as AnnouncementType, label: 'General Notices' },
          ].map((item) => (
            <button
              key={item.type}
              type="button"
              id={`filter-${item.type.toLowerCase()}`}
              onClick={() => setSelectedType(item.type as any)}
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

        {/* Search Field */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search announcements by title or author..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : paginatedItems.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No announcements found"
          description={
            searchQuery
              ? `No circulars matching "${searchQuery}". Try a different search term.`
              : 'There are no announcements posted in this category yet.'
          }
          actionLabel={canPost ? 'Post the First Announcement' : undefined}
          onAction={
            canPost
              ? () => {
                  setEditingAnnouncement(null);
                  setIsModalOpen(true);
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {paginatedItems.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              currentUserRole={user?.role}
              currentUserId={user?.userId}
              onEdit={(anc) => {
                setEditingAnnouncement(anc);
                setIsModalOpen(true);
              }}
              onDelete={(anc) => setAnnouncementToDelete(anc)}
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
            <span className="font-semibold">{totalItems}</span> circulars
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

      {/* Modal */}
      <AnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAnnouncement}
        initialAnnouncement={editingAnnouncement}
        defaultClassroomId={classroomId || 'cls_cse_3a'}
        defaultClassroomName={classroomName || 'CSE - 3rd Year (Section A)'}
        defaultDepartment={department || 'Computer Science & Engineering'}
        authorId={user?.userId || 'usr_faculty_01'}
        authorName={user?.name || 'Dr. Ramesh Sharma'}
        authorRole={user?.role || 'FACULTY'}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={!!announcementToDelete}
        onClose={() => setAnnouncementToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${announcementToDelete?.title}"? This cannot be undone.`}
        confirmLabel="Delete Announcement"
        isLoading={isDeleting}
      />
    </div>
  );
};
