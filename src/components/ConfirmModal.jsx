import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ 
  isOpen, 
  title = 'Confirm Delete', 
  message = 'Are you sure you want to delete this item? This action cannot be undone.', 
  confirmText = 'Delete', 
  cancelText = 'Cancel', 
  onConfirm, 
  onCancel 
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 6, backgroundColor: 'var(--badge-red-bg)', color: 'var(--badge-red-text)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} />
            </div>
            <h3 className="modal-title">{title}</h3>
          </div>
          <button onClick={onCancel} className="btn btn-ghost btn-sm">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {message}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onCancel} className="btn btn-secondary">
            {cancelText}
          </button>
          <button type="button" onClick={onConfirm} className="btn btn-danger">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
