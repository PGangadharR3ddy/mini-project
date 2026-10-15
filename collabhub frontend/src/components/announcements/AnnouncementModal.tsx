import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Announcement, AnnouncementType } from '../../types';
import { Pin } from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Announcement, 'id' | 'createdAt'>) => Promise<void>;
  initialAnnouncement?: Announcement | null;
  defaultClassroomId?: string;
  defaultClassroomName?: string;
  defaultDepartment?: string;
  authorId: string;
  authorName: string;
  authorRole: any;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAnnouncement,
  defaultClassroomId = 'cls_cse_3a',
  defaultClassroomName = 'CSE - 3rd Year (Section A)',
  defaultDepartment = 'Computer Science & Engineering',
  authorId,
  authorName,
  authorRole,
}) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<AnnouncementType>('SECTION');
  const [pinned, setPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialAnnouncement) {
      setTitle(initialAnnouncement.title);
      setBody(initialAnnouncement.body);
      setType(initialAnnouncement.type);
      setPinned(!!initialAnnouncement.pinned);
    } else {
      setTitle('');
      setBody('');
      setType('SECTION');
      setPinned(false);
    }
    setError('');
  }, [initialAnnouncement, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    if (!body.trim()) {
      setError('Please write the announcement message');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      await onSave({
        title: title.trim(),
        body: body.trim(),
        type,
        pinned,
        classroomId: type === 'SECTION' ? defaultClassroomId : undefined,
        classroomName: type === 'SECTION' ? defaultClassroomName : undefined,
        department: defaultDepartment,
        authorId: initialAnnouncement?.authorId || authorId,
        authorName: initialAnnouncement?.authorName || authorName,
        authorRole: initialAnnouncement?.authorRole || authorRole,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to post announcement');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="announcement-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={initialAnnouncement ? 'Edit Announcement' : 'Post New Announcement'}
      subtitle="Publish updates, schedules, and important circulars to students and faculty"
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
            id="announcement-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Publishing...' : initialAnnouncement ? 'Update Announcement' : 'Publish Announcement'}
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

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Scope / Type *</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { type: 'SECTION' as AnnouncementType, label: 'Section Only', desc: 'Active Classroom' },
              { type: 'DEPARTMENT' as AnnouncementType, label: 'Department', desc: defaultDepartment.split(' ')[0] },
              { type: 'GENERAL' as AnnouncementType, label: 'General Notice', desc: 'All Engineering' },
            ].map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => setType(item.type)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  type === item.type
                    ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold ring-1 ring-indigo-500'
                    : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700'
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Announcement Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Mid-Term Assessment Schedule & Guidelines"
            required
            className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            placeholder="Provide clear instructions, deadlines, or details for students and faculty..."
            required
            className="w-full text-xs font-normal bg-slate-50 border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-y"
          />
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="pinned-toggle"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
          />
          <label htmlFor="pinned-toggle" className="text-xs font-medium text-slate-700 flex items-center gap-1.5 cursor-pointer">
            <Pin className="w-3.5 h-3.5 text-indigo-600" />
            Pin this announcement to top of feed
          </label>
        </div>
      </form>
    </Modal>
  );
};
