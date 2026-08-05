import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Profile from './Profile';
import MembersManagement from './MembersManagement';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config/api';
import {
  Layers,
  Briefcase,
  CheckSquare,
  Users,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  MessageSquare,
  X,
  Loader2,
  Search,
  User as UserIcon,
  Sparkles,
  Key
} from 'lucide-react';

export default function Dashboard({ token, onLogout, invitationInfo, onClearInvitation }) {
  const { showSuccess, showError, showInfo } = useToast();

  // Navigation & Core States
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Data Collections
  const [workspaces, setWorkspaces] = useState([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(null);

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);

  const [tasks, setTasks] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [projectMembers, setProjectMembers] = useState([]);

  // Task Filter & Search
  const [taskStatusFilter, setTaskStatusFilter] = useState('ALL');
  const [taskSearch, setTaskSearch] = useState('');

  // Custom Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
  });

  const triggerConfirm = (title, message, action) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        setConfirmConfig((prev) => ({ ...prev, isOpen: false }));
        action();
      },
    });
  };

  // Modals & Drawers States
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [workspaceForm, setWorkspaceForm] = useState({ name: '' });
  const [savingWorkspace, setSavingWorkspace] = useState(false);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [projectForm, setProjectForm] = useState({ title: '', description: '' });
  const [savingProject, setSavingProject] = useState(false);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [savingTask, setSavingTask] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    dueDate: new Date().toISOString().substring(0, 16),
    status: 'TODO',
    userId: '',
  });

  // Comments Drawer State
  const [activeTaskForComments, setActiveTaskForComments] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);

  // Role States for active Workspace and Project
  const [workspaceRole, setWorkspaceRole] = useState(null); // 'OWNER' | 'MEMBER'
  const [projectRole, setProjectRole] = useState(null); // 'PROJECT_MANAGER' | 'DEVELOPER'

  // Helper API Fetcher
  const authFetch = useCallback(async (url, options = {}) => {
    const targetUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
    const res = await fetch(targetUrl, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        showError('Session expired or invalid. Please log in again.');
        onLogout();
        throw new Error('Session expired');
      }

      const errText = await res.text();
      let errMsg = errText;
      try {
        const json = JSON.parse(errText);
        errMsg = json.message || json.error || errText;
      } catch { }

      if (res.status === 403) {
        showError(errMsg || 'Access denied: You do not have permission to perform this action.');
        throw new Error(errMsg || 'Forbidden');
      }

      throw new Error(errMsg || 'API Request failed');
    }

    const text = await res.text();
    try {
      return text ? JSON.parse(text) : null;
    } catch {
      return text;
    }
  }, [token, onLogout, showError]);

  // Initial Load: User Profile & Workspaces & Team
  useEffect(() => {
    loadInitialData();
  }, [token]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const userData = await authFetch('/api/users/me');
      if (!userData || !userData.id) {
        throw new Error('Could not verify active session user profile.');
      }
      setUser(userData);
      setTaskForm((prev) => ({ ...prev, userId: userData.id.toString() }));

      const wsList = await authFetch('/api/workspaces');
      if (Array.isArray(wsList)) {
        setWorkspaces(wsList);
        if (wsList.length > 0) {
          setSelectedWorkspaceId(wsList[0].id);
          fetchWorkspaceRole(wsList[0].id, userData);
        }
      }

      const usersList = await authFetch('/api/users');
      if (Array.isArray(usersList)) {
        setTeamMembers(usersList);
      }
    } catch (err) {
      console.error('Failed initial session load:', err);
      showInfo('Please sign in to access Foreman.');
      onLogout();
    } finally {
      setLoading(false);
    }
  };

  // Load Projects and Workspace Role when Selected Workspace Changes
  useEffect(() => {
    if (selectedWorkspaceId) {
      setProjects([]);
      setSelectedProjectId(null);
      setTasks([]);
      setProjectRole(null);
      fetchProjects(selectedWorkspaceId);
      if (user) {
        fetchWorkspaceRole(selectedWorkspaceId, user);
      }
    } else {
      setProjects([]);
      setSelectedProjectId(null);
      setTasks([]);
      setWorkspaceRole(null);
      setProjectRole(null);
    }
  }, [selectedWorkspaceId, user]);

  const fetchWorkspaceRole = async (wId, currentUser = user) => {
    try {
      const list = await authFetch(`/api/workspaces/${wId}/members`);
      const targetUser = currentUser || user;
      if (Array.isArray(list) && targetUser) {
        const myMem = list.find((m) =>
          (m.id != null && targetUser.id != null && String(m.id) === String(targetUser.id)) ||
          (m.email && targetUser.email && m.email.toLowerCase() === targetUser.email.toLowerCase())
        );
        if (myMem) {
          setWorkspaceRole(myMem.workspaceRole || 'MEMBER');
          return;
        }
      }
      setWorkspaceRole('MEMBER');
    } catch (err) {
      setWorkspaceRole('MEMBER');
    }
  };

  const fetchProjects = async (wId) => {
    try {
      const projList = await authFetch(`/api/workspaces/${wId}/projects`);
      if (Array.isArray(projList)) {
        const filteredList = projList.filter((p) => {
          const pWsId = p.workspaceId || p.workspace?.id;
          return pWsId == null || String(pWsId) === String(wId);
        });
        setProjects(filteredList);
        if (filteredList.length > 0) {
          setSelectedProjectId(filteredList[0].id);
        } else {
          setSelectedProjectId(null);
          setTasks([]);
        }
      } else {
        setProjects([]);
        setSelectedProjectId(null);
        setTasks([]);
      }
    } catch (err) {
      console.error(err);
      setProjects([]);
      setSelectedProjectId(null);
      setTasks([]);
    }
  };

  // Automatic Join Invitation Acceptor
  useEffect(() => {
    if (invitationInfo && user) {
      handleAcceptInvitation(invitationInfo);
    }
  }, [invitationInfo, user]);

  const handleAcceptInvitation = async (info) => {
    try {
      if (info.type === 'workspace') {
        const resMsg = await authFetch(`/api/workspaces/${info.wrkspcId}/members/join?email=${encodeURIComponent(info.email)}`);
        showSuccess(typeof resMsg === 'string' ? resMsg : 'Successfully joined workspace!');
        const wsList = await authFetch('/api/workspaces');
        if (Array.isArray(wsList)) {
          setWorkspaces(wsList);
          if (wsList.length > 0) setSelectedWorkspaceId(info.wrkspcId || wsList[0].id);
        }
      } else if (info.type === 'project') {
        const targetWrkspcId = info.wrkspcId || selectedWorkspaceId || (workspaces.length > 0 ? workspaces[0].id : null);
        if (targetWrkspcId) {
          const resMsg = await authFetch(`/api/workspaces/${targetWrkspcId}/projects/${info.projId}/members/join?email=${encodeURIComponent(info.email)}`);
          showSuccess(typeof resMsg === 'string' ? resMsg : 'Successfully joined project!');
          fetchProjects(targetWrkspcId);
        }
      }
    } catch (err) {
      showError(err.message || 'Failed to accept invitation.');
    } finally {
      if (onClearInvitation) onClearInvitation();
    }
  };

  // Load Tasks, Project Members, and Project Role when Selected Project Changes
  useEffect(() => {
    if (selectedWorkspaceId && selectedProjectId) {
      fetchTasks(selectedWorkspaceId, selectedProjectId);
      fetchProjectMembers(selectedWorkspaceId, selectedProjectId);
      if (user) {
        fetchProjectRole(selectedWorkspaceId, selectedProjectId, user);
      }
    } else {
      setTasks([]);
      setProjectMembers([]);
      setProjectRole(null);
    }
  }, [selectedWorkspaceId, selectedProjectId, user]);

  const fetchProjectMembers = async (wId, pId) => {
    try {
      const list = await authFetch(`/api/workspaces/${wId}/projects/${pId}/members`);
      if (Array.isArray(list)) {
        setProjectMembers(list);
      }
    } catch (err) {
      setProjectMembers([]);
    }
  };

  const fetchProjectRole = async (wId, pId, currentUser = user) => {
    try {
      const list = await authFetch(`/api/workspaces/${wId}/projects/${pId}/members`);
      const targetUser = currentUser || user;
      if (Array.isArray(list)) {
        setProjectMembers(list);
        if (targetUser) {
          const myMem = list.find((m) =>
            (m.id != null && targetUser.id != null && String(m.id) === String(targetUser.id)) ||
            (m.email && targetUser.email && m.email.toLowerCase() === targetUser.email.toLowerCase())
          );
          if (myMem) {
            setProjectRole(myMem.projectRole || 'DEVELOPER');
            return;
          }
        }
      }
      setProjectRole('DEVELOPER');
    } catch (err) {
      setProjectRole('DEVELOPER');
    }
  };

  const fetchTasks = async (wId, pId, searchKeyword = '') => {
    try {
      const endpoint = searchKeyword.trim()
        ? `/api/workspaces/${wId}/projects/${pId}/tasks/search?keyword=${encodeURIComponent(searchKeyword.trim())}`
        : `/api/workspaces/${wId}/projects/${pId}/tasks`;
      const taskList = await authFetch(endpoint);
      if (Array.isArray(taskList)) {
        setTasks(taskList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Role Helper Flags
  const isWorkspaceOwner = workspaceRole === 'OWNER';
  const isProjectManager = isWorkspaceOwner || projectRole === 'PROJECT_MANAGER';
  const isDeveloper = !isWorkspaceOwner && !isProjectManager;

  // WORKSPACE HANDLERS
  const handleOpenCreateWorkspace = () => {
    setEditingWorkspace(null);
    setWorkspaceForm({ name: '' });
    setShowWorkspaceModal(true);
  };

  const handleOpenEditWorkspace = (ws) => {
    setEditingWorkspace(ws);
    setWorkspaceForm({ name: ws.name });
    setShowWorkspaceModal(true);
  };

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (!workspaceForm.name.trim()) return;

    setSavingWorkspace(true);
    try {
      if (editingWorkspace) {
        await authFetch(`/api/workspaces/${editingWorkspace.id}/update`, {
          method: 'PUT',
          body: JSON.stringify(workspaceForm),
        });
        showSuccess(`Workspace updated successfully!`);
      } else {
        await authFetch('/api/workspaces', {
          method: 'POST',
          body: JSON.stringify(workspaceForm),
        });
        showSuccess(`Workspace "${workspaceForm.name}" created!`);
      }

      setShowWorkspaceModal(false);
      const wsList = await authFetch('/api/workspaces');
      setWorkspaces(wsList);
      if (!selectedWorkspaceId && wsList.length > 0) {
        setSelectedWorkspaceId(wsList[0].id);
      }
    } catch (err) {
      showError(err.message || 'Failed to save workspace');
    } finally {
      setSavingWorkspace(false);
    }
  };

  const handleDeleteWorkspace = (wsId) => {
    triggerConfirm(
      'Delete Workspace',
      'Are you sure you want to delete this workspace? All associated projects and tasks will be removed.',
      async () => {
        try {
          await authFetch(`/api/workspaces/${wsId}/delete`, { method: 'DELETE' });
          showSuccess('Workspace deleted successfully');
          const wsList = await authFetch('/api/workspaces');
          setWorkspaces(wsList);
          if (selectedWorkspaceId === wsId) {
            setSelectedWorkspaceId(wsList.length > 0 ? wsList[0].id : null);
          }
        } catch (err) {
          showError(err.message || 'Failed to delete workspace');
        }
      }
    );
  };

  // PROJECT HANDLERS
  const handleOpenCreateProject = () => {
    if (!selectedWorkspaceId) {
      showInfo('Please create or select a workspace first.');
      return;
    }
    setEditingProject(null);
    setProjectForm({ title: '', description: '' });
    setShowProjectModal(true);
  };

  const handleOpenEditProject = (proj) => {
    setEditingProject(proj);
    setProjectForm({ title: proj.title, description: proj.description });
    setShowProjectModal(true);
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!projectForm.title.trim() || !projectForm.description.trim()) return;

    setSavingProject(true);
    try {
      if (editingProject) {
        await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${editingProject.id}/update`, {
          method: 'PUT',
          body: JSON.stringify(projectForm),
        });
        showSuccess('Project updated successfully!');
      } else {
        await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects`, {
          method: 'POST',
          body: JSON.stringify(projectForm),
        });
        showSuccess(`Project "${projectForm.title}" created!`);
      }

      setShowProjectModal(false);
      fetchProjects(selectedWorkspaceId);
    } catch (err) {
      showError(err.message || 'Failed to save project');
    } finally {
      setSavingProject(false);
    }
  };

  const handleDeleteProject = (projId) => {
    triggerConfirm(
      'Delete Project',
      'Are you sure you want to delete this project? All associated tasks will be removed.',
      async () => {
        try {
          await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${projId}/delete`, {
            method: 'DELETE',
          });
          showSuccess('Project deleted successfully');
          fetchProjects(selectedWorkspaceId);
        } catch (err) {
          showError(err.message || 'Failed to delete project');
        }
      }
    );
  };

  // TASK HANDLERS (LIST VIEW - NO KANBAN)
  const handleOpenCreateTask = () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      showInfo('Please select a workspace and a project first.');
      return;
    }
    setEditingTask(null);
    setTaskForm({
      title: '',
      description: '',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 86400000).toISOString().substring(0, 16),
      status: 'TODO',
      userId: user?.id ? user.id.toString() : '1',
    });
    setShowTaskModal(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      priority: task.priority || 'MEDIUM',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().substring(0, 16) : '',
      status: task.status || 'TODO',
      userId: task.userId ? task.userId.toString() : (user?.id ? user.id.toString() : '1'),
    });
    setShowTaskModal(true);
  };

  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!taskForm.title.trim() || !taskForm.description.trim()) return;

    setSavingTask(true);
    try {
      const payload = {
        ...taskForm,
        userId: Number(taskForm.userId),
        dueDate: taskForm.dueDate ? `${taskForm.dueDate}:00` : new Date().toISOString(),
      };

      if (editingTask) {
        await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/tasks/${editingTask.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        showSuccess('Task updated successfully!');
      } else {
        await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/tasks`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        showSuccess(`Task "${taskForm.title}" added!`);
      }

      setShowTaskModal(false);
      await fetchTasks(selectedWorkspaceId, selectedProjectId);
    } catch (err) {
      showError(err.message || 'Failed to save task');
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = (taskId) => {
    triggerConfirm(
      'Delete Task',
      'Are you sure you want to delete this task? All comments on this task will also be deleted.',
      async () => {
        try {
          await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/tasks/${taskId}`, {
            method: 'DELETE',
          });
          showSuccess('Task deleted successfully');
          fetchTasks(selectedWorkspaceId, selectedProjectId);
        } catch (err) {
          showError(err.message || 'Failed to delete task');
        }
      }
    );
  };

  // COMMENTS HANDLERS
  const handleOpenComments = async (task) => {
    setActiveTaskForComments(task);
    setLoadingComments(true);
    try {
      const list = await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/tasks/${task.id}/comments`);
      setComments(Array.isArray(list) ? list : []);
    } catch (err) {
      showError('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim() || !activeTaskForComments) return;

    setPostingComment(true);
    try {
      await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/tasks/${activeTaskForComments.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          message: commentText.trim(),
        }),
      });

      showSuccess('Comment posted!');
      setCommentText('');
      const list = await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/tasks/${activeTaskForComments.id}/comments`);
      setComments(Array.isArray(list) ? list : []);
    } catch (err) {
      showError(err.message || 'Failed to add comment');
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = (commentId) => {
    triggerConfirm(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      async () => {
        try {
          await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/tasks/${activeTaskForComments.id}/comments/${commentId}`, {
            method: 'DELETE',
          });
          showSuccess('Comment deleted');
          const list = await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/tasks/${activeTaskForComments.id}/comments`);
          setComments(Array.isArray(list) ? list : []);
        } catch (err) {
          showError(err.message || 'Failed to delete comment');
        }
      }
    );
  };

  const filteredTasks = tasks.filter((t) => {
    const matchesStatus = taskStatusFilter === 'ALL' || t.status === taskStatusFilter;
    const matchesSearch = t.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
      t.description.toLowerCase().includes(taskSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Overview Dashboard';
      case 'workspaces': return 'Workspaces Directory';
      case 'projects': return 'Projects Directory';
      case 'tasks': return 'Tasks List View';
      case 'members': return 'Member Roles Management';
      case 'team': return 'All Registered Users';
      case 'profile': return 'User Profile & Settings';
      default: return 'Foreman Dashboard';
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#f4f5f7', color: '#5e6c84' }}>
        <Loader2 size={36} className="spinner" style={{ color: '#0052cc', marginBottom: 12 }} />
        <span>Loading Foreman Dashboard...</span>
      </div>
    );
  }

  return (
    <div className="app-layout">
      {/* Vertical Hover-Expanding Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
        workspaceRole={workspaceRole}
        projectRole={projectRole}
        isOwner={isWorkspaceOwner}
        isManager={isProjectManager}
      />

      {/* Main Layout Content Area */}
      <div className="main-wrapper">
        <Navbar
          user={user}
          title={getTabTitle()}
          workspaces={workspaces}
          selectedWorkspaceId={selectedWorkspaceId}
          setSelectedWorkspaceId={setSelectedWorkspaceId}
          onOpenProfile={() => setActiveTab('profile')}
          onLogout={onLogout}
        />

        <main style={{ padding: '24px 32px', flex: 1 }}>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div>
              <div className="card" style={{ marginBottom: 24, padding: 24, backgroundColor: '#ffffff' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="badge badge-done">Active Session</span>
                  <span className={`badge ${isWorkspaceOwner ? 'badge-in-progress' : isProjectManager ? 'badge-done' : 'badge-todo'}`}>
                    Role: {isWorkspaceOwner ? 'OWNER' : isProjectManager ? 'PROJECT_MANAGER' : 'DEVELOPER'}
                  </span>
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                  Welcome back, {user?.firstName} {user?.lastName}! 👋
                </h1>
                <p style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                  Efficiently manage workflows, project lifecycles, team roles, and tasks within a centralized platform.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => setActiveTab('workspaces')}>
                  <div style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: 'var(--badge-blue-bg)', color: 'var(--atlassian-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Layers size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{workspaces.length}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Workspaces</div>
                  </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => setActiveTab('projects')}>
                  <div style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: 'var(--badge-green-bg)', color: 'var(--badge-green-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Briefcase size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>
                      {projects.filter(p => (p.workspaceId || p.workspace?.id) == null || String(p.workspaceId || p.workspace?.id) === String(selectedWorkspaceId)).length}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Active Projects</div>
                  </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => setActiveTab('tasks')}>
                  <div style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: 'var(--badge-yellow-bg)', color: 'var(--badge-yellow-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckSquare size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{tasks.length}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Tasks in Project</div>
                  </div>
                </div>

                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={() => setActiveTab('members')}>
                  <div style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: 'var(--badge-blue-bg)', color: 'var(--atlassian-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Users size={22} />
                  </div>
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>{teamMembers.length}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Registered Users</div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
                <div className="card">
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={18} style={{ color: 'var(--atlassian-blue)' }} />
                    Quick Action Launchers
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <button onClick={handleOpenCreateWorkspace} className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start' }}>
                      <Plus size={16} /> Create Workspace
                    </button>
                    <button onClick={handleOpenCreateProject} className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start' }}>
                      <Plus size={16} /> Create Project
                    </button>
                    <button
                      onClick={handleOpenCreateTask}
                      className="btn btn-secondary btn-block"
                      style={{ justifyContent: 'flex-start', opacity: isDeveloper ? 0.6 : 1 }}
                      disabled={isDeveloper}
                      title={isDeveloper ? "Requires Manager or Owner role" : ""}
                    >
                      <Plus size={16} /> Add Task {isDeveloper ? "(Requires Manager/Owner)" : ""}
                    </button>
                    <button onClick={() => setActiveTab('members')} className="btn btn-secondary btn-block" style={{ justifyContent: 'flex-start' }}>
                      <Users size={16} /> Member Roles Management
                    </button>
                  </div>
                </div>

                <div className="card">
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <UserIcon size={18} style={{ color: 'var(--atlassian-blue)' }} />
                    Account Settings
                  </h3>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
                    Logged in as <strong>{user?.firstName} {user?.lastName}</strong> ({user?.email})
                  </p>
                  <button onClick={() => setActiveTab('profile')} className="btn btn-primary btn-block">
                    <UserIcon size={16} /> Open Profile & Settings
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* WORKSPACES TAB */}
          {activeTab === 'workspaces' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Workspaces Directory</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage workspace environments.</p>
                </div>
                <button onClick={handleOpenCreateWorkspace} className="btn btn-primary">
                  <Plus size={16} /> New Workspace
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {workspaces.map((ws) => {
                  const isSelected = selectedWorkspaceId === ws.id;
                  return (
                    <div
                      key={ws.id}
                      className="card"
                      style={{
                        borderColor: isSelected ? 'var(--atlassian-blue)' : 'var(--border-color)',
                        backgroundColor: isSelected ? 'var(--atlassian-blue-subtle)' : 'var(--bg-surface)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: 'var(--atlassian-blue-subtle)', color: 'var(--atlassian-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Layers size={20} />
                          </div>
                          <div>
                            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{ws.name}</h3>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Workspace #{ws.id}</span>
                          </div>
                        </div>

                        {isWorkspaceOwner && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button onClick={() => handleOpenEditWorkspace(ws)} className="btn btn-ghost btn-sm" title="Edit Workspace">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => handleDeleteWorkspace(ws.id)} className="btn btn-ghost btn-sm" title="Delete Workspace" style={{ color: 'var(--badge-red-text)' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedWorkspaceId(ws.id);
                          setActiveTab('projects');
                          showInfo(`Switched active workspace to "${ws.name}"`);
                        }}
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-block btn-sm`}
                        style={{ marginTop: 8 }}
                      >
                        {isSelected ? 'Currently Active' : 'Select Workspace'}
                      </button>
                    </div>
                  );
                })}

                {workspaces.length === 0 && (
                  <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    No workspaces found. Click "New Workspace" above to create one.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* PROJECTS TAB */}
          {activeTab === 'projects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Projects</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Workspace ID: <strong>#{selectedWorkspaceId || 'None'}</strong>
                  </p>
                </div>
                <button onClick={handleOpenCreateProject} className="btn btn-primary">
                  <Plus size={16} /> New Project
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {projects
                  .filter((p) => {
                    const pWsId = p.workspaceId || p.workspace?.id;
                    return pWsId == null || String(pWsId) === String(selectedWorkspaceId);
                  })
                  .map((p) => {
                    const isSelected = selectedProjectId === p.id;
                    return (
                      <div key={p.id} className="card" style={{ borderColor: isSelected ? 'var(--atlassian-blue)' : 'var(--border-color)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 6, backgroundColor: 'var(--badge-green-bg)', color: 'var(--badge-green-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Briefcase size={20} />
                            </div>
                            <div>
                              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{p.title}</h3>
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Project #{p.id}</span>
                            </div>
                          </div>

                          {(isWorkspaceOwner || isProjectManager) && (
                            <div style={{ display: 'flex', gap: 4 }}>
                              <button onClick={() => handleOpenEditProject(p)} className="btn btn-ghost btn-sm" title="Edit Project">
                                <Edit3 size={14} />
                              </button>
                              <button onClick={() => handleDeleteProject(p.id)} className="btn btn-ghost btn-sm" title="Delete Project" style={{ color: 'var(--badge-red-text)' }}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, minHeight: 38 }}>
                          {p.description}
                        </p>

                        <div style={{ display: 'flex', gap: 8 }}>
                          <button
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setActiveTab('tasks');
                              showInfo(`Viewing tasks for "${p.title}"`);
                            }}
                            className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                            style={{ flex: 1 }}
                          >
                            {isSelected ? 'View Tasks' : 'Open Tasks'}
                          </button>

                          <button
                            onClick={() => {
                              setSelectedProjectId(p.id);
                              setActiveTab('members');
                            }}
                            className="btn btn-secondary btn-sm"
                            title="Assign Members & Roles"
                          >
                            <Users size={14} /> Assign Roles
                          </button>
                        </div>
                      </div>
                    );
                  })}

                {projects.filter((p) => {
                  const pWsId = p.workspaceId || p.workspace?.id;
                  return pWsId == null || String(pWsId) === String(selectedWorkspaceId);
                }).length === 0 && (
                  <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
                    No projects found in this workspace. Click "New Project" to create one.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                <div>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Task Directory (List View)</h2>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                    Workspace #{selectedWorkspaceId || '?'} &rarr; Project #{selectedProjectId || '?'}
                  </p>
                </div>

                {(isWorkspaceOwner || isProjectManager) ? (
                  <button onClick={handleOpenCreateTask} className="btn btn-primary">
                    <Plus size={16} /> Add New Task
                  </button>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="badge badge-todo">DEVELOPER</span>
                    <span>(Can update task status & comments)</span>
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((st) => (
                    <button
                      key={st}
                      onClick={() => setTaskStatusFilter(st)}
                      className={`btn btn-sm ${taskStatusFilter === st ? 'btn-primary' : 'btn-ghost'}`}
                    >
                      {st === 'ALL' ? 'All Tasks' : st.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <div style={{ position: 'relative', width: 240 }}>
                  <Search size={14} style={{ position: 'absolute', left: 10, top: 10, color: 'var(--text-secondary)' }} />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search tasks..."
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    style={{ paddingLeft: 30, height: 34, fontSize: 13 }}
                  />
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title & Description</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Assignee ID</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>#{t.id}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{t.title}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{t.description}</div>
                        </td>
                        <td>
                          <span className={`badge badge-${(t.status || 'TODO').toLowerCase()}`}>
                            {(t.status || 'TODO').replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${(t.priority || 'MEDIUM').toLowerCase()}`}>
                            {t.priority || 'MEDIUM'}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No date'}
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--atlassian-blue)' }}>
                          User #{t.userId || 'N/A'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button
                              onClick={() => handleOpenComments(t)}
                              className="btn btn-secondary btn-sm"
                              title="View Comments"
                            >
                              <MessageSquare size={13} /> Comments
                            </button>
                            <button
                              onClick={() => handleOpenEditTask(t)}
                              className="btn btn-ghost btn-sm"
                              title="Edit Task"
                            >
                              <Edit3 size={14} />
                            </button>
                            {(isWorkspaceOwner || isProjectManager) && (
                              <button
                                onClick={() => handleDeleteTask(t.id)}
                                className="btn btn-ghost btn-sm"
                                title="Delete Task"
                                style={{ color: 'var(--badge-red-text)' }}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredTasks.length === 0 && (
                      <tr>
                        <td colSpan="7" style={{ textAlign: 'center', padding: 32, color: 'var(--text-secondary)' }}>
                          No tasks match your filter. Click "Add New Task" to create one.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* MEMBER ROLES TAB */}
          {activeTab === 'members' && (
            <MembersManagement
              authFetch={authFetch}
              selectedWorkspaceId={selectedWorkspaceId}
              selectedProjectId={selectedProjectId}
              workspaces={workspaces}
              projects={projects}
              isOwner={isWorkspaceOwner}
              isManager={isProjectManager}
              user={user}
            />
          )}

          {/* ALL USERS TAB */}
          {activeTab === 'team' && (
            <div>
              <div style={{ marginBottom: 20 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>All Registered Users</h2>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Registered user directory in Foreman.</p>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teamMembers.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>#{m.id}</td>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {m.firstName} {m.lastName}
                        </td>
                        <td style={{ color: 'var(--atlassian-blue)' }}>{m.email}</td>
                        <td>
                          <span className="badge badge-done">Active Member</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PROFILE TAB */}
          {activeTab === 'profile' && (
            <Profile
              user={user}
              token={token}
              onUserUpdated={(u) => setUser(u)}
              onLogout={onLogout}
            />
          )}

        </main>
      </div>

      {/* CUSTOM CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        onConfirm={confirmConfig.onConfirm}
        onCancel={() => setConfirmConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Workspace Modal */}
      {showWorkspaceModal && (
        <div className="modal-overlay" onClick={() => setShowWorkspaceModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingWorkspace ? 'Edit Workspace' : 'Create New Workspace'}</h3>
              <button onClick={() => setShowWorkspaceModal(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveWorkspace}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Workspace Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Engineering Team"
                    value={workspaceForm.name}
                    onChange={(e) => setWorkspaceForm({ name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowWorkspaceModal(false)} className="btn btn-secondary" disabled={savingWorkspace}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingWorkspace}>
                  {savingWorkspace ? (
                    <>
                      <Loader2 size={16} className="spinner" /> Saving...
                    </>
                  ) : (
                    'Save Workspace'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Project Modal */}
      {showProjectModal && (
        <div className="modal-overlay" onClick={() => setShowProjectModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingProject ? 'Edit Project' : 'Create New Project'}</h3>
              <button onClick={() => setShowProjectModal(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveProject}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Backend API Migration"
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    required
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Brief summary of project goals..."
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowProjectModal(false)} className="btn btn-secondary" disabled={savingProject}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingProject}>
                  {savingProject ? (
                    <>
                      <Loader2 size={16} className="spinner" /> Saving...
                    </>
                  ) : (
                    'Save Project'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editingTask ? (isDeveloper ? 'Update Task Status' : 'Edit Task') : 'Add New Task'}</h3>
              <button onClick={() => setShowTaskModal(false)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSaveTask}>
              <div className="modal-body">
                {isDeveloper && editingTask && (
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 12, padding: '8px 12px', backgroundColor: '#fff8e1', borderRadius: 4 }}>
                    As a <strong>DEVELOPER</strong>, you can update task status. Modifying title, description, or assignee requires Project Manager/Owner permissions.
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Task Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Fix preflight CORS error"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                    disabled={isDeveloper && !!editingTask}
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    placeholder="Task details..."
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    required
                    disabled={isDeveloper && !!editingTask}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select
                      className="form-control"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                      disabled={isDeveloper && !!editingTask}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select
                      className="form-control"
                      value={taskForm.status}
                      onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                    >
                      <option value="TODO">TODO</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="DONE">DONE</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Due Date</label>
                  <input
                    type="datetime-local"
                    className="form-control"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                    required
                    disabled={isDeveloper && !!editingTask}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assignee</label>
                  <select
                    className="form-control"
                    value={taskForm.userId}
                    onChange={(e) => setTaskForm({ ...taskForm, userId: e.target.value })}
                    required
                    disabled={isDeveloper && !!editingTask}
                  >
                    <option value="">Select Assignee</option>
                    {(projectMembers.length > 0 ? projectMembers : teamMembers).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.firstName} {m.lastName} ({m.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowTaskModal(false)} className="btn btn-secondary" disabled={savingTask}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingTask}>
                  {savingTask ? (
                    <>
                      <Loader2 size={16} className="spinner" /> Saving...
                    </>
                  ) : (
                    'Save Task'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Comments Drawer */}
      {activeTaskForComments && (
        <div className="drawer-overlay" onClick={() => setActiveTaskForComments(null)}>
          <div className="drawer-card" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>
                  Comments: {activeTaskForComments.title}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Task #{activeTaskForComments.id}</span>
              </div>
              <button onClick={() => setActiveTaskForComments(null)} className="btn btn-ghost btn-sm">
                <X size={16} />
              </button>
            </div>

            <div className="drawer-body">
              <form onSubmit={handleAddComment} style={{ marginBottom: 20 }}>
                <div className="form-group">
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Write a comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-sm" style={{ float: 'right' }} disabled={postingComment}>
                  {postingComment ? (
                    <>
                      <Loader2 size={14} className="spinner" /> Posting...
                    </>
                  ) : (
                    'Post Comment'
                  )}
                </button>
                <div style={{ clear: 'both' }} />
              </form>

              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>
                Discussion Thread ({comments.length})
              </h4>

              {loadingComments ? (
                <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>
                  <Loader2 size={20} className="spinner" /> Loading comments...
                </div>
              ) : comments.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                  No comments yet on this task. Be the first to comment!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {comments.map((c) => (
                    <div key={c.id} style={{ backgroundColor: '#fafbfc', padding: 12, borderRadius: 6, border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--atlassian-blue)' }}>
                            {c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : (c.firstName || `User #${c.userId || c.id}`)}
                          </span>
                          {c.createdOn && (
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                              • {new Date(c.createdOn).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteComment(c.id)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: 'var(--badge-red-text)', padding: 2 }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)' }}>{c.message || c.content}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
