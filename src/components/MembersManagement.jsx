import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, ShieldCheck, Trash2, Edit3, Loader2, Layers, Briefcase } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import CustomSelect from './CustomSelect';

const projectRoleOptions = [
  { value: 'PROJECT_MANAGER', label: 'PROJECT_MANAGER', icon: <ShieldCheck size={14} style={{ color: '#0052cc' }} /> },
  { value: 'DEVELOPER', label: 'DEVELOPER', icon: <Briefcase size={14} style={{ color: '#5e6c84' }} /> }
];

const workspaceRoleOptions = [
  { value: 'OWNER', label: 'OWNER', icon: <Shield size={14} style={{ color: '#ff8b00' }} /> },
  { value: 'MEMBER', label: 'MEMBER', icon: <Users size={14} style={{ color: '#006644' }} /> }
];

export default function MembersManagement({
  authFetch,
  selectedWorkspaceId,
  selectedProjectId,
  workspaces = [],
  projects = [],
  isOwner = false,
  isManager = false,
  user = null
}) {
  const { showSuccess, showError } = useToast();

  const [activeSubTab, setActiveSubTab] = useState('project'); // 'project' | 'workspace'

  // Workspace Members State
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [wsMemberForm, setWsMemberForm] = useState({ email: '', workspaceRole: 'MEMBER' });
  const [loadingWsMembers, setLoadingWsMembers] = useState(false);

  // Project Members State
  const [projectMembers, setProjectMembers] = useState([]);
  const [projMemberForm, setProjMemberForm] = useState({ email: '', projectRole: 'DEVELOPER' });
  const [loadingProjMembers, setLoadingProjMembers] = useState(false);

  // Self-calculated Role Check from fetched membership tables
  const currentWsMem = workspaceMembers.find(
    (m) =>
      (m.id != null && user?.id != null && String(m.id) === String(user.id)) ||
      (m.email && user?.email && m.email.toLowerCase() === user.email.toLowerCase())
  );
  const currentProjMem = projectMembers.find(
    (m) =>
      (m.id != null && user?.id != null && String(m.id) === String(user.id)) ||
      (m.email && user?.email && m.email.toLowerCase() === user.email.toLowerCase())
  );

  const effectiveIsOwner = isOwner || currentWsMem?.workspaceRole === 'OWNER';
  const effectiveIsManager = isManager || effectiveIsOwner || currentProjMem?.projectRole === 'PROJECT_MANAGER';

  useEffect(() => {
    if (selectedWorkspaceId) {
      fetchWorkspaceMembers();
    }
  }, [selectedWorkspaceId]);

  useEffect(() => {
    if (selectedWorkspaceId && selectedProjectId) {
      fetchProjectMembers();
    }
  }, [selectedWorkspaceId, selectedProjectId]);

  const fetchWorkspaceMembers = async () => {
    if (!selectedWorkspaceId) return;
    setLoadingWsMembers(true);
    try {
      const list = await authFetch(`/api/workspaces/${selectedWorkspaceId}/members`);
      setWorkspaceMembers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingWsMembers(false);
    }
  };

  const fetchProjectMembers = async () => {
    if (!selectedWorkspaceId || !selectedProjectId) return;
    setLoadingProjMembers(true);
    try {
      const list = await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/members`);
      setProjectMembers(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProjMembers(false);
    }
  };

  // ---------------- WORKSPACE MEMBER ACTIONS ----------------
  const handleAddWorkspaceMember = async (e) => {
    e.preventDefault();
    if (!wsMemberForm.email.trim() || !selectedWorkspaceId) return;

    try {
      const resMsg = await authFetch(`/api/workspaces/${selectedWorkspaceId}/members`, {
        method: 'POST',
        body: JSON.stringify(wsMemberForm),
      });
      showSuccess(typeof resMsg === 'string' ? resMsg : `Sent invitation mail to ${wsMemberForm.email}!`);
      setWsMemberForm({ email: '', workspaceRole: 'MEMBER' });
      fetchWorkspaceMembers();
    } catch (err) {
      showError(err.message || 'Failed to send workspace invitation');
    }
  };

  const handleUpdateWorkspaceMemberRole = async (email, newRole) => {
    try {
      await authFetch(`/api/workspaces/${selectedWorkspaceId}/members`, {
        method: 'PUT',
        body: JSON.stringify({ email, workspaceRole: newRole }),
      });
      showSuccess(`Role updated to ${newRole} for ${email}`);
      fetchWorkspaceMembers();
    } catch (err) {
      showError(err.message || 'Failed to update member role');
    }
  };

  const handleDeleteWorkspaceMember = async (memId) => {
    if (!window.confirm('Remove this member from the workspace?')) return;
    try {
      await authFetch(`/api/workspaces/${selectedWorkspaceId}/members/${memId}`, {
        method: 'DELETE',
      });
      showSuccess('Member removed from workspace.');
      fetchWorkspaceMembers();
    } catch (err) {
      showError(err.message || 'Failed to remove member');
    }
  };

  // ---------------- PROJECT MEMBER ACTIONS ----------------
  const handleAddProjectMember = async (e) => {
    e.preventDefault();
    if (!projMemberForm.email.trim() || !selectedWorkspaceId || !selectedProjectId) return;

    try {
      const resMsg = await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/members`, {
        method: 'POST',
        body: JSON.stringify(projMemberForm),
      });
      showSuccess(typeof resMsg === 'string' ? resMsg : `Sent project invitation to ${projMemberForm.email}!`);
      setProjMemberForm({ email: '', projectRole: 'DEVELOPER' });
      fetchProjectMembers();
    } catch (err) {
      showError(err.message || 'Failed to send project invitation');
    }
  };

  const handleUpdateProjectMemberRole = async (email, newRole) => {
    try {
      await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/members`, {
        method: 'PUT',
        body: JSON.stringify({ email, projectRole: newRole }),
      });
      showSuccess(`Project role updated to ${newRole} for ${email}`);
      fetchProjectMembers();
    } catch (err) {
      showError(err.message || 'Failed to update project member role');
    }
  };

  const handleDeleteProjectMember = async (memId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      await authFetch(`/api/workspaces/${selectedWorkspaceId}/projects/${selectedProjectId}/members/${memId}`, {
        method: 'DELETE',
      });
      showSuccess('Member removed from project.');
      fetchProjectMembers();
    } catch (err) {
      showError(err.message || 'Failed to remove project member');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
            Member Management
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Assign users to specific workspaces and projects with defined roles.
          </p>
        </div>

        {/* Subtab Switcher */}
        <div style={{ display: 'flex', gap: 6, backgroundColor: 'var(--bg-surface-hover)', padding: 4, borderRadius: 6 }}>
          <button
            onClick={() => setActiveSubTab('project')}
            className={`btn btn-sm ${activeSubTab === 'project' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Briefcase size={14} /> Project Members & Roles
          </button>
          <button
            onClick={() => setActiveSubTab('workspace')}
            className={`btn btn-sm ${activeSubTab === 'workspace' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Layers size={14} /> Workspace Members & Roles
          </button>
        </div>
      </div>

      {/* ================= PROJECT MEMBERS SUBTAB ================= */}
      {activeSubTab === 'project' && (
        <div>
          {!selectedProjectId ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              Please select a project to manage its assigned members.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>

              {/* Add Member Form */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={18} style={{ color: 'var(--atlassian-blue)' }} />
                  Assign User to Project
                </h3>

                {!effectiveIsManager ? (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '12px 0' }}>
                    <Shield size={16} style={{ color: 'var(--badge-yellow-text)', verticalAlign: 'middle', marginRight: 6 }} />
                    You are viewing as <strong>DEVELOPER</strong>. Assigning or modifying project members requires <strong>PROJECT_MANAGER</strong> or <strong>OWNER</strong> privileges.
                  </div>
                ) : (
                  <form onSubmit={handleAddProjectMember}>
                    <div className="form-group">
                      <label className="form-label">User Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="user@example.com"
                        value={projMemberForm.email}
                        onChange={(e) => setProjMemberForm({ ...projMemberForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Project Role</label>
                      <CustomSelect
                        options={projectRoleOptions}
                        value={projMemberForm.projectRole}
                        onChange={(val) => setProjMemberForm({ ...projMemberForm, projectRole: val })}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">
                      <UserPlus size={16} /> Assign to Project
                    </button>
                  </form>
                )}
              </div>

              {/* Members Table */}
              <div className="table-container">
                <div className="table-header-banner">
                  Assigned Members in Project #{selectedProjectId}
                </div>

                {loadingProjMembers ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Loader2 size={20} className="spinner" /> Loading project members...
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Project Role</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectMembers.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>#{m.id}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.firstName} {m.lastName}</td>
                          <td style={{ color: 'var(--atlassian-blue)' }}>{m.email}</td>
                          <td>
                            {effectiveIsManager ? (
                              <CustomSelect
                                size="sm"
                                options={projectRoleOptions}
                                value={m.projectRole || 'DEVELOPER'}
                                onChange={(val) => handleUpdateProjectMemberRole(m.email, val)}
                              />
                            ) : (
                              <span className="badge badge-done">{m.projectRole || 'DEVELOPER'}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {effectiveIsManager ? (
                              <button
                                onClick={() => handleDeleteProjectMember(m.id)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--badge-red-text)' }}
                                title="Remove from Project"
                              >
                                <Trash2 size={14} /> Remove
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Read only</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {projectMembers.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
                            No users assigned to this project yet. Use the form on the left to assign team members.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ================= WORKSPACE MEMBERS SUBTAB ================= */}
      {activeSubTab === 'workspace' && (
        <div>
          {!selectedWorkspaceId ? (
            <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>
              Please select a workspace to manage members.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>

              {/* Add Workspace Member Form */}
              <div className="card">
                <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserPlus size={18} style={{ color: 'var(--atlassian-blue)' }} />
                  Add User to Workspace
                </h3>

                {!effectiveIsOwner ? (
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '12px 0' }}>
                    <Shield size={16} style={{ color: 'var(--badge-yellow-text)', verticalAlign: 'middle', marginRight: 6 }} />
                    Adding or editing workspace members requires <strong>WORKSPACE OWNER</strong> privileges.
                  </div>
                ) : (
                  <form onSubmit={handleAddWorkspaceMember}>
                    <div className="form-group">
                      <label className="form-label">User Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="user@example.com"
                        value={wsMemberForm.email}
                        onChange={(e) => setWsMemberForm({ ...wsMemberForm, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Workspace Role</label>
                      <CustomSelect
                        options={workspaceRoleOptions}
                        value={wsMemberForm.workspaceRole}
                        onChange={(val) => setWsMemberForm({ ...wsMemberForm, workspaceRole: val })}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block">
                      <UserPlus size={16} /> Add to Workspace
                    </button>
                  </form>
                )}
              </div>

              {/* Workspace Members Table */}
              <div className="table-container">
                <div className="table-header-banner">
                  Workspace #{selectedWorkspaceId} Members
                </div>

                {loadingWsMembers ? (
                  <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    <Loader2 size={20} className="spinner" /> Loading workspace members...
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>User ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Workspace Role</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {workspaceMembers.map((m) => (
                        <tr key={m.id}>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>#{m.id}</td>
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{m.firstName} {m.lastName}</td>
                          <td style={{ color: 'var(--atlassian-blue)' }}>{m.email}</td>
                          <td>
                            {effectiveIsOwner ? (
                              <CustomSelect
                                size="sm"
                                options={workspaceRoleOptions}
                                value={m.workspaceRole || 'MEMBER'}
                                onChange={(val) => handleUpdateWorkspaceMemberRole(m.email, val)}
                              />
                            ) : (
                              <span className="badge badge-done">{m.workspaceRole || 'MEMBER'}</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {effectiveIsOwner ? (
                              <button
                                onClick={() => handleDeleteWorkspaceMember(m.id)}
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--badge-red-text)' }}
                                title="Remove from Workspace"
                              >
                                <Trash2 size={14} /> Remove
                              </button>
                            ) : (
                              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Read only</span>
                            )}
                          </td>
                        </tr>
                      ))}

                      {workspaceMembers.length === 0 && (
                        <tr>
                          <td colSpan="5" style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)' }}>
                            No workspace members found. Add members using the form on the left.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
}
