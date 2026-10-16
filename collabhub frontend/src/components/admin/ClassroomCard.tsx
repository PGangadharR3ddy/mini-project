import React from 'react';
import { Classroom } from '../../types';
import { School, Users, BookOpen, User, Edit2, Trash2, Calendar } from 'lucide-react';

interface ClassroomCardProps {
  classroom: Classroom;
  onEdit: (classroom: Classroom) => void;
  onDelete: (classroom: Classroom) => void;
}

export const ClassroomCard: React.FC<ClassroomCardProps> = ({
  classroom,
  onEdit,
  onDelete,
}) => {
  return (
    <div
      id={`classroom-card-${classroom.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all p-5 flex flex-col justify-between gap-4"
    >
      <div>
        {/* Header: Department Badge & Actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
            {classroom.department}
          </span>

          <div className="flex items-center gap-1">
            <button
              type="button"
              id={`edit-classroom-${classroom.id}`}
              onClick={() => onEdit(classroom)}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit Classroom"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              id={`delete-classroom-${classroom.id}`}
              onClick={() => onDelete(classroom)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Classroom"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Title & Section */}
        <div className="flex items-center gap-2 mb-1">
          <School className="w-4 h-4 text-indigo-600 shrink-0" />
          <h3 className="text-base font-bold text-slate-900 leading-snug">
            {classroom.name}
          </h3>
        </div>
        <p className="text-xs font-semibold text-slate-500 pl-6">
          {classroom.section} • Year {classroom.year}, Semester {classroom.semester}
        </p>

        {/* Advisor */}
        {classroom.facultyAdvisor && (
          <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
            <User className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Advisor:</span>
            <span className="font-semibold text-slate-800">{classroom.facultyAdvisor}</span>
          </div>
        )}
      </div>

      {/* Metrics Row */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span className="block font-bold text-slate-900 text-sm">{classroom.totalStudents || 60}</span>
          <span className="text-[10px] text-slate-500 font-medium">Students Enrolled</span>
        </div>
        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
          <span className="block font-bold text-slate-900 text-sm">{classroom.totalSubjects || 6}</span>
          <span className="text-[10px] text-slate-500 font-medium">Core Courses</span>
        </div>
      </div>
    </div>
  );
};
