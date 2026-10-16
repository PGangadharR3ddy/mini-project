import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, Github, Globe, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import {
  deleteProject,
  getProjectById,
  getProjectRequests,
  ProjectUpdatePayload,
  respondToProjectRequest,
  sendProjectJoinRequest,
  updateProject,
} from '../api/projects';
import { getClassrooms } from '../api/classrooms';
import { Classroom, Project, ProjectJoinRequest } from '../types';
import { Badge } from '../components/Badge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { EmptyState, Spinner } from '../components/Loader';
import { Modal } from '../components/Modal';
import { ProjectFormModal } from '../components/ProjectFormModal';

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : 'Project request failed.';
}

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = Number(id);
  const navigate = useNavigate();
  const { user, classroomId } = useAuth();
  const userId = user && Number.isFinite(Number(user.sub)) ? Number(user.sub) : null;
  const [project, setProject] = useState<Project | null>(null);
  const [requests, setRequests] = useState<ProjectJoinRequest[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [savingJoin, setSavingJoin] = useState(false);
  const [busyRequest, setBusyRequest] = useState<number | null>(null);

  const loadProject = async () => {
    if (!Number.isSafeInteger(projectId) || projectId < 1) {
      setProject(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const current = await getProjectById(projectId);
      setProject(current);
      const isOwnerOrAdmin = userId !== null && (current.postedBy === userId || user?.role === 'ADMIN');
      if (isOwnerOrAdmin) {
        const [projectRequests, classroomList] = await Promise.all([
          getProjectRequests(projectId),
          getClassrooms(),
        ]);
        setRequests(projectRequests);
        setClassrooms(classroomList);
      } else {
        setRequests([]);
      }
    } catch (error) {
      setProject(null);
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProject();
  }, [projectId, userId, user?.role]);

  const handleUpdate = async (payload: ProjectUpdatePayload) => {
    const updated = await updateProject(projectId, payload);
    setProject(updated);
    toast.success('Project updated.');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteProject(projectId);
      toast.success('Project deleted.');
      navigate('/projects', { replace: true });
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const handleJoin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!joinMessage.trim()) return;
    setSavingJoin(true);
    try {
      await sendProjectJoinRequest(projectId, joinMessage.trim());
      toast.success('Join request sent.');
      setJoining(false);
      setJoinMessage('');
      await loadProject();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSavingJoin(false);
    }
  };

  const handleRequestDecision = async (requestId: number, accept: boolean) => {
    setBusyRequest(requestId);
    try {
      await respondToProjectRequest(requestId, accept);
      toast.success(accept ? 'Request accepted.' : 'Request declined.');
      await loadProject();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setBusyRequest(null);
    }
  };

  if (loading) return <Spinner label="Loading project details…" />;
  if (!project) return <EmptyState title="Project not found" description="It may have been removed, or the project ID is invalid." actionText="Back to projects" onAction={() => navigate('/projects')} />;

  const isOwner = userId !== null && project.postedBy === userId;
  const canManage = isOwner || user?.role === 'ADMIN';
  const teamIsFull = project.memberCount >= project.teamSize;
  const tags = project.tags?.split(',').map((tag) => tag.trim()).filter(Boolean) ?? [];
  const technologies = project.techStack.split(',').map((tech) => tech.trim()).filter(Boolean);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link to="/projects" className="inline-flex items-center gap-2 text-sm font-bold text-stone-700 hover:text-stone-950"><ArrowLeft className="h-4 w-4" /> All projects</Link>
        {canManage && <div className="flex gap-2">
          <button onClick={() => setEditing(true)} className="border-2 border-stone-900 bg-white px-3 py-2 text-sm font-bold hover:bg-stone-100">Edit project</button>
          <button onClick={() => setConfirmDelete(true)} className="border-2 border-rose-800 px-3 py-2 text-sm font-bold text-rose-800 hover:bg-rose-50">Delete</button>
        </div>}
      </div>

      <section className="border-2 border-stone-900 bg-white shadow-[5px_5px_0_0_#1b1c19]">
        <div className="flex flex-col gap-5 border-b-2 border-stone-900 bg-[#f1efe6] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-8">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge type={project.status} size="md" />
              <span className="text-xs font-bold uppercase text-stone-600">{project.classroomName || 'Open collaboration'}</span>
              <span className="text-xs text-stone-500">Posted {new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
            <h1 className="mt-4 font-serif text-3xl font-semibold leading-tight text-stone-950 sm:text-4xl">{project.title}</h1>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">{project.description}</p>
          </div>
          {!canManage && !project.isMember && (
            project.hasRequested ? <span className="shrink-0 border-2 border-amber-600 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-900">Request pending</span>
              : project.status === 'OPEN' && !teamIsFull ? <button onClick={() => setJoining(true)} className="shrink-0 border-2 border-stone-900 bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">Request to join</button>
                : <span className="shrink-0 text-sm font-bold text-stone-500">{teamIsFull ? 'Team full' : 'Not recruiting'}</span>
          )}
          {project.isMember && !canManage && <span className="shrink-0 border-2 border-emerald-800 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-900">Team member</span>}
        </div>

        <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500">Technology</h2>
              <div className="mt-2 flex flex-wrap gap-2">{technologies.length ? technologies.map((technology) => <span key={technology} className="border border-stone-300 bg-stone-50 px-3 py-1.5 text-sm font-medium">{technology}</span>) : <span className="text-sm text-stone-500">Not specified</span>}</div>
              {tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{tags.map((tag) => <span key={tag} className="text-xs font-bold text-emerald-900">#{tag}</span>)}</div>}
            </div>
            <div className="grid gap-5 border-t-2 border-stone-200 pt-5 sm:grid-cols-2">
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500">Team</h2>
                <p className="mt-2 flex items-center gap-2 text-sm font-bold"><Users className="h-4 w-4" /> {project.memberCount} of {project.teamSize} members</p>
                <div className="mt-3 divide-y divide-stone-200">
                  {project.members?.length ? project.members.map((member) => (
                    <div key={member.studentId} className="flex justify-between gap-3 py-2 text-sm">
                      <div><p className="font-bold">{member.studentName}{member.studentId === project.postedBy ? ' · Lead' : ''}</p><p className="text-xs text-stone-500">{member.studentDepartment}</p></div>
                      <span className="text-xs text-stone-500">{new Date(member.joinedAt).toLocaleDateString()}</span>
                    </div>
                  )) : <p className="py-2 text-sm text-stone-500">No student members yet.</p>}
                </div>
              </div>
              <div>
                <h2 className="text-xs font-bold uppercase tracking-wide text-stone-500">Project lead</h2>
                <p className="mt-2 text-lg font-semibold">{project.postedByName}</p>
                <p className="text-sm text-stone-600">{project.postedByRole} · {project.department}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {project.repoUrl && <a href={project.repoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-2 border-stone-900 px-3 py-2 text-sm font-bold hover:bg-stone-100"><Github className="h-4 w-4" />Repository<ExternalLink className="h-3 w-3" /></a>}
                  {project.liveUrl && <a href={project.liveUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 border-2 border-stone-300 px-3 py-2 text-sm font-bold hover:bg-stone-100"><Globe className="h-4 w-4" />Live site<ExternalLink className="h-3 w-3" /></a>}
                  {!project.repoUrl && !project.liveUrl && <p className="text-sm text-stone-500">No external links provided.</p>}
                </div>
              </div>
            </div>
          </div>
          <aside className="border-t-2 border-stone-200 pt-5 lg:border-l-2 lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-xs font-bold uppercase tracking-wide text-stone-500">Project record</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div><dt className="text-xs text-stone-500">Department</dt><dd className="font-bold">{project.department}</dd></div>
              <div><dt className="text-xs text-stone-500">Classroom</dt><dd className="font-bold">{project.classroomName || 'Open collaboration'}</dd></div>
              <div><dt className="text-xs text-stone-500">Project ID</dt><dd className="font-mono">{project.id}</dd></div>
              <div><dt className="text-xs text-stone-500">Last updated</dt><dd className="font-bold">{new Date(project.updatedAt).toLocaleDateString()}</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      {canManage && <section className="border-2 border-stone-900 bg-white">
        <div className="flex items-center justify-between border-b-2 border-stone-900 p-4 sm:p-5">
          <div><h2 className="font-serif text-xl font-semibold">Join requests</h2><p className="text-xs text-stone-500">Review requests for this project.</p></div>
          <span className="text-sm font-bold">{requests.filter((request) => request.status === 'PENDING').length} pending</span>
        </div>
        {requests.length ? <div className="divide-y-2 divide-stone-200">
          {requests.map((request) => <div key={request.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{request.requestedByName}</p><Badge type={request.status} /></div><p className="text-xs text-stone-500">{request.requestedByDepartment} · {new Date(request.requestedAt).toLocaleString()}</p><p className="mt-2 text-sm text-stone-700">{request.message}</p></div>
            {request.status === 'PENDING' && <div className="flex shrink-0 gap-2"><button disabled={busyRequest === request.id || teamIsFull} onClick={() => void handleRequestDecision(request.id, true)} className="border-2 border-emerald-800 bg-emerald-800 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">Accept</button><button disabled={busyRequest === request.id} onClick={() => void handleRequestDecision(request.id, false)} className="border-2 border-stone-300 px-3 py-2 text-xs font-bold disabled:opacity-40">Decline</button></div>}
          </div>)}
        </div> : <p className="p-5 text-sm text-stone-500">No join requests yet.</p>}
      </section>}

      <ProjectFormModal isOpen={editing} onClose={() => setEditing(false)} onSave={handleUpdate} project={project} classrooms={classrooms} userClassroomId={classroomId} />
      <ConfirmDialog isOpen={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => void handleDelete()} title="Delete project" message="This permanently removes the project and its join requests." isLoading={deleting} />
      <Modal isOpen={joining} onClose={() => setJoining(false)} title="Request to join" subtitle={project.title} maxWidth="md">
        <form onSubmit={handleJoin} className="space-y-4"><label htmlFor="detail-join-message" className="block text-xs font-bold uppercase text-stone-600">Message to the project lead</label><textarea id="detail-join-message" rows={5} required value={joinMessage} onChange={(event) => setJoinMessage(event.target.value)} className="w-full border-2 border-stone-300 p-3 text-sm outline-none focus:border-stone-900" placeholder="Share your interest, skills, and how you could contribute." /><div className="flex justify-end gap-3 border-t-2 border-stone-200 pt-4"><button type="button" onClick={() => setJoining(false)} className="border-2 border-stone-300 px-4 py-2 text-sm font-bold">Cancel</button><button disabled={savingJoin} className="border-2 border-stone-900 bg-stone-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{savingJoin ? 'Sending…' : 'Send request'}</button></div></form>
      </Modal>
    </div>
  );
};