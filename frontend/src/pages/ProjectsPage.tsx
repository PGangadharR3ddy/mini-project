import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FolderKanban, Plus, Search, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import { getClassrooms } from '../api/classrooms';
import {
  createProject,
  getJoinedProjects,
  getMyProjectRequests,
  getMyProjects,
  getProjects,
  ProjectPayload,
  sendProjectJoinRequest,
} from '../api/projects';
import { Classroom, Project, ProjectJoinRequest, ProjectStatus } from '../types';
import { Badge } from '../components/Badge';
import { EmptyState, Spinner } from '../components/Loader';
import { Modal } from '../components/Modal';
import { ProjectCard } from '../components/ProjectCard';
import { ProjectFormModal } from '../components/ProjectFormModal';

type ProjectTab = 'DISCOVER' | 'MINE' | 'JOINED' | 'REQUESTS';

function errorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }
  return error instanceof Error ? error.message : 'Project request failed.';
}

export const ProjectsPage: React.FC = () => {
  const { user, classroomId } = useAuth();
  const [searchParams] = useSearchParams();
  const userId = user && Number.isFinite(Number(user.sub)) ? Number(user.sub) : null;
  const [activeTab, setActiveTab] = useState<ProjectTab>('DISCOVER');
  const [projects, setProjects] = useState<Project[]>([]);
  const [mine, setMine] = useState<Project[]>([]);
  const [joined, setJoined] = useState<Project[]>([]);
  const [requests, setRequests] = useState<ProjectJoinRequest[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('q') ?? '');
  const [status, setStatus] = useState<ProjectStatus | 'ALL'>('ALL');
  const [scope, setScope] = useState<'ALL' | 'CLASSROOM' | 'DEPARTMENT'>('ALL');
  const [editing, setEditing] = useState(false);
  const [joining, setJoining] = useState<Project | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [submittingJoin, setSubmittingJoin] = useState(false);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const [allProjects, myProjects, joinedProjects, myRequests, classroomList] = await Promise.all([
        getProjects(),
        getMyProjects(),
        getJoinedProjects(),
        getMyProjectRequests(),
        getClassrooms(),
      ]);
      setProjects(allProjects);
      setMine(myProjects);
      setJoined(joinedProjects);
      setRequests(myRequests);
      setClassrooms(classroomList);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const visibleProjects = useMemo(() => {
    const base = activeTab === 'MINE' ? mine : activeTab === 'JOINED' ? joined : projects;
    const query = search.trim().toLowerCase();
    return base.filter((project) => {
      if (status !== 'ALL' && project.status !== status) return false;
      if (scope === 'CLASSROOM' && project.classroomId !== classroomId) return false;
      if (scope === 'DEPARTMENT' && project.department.toLowerCase() !== user?.department.toLowerCase()) return false;
      if (!query) return true;
      return [project.title, project.description, project.techStack, project.tags ?? '', project.postedByName]
        .some((value) => value.toLowerCase().includes(query));
    });
  }, [activeTab, mine, joined, projects, search, status, scope, classroomId, user?.department]);

  const handleCreate = async (payload: ProjectPayload) => {
    await createProject(payload);
    toast.success('Project published.');
    await loadProjects();
  };

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    if (!joining || !joinMessage.trim()) return;
    setSubmittingJoin(true);
    try {
      await sendProjectJoinRequest(joining.id, joinMessage.trim());
      toast.success('Join request sent.');
      setJoining(null);
      setJoinMessage('');
      await loadProjects();
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setSubmittingJoin(false);
    }
  };

  const tabs: { id: ProjectTab; label: string; count: number }[] = [
    { id: 'DISCOVER', label: 'Discover', count: projects.length },
    { id: 'MINE', label: 'My projects', count: mine.length },
    { id: 'JOINED', label: 'Joined teams', count: joined.length },
    { id: 'REQUESTS', label: 'My requests', count: requests.length },
  ];

  return (
    <div className="space-y-6 pb-12">
      <header className="flex flex-col justify-between gap-4 border-2 border-stone-900 bg-[#f1efe6] p-5 sm:flex-row sm:items-center sm:p-7 shadow-[4px_4px_0_0_#1b1c19]">
        <div className="flex items-start gap-3">
          <FolderKanban className="mt-1 h-6 w-6 shrink-0 text-emerald-800" />
          <div>
            <p className="text-[11px] font-bold uppercase text-emerald-900">Student collaboration</p>
            <h1 className="font-serif text-3xl font-semibold text-stone-900">Projects</h1>
            <p className="mt-1 text-sm text-stone-600">Find a team, share an idea, or keep track of your work.</p>
          </div>
        </div>
        <button onClick={() => setEditing(true)} className="inline-flex items-center justify-center gap-2 border-2 border-stone-900 bg-stone-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-800">
          <Plus className="h-4 w-4" /> Post a project
        </button>
      </header>

      <nav className="flex overflow-x-auto border-b-2 border-stone-900" aria-label="Project views">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`shrink-0 border-b-4 px-4 py-3 text-sm font-bold ${activeTab === tab.id ? 'border-emerald-700 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-900'}`}>
            {tab.label} <span className="ml-1 text-xs font-medium">{tab.count}</span>
          </button>
        ))}
      </nav>

      {activeTab !== 'REQUESTS' && (
        <div className="grid gap-3 border-2 border-stone-300 bg-white p-3 sm:grid-cols-[1fr_auto_auto] sm:items-center">
          <label className="relative block">
            <Search className="absolute left-3 top-3 h-4 w-4 text-stone-500" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search projects, technologies, or leads" className="w-full border-2 border-stone-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-stone-900" />
          </label>
          <select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)} className="border-2 border-stone-200 bg-white px-3 py-2.5 text-sm font-medium">
            <option value="ALL">All scopes</option>
            <option value="CLASSROOM">My classroom</option>
            <option value="DEPARTMENT">My department</option>
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value as ProjectStatus | 'ALL')} className="border-2 border-stone-200 bg-white px-3 py-2.5 text-sm font-medium">
            <option value="ALL">All statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      )}

      {loading ? <Spinner label="Loading projects…" /> : activeTab === 'REQUESTS' ? (
        requests.length ? (
          <div className="divide-y-2 divide-stone-200 border-2 border-stone-900 bg-white">
            {requests.map((request) => (
              <div key={request.id} className="flex flex-col justify-between gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link className="font-bold text-stone-900 underline" to={`/projects/${request.projectId}`}>{request.projectTitle}</Link>
                    <Badge type={request.status} />
                  </div>
                  <p className="mt-2 text-sm text-stone-600">{request.message}</p>
                  <p className="mt-1 text-xs text-stone-500">Sent {new Date(request.requestedAt).toLocaleString()}</p>
                </div>
                <Link to={`/projects/${request.projectId}`} className="shrink-0 text-sm font-bold underline">View project</Link>
              </div>
            ))}
          </div>
        ) : <EmptyState title="No requests yet" description="Requests you send to project leads will appear here." />
      ) : visibleProjects.length ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visibleProjects.map((project) => <ProjectCard key={project.id} project={project} currentUserId={userId} onRequestJoin={setJoining} />)}
        </div>
      ) : <EmptyState title="No matching projects" description="Try another search or filter, or post a project of your own." actionText="Post a project" onAction={() => setEditing(true)} />}

      <ProjectFormModal isOpen={editing} onClose={() => setEditing(false)} onSave={handleCreate} classrooms={classrooms} userClassroomId={classroomId} />

      <Modal isOpen={!!joining} onClose={() => setJoining(null)} title="Request to join" subtitle={joining?.title} maxWidth="md">
        <form onSubmit={handleJoin} className="space-y-4">
          <label htmlFor="join-message" className="block text-xs font-bold uppercase text-stone-600">Message to the project lead</label>
          <textarea id="join-message" rows={5} required value={joinMessage} onChange={(event) => setJoinMessage(event.target.value)} className="w-full border-2 border-stone-300 p-3 text-sm outline-none focus:border-stone-900" placeholder="Share your interest, skills, and how you could contribute." />
          <div className="flex justify-end gap-3 border-t-2 border-stone-200 pt-4">
            <button type="button" onClick={() => setJoining(null)} className="border-2 border-stone-300 px-4 py-2 text-sm font-bold">Cancel</button>
            <button disabled={submittingJoin} className="inline-flex items-center gap-2 border-2 border-stone-900 bg-stone-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"><Send className="h-4 w-4" />{submittingJoin ? 'Sending…' : 'Send request'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};