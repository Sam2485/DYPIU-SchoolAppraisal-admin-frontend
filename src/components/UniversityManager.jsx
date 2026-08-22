import React, { useState } from 'react';
import { createUniversity, updateUniversity } from '../api/adminApi';

export const UniversityManager = ({
  universities = [],
  onReload,
  onSelectUniversity,
  selectedUniversity,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUniversity, setEditingUniversity] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    domain: '',
    address: '',
    establishmentAct: '',
    primaryColor: '#2563eb',
    logoUrl: '',
    iqacLogoUrl: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleOpenCreate = () => {
    setEditingUniversity(null);
    setFormData({
      code: '',
      name: '',
      domain: '',
      address: '',
      establishmentAct: '',
      primaryColor: '#2563eb',
      logoUrl: '',
      iqacLogoUrl: '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (u) => {
    setEditingUniversity(u);
    setFormData({
      code: u.code || '',
      name: u.name || '',
      domain: u.domain || '',
      address: u.address || '',
      establishmentAct: u.establishmentAct || '',
      primaryColor: u.primaryColor || '#2563eb',
      logoUrl: u.logoUrl || '',
      iqacLogoUrl: u.iqacLogoUrl || '',
    });
    setError(null);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (editingUniversity) {
        await updateUniversity(editingUniversity.id, formData);
      } else {
        await createUniversity(formData);
      }
      setShowModal(false);
      await onReload();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save university');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">🏛️ Universities & Tenants</h3>
          <p className="text-muted mb-0">
            Configure multi-tenant institutions, branding, and schema isolation.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary px-3 py-2 fw-semibold"
          onClick={handleOpenCreate}
        >
          + Onboard New University
        </button>
      </div>

      <div className="row g-4">
        {universities.map((u) => {
          const isSelected = selectedUniversity?.id === u.id;
          return (
            <div key={u.id} className="col-md-6 col-lg-4">
              <div
                className={`card h-100 shadow-sm border-2 ${
                  isSelected ? 'border-primary' : 'border-light'
                }`}
                style={{ borderRadius: '12px' }}
              >
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className="badge bg-secondary text-uppercase fw-bold px-2 py-1">
                      {u.code}
                    </span>
                    <span className="badge bg-success">ACTIVE</span>
                  </div>

                  <h5 className="card-title fw-bold text-dark mb-1">{u.name}</h5>
                  <p className="text-muted small mb-2">{u.domain || 'No domain configured'}</p>

                  <div className="small text-secondary mb-3 flex-grow-1">
                    <p className="mb-1 text-truncate">📍 {u.address || 'Address not specified'}</p>
                    {u.establishmentAct && (
                      <p className="mb-0 text-truncate fst-italic">📜 {u.establishmentAct}</p>
                    )}
                  </div>

                  <div className="d-flex gap-2 pt-2 border-top">
                    <button
                      type="button"
                      className={`btn btn-sm flex-grow-1 ${
                        isSelected ? 'btn-primary' : 'btn-outline-primary'
                      }`}
                      onClick={() => onSelectUniversity(u)}
                    >
                      {isSelected ? '✓ Selected' : 'Select'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => handleOpenEdit(u)}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  {editingUniversity ? '✏️ Edit University' : '🏛️ Onboard New University'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {error && <div className="alert alert-danger py-2">{error}</div>}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">University Code (Unique identifier)*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. apex_uni, mit_wpu"
                      disabled={Boolean(editingUniversity)}
                      required
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    />
                    <small className="text-muted">Lowercase, alphanumeric without spaces.</small>
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">University Full Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Apex Global University"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Domain</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. apex.edu.in"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Campus Address</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Campus address..."
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Establishment Act / Authority</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Maharashtra Act No. XX of 2020"
                      value={formData.establishmentAct}
                      onChange={(e) => setFormData({ ...formData, establishmentAct: e.target.value })}
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Primary Brand Color</label>
                      <input
                        type="color"
                        className="form-control form-control-color w-100"
                        value={formData.primaryColor}
                        onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Logo URL</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="https://..."
                        value={formData.logoUrl}
                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                    {loading ? 'Saving...' : editingUniversity ? 'Update University' : 'Create & Initialize'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
