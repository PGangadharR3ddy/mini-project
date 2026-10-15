import React from 'react';
import { Resource, UserRole } from '../../types';
import { Badge } from '../common/Badge';
import { formatDate } from '../../utils/formatters';
import {
  Download,
  Trash2,
  FileText,
  Presentation,
  ClipboardList,
  BookOpen,
  Video,
  User,
  HardDrive,
  File,
} from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface ResourceCardProps {
  resource: Resource;
  currentUserRole?: UserRole;
  currentUserId?: string;
  onDelete?: (resource: Resource) => void;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  resource,
  currentUserRole,
  currentUserId,
  onDelete,
}) => {
  const { success } = useToast();
  const isAuthor = currentUserId === resource.uploadedById;
  const isAdmin = currentUserRole === 'ADMIN';
  const isFaculty = currentUserRole === 'FACULTY';
  const canDelete = isAdmin || (isFaculty && isAuthor) || isAuthor;

  const getIcon = () => {
    switch (resource.type) {
      case 'PPT':
        return <Presentation className="w-5 h-5 text-orange-600" />;
      case 'ASSIGNMENT':
        return <ClipboardList className="w-5 h-5 text-amber-600" />;
      case 'REFERENCE':
        return <BookOpen className="w-5 h-5 text-emerald-600" />;
      case 'RECORDED_LECTURE':
        return <Video className="w-5 h-5 text-rose-600" />;
      default:
        return <FileText className="w-5 h-5 text-blue-600" />;
    }
  };

  const handleDownload = () => {
    // Simulated download action
    success(`Downloading "${resource.fileName}" (${resource.fileSize})...`);
    // Create a mock blob download for good measure if needed
    const element = document.createElement('a');
    const file = new Blob([`Smart Classroom Resource: ${resource.title}\nSubject: ${resource.subject}\nAuthor: ${resource.uploadedByName}`], {
      type: 'text/plain',
    });
    element.href = URL.createObjectURL(file);
    element.download = resource.fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div
      id={`resource-card-${resource.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all p-5 flex flex-col justify-between gap-4 group"
    >
      <div>
        {/* Header: Icon, Type Badge & Delete button */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
              {getIcon()}
            </div>
            <div className="min-w-0">
              <Badge variant="resource" resourceType={resource.type} size="sm" />
              <span className="block text-xs font-semibold text-indigo-600 mt-1 truncate">
                {resource.subject}
              </span>
            </div>
          </div>

          {canDelete && onDelete && (
            <button
              type="button"
              id={`delete-resource-${resource.id}`}
              onClick={() => onDelete(resource)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Resource"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Title & Description */}
        <h3 className="text-sm font-bold text-slate-900 leading-snug mb-1.5 group-hover:text-indigo-600 transition-colors">
          {resource.title}
        </h3>
        {resource.description && (
          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed mb-3">
            {resource.description}
          </p>
        )}

        {/* File Details Pill */}
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-2 truncate">
            <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-mono text-[11px] truncate">{resource.fileName}</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 shrink-0">{resource.fileSize}</span>
        </div>
      </div>

      {/* Footer: Uploaded by & Download Action */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 truncate">
          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate">{resource.uploadedByName}</span>
          <span className="text-slate-300">•</span>
          <span className="text-[11px] shrink-0">{formatDate(resource.uploadedDate)}</span>
        </div>

        <button
          type="button"
          id={`download-btn-${resource.id}`}
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-xl text-xs font-semibold transition-all shrink-0 shadow-2xs"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>
      </div>
    </div>
  );
};
