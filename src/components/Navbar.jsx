import React from 'react';
import { Layers, User as UserIcon, LogOut } from 'lucide-react';

export default function Navbar({ 
  user, 
  title, 
  workspaces = [], 
  selectedWorkspaceId, 
  setSelectedWorkspaceId,
  onOpenProfile,
  onLogout
}) {
  return (
    <header className="top-header">
      <div className="page-title">
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </span>
      </div>

      <div className="header-controls">
        {/* Workspace Quick Selector */}
        {workspaces && workspaces.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Layers size={16} style={{ color: 'var(--atlassian-blue)', flexShrink: 0 }} />
            <select
              className="workspace-select"
              value={selectedWorkspaceId || ''}
              onChange={(e) => setSelectedWorkspaceId(Number(e.target.value))}
            >
              {workspaces.map((w) => (
                <option key={w.id} value={w.id}>
                  Workspace: {w.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Profile Avatar Button */}
        {user && (
          <button 
            onClick={onOpenProfile} 
            className="user-profile-nav-btn"
            title="Open Profile Settings"
          >
            <div className="avatar-circle">
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : <UserIcon size={14} />}
            </div>
            <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {user.firstName} {user.lastName}
            </span>
          </button>
        )}

        {/* Logout Quick Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            className="btn btn-ghost btn-sm"
            style={{ color: 'var(--badge-red-text)', padding: '6px 10px' }}
            title="Sign Out"
          >
            <LogOut size={16} />
            <span style={{ fontSize: 13 }}>Logout</span>
          </button>
        )}
      </div>
    </header>
  );
}
