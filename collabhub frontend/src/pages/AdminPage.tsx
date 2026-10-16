import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getClassrooms,
  createClassroom,
  updateClassroom,
  deleteClassroom,
} from '../api/classrooms';
import { Classroom } from '../types';
import { ClassroomCard } from '../components/admin/ClassroomCard';
import { ClassroomModal } from '../components/admin/ClassroomModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import {
  ShieldAlert,
  Plus,
  Search,
  School,
  Building,
  GraduationCap,
  Users,
  Layers,
} from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error: showError } = useToast();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedDept, setSelectedDept] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClassroom, setEditingClassroom] = useState<Classroom | null>(null);

  // Delete
  const [classroomToDelete, setClassroomToDelete] = useState<Classroom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadClassrooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClassrooms(selectedDept);
      setClassrooms(data);
    } catch (err: any) {
      showError(err.message || 'Failed to load classrooms');
    } finally {
      setLoading(false);
    }
  }, [selectedDept, showError]);

  useEffect(() => {
    loadClassrooms();
  }, [loadClassrooms]);

  const uniqueDepts = useMemo(() => {
    const depts = new Set<string>();
    classrooms.forEach((c) => {
      if (c.department) depts.add(c.department);
    });
    return Array.from(depts);
  }, [classrooms]);

  const filteredClassrooms = useMemo(() => {
    if (!searchQuery.trim()) return classrooms;
    const q = searchQuery.toLowerCase();
    return classrooms.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.section.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q) ||
        (c.facultyAdvisor && c.facultyAdvisor.toLowerCase().includes(q))
    );
  }, [classrooms, searchQuery]);

  const handleSaveClassroom = async (data: Omit<Classroom, 'id' | 'createdAt'>) => {
    if (editingClassroom) {
      await updateClassroom(editingClassroom.id, data);
      success('Classroom details updated');
    } else {
      await createClassroom(data);
      success('New classroom created');
    }
    await loadClassrooms();
  };

  const handleConfirmDelete = async () => {
    if (!classroomToDelete) return;
    setIsDeleting(true);
    try {
      await deleteClassroom(classroomToDelete.id);
      success('Classroom deleted');
      setClassroomToDelete(null);
      await loadClassrooms();
    } catch (err: any) {
      showError(err.message || 'Failed to delete classroom');
    } finally {
      setIsDeleting(false);
    }
  };

  // Metrics
  const totalStudents = classrooms.reduce((acc, c) => acc + (c.totalStudents || 60), 0);

  return (
    <div id="admin-page" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-5 h-5 text-purple-600" />
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
              Classroom & Department Administration
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            Administrative control panel for creating, configuring, and managing institutional classroom cohorts
          </p>
        </div>

        <button
          type="button"
          id="create-classroom-btn"
          onClick={() => {
            setEditingClassroom(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Classroom
        </button>
      </div>

      {/* Admin Summary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <School className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Active Classrooms</span>
            <p className="text-xl font-bold text-slate-900">{classrooms.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Academic Departments</span>
            <p className="text-xl font-bold text-slate-900">{uniqueDepts.length || 4}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Enrolled Students</span>
            <p className="text-xl font-bold text-slate-900">{totalStudents}</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Department Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-600 shrink-0">Department:</label>
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="bg-white border border-slate-200 text-xs font-semibold text-slate-700 px-3 py-2 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-purple-500 shrink-0"
          >
            <option value="ALL">All Departments</option>
            {uniqueDepts.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by classroom name, section, or advisor..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Classrooms Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filteredClassrooms.length === 0 ? (
        <EmptyState
          icon={School}
          title="No classrooms found"
          description={
            searchQuery
              ? `No classrooms match "${searchQuery}".`
              : 'There are no active classrooms configured in this department.'
          }
          actionLabel="Create New Classroom"
          onAction={() => {
            setEditingClassroom(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClassrooms.map((classroom) => (
            <ClassroomCard
              key={classroom.id}
              classroom={classroom}
              onEdit={(c) => {
                setEditingClassroom(c);
                setIsModalOpen(true);
              }}
              onDelete={(c) => setClassroomToDelete(c)}
            />
          ))}
        </div>
      )}

      {/* Classroom Modal */}
      <ClassroomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClassroom}
        initialClassroom={editingClassroom}
      />

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!classroomToDelete}
        onClose={() => setClassroomToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Classroom Cohort"
        message={`Are you sure you want to permanently remove "${classroomToDelete?.name} (${classroomToDelete?.section})"? All associated timetable slots, announcements, and resources will be affected.`}
        confirmLabel="Delete Classroom"
        isLoading={isDeleting}
      />
    </div>
  );
};
