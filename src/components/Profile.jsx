import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Calendar, Key, LogOut, Save, Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { API_BASE_URL } from '../config/api';

export default function Profile({ user, onUserUpdated, onLogout, token }) {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        password: '', // blank by default unless updating
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim() || !formData.email.trim()) {
      showError('First name, last name, and email are required.');
      return;
    }
    if (!formData.password) {
      showError('Please enter your password (or a new password) to confirm updates.');
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...user,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
      };

      const response = await fetch(`${API_BASE_URL}/api/users/${user.id}/update`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || 'Failed to update user profile.');
      }

      const updatedUser = await response.json();
      showSuccess('Profile updated successfully!');
      if (onUserUpdated) onUserUpdated(updatedUser);
      setFormData((prev) => ({ ...prev, password: '' }));
    } catch (err) {
      showError(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>User Profile & Settings</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Manage your personal details and session state.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        
        {/* Edit Profile Details Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
            <UserIcon size={20} style={{ color: 'var(--atlassian-blue)' }} />
            <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Edit Personal Information</h3>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                className="form-control"
                value={formData.firstName}
                onChange={handleChange}
                maxLength={20}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                className="form-control"
                value={formData.lastName}
                onChange={handleChange}
                maxLength={20}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                maxLength={254}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="password">Password (Required to save changes)</label>
              <input
                id="password"
                type="password"
                name="password"
                className="form-control"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={saving} style={{ marginTop: 8 }}>
              {saving ? (
                <>
                  <Loader2 size={16} className="spinner" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Profile Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* User Account Info & Session Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
              <ShieldCheck size={20} style={{ color: 'var(--badge-green-text)' }} />
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>Account Meta & Role</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Account ID:</span>{' '}
                <strong style={{ fontFamily: 'var(--font-mono)' }}>#{user?.id}</strong>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Member Since:</span>{' '}
                <span style={{ color: 'var(--text-primary)' }}>
                  {user?.createdOn ? new Date(user.createdOn).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div>
                <span style={{ color: 'var(--text-secondary)' }}>Account Status:</span>{' '}
                <span className="badge badge-done">Active User</span>
              </div>
            </div>
          </div>

          {/* Embedded Logout Section */}
          <div className="card" style={{ borderColor: 'rgba(222, 53, 11, 0.3)', backgroundColor: '#fff5f5' }}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--badge-red-text)', marginBottom: 8 }}>
              Account Session Actions
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Sign out of your session on this device. You will need to sign in again to access your account.
            </p>

            <button onClick={onLogout} className="btn btn-danger btn-block">
              <LogOut size={16} /> Sign out of Foreman
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
