import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Users } from 'lucide-react';
import { Project } from '../types';
import { Badge } from './Badge';

interface ProjectCardProps {
  project: Project;
  currentUserId: number | null;
  onRequestJoin: (project: Project) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  currentUserId,
  onRequestJoin,
}) => {
  const tags = project.tags?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? [];
  const isOwner = currentUserId !== null && project.postedBy === currentUserId;
  const isFull = project.memberCount >= project.teamSize;

  return (
    <article className="flex min-h-[280px] flex-col border-2 border-stone-900 bg-white shadow-[4px_4px_0_0_#1b1c19]">
      <div className="flex items-start justify-between gap-3 border-b-2 border-stone-900 bg-[#f1efe6] p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge type={project.status} />
          <span className="text-[11px] font-bold uppercase text-stone-600">
            {project.classroomName || 'Open collaboration'}
          </span>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-bold text-stone-800" title="Team members">
          <Users className="h-3.5 w-3.5" /> {project.memberCount}/{project.teamSize}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <Link to={`/projects/${project.id}`} className="group inline-flex items-start justify-between gap-2">
          <h2 className="font-serif text-xl font-semibold leading-tight text-stone-900 group-hover:underline">
            {project.title}
          </h2>
          <ArrowUpRight className="mt-1 h-4 w-4 shrink-0" />
        </Link>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-stone-600">{project.description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {project.techStack.split(',').map((tech) => tech.trim()).filter(Boolean).slice(0, 4).map((tech) => (
            <span key={tech} className="border border-stone-300 bg-stone-50 px-2 py-1 text-[11px] font-medium text-stone-700">
              {tech}
            </span>
          ))}
          {tags.slice(0, 3).map((tag) => (
            <span key={tag} className="border border-emerald-800/20 bg-emerald-50 px-2 py-1 text-[11px] font-medium text-emerald-900">
              #{tag}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-stone-200 pt-4">
          <div className="min-w-0">
            <p className="truncate text-xs font-bold text-stone-900">{project.postedByName}</p>
            <p className="text-[11px] text-stone-500">{project.department} · {new Date(project.createdAt).toLocaleDateString()}</p>
          </div>
          {isOwner || project.isMember ? (
            <Link to={`/projects/${project.id}`} className="shrink-0 border-2 border-stone-900 px-3 py-2 text-xs font-bold hover:bg-stone-100">
              {isOwner ? 'Manage' : 'Team'}
            </Link>
          ) : project.hasRequested ? (
            <span className="shrink-0 px-2 py-2 text-xs font-bold text-amber-800">Request sent</span>
          ) : project.status === 'OPEN' && !isFull ? (
            <button onClick={() => onRequestJoin(project)} className="shrink-0 border-2 border-stone-900 bg-stone-900 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-800">
              Request to join
            </button>
          ) : (
            <Link to={`/projects/${project.id}`} className="shrink-0 px-2 py-2 text-xs font-bold underline">Details</Link>
          )}
        </div>
      </div>
    </article>
  );
};