import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getAllProjects,
  createProject,
  sendJoinRequest,
  getMyJoinRequests,
  CreateProjectPayload,
} from '../api/projects';
import { getClassrooms } from '../api/classrooms';
import { Project, JoinRequest, Classroom, ProjectStatus } from '../types';
import { ProjectCard } from '../components/projects/ProjectCard';
import { ProjectModal } from '../components/projects/ProjectModal';
import { JoinRequestModal } from '../components/projects/JoinRequestModal';
import { ProjectDashboardWidget } from '../components/projects/ProjectDashboardWidget';
import { EmptyState } from '../components/common/EmptyState';
import { CardSkeleton } from '../components/common/Skeleton';
import { Badge } from '../components/common/Badge';
import { formatRelativeTime } from '../utils/formatters';
import {
  FolderGit2,
  Plus,
  Search,
  Filter,
  Users,
  Compass,
  Briefcase,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  Building2,
  School,
  ExternalLink,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

type ActiveTab = 'DISCOVER' | 'MY_PROJECTS' | 'JOINED' | 'MY_REQUESTS';
type ScopeFilter = 'ALL' | 'CLASSROOM' | 'DEPARTMENT';

export const ProjectsPage: React.FC = () => {
  const { user, classroomId, classroomName, department } = useAuth();
  const { success, error: showError } = useToast();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState<ActiveTab>('DISCOVER');
  const [projects, setProjects] = useState<Project[]>([]);
  const [myRequests, setMyRequests] = useState<JoinRequest[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || searchParams.get('search') || '');

  useEffect(() => {
    const q = searchParams.get('q') || searchParams.get('search');
    if (q !== null) {
      setSearchQuery(q);
    }
  }, [searchParams]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projectForJoinRequest, setProjectForJoinRequest] = useState<Project | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allProjectsData, requestsData, classroomsData] = await Promise.all([
        getAllProjects(),
        user?.userId ? getMyJoinRequests(user.userId) : Promise.resolve([]),
        getClassrooms(),
      ]);

      setProjects(allProjectsData);
      setMyRequests(requestsData);
      setClassrooms(classroomsData);
    } catch (err: any) {
      showError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [user?.userId, showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Project Creation
  const handleCreateProject = async (payload: CreateProjectPayload) => {
    if (!user) return;
    try {
      const newPrj = await createProject(payload, {
        userId: user.userId,
        name: user.name,
        role: user.role,
        department: user.department,
        classroomName: user.classroomName,
      });
      setProjects((prev) => [newPrj, ...prev]);
      success('Project published successfully! Collaborators can now request to join.');
    } catch (err: any) {
      showError(err.message || 'Could not post project');
      throw err;
    }
  };

  // Handle Send Join Request
  const handleSendJoinRequest = async (message: string) => {
    if (!projectForJoinRequest || !user) return;
    try {
      const req = await sendJoinRequest(
        projectForJoinRequest.id,
        message,
        {
          userId: user.userId,
          name: user.name,
          role: user.role,
          department: user.department,
        },
        projectForJoinRequest.title
      );
      setMyRequests((prev) => [req, ...prev]);
      success('Join request sent to project lead!');
    } catch (err: any) {
      showError(err.message || 'Failed to send request');
      throw err;
    }
  };

  // IDs of projects the user has requested to join
  const userRequestedProjectIds = useMemo(() => {
    return new Set(myRequests.map((r) => r.projectId));
  }, [myRequests]);

  // Tab Filtering
  const displayedProjects = useMemo(() => {
    if (!user) return [];

    let list: Project[] = [];

    if (activeTab === 'DISCOVER') {
      list = [...projects];
    } else if (activeTab === 'MY_PROJECTS') {
      list = projects.filter((p) => p.postedById === user.userId);
    } else if (activeTab === 'JOINED') {
      list = projects.filter(
        (p) =>
          p.postedById !== user.userId &&
          (p.members || []).some((m) => m.userId === user.userId)
      );
    } else {
      return []; // MY_REQUESTS handled separately
    }

    // Scope filter (only applies to DISCOVER or general lists)
    if (scopeFilter === 'CLASSROOM' && classroomId) {
      list = list.filter((p) => p.classroomId === classroomId);
    } else if (scopeFilter === 'DEPARTMENT' && department) {
      list = list.filter(
        (p) => p.department.trim().toLowerCase() === department.trim().toLowerCase()
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter((p) => p.status === statusFilter);
    }

    // Search query: searches title, tags, techStack
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => {
        const titleMatch = p.title.toLowerCase().includes(q);
        const descMatch = p.description.toLowerCase().includes(q);
        const techMatch = p.techStack.toLowerCase().includes(q);
        const tagMatch = (p.tags || []).some((t) => t.toLowerCase().includes(q));
        const authorMatch = p.postedByName.toLowerCase().includes(q);
        return titleMatch || descMatch || techMatch || tagMatch || authorMatch;
      });
    }

    return list;
  }, [
    projects,
    activeTab,
    user,
    scopeFilter,
    classroomId,
    department,
    statusFilter,
    searchQuery,
  ]);

  return (
    <div id="projects-page" className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              Collab Hub & Projects
            </h1>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Form cross-disciplinary project teams, discover engineering initiatives, and build together
          </p>
        </div>

        <button
          type="button"
          id="post-project-btn"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Post a Project
        </button>
      </div>

      {/* Visual Analytics Dashboard Widget (Recharts) */}
      <ProjectDashboardWidget projects={projects} />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-px">
        <button
          type="button"
          id="tab-discover"
          onClick={() => setActiveTab('DISCOVER')}
          className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'DISCOVER'
              ? 'border-indigo-600 text-indigo-600 bg-white/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          Discover Projects
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {projects.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-my-projects"
          onClick={() => setActiveTab('MY_PROJECTS')}
          className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'MY_PROJECTS'
              ? 'border-indigo-600 text-indigo-600 bg-white/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          My Projects
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {projects.filter((p) => p.postedById === user?.userId).length}
          </span>
        </button>

        <button
          type="button"
          id="tab-joined"
          onClick={() => setActiveTab('JOINED')}
          className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'JOINED'
              ? 'border-indigo-600 text-indigo-600 bg-white/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Joined Teams
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {
              projects.filter(
                (p) =>
                  p.postedById !== user?.userId &&
                  (p.members || []).some((m) => m.userId === user?.userId)
              ).length
            }
          </span>
        </button>

        <button
          type="button"
          id="tab-my-requests"
          onClick={() => setActiveTab('MY_REQUESTS')}
          className={`px-4 py-2.5 text-xs md:text-sm font-bold border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
            activeTab === 'MY_REQUESTS'
              ? 'border-indigo-600 text-indigo-600 bg-white/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          My Requests
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium">
            {myRequests.length}
          </span>
        </button>
      </div>

      {/* Filter and Search Bar (Visible for project grids) */}
      {activeTab !== 'MY_REQUESTS' && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              id="projects-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, technology (e.g. React), tags, or lead..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Scope Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="scope-filter"
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value as ScopeFilter)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                <option value="DEPARTMENT">My Department ({department?.split(' ')[0] || 'Dept'})</option>
                {classroomId && <option value="CLASSROOM">My Class ({classroomName || 'Class'})</option>}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open (Recruiting)</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : activeTab === 'MY_REQUESTS' ? (
        /* My Sent Join Requests Table / List */
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Submitted Collaboration Requests ({myRequests.length})
            </h3>
            <p className="text-xs text-slate-400">
              Track the status of your join proposals
            </p>
          </div>

          {myRequests.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                title="No Join Requests Sent"
                description="You haven't requested to join any project teams yet. Discover open projects and submit a proposal."
                actionLabel="Browse Open Projects"
                onAction={() => setActiveTab('DISCOVER')}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {myRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/projects/${req.projectId}`}
                        className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition-colors"
                      >
                        {req.projectTitle}
                      </Link>
                      <Badge variant="request" requestStatus={req.status} size="sm" />
                    </div>
                    <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                      "{req.message}"
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Submitted {formatRelativeTime(req.createdAt)}
                    </p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <Link
                      to={`/projects/${req.projectId}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors"
                    >
                      View Project
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-12 text-center">
          <EmptyState
            title={
              activeTab === 'MY_PROJECTS'
                ? "You Haven't Posted Any Projects"
                : activeTab === 'JOINED'
                ? 'No Joined Teams Yet'
                : 'No Projects Matching Filters'
            }
            description={
              activeTab === 'MY_PROJECTS'
                ? 'Start an engineering venture, hackathon entry, or capstone study project and invite teammates.'
                : activeTab === 'JOINED'
                ? 'Explore projects in the Discover tab and submit requests to collaborate.'
                : 'Try adjusting your search criteria, scope filter, or status dropdown.'
            }
            actionLabel={activeTab === 'MY_PROJECTS' ? 'Post Your First Project' : undefined}
            onAction={activeTab === 'MY_PROJECTS' ? () => setIsCreateModalOpen(true) : undefined}
          />
        </div>
      ) : (
        /* Grid of Projects */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              currentUserId={user?.userId}
              onRequestJoin={(p) => setProjectForJoinRequest(p)}
              hasRequested={userRequestedProjectIds.has(project.id)}
            />
          ))}
        </div>
      )}

      {/* Post Project Modal */}
      <ProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateProject}
        classrooms={classrooms}
        userClassroomId={classroomId}
      />

      {/* Request to Join Modal */}
      {projectForJoinRequest && (
        <JoinRequestModal
          isOpen={!!projectForJoinRequest}
          onClose={() => setProjectForJoinRequest(null)}
          projectTitle={projectForJoinRequest.title}
          onSubmit={handleSendJoinRequest}
        />
      )}
    </div>
  );
};
