import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../../types';
import { Badge } from '../common/Badge';
import {
  Users,
  Code2,
  FolderGit2,
  ExternalLink,
  Building2,
  Settings,
  UserPlus,
  CheckCircle2,
  Clock,
} from 'lucide-react';

interface ProjectCardProps {
  id?: string;
  project: Project;
  currentUserId?: string;
  onRequestJoin: (project: Project) => void;
  hasRequested?: boolean;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  project,
  currentUserId,
  onRequestJoin,
  hasRequested = false,
}) => {
  const isOwner = currentUserId && project.postedById === currentUserId;
  const isMember =
    currentUserId &&
    (project.members || []).some((m) => m.userId === currentUserId);
  const currentMembersCount = project.members?.length || 1;
  const maxCapacity = project.teamSize || 1;
  const isFull = currentMembersCount >= maxCapacity;

  // Split tech stack into chips if comma separated
  const techStackList = project.techStack
    ? project.techStack.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div
      id={id || `project-card-${project.id}`}
      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-slate-300"
    >
      <div className="p-5 md:p-6 space-y-4">
        {/* Top Header: Department/Classroom Scope & Status */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="project"
              projectStatus={project.status}
              size="sm"
              dot
            />
            {project.classroomName ? (
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full truncate max-w-[170px]">
                {project.classroomName}
              </span>
            ) : (
              <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Building2 className="w-3 h-3 text-indigo-600" />
                Cross-Department
              </span>
            )}
          </div>

          {/* Team Capacity Counter */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-xl shrink-0">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              {currentMembersCount}/{maxCapacity}
            </span>
          </div>
        </div>

        {/* Title & Description */}
        <div>
          <Link
            to={`/projects/${project.id}`}
            className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 leading-snug"
          >
            {project.title}
          </Link>
          <p className="text-xs text-slate-500 line-clamp-2 mt-1.5 leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Tech Stack Chips */}
        {techStackList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {techStackList.slice(0, 4).map((tech, idx) => (
              <span
                key={idx}
                className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/70"
              >
                {tech}
              </span>
            ))}
            {techStackList.length > 4 && (
              <span className="text-[11px] font-medium text-slate-400 px-1 py-0.5">
                +{techStackList.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {project.tags && project.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag, idx) => (
              <span
                key={idx}
                className="text-[10px] font-semibold text-indigo-600 bg-indigo-50/70 px-2 py-0.5 rounded-md"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer Details: Posted By & Action Button */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-3">
        {/* Creator Info */}
        <div className="min-w-0 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 border border-slate-300">
            {project.postedByName ? project.postedByName.charAt(0) : 'U'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-slate-800 truncate">
                {project.postedByName}
              </span>
              <Badge variant="role" role={project.postedByRole} size="sm" />
            </div>
            <p className="text-[10px] text-slate-400 truncate">
              {project.department}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="shrink-0 flex items-center gap-2">
          {isOwner ? (
            <Link
              to={`/projects/${project.id}`}
              id={`manage-project-btn-${project.id}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              Manage
            </Link>
          ) : isMember ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Team Member
            </span>
          ) : hasRequested ? (
            <span className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              Requested
            </span>
          ) : project.status === 'OPEN' && !isFull ? (
            <button
              type="button"
              id={`request-join-btn-${project.id}`}
              onClick={() => onRequestJoin(project)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-2xs transition-colors"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Request to Join
            </button>
          ) : (
            <Link
              to={`/projects/${project.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
