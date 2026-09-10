import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  getClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} from '../../api/classrooms';
import { Classroom } from '../../types';
import { Modal } from '../../components/Modal';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { CardSkeleton, EmptyState } from '../../components/Loader';
import { canManageClassrooms } from '../../utils/roleGuard';
import toast from 'react-hot-toast';

export const AdminPage: React.FC = () => {
  const { role, switchDemoRole } = useAuth();
  const isAdmin = canManageClassrooms(role || undefined);

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);
  const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    section: 'A',
    department: 'CSE',
    year: 2,
    semester: 3,
  });

  const fetchClassrooms = async () => {
    try {
      setLoading(true);
      const data = await getClassrooms(selectedDept);
      setClassrooms(data);
    } catch (err) {
      console.error('Failed to load classrooms:', err);
      toast.error('Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchClassrooms();
    }
  }, [isAdmin, selectedDept]);

  const handleOpenCreate = () => {
    setEditingClassroom(null);
    setFormData({
      name: '',
      section: 'A',
      department: selectedDept !== 'ALL' ? selectedDept : 'CSE',
      year: 2,
      semester: 3,
    });
    setIsCreateModalOpen(true);
  };

  const handleOpenEdit = (cls: Classroom) => {
    setEditingClassroom(cls);
    setFormData({
      name: cls.name,
      section: cls.section,
      department: cls.department,
      year: cls.year,
      semester: cls.semester,
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingClassroom) {
        await updateClassroom(editingClassroom.id, formData);
        toast.success('Classroom configuration updated');
      } else {
        await createClassroom(formData);
        toast.success('Classroom provisioned successfully');
      }
      setIsCreateModalOpen(false);
      fetchClassrooms();
    } catch (err) {
      toast.error('Failed to save classroom');
    }
  };

  const handleDeleteClassroom = async () => {
    if (!classroomToDelete) return;
    try {
      await deleteClassroom(classroomToDelete.id);
      toast.success('Classroom deleted');
      setClassroomToDelete(null);
      fetchClassrooms();
    } catch (err) {
      toast.error('Failed to delete classroom');
    }
  };

  // If user is not Admin, display restricted access notice
  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 bg-white border border-stone-200 rounded-2xl shadow-sm p-8 text-center">
        <div className="w-12 h-12 bg-rose-50 text-rose-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <h1 className="font-serif text-2xl font-semibold text-stone-900 mb-2">
          Administrator Authority Required
        </h1>
        <p className="text-xs text-stone-600 mb-6 max-w-sm mx-auto leading-relaxed">
          Your current session role (<span className="font-medium text-stone-900">{role}</span>) does not have privileges to access the institutional classroom management portal.
        </p>

        <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl text-left mb-2">
          <div className="text-xs font-semibold text-stone-900 mb-1">
            Switch to Admin Role for Testing
          </div>
          <p className="text-[11px] text-stone-500 mb-3">
            Click below to authenticate with the Administrative authority token.
          </p>
          <button
            onClick={() => switchDemoRole('admin')}
            className="w-full bg-stone-900 hover:bg-stone-800 text-white rounded-lg py-2 px-4 text-xs font-medium shadow-sm transition-colors"
          >
            Authenticate As Admin (Dr. Sarah Müller)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200/70 px-2 py-0.5 rounded-md">
              System Administration
            </span>
            <span className="text-xs text-stone-500 font-medium">
              Classroom & Department Infrastructure
            </span>
          </div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-stone-900">
            Classroom Management
          </h1>
        </div>

        <button
          onClick={handleOpenCreate}
          className="bg-stone-900 hover:bg-stone-800 text-white px-4 py-2 rounded-lg text-xs font-medium shadow-sm flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Classroom Section</span>
        </button>
      </div>

      {/* Department Filters */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-sm flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'CSE', 'ECE', 'MECH'].map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedDept === dept
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              {dept === 'ALL' ? 'All Departments' : `${dept} Department`}
            </button>
          ))}
        </div>

        <div className="text-xs text-stone-500 font-medium">
          {classrooms.length} Active Sections
        </div>
      </div>

      {/* Classrooms Grid */}
      {loading ? (
        <CardSkeleton count={3} />
      ) : classrooms.length === 0 ? (
        <EmptyState
          title="No classrooms found"
          description="No classroom sections currently configured for this department."
          actionText="Create First Section"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classrooms.map((cls) => (
            <div
              key={cls.id}
              className="bg-white border border-stone-200 hover:border-stone-300 rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-xs text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {cls.department}
                  </span>
                  <span className="text-[11px] font-medium text-stone-600 bg-stone-100 px-2 py-0.5 rounded-md">
                    Section {cls.section}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-semibold text-stone-900 mb-1">
                  {cls.name}
                </h3>

                <p className="text-xs text-stone-500 mb-4">
                  Year {cls.year} • Semester {cls.semester} • Term {cls.academicYear || '2024-2025'}
                </p>

                <div className="bg-stone-50 border border-stone-200/70 rounded-xl p-3 space-y-1.5 text-xs text-stone-700">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Student Strength:</span>
                    <span className="font-medium text-stone-900">{cls.studentCount || 114} / {cls.capacity || 120}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Classroom ID:</span>
                    <span className="font-mono text-stone-600">#{cls.id}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleOpenEdit(cls)}
                  className="flex-1 bg-stone-50 hover:bg-stone-100 text-stone-800 border border-stone-200 rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Configure</span>
                </button>

                <button
                  onClick={() => setClassroomToDelete(cls)}
                  className="p-1.5 hover:bg-rose-50 text-stone-400 hover:text-rose-700 rounded-lg transition-colors"
                  title="Delete Section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Classroom Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={editingClassroom ? 'Configure Classroom Section' : 'Create New Classroom Section'}
        subtitle="Define department, year, and section designation"
      >
        <form onSubmit={handleSaveClassroom} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Classroom Name
            </label>
            <input
              type="text"
              placeholder="e.g. CSE - Sophomores A"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Department
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              >
                <option value="CSE">Computer Science (CSE)</option>
                <option value="ECE">Electronics (ECE)</option>
                <option value="MECH">Mechanical (MECH)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Section Label
              </label>
              <input
                type="text"
                placeholder="A, B, C or Final"
                value={formData.section}
                onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Academic Year
              </label>
              <input
                type="number"
                min={1}
                max={5}
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: parseInt(e.target.value, 10) || 1 })
                }
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Semester
              </label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.semester}
                onChange={(e) =>
                  setFormData({ ...formData, semester: parseInt(e.target.value, 10) || 1 })
                }
                required
                className="w-full bg-stone-50 border border-stone-200 rounded-lg p-2 text-xs text-stone-900 focus:outline-none focus:bg-white focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 border border-stone-200 bg-white hover:bg-stone-50 rounded-lg text-xs font-medium text-stone-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-medium shadow-sm transition-colors"
            >
              {editingClassroom ? 'Update Section' : 'Create Section'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!classroomToDelete}
        onClose={() => setClassroomToDelete(null)}
        onConfirm={handleDeleteClassroom}
        title="Delete Classroom Section"
        message={`Are you sure you want to delete ${classroomToDelete?.name}? This will remove all timetable bindings and student enrollments for this section.`}
        confirmText="Delete Section"
      />
    </div>
  );
};

