import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import {
  getProjectById,
  updateProject,
  deleteProject,
  getProjectJoinRequests,
  acceptJoinRequest,
  rejectJoinRequest,
  sendJoinRequest,
  UpdateProjectPayload,
} from '../api/projects';
import { getClassrooms } from '../api/classrooms';
import { Project, JoinRequest, Classroom, ProjectMember } from '../types';
import { ProjectModal } from '../components/projects/ProjectModal';
import { JoinRequestModal } from '../components/projects/JoinRequestModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Badge } from '../components/common/Badge';
import { CardSkeleton } from '../components/common/Skeleton';
import { formatRelativeTime } from '../utils/formatters';
import {
  FolderGit2,
  Users,
  Code2,
  Globe,
  Github,
  Calendar,
  Building2,
  Settings,
  Trash2,
  UserPlus,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Share2,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isFaculty, isAdmin, classroomId } = useAuth();
  const { success, error: showError } = useToast();

  const [project, setProject] = useState<Project | null>(null);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);

  // Actions
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionInProgressId, setActionInProgressId] = useState<string | null>(null);

  const loadProject = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getProjectById(id);
      setProject(data);

      // If user is owner or admin, load pending join requests
      if (user && (data.postedById === user.userId || user.role === 'ADMIN')) {
        const reqs = await getProjectJoinRequests(id);
        setRequests(reqs);
      }

      const clss = await getClassrooms();
      setClassrooms(clss);
    } catch (err: any) {
      showError(err.message || 'Project not found');
    } finally {
      setLoading(false);
    }
  }, [id, user, showError]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/projects')}
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-semibold text-slate-400">Loading collaboration details...</span>
        </div>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
          <FolderGit2 className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Project Not Found</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          The requested project might have been completed or removed by its lead.
        </p>
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Projects
        </Link>
      </div>
    );
  }

  const isOwner = user && project.postedById === user.userId;
  const canManage = isOwner || (user && user.role === 'ADMIN');
  const isMember = user && (project.members || []).some((m) => m.userId === user.userId);
  const currentMembersCount = project.members?.length || 1;
  const maxCapacity = project.teamSize || 1;
  const isFull = currentMembersCount >= maxCapacity;
  const capacityPercent = Math.min(100, Math.round((currentMembersCount / maxCapacity) * 100));

  // Find if user already has a pending request
  const userRequest = requests.find((r) => r.userId === user?.userId);

  // Handle Edit
  const handleEditProject = async (payload: UpdateProjectPayload) => {
    try {
      const updated = await updateProject(project.id, payload);
      setProject(updated);
      success('Project updated successfully');
    } catch (err: any) {
      showError(err.message || 'Failed to update project');
      throw err;
    }
  };

  // Handle Delete
  const handleDeleteProject = async () => {
    setIsDeleting(true);
    try {
      await deleteProject(project.id);
      success('Project deleted');
      navigate('/projects');
    } catch (err: any) {
      showError(err.message || 'Failed to delete project');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle Send Join Request
  const handleSendJoinRequest = async (message: string) => {
    if (!user) return;
    try {
      const req = await sendJoinRequest(
        project.id,
        message,
        {
          userId: user.userId,
          name: user.name,
          role: user.role,
          department: user.department,
        },
        project.title
      );
      setRequests((prev) => [req, ...prev]);
      success('Your request has been submitted to the project lead!');
    } catch (err: any) {
      showError(err.message || 'Failed to submit request');
      throw err;
    }
  };

  // Accept Request
  const handleAcceptRequest = async (req: JoinRequest) => {
    setActionInProgressId(req.id);
    try {
      const result = await acceptJoinRequest(req.id, project.id);
      success(`Accepted ${req.userName} to the team!`);

      // Refresh project and request state
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'ACCEPTED' } : r))
      );

      // Add to members
      setProject((prev) => {
        if (!prev) return prev;
        const updatedMembers = [...(prev.members || []), result.member];
        const newStatus =
          updatedMembers.length >= prev.teamSize && prev.status === 'OPEN'
            ? 'IN_PROGRESS'
            : prev.status;
        return {
          ...prev,
          members: updatedMembers,
          status: newStatus,
        };
      });
    } catch (err: any) {
      showError(err.message || 'Failed to accept request');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Reject Request
  const handleRejectRequest = async (req: JoinRequest) => {
    setActionInProgressId(req.id);
    try {
      await rejectJoinRequest(req.id);
      success(`Declined request from ${req.userName}`);
      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: 'REJECTED' } : r))
      );
    } catch (err: any) {
      showError(err.message || 'Failed to decline request');
    } finally {
      setActionInProgressId(null);
    }
  };

  // Tech stack chips
  const techStackList = project.techStack
    ? project.techStack.split(',').map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <div id="project-detail-page" className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Projects
        </Link>

        {canManage && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="edit-project-btn"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors shadow-2xs"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              Edit Project
            </button>
            <button
              type="button"
              id="delete-project-btn"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {/* Main Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs p-6 md:p-8 space-y-6">
        {/* Top Badges & Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="project"
              projectStatus={project.status}
              size="md"
              dot
            />
            {project.classroomName ? (
              <span className="text-xs font-semibold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                {project.classroomName}
              </span>
            ) : (
              <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                Cross-Department Collaboration
              </span>
            )}
            <span className="text-xs text-slate-400 font-medium">
              Posted {formatRelativeTime(project.createdAt)}
            </span>
          </div>

          {/* Action on Header */}
          {!isOwner && !isMember && (
            <div>
              {userRequest?.status === 'PENDING' ? (
                <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold rounded-xl">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Join Request Pending Review
                </div>
              ) : project.status === 'OPEN' && !isFull ? (
                <button
                  type="button"
                  id="detail-request-join-btn"
                  onClick={() => setIsJoinModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-xs transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Request to Join
                </button>
              ) : (
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                  {isFull ? 'Team is Full' : 'Project Not Accepting Members'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            {project.title}
          </h1>
          <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-4xl whitespace-pre-line">
            {project.description}
          </p>
        </div>

        {/* Tech Stack & External Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-indigo-500" />
              Technologies & Frameworks
            </h3>
            <div className="flex flex-wrap gap-2">
              {techStackList.map((tech, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Tags */}
            {project.tags && project.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {project.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium text-indigo-600 bg-indigo-50/80 px-2.5 py-0.5 rounded-md"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Resources & Repositories
            </h3>
            <div className="flex flex-col sm:flex-row gap-3">
              {project.repositoryUrl ? (
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  <Github className="w-4 h-4" />
                  Source Code
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              ) : (
                <span className="text-xs text-slate-400 italic py-2">
                  No public repository provided
                </span>
              )}

              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Live Preview
                  <ExternalLink className="w-3 h-3 opacity-60" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Team Capacity Progress Bar */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              Team Roster Capacity
            </span>
            <span className="font-bold text-slate-900">
              {currentMembersCount} of {maxCapacity} slots filled ({capacityPercent}%)
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80">
            <div
              className={`h-full transition-all duration-500 ${
                isFull ? 'bg-amber-500' : 'bg-indigo-600'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Members & Owner Info | Pending Requests (if owner) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Team Members (2 cols on lg) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Team Members</h3>
                <p className="text-xs text-slate-400">
                  Students and mentors actively collaborating on this initiative
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
                {currentMembersCount} Members
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {project.members && project.members.length > 0 ? (
                project.members.map((member) => {
                  const isLead = member.userId === project.postedById;
                  return (
                    <div
                      key={member.userId}
                      className="py-3.5 flex items-center justify-between gap-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-indigo-700 text-sm">
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {member.name}
                            </span>
                            {isLead && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                                Project Lead
                              </span>
                            )}
                            {member.role && (
                              <Badge variant="role" role={member.role} size="sm" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{member.department}</p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400">
                          Joined {formatRelativeTime(member.joinedAt)}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No member records found
                </div>
              )}
            </div>
          </div>

          {/* Pending Join Requests (Visible only to Project Owner / Admin) */}
          {canManage && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      Collaboration Requests
                    </h3>
                    <p className="text-xs text-slate-400">
                      Review join proposals from peers and assign team slots
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                  {requests.filter((r) => r.status === 'PENDING').length} Pending
                </span>
              </div>

              {requests.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <p className="text-xs font-medium">No join requests received yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    When students request to join, their messages will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {requests.map((req) => (
                    <div
                      key={req.id}
                      className="py-4 space-y-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900">
                              {req.userName}
                            </span>
                            {req.userRole && (
                              <Badge variant="role" role={req.userRole} size="sm" />
                            )}
                            <Badge
                              variant="request"
                              requestStatus={req.status}
                              size="sm"
                            />
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {req.userDepartment} &bull; {formatRelativeTime(req.createdAt)}
                          </p>
                        </div>

                        {/* Action buttons if pending */}
                        {req.status === 'PENDING' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              id={`accept-req-btn-${req.id}`}
                              disabled={actionInProgressId === req.id || isFull}
                              onClick={() => handleAcceptRequest(req)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Accept
                            </button>
                            <button
                              type="button"
                              id={`reject-req-btn-${req.id}`}
                              disabled={actionInProgressId === req.id}
                              onClick={() => handleRejectRequest(req)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              Decline
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Request message bubble */}
                      <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 italic">
                        "{req.message}"
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Lead Contact & Summary Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
              Project Lead Information
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-lg">
                {project.postedByName ? project.postedByName.charAt(0) : 'L'}
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-bold text-slate-900 truncate">
                  {project.postedByName}
                </h4>
                <div className="mt-0.5">
                  <Badge variant="role" role={project.postedByRole} size="sm" />
                </div>
                <p className="text-xs text-slate-400 truncate mt-1">
                  {project.department}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Classroom:</span>
                <span className="font-semibold text-slate-800">
                  {project.classroomName || 'Cross-Department'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Posted on:</span>
                <span className="font-semibold text-slate-800">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Project ID:</span>
                <span className="font-mono text-[11px] text-slate-500">
                  {project.id}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Action Helper */}
          <div className="p-5 bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl text-xs space-y-2">
            <p className="font-bold text-indigo-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              Collaboration Guidelines
            </p>
            <p className="text-indigo-950/70 leading-relaxed">
              When accepted into a team, maintain communication, document tasks in the repository, and adhere to department honor codes for academic submissions.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Project Modal */}
      {isEditModalOpen && (
        <ProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleEditProject}
          project={project}
          classrooms={classrooms}
          userClassroomId={classroomId}
        />
      )}

      {/* Join Request Modal */}
      {isJoinModalOpen && (
        <JoinRequestModal
          isOpen={isJoinModalOpen}
          onClose={() => setIsJoinModalOpen(false)}
          projectTitle={project.title}
          onSubmit={handleSendJoinRequest}
        />
      )}

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteProject}
        title="Delete Project Collaboration"
        message="Are you sure you want to permanently delete this project? All associated team join requests and member lists will be removed."
        confirmLabel="Delete Project"
        isLoading={isDeleting}
      />
    </div>
  );
};
