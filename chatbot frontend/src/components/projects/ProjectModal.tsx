import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { CreateProjectPayload, UpdateProjectPayload } from '../../api/projects';
import { Project, Classroom } from '../../types';
import { Code2, Globe, Github, Users, Tag, Building2, Layers } from 'lucide-react';

interface ProjectModalProps {
  id?: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: CreateProjectPayload | UpdateProjectPayload) => Promise<void>;
  project?: Project | null;
  classrooms?: Classroom[];
  userClassroomId?: string;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  id = 'project-modal',
  isOpen,
  onClose,
  onSave,
  project,
  classrooms = [],
  userClassroomId,
}) => {
  const isEditing = !!project;

  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [techStack, setTechStack] = useState(project?.techStack || '');
  const [tagsInput, setTagsInput] = useState(project?.tags?.join(', ') || '');
  const [repositoryUrl, setRepositoryUrl] = useState(project?.repositoryUrl || '');
  const [liveUrl, setLiveUrl] = useState(project?.liveUrl || '');
  const [teamSize, setTeamSize] = useState<number>(project?.teamSize || 4);
  const [classroomId, setClassroomId] = useState<string>(
    project ? (project.classroomId || '') : (userClassroomId || '')
  );
  const [status, setStatus] = useState<any>(project?.status || 'OPEN');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Reset form when opening/editing changes
  React.useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      setTechStack(project.techStack);
      setTagsInput(project.tags?.join(', ') || '');
      setRepositoryUrl(project.repositoryUrl || '');
      setLiveUrl(project.liveUrl || '');
      setTeamSize(project.teamSize);
      setClassroomId(project.classroomId || '');
      setStatus(project.status);
    } else {
      setTitle('');
      setDescription('');
      setTechStack('');
      setTagsInput('');
      setRepositoryUrl('');
      setLiveUrl('');
      setTeamSize(4);
      setClassroomId(userClassroomId || '');
      setStatus('OPEN');
    }
    setErrorMsg('');
  }, [project, userClassroomId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a project title');
      return;
    }
    if (!description.trim()) {
      setErrorMsg('Please enter a project description');
      return;
    }
    if (!techStack.trim()) {
      setErrorMsg('Please specify the primary tech stack (e.g. React, Spring Boot)');
      return;
    }
    if (teamSize < 1 || teamSize > 20) {
      setErrorMsg('Team size must be between 1 and 20 members');
      return;
    }

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      techStack: techStack.trim(),
      tags: parsedTags,
      repositoryUrl: repositoryUrl.trim() || undefined,
      liveUrl: liveUrl.trim() || undefined,
      teamSize: Number(teamSize),
      classroomId: classroomId ? classroomId : null,
    };

    if (isEditing) {
      payload.status = status;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await onSave(payload);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save project. Please check backend status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      id={id}
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Project Collaboration' : 'Post a New Project'}
      subtitle={
        isEditing
          ? 'Update project details, scope, or team capacity'
          : 'Share your venture or study project to recruit student & faculty collaborators'
      }
      maxWidth="lg"
      footer={
        <>
          <button
            type="button"
            id={`${id}-cancel-btn`}
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form={`${id}-form`}
            id={`${id}-submit-btn`}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              'Saving...'
            ) : isEditing ? (
              'Save Changes'
            ) : (
              'Publish Project'
            )}
          </button>
        </>
      }
    >
      <form id={`${id}-form`} onSubmit={handleSubmit} className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {errorMsg}
          </div>
        )}

        {/* Title */}
        <div>
          <label htmlFor={`${id}-title`} className="block text-xs font-bold text-slate-700 mb-1">
            Project Title <span className="text-rose-500">*</span>
          </label>
          <input
            id={`${id}-title`}
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Autonomous Campus Drone Delivery System"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor={`${id}-description`} className="block text-xs font-bold text-slate-700 mb-1">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            id={`${id}-description`}
            required
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide context, problem statement, key deliverables, and target outcome..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400 resize-none"
          />
        </div>

        {/* Tech Stack & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${id}-tech-stack`} className="block text-xs font-bold text-slate-700 mb-1">
              Tech Stack <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Code2 className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id={`${id}-tech-stack`}
                type="text"
                required
                value={techStack}
                onChange={(e) => setTechStack(e.target.value)}
                placeholder="React, Spring Boot, PostgreSQL"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Comma-separated tools and technologies</p>
          </div>

          <div>
            <label htmlFor={`${id}-tags`} className="block text-xs font-bold text-slate-700 mb-1">
              Domain Tags
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id={`${id}-tags`}
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="AI, Web, Robotics, FinTech"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Keywords separated by commas</p>
          </div>
        </div>

        {/* URLs: Repo & Live */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor={`${id}-repo-url`} className="block text-xs font-bold text-slate-700 mb-1">
              Repository URL
            </label>
            <div className="relative">
              <Github className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id={`${id}-repo-url`}
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/org/repo"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${id}-live-url`} className="block text-xs font-bold text-slate-700 mb-1">
              Live Demo / Preview URL
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id={`${id}-live-url`}
                type="url"
                value={liveUrl}
                onChange={(e) => setLiveUrl(e.target.value)}
                placeholder="https://my-project.dev"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* Team Size, Scope (Classroom vs Cross-Dept) & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-1">
          <div>
            <label htmlFor={`${id}-team-size`} className="block text-xs font-bold text-slate-700 mb-1">
              Target Team Size <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Users className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                id={`${id}-team-size`}
                type="number"
                min="1"
                max="20"
                required
                value={teamSize}
                onChange={(e) => setTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-semibold"
              />
            </div>
          </div>

          <div>
            <label htmlFor={`${id}-classroom`} className="block text-xs font-bold text-slate-700 mb-1">
              Classroom Scope
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <select
                id={`${id}-classroom`}
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900"
              >
                <option value="">Cross-Department (Open to All)</option>
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} - {c.section}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isEditing && (
            <div>
              <label htmlFor={`${id}-status`} className="block text-xs font-bold text-slate-700 mb-1">
                Project Status
              </label>
              <div className="relative">
                <Layers className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
                <select
                  id={`${id}-status`}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 font-semibold"
                >
                  <option value="OPEN">OPEN (Recruiting)</option>
                  <option value="IN_PROGRESS">IN_PROGRESS (Working)</option>
                  <option value="COMPLETED">COMPLETED (Delivered)</option>
                  <option value="CLOSED">CLOSED (Archived)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </form>
    </Modal>
  );
};
