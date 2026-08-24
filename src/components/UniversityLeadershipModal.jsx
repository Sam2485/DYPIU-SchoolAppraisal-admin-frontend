import React, { useState, useEffect } from 'react';
import {
  getUniversityLeadership,
  createOrUpdateLeadership,
  deleteUniversityLeadership,
} from '../api/adminApi';

export const UniversityLeadershipModal = ({
  university,
  isOpen,
  onClose,
}) => {
  const [leadershipUsers, setLeadershipUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    role: 'iqac',
    name: '',
    email: '',
    designation: '',
    password: '',
  });

  const domain = university?.domain || 'university.edu.in';

  const loadUsers = async () => {
    if (!university?.id) return;
    setLoading(true);
    setError(null);
    try {
      const users = await getUniversityLeadership(university.id);
      setLeadershipUsers(users);
    } catch (err) {
      console.error('Failed to load leadership users:', err);
      setError(err.response?.data?.message || 'Failed to load leadership users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && university) {
      loadUsers();
      setShowForm(false);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, university]);

  const handleOpenAdd = (defaultRole = 'iqac') => {
    const isIqac = defaultRole === 'iqac';
    setFormData({
      role: defaultRole,
      name: isIqac ? 'IQAC Coordinator' : 'Vice Chancellor',
      email: isIqac ? `iqac@${domain}` : `vc@${domain}`,
      designation: isIqac ? 'Coordinator, IQAC' : 'Vice Chancellor',
      password: isIqac ? 'Iqac@123' : 'Vc@123',
    });
    setError(null);
    setSuccessMsg(null);
    setShowForm(true);
  };

  const handleOpenEdit = (user) => {
    setFormData({
      role: user.role || 'iqac',
      name: user.name || '',
      email: user.email || '',
      designation: user.designation || '',
      password: '', // leave blank if unchanged or type new
    });
    setError(null);
    setSuccessMsg(null);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setError('Name and Email are required.');
      return;
    }
    if (!formData.password || formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await createOrUpdateLeadership(university.id, {
        ...formData,
        universityId: university.id,
        universityCode: university.code,
      });
      setSuccessMsg(`Successfully configured ${formData.role.toUpperCase()} account for ${formData.email}`);
      setShowForm(false);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save leadership account.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (!window.confirm(`Are you sure you want to remove the ${user.role.toUpperCase()} account (${user.email})?`)) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await deleteUniversityLeadership(university.id, user.id);
      setSuccessMsg(`Account ${user.email} removed.`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !university) return null;

  const iqacUser = leadershipUsers.find((u) => u.role === 'iqac');
  const vcUser = leadershipUsers.find((u) => u.role === 'vice-chancellor');

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)' }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0 rounded-4 overflow-hidden">
          {/* Modal Header */}
          <div className="modal-header text-white px-4 py-3" style={{ backgroundColor: university.primaryColor || '#2563eb' }}>
            <div>
              <div className="d-flex align-items-center gap-2">
                <span className="fs-4">👥</span>
                <h5 className="modal-title fw-bold mb-0">University Leadership Accounts</h5>
              </div>
              <small className="opacity-75">
                {university.name} ({university.code?.toUpperCase()})
              </small>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4 bg-light">
            {error && (
              <div className="alert alert-danger py-2 px-3 d-flex align-items-center gap-2 rounded-3 mb-3">
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}
            {successMsg && (
              <div className="alert alert-success py-2 px-3 d-flex align-items-center gap-2 rounded-3 mb-3">
                <span>✅</span>
                <span>{successMsg}</span>
              </div>
            )}

            {/* Quick Status Cards */}
            <div className="row g-3 mb-4">
              {/* IQAC Card */}
              <div className="col-md-6">
                <div className={`card h-100 border-2 rounded-3 ${iqacUser ? 'border-primary bg-white shadow-sm' : 'border-dashed border-secondary bg-white'}`}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-primary px-2 py-1">IQAC</span>
                        <h6 className="fw-bold mb-0 text-dark">Quality Cell Coordinator</h6>
                      </div>
                      {iqacUser ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">Active</span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle">Not Set</span>
                      )}
                    </div>
                    {iqacUser ? (
                      <div>
                        <div className="fw-semibold text-dark">{iqacUser.name}</div>
                        <div className="text-muted small mb-2">📧 {iqacUser.email}</div>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary py-1 px-2"
                            onClick={() => handleOpenEdit(iqacUser)}
                          >
                            ✏️ Edit / Reset Password
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-1 px-2"
                            onClick={() => handleDelete(iqacUser)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted small mb-2">
                          Required to initiate appraisal cycles, review submissions, and manage faculty users.
                        </p>
                        <button
                          type="button"
                          className="btn btn-sm btn-primary py-1 px-3 fw-semibold"
                          onClick={() => handleOpenAdd('iqac')}
                        >
                          + Create IQAC Account
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* VC Card */}
              <div className="col-md-6">
                <div className={`card h-100 border-2 rounded-3 ${vcUser ? 'border-indigo bg-white shadow-sm' : 'border-dashed border-secondary bg-white'}`}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-dark px-2 py-1">VC</span>
                        <h6 className="fw-bold mb-0 text-dark">Vice-Chancellor</h6>
                      </div>
                      {vcUser ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle">Active</span>
                      ) : (
                        <span className="badge bg-warning-subtle text-warning border border-warning-subtle">Not Set</span>
                      )}
                    </div>
                    {vcUser ? (
                      <div>
                        <div className="fw-semibold text-dark">{vcUser.name}</div>
                        <div className="text-muted small mb-2">📧 {vcUser.email}</div>
                        <div className="d-flex gap-2">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-dark py-1 px-2"
                            onClick={() => handleOpenEdit(vcUser)}
                          >
                            ✏️ Edit / Reset Password
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger py-1 px-2"
                            onClick={() => handleDelete(vcUser)}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-muted small mb-2">
                          Required for executive overview, institutional report approvals, and grade sign-offs.
                        </p>
                        <button
                          type="button"
                          className="btn btn-sm btn-dark py-1 px-3 fw-semibold"
                          onClick={() => handleOpenAdd('vice-chancellor')}
                        >
                          + Create VC Account
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Section */}
            {showForm && (
              <div className="card border-0 shadow-sm rounded-3 mb-3">
                <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                  <h6 className="fw-bold mb-0 text-primary">
                    {formData.role === 'iqac' ? '🏛️ Configure IQAC Account' : '🎓 Configure Vice-Chancellor Account'}
                  </h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                    onClick={() => setShowForm(false)}
                  >
                    ✕ Cancel
                  </button>
                </div>
                <div className="card-body p-3">
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Role *</label>
                        <select
                          className="form-select form-select-sm"
                          value={formData.role}
                          onChange={(e) => {
                            const newRole = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              role: newRole,
                              name: newRole === 'iqac' ? 'IQAC Coordinator' : 'Vice Chancellor',
                              email: newRole === 'iqac' ? `iqac@${domain}` : `vc@${domain}`,
                              designation: newRole === 'iqac' ? 'Coordinator, IQAC' : 'Vice Chancellor',
                              password: newRole === 'iqac' ? 'Iqac@123' : 'Vc@123',
                            }));
                          }}
                        >
                          <option value="iqac">IQAC Coordinator (Reviewer)</option>
                          <option value="vice-chancellor">Vice-Chancellor (Executive Reviewer)</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Full Name *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="e.g. Dr. Quality Coordinator"
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Email Address (Login Username) *</label>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder={`e.g. iqac@${domain}`}
                          required
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label small fw-semibold">Designation</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          placeholder="e.g. Coordinator, IQAC"
                        />
                      </div>

                      <div className="col-md-12">
                        <label className="form-label small fw-semibold">Password *</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          placeholder="Minimum 6 characters (e.g. Iqac@123)"
                          required
                        />
                        <div className="form-text small">
                          The user will use this email and password to log in at the main appraisal portal.
                        </div>
                      </div>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-3 pt-2 border-top">
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary px-3"
                        onClick={() => setShowForm(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-sm btn-primary px-4 fw-semibold"
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : '💾 Save Account'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Existing Accounts Table */}
            <div className="card border-0 shadow-sm rounded-3">
              <div className="card-header bg-white py-2 px-3 border-bottom d-flex justify-content-between align-items-center">
                <h6 className="fw-bold mb-0 text-dark">📋 Configured Accounts ({leadershipUsers.length})</h6>
                {!showForm && (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary py-1 px-2"
                    onClick={() => handleOpenAdd('iqac')}
                  >
                    + Add Account
                  </button>
                )}
              </div>
              <div className="card-body p-0">
                {loading ? (
                  <div className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm me-2 text-primary" role="status"></div>
                    Loading accounts...
                  </div>
                ) : leadershipUsers.length === 0 ? (
                  <div className="text-center py-4 text-muted small">
                    No leadership accounts configured for this university yet.
                    <br />
                    Click <strong>"+ Create IQAC Account"</strong> above to provision the initial administrator.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th className="ps-3">Role</th>
                          <th>Name</th>
                          <th>Email (Username)</th>
                          <th>Designation</th>
                          <th>Status</th>
                          <th className="text-end pe-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leadershipUsers.map((u) => (
                          <tr key={u.id}>
                            <td className="ps-3">
                              <span className={`badge ${u.role === 'iqac' ? 'bg-primary' : 'bg-dark'}`}>
                                {u.role === 'iqac' ? 'IQAC' : 'Vice-Chancellor'}
                              </span>
                            </td>
                            <td className="fw-semibold text-dark">{u.name}</td>
                            <td><code>{u.email}</code></td>
                            <td className="text-muted">{u.designation || '—'}</td>
                            <td>
                              <span className="badge bg-success-subtle text-success border border-success-subtle">
                                {u.status || 'active'}
                              </span>
                            </td>
                            <td className="text-end pe-3">
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-primary p-0 me-2 text-decoration-none"
                                onClick={() => handleOpenEdit(u)}
                                title="Edit password or details"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                                onClick={() => handleDelete(u)}
                                title="Delete account"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-white px-4 py-2 border-top d-flex justify-content-between">
            <div className="small text-muted">
              💡 <em>Once created, the IQAC coordinator can sign in to the main appraisal portal and create faculty & auditors.</em>
            </div>
            <button type="button" className="btn btn-secondary px-4 fw-semibold" onClick={onClose}>
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
