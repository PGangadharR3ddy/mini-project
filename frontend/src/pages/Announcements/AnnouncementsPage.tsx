import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  FileText,
  Download,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getAnnouncementFeed,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../../api/announcements';
import { Announcement, AnnouncementType } from '../../types';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CardSkeleton, EmptyState } from '../../components/Loader';
import { canCreateContent, canEditContent } from '../../utils/roleGuard';
import { formatDateTime, formatRelative } from '../../utils/dateFormat';
import toast from 'react-hot-toast';

export const AnnouncementsPage: React.FC = () => {
  const { role, user, classroomId } = useAuth();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Modals state
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Announcement | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'SECTION' as AnnouncementType,
    department: user?.department || 'CSE',
    urgent: false,
    hasAttachment: false,
    attachmentName: '',
  });

  const canPost = canCreateContent(role || undefined);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const pageResult = await getAnnouncementFeed(
        classroomId,
        user?.department || 'CSE',
        currentPage,
        20
      );
      setAnnouncements(pageResult.content);
      setTotalPages(pageResult.totalPages || 1);
    } catch (err) {
      console.error('Failed to load announcements:', err);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [classroomId, currentPage]);

  const handleOpenPost = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      body: '',
      type: 'SECTION',
      department: user?.department || 'CSE',
      urgent: false,
      hasAttachment: false,
      attachmentName: '',
    });
    setIsPostModalOpen(true);
  };

  const handleOpenEdit = (item: Announcement) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      body: item.body,
      type: item.type,
      department: item.department || user?.department || 'CSE',
      urgent: !!item.urgent,
      hasAttachment: !!item.attachmentName,
      attachmentName: item.attachmentName || '',
    });
    setIsPostModalOpen(true);
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = {
        classroomId: formData.type === 'SECTION' ? classroomId : null,
        title: formData.title,
        body: formData.body,
        type: formData.type,
        department: formData.department,
        urgent: formData.urgent,
      };

      if (formData.hasAttachment && formData.attachmentName) {
        payload.attachmentName = formData.attachmentName;
        payload.attachmentSize = '2.4 MB';
        payload.attachmentUrl = '#';
      }

      if (editingItem) {
        await updateAnnouncement(editingItem.id, payload);
        toast.success('Announcement updated');
      } else {
        await createAnnouncement(payload);
        toast.success('Announcement bulletin posted');
      }

      setIsPostModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to save announcement');
    }
  };

  const handleDeleteAnnouncement = async () => {
    if (!itemToDelete) return;
    try {
      await deleteAnnouncement(itemToDelete.id);
      toast.success('Announcement removed');
      setItemToDelete(null);
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  // Client-side category and search filtering
  const filteredList = announcements.filter((item) => {
    const matchesType =
      selectedType === 'ALL' || item.type.toUpperCase() === selectedType;
    const matchesSearch =
      !searchQuery ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.postedBy && item.postedBy.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-2 py-0.5 rounded-md">
              Broadcast Dispatch
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Official Institutional Notices
            </span>
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
            Announcements & Bulletins
          </h1>
        </div>

        {canPost && (
          <button
            onClick={handleOpenPost}
            className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Post Bulletin</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center bg-white border border-stone-200 rounded-2xl p-4 shadow-sm">
        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'SECTION', 'DEPARTMENT', 'GENERAL'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedType(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedType === tab
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {tab === 'ALL' ? 'All Bulletins' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[260px]">
          <input
            type="text"
            placeholder="Search bulletins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 pl-8 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
          />
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-stone-400" />
        </div>
      </div>

      {/* Announcements Feed Grid */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : filteredList.length === 0 ? (
        <EmptyState
          title="No bulletins found"
          description="There are currently no announcements matching your filter selection."
          actionText={canPost ? 'Post First Bulletin' : undefined}
          onAction={canPost ? handleOpenPost : undefined}
        />
      ) : (
        <div className="space-y-4">
          {filteredList.map((item) => {
            const isUserAuthor = canEditContent(
              role || undefined,
              item.postedBy,
              user?.name
            );

            return (
              <div
                key={item.id}
                className="bg-white border border-stone-200 hover:border-stone-300 rounded-2xl p-6 shadow-sm transition-all"
              >
                {/* Header Row */}
                <div className="flex flex-wrap items-start justify-between gap-4 pb-4 mb-4 border-b border-stone-100">
                  <div className="flex items-center gap-3">
                    {/* Author Avatar or Initial */}
                    <div className="w-9 h-9 rounded-full bg-stone-100 text-stone-800 border border-stone-200 flex items-center justify-center font-serif font-semibold text-sm">
                      {item.postedBy ? item.postedBy.charAt(0) : 'A'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-xs text-stone-900">
                          {item.postedBy || 'Academic Faculty'}
                        </span>
                        <span className="text-[11px] text-stone-500">
                          • {item.authorRole || item.department}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-400">
                        {formatDateTime(item.createdAt)} ({formatRelative(item.createdAt)})
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.urgent && <Badge type="URGENT" size="sm" />}
                    <Badge type={item.type} size="sm" />

                    {isUserAuthor && (
                      <div className="flex items-center gap-1 ml-2 border-l border-stone-200 pl-2">
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="p-1 hover:bg-stone-100 rounded text-stone-500 hover:text-stone-900 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1 hover:bg-rose-50 rounded text-stone-400 hover:text-rose-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bulletin Content */}
                <div className="space-y-2">
                  <h3 className="font-serif text-lg font-semibold text-stone-900 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 whitespace-pre-line leading-relaxed">
                    {item.body}
                  </p>
                </div>

                {/* Optional Attachment Pill */}
                {item.attachmentName && (
                  <div className="mt-4 pt-4 border-t border-stone-100">
                    <div className="inline-flex items-center gap-3 bg-stone-50 border border-stone-200 rounded-xl p-2.5 hover:bg-stone-100 transition-colors">
                      <div className="w-7 h-7 rounded-lg bg-stone-200 text-stone-700 flex items-center justify-center">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-stone-900">
                          {item.attachmentName}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {item.attachmentSize || '2.4 MB'} • Document
                        </div>
                      </div>
                      <a
                        href={item.attachmentUrl || '#'}
                        download
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.success(`Downloading ${item.attachmentName}`);
                        }}
                        className="ml-3 p-1.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 text-stone-700 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <span className="text-xs text-stone-500 px-3 py-1.5">
                Page {currentPage + 1} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="px-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Post / Edit Announcement Modal */}
      <Modal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        title={editingItem ? 'Edit Bulletin' : 'Post Announcement Bulletin'}
        subtitle="Broadcast to students and department faculty"
      >
        <form onSubmit={handleSaveAnnouncement} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Audience Scope / Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as AnnouncementType })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              >
                <option value="SECTION">SECTION (Classroom Only)</option>
                <option value="DEPARTMENT">DEPARTMENT (CSE Dept)</option>
                <option value="GENERAL">GENERAL (All Campus)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Department
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Headline Title
            </label>
            <input
              type="text"
              placeholder="e.g. Schedule for Mid-Term Practical Evaluations"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Bulletin Body & Details
            </label>
            <textarea
              rows={5}
              placeholder="Provide comprehensive details, instructions, room numbers, or links..."
              value={formData.body}
              onChange={(e) => setFormData({ ...formData, body: e.target.value })}
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="space-y-2 bg-stone-50 p-3 rounded-xl border border-stone-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.urgent}
                onChange={(e) => setFormData({ ...formData, urgent: e.target.checked })}
                className="w-4 h-4 accent-stone-900 rounded"
              />
              <span className="text-xs font-medium text-rose-700">
                Mark as High Priority / Urgent Broadcast
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={formData.hasAttachment}
                onChange={(e) => setFormData({ ...formData, hasAttachment: e.target.checked })}
                className="w-4 h-4 accent-stone-900 rounded"
              />
              <span className="text-xs font-medium text-stone-700">
                Attach Reference Document (PDF)
              </span>
            </label>

            {formData.hasAttachment && (
              <div className="pt-2">
                <input
                  type="text"
                  placeholder="e.g. Schedule_Matrix_V2.pdf"
                  value={formData.attachmentName}
                  onChange={(e) => setFormData({ ...formData, attachmentName: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsPostModalOpen(false)}
              className="px-4 py-2 border border-stone-200 bg-white hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              {editingItem ? 'Save Updates' : 'Publish Bulletin'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleDeleteAnnouncement}
        title="Delete Announcement"
        message={`Are you sure you want to delete "${itemToDelete?.title}"? This cannot be undone.`}
        confirmText="Delete Bulletin"
      />
    </div>
  );
};

