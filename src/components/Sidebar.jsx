import React from 'react';
import foremanIcon from '../assets/foreman_icon.svg';
import { 
  LayoutDashboard, 
  Layers, 
  Briefcase, 
  CheckSquare, 
  Users, 
  User,
  ShieldCheck, 
  UserCheck,
  Lock
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  user,
  workspaceRole,
  projectRole,
  isOwner = false,
  isManager = false
}) {
  const isDeveloper = !isOwner && !isManager;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'workspaces', label: 'Workspaces', icon: Layers },
    { id: 'projects', label: 'Projects', icon: Briefcase },
    { id: 'tasks', label: 'Tasks List', icon: CheckSquare },
    { id: 'members', label: 'Member Roles', icon: Users, roleRequired: 'Manager/Owner', restricted: isDeveloper },
    { id: 'team', label: 'All Users', icon: UserCheck },
  ];

  const roleLabel = isOwner ? 'OWNER' : isManager ? 'MANAGER' : 'DEVELOPER';
  const roleBadgeStyle = isOwner 
    ? { backgroundColor: '#e3f2fd', color: '#0288d1', border: '1px solid #90caf9' }
    : isManager 
    ? { backgroundColor: '#e8f5e9', color: '#2e7d32', border: '1px solid #a5d6a7' }
    : { backgroundColor: '#fff3e0', color: '#ef6c00', border: '1px solid #ffe0b2' };

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <img 
          src={foremanIcon} 
          alt="Foreman Logo" 
          style={{ width: 28, height: 28, borderRadius: 6, flexShrink: 0, objectFit: 'contain' }} 
        />
        <span className="sidebar-brand-name">Foreman</span>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`sidebar-item ${isActive ? 'active' : ''} ${item.restricted ? 'sidebar-item-restricted' : ''}`}
              title={item.restricted ? `${item.label} (Requires Owner or Manager role)` : item.label}
              style={item.restricted ? { opacity: 0.75 } : {}}
            >
              <Icon size={20} style={{ flexShrink: 0 }} />
              <span className="sidebar-item-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span>{item.label}</span>
                {item.restricted && <Lock size={12} style={{ color: 'var(--text-secondary)', marginLeft: 6 }} />}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile Section */}
      {user && (
        <div className="sidebar-footer" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 8, padding: '12px 16px' }}>
          <button
            onClick={() => setActiveTab('profile')}
            className={`sidebar-item ${activeTab === 'profile' ? 'active' : ''}`}
            title="My Profile & Settings"
            style={{ padding: '6px 8px' }}
          >
            <div className="avatar-circle" style={{ width: 26, height: 26, fontSize: 11, flexShrink: 0 }}>
              {user.firstName ? user.firstName.charAt(0).toUpperCase() : <User size={12} />}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', overflow: 'hidden' }}>
              <span className="sidebar-item-label" style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user.firstName} {user.lastName}
              </span>
              <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 700, ...roleBadgeStyle }}>
                {roleLabel}
              </span>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}
