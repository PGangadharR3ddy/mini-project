import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Classroom } from '../../types';

interface ClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Classroom, 'id' | 'createdAt'>) => Promise<void>;
  initialClassroom?: Classroom | null;
}

const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Information Technology',
  'Mechanical Engineering',
  'Electrical Engineering',
  'Civil Engineering',
];

export const ClassroomModal: React.FC<ClassroomModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialClassroom,
}) => {
  const [name, setName] = useState('');
  const [section, setSection] = useState('Section A');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [year, setYear] = useState<number | string>(3);
  const [semester, setSemester] = useState<number | string>(5);
  const [totalStudents, setTotalStudents] = useState<number | string>(60);
  const [facultyAdvisor, setFacultyAdvisor] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialClassroom) {
      setName(initialClassroom.name);
      setSection(initialClassroom.section);
      setDepartment(initialClassroom.department);
      setYear(initialClassroom.year);
      setSemester(initialClassroom.semester);
      setTotalStudents(initialClassroom.totalStudents || 60);
      setFacultyAdvisor(initialClassroom.facultyAdvisor || '');
    } else {
      setName('');
      setSection('Section A');
      setDepartment(DEPARTMENTS[0]);
      setYear(3);
      setSemester(5);
      setTotalStudents(60);
      setFacultyAdvisor('');
    }
    setError('');
  }, [initialClassroom, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter a classroom name');
      return;
    }
    if (!section.trim()) {
      setError('Please specify section');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onSave({
        name: name.trim(),
        section: section.trim(),
        department,
        year: Number(year) || 1,
        semester: Number(semester) || 1,
        totalStudents: Number(totalStudents) || 0,
        facultyAdvisor: facultyAdvisor.trim() || undefined,
        totalSubjects: 6,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save classroom');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id="classroom-modal"
      isOpen={isOpen}
      onClose={onClose}
      title={initialClassroom ? 'Edit Classroom' : 'Create New Classroom'}
      subtitle="Define classroom division, academic department, and enrollment quota"
      maxWidth="md"
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
            id="classroom-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialClassroom ? 'Update Classroom' : 'Create Classroom'}
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
          <label className="block text-xs font-semibold text-slate-700 mb-1">Classroom Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. B.Tech Computer Science"
            required
            className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="e.g. Section A"
              required
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            >
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
            <input
              type="number"
              min="1"
              max="5"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Semester</label>
            <input
              type="number"
              min="1"
              max="10"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Student Capacity</label>
            <input
              type="number"
              min="1"
              value={totalStudents}
              onChange={(e) => setTotalStudents(e.target.value)}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Faculty Advisor (Optional)</label>
          <input
            type="text"
            value={facultyAdvisor}
            onChange={(e) => setFacultyAdvisor(e.target.value)}
            placeholder="e.g. Dr. Ramesh Sharma"
            className="w-full text-xs font-medium bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </form>
    </Modal>
  );
};
