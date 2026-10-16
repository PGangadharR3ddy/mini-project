import React, { FormEvent, useEffect, useState } from 'react';
import { Project, ProjectStatus, Classroom } from '../types';
import { Modal } from './Modal';
import { ProjectPayload, ProjectUpdatePayload } from '../api/projects';

interface ProjectFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: ProjectPayload | ProjectUpdatePayload) => Promise<void>;
  project?: Project | null;
  classrooms: Classroom[];
  userClassroomId: number;
}

export const ProjectFormModal: React.FC<ProjectFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  project,
  classrooms,
  userClassroomId,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [techStack, setTechStack] = useState('');
  const [tags, setTags] = useState('');
  const [repoUrl, setRepoUrl] = useState('');
  const [liveUrl, setLiveUrl] = useState('');
  const [teamSize, setTeamSize] = useState(4);
  const [classroomId, setClassroomId] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('OPEN');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTitle(project?.title ?? '');
    setDescription(project?.description ?? '');
    setTechStack(project?.techStack ?? '');
    setTags(project?.tags ?? '');
    setRepoUrl(project?.repoUrl ?? '');
    setLiveUrl(project?.liveUrl ?? '');
    setTeamSize(project?.teamSize ?? 4);
    setClassroomId(project?.classroomId?.toString() ?? (userClassroomId ? String(userClassroomId) : ''));
    setStatus(project?.status ?? 'OPEN');
    setError('');
  }, [isOpen, project, userClassroomId]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !description.trim() || !techStack.trim()) {
      setError('Title, description, and technology stack are required.');
      return;
    }
    if (!Number.isInteger(teamSize) || teamSize < 1 || teamSize > 20) {
      setError('Team size must be between 1 and 20.');
      return;
    }

    const payload: ProjectPayload | ProjectUpdatePayload = {
      title: title.trim(),
      description: description.trim(),
      techStack: techStack.trim(),
      tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean).join(', '),
      repoUrl: repoUrl.trim() || undefined,
      liveUrl: liveUrl.trim() || undefined,
      teamSize,
      ...(!project ? { classroomId: classroomId ? Number(classroomId) : null } : {}),
      ...(project ? { status } : {}),
    };

    setSaving(true);
    setError('');
    try {
      await onSave(payload);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save project.');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = 'w-full border-2 border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-900 outline-none focus:border-stone-900';
  const labelClass = 'mb-1 block text-xs font-bold uppercase text-stone-600';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={project ? 'Edit Project' : 'Post a Project'} subtitle="Project details are saved to the classroom service." maxWidth="xl">
      <form onSubmit={submit} className="space-y-4">
        {error && <p role="alert" className="border-2 border-rose-700 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
        <div>
          <label className={labelClass} htmlFor="project-title">Title</label>
          <input id="project-title" className={fieldClass} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required />
        </div>
        <div>
          <label className={labelClass} htmlFor="project-description">Description</label>
          <textarea id="project-description" className={fieldClass} value={description} onChange={(event) => setDescription(event.target.value)} rows={4} required />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass} htmlFor="project-tech">Technologies</label>
            <input id="project-tech" className={fieldClass} value={techStack} onChange={(event) => setTechStack(event.target.value)} placeholder="React, Spring Boot" required />
          </div>
          <div>
            <label className={labelClass} htmlFor="project-tags">Tags</label>
            <input id="project-tags" className={fieldClass} value={tags} onChange={(event) => setTags(event.target.value)} placeholder="AI, Web, Robotics" />
          </div>
          <div>
            <label className={labelClass} htmlFor="project-repo">Repository URL</label>
            <input id="project-repo" className={fieldClass} type="url" value={repoUrl} onChange={(event) => setRepoUrl(event.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="project-live">Live URL</label>
            <input id="project-live" className={fieldClass} type="url" value={liveUrl} onChange={(event) => setLiveUrl(event.target.value)} />
          </div>
          <div>
            <label className={labelClass} htmlFor="project-team-size">Team size</label>
            <input id="project-team-size" className={fieldClass} type="number" min={1} max={20} value={teamSize} onChange={(event) => setTeamSize(Number(event.target.value))} required />
          </div>
          {!project && <div>
            <label className={labelClass} htmlFor="project-classroom">Classroom scope</label>
            <select id="project-classroom" className={fieldClass} value={classroomId} onChange={(event) => setClassroomId(event.target.value)}>
              <option value="">Open collaboration</option>
              {classrooms.map((classroom) => <option key={classroom.id} value={classroom.id}>{classroom.name} · {classroom.department}</option>)}
            </select>
          </div>}
          {project && (
            <div>
              <label className={labelClass} htmlFor="project-status">Status</label>
              <select id="project-status" className={fieldClass} value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus)}>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t-2 border-stone-200 pt-4">
          <button type="button" onClick={onClose} disabled={saving} className="border-2 border-stone-300 px-4 py-2 text-sm font-bold hover:bg-stone-100">Cancel</button>
          <button type="submit" disabled={saving} className="border-2 border-stone-900 bg-stone-900 px-5 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60">
            {saving ? 'Saving…' : project ? 'Save changes' : 'Publish project'}
          </button>
        </div>
      </form>
    </Modal>
  );
};