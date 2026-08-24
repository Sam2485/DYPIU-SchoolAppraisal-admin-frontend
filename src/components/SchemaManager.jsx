import React, { useState, useEffect } from 'react';
import {
  getSchemas,
  getSchemaDetails,
  createSchema,
  deleteSchema,
  createDraftVersion,
  deleteVersion,
  rollbackVersion,
} from '../api/adminApi';

export const SchemaManager = ({
  selectedUniversity,
  onOpenBuilder,
  onOpenPreview,
}) => {
  const [schemas, setSchemas] = useState([]);
  const [selectedSchema, setSelectedSchema] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSchemaForm, setNewSchemaForm] = useState({
    auditType: 'academic',
    name: '',
    description: '',
  });

  const loadSchemas = async () => {
    if (!selectedUniversity) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSchemas(selectedUniversity.id, selectedUniversity.code);
      setSchemas(data);
      if (data.length > 0) {
        handleSelectSchema(data[0]);
      } else {
        setSelectedSchema(null);
        setVersions([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to load schemas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemas();
  }, [selectedUniversity]);

  const handleSelectSchema = async (s) => {
    setSelectedSchema(s);
    try {
      const details = await getSchemaDetails(s.id);
      setVersions(details.versions || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateDraft = async (schemaId) => {
    try {
      const draft = await createDraftVersion(schemaId, 'admin');
      await handleSelectSchema(selectedSchema);
      onOpenBuilder(draft.id);
    } catch (err) {
      alert('Error creating draft: ' + err.message);
    }
  };

  const handleRollback = async (targetVersionId) => {
    if (!confirm('Are you sure you want to rollback the active form to Version ' + targetVersionId + '?')) {
      return;
    }
    try {
      await rollbackVersion(selectedSchema.id, targetVersionId);
      await loadSchemas();
      alert('Rollback successful.');
    } catch (err) {
      alert('Error rolling back: ' + err.message);
    }
  };

  const handleDeleteSchema = async (schema) => {
    if (!window.confirm(`Are you sure you want to permanently delete the Form Schema "${schema.name}" and all its versions?`)) {
      return;
    }
    try {
      await deleteSchema(schema.id);
      await loadSchemas();
    } catch (err) {
      alert('Failed to delete schema: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteVersion = async (version) => {
    if (!window.confirm(`Are you sure you want to delete Version V${version.versionNumber} (${version.status})?`)) {
      return;
    }
    try {
      await deleteVersion(version.id);
      if (selectedSchema) {
        await handleSelectSchema(selectedSchema);
      }
      await loadSchemas();
    } catch (err) {
      alert('Failed to delete version: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCreateSchemaSubmit = async (e) => {
    e.preventDefault();
    try {
      await createSchema({
        ...newSchemaForm,
        universityId: selectedUniversity.id,
      });
      setShowCreateModal(false);
      await loadSchemas();
    } catch (err) {
      alert('Failed to create schema: ' + err.message);
    }
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-dark mb-1">📋 Schemas & Versions</h3>
          <p className="text-muted mb-0">
            Manage form definitions and version lifecycles for{' '}
            <strong className="text-primary">{selectedUniversity?.name}</strong>.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary px-3 py-2 fw-semibold"
          onClick={() => setShowCreateModal(true)}
        >
          + Create New Form Schema
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"></div>
        </div>
      ) : schemas.length === 0 ? (
        <div className="card shadow-sm p-5 text-center bg-white border-0" style={{ borderRadius: '12px' }}>
          <h4>No form schemas found for this university</h4>
          <p className="text-muted">Create your first Academic or Administrative audit schema to begin.</p>
          <div>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              + Create First Form Schema
            </button>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {/* Left Column: Schema List */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
              <div className="card-header bg-light py-3">
                <h6 className="mb-0 fw-bold text-dark">Form Schemas</h6>
              </div>
              <div className="list-group list-group-flush">
                {schemas.map((s) => {
                  const isSelected = selectedSchema?.id === s.id;
                  return (
                    <div
                      key={s.id}
                      className={`list-group-item list-group-item-action p-3 d-flex justify-content-between align-items-center ${
                        isSelected ? 'bg-primary text-white active' : ''
                      }`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleSelectSchema(s)}
                    >
                      <div style={{ flex: 1 }}>
                        <div className="fw-bold">{s.name}</div>
                        <small className={isSelected ? 'text-white-50' : 'text-muted'}>
                          Type: {s.auditType.toUpperCase()}
                        </small>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <span
                          className={`badge ${
                            isSelected ? 'bg-light text-primary' : 'bg-secondary'
                          }`}
                        >
                          v{s.activeVersionNumber || 1} Active
                        </span>
                        <button
                          type="button"
                          className={`btn btn-sm p-1 ${isSelected ? 'text-white' : 'text-danger'}`}
                          style={{ border: 'none', background: 'transparent' }}
                          title={`Delete "${s.name}"`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSchema(s);
                          }}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Version History & Actions */}
          <div className="col-md-8">
            {selectedSchema && (
              <div className="card shadow-sm border-0" style={{ borderRadius: '12px' }}>
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold text-dark mb-0">{selectedSchema.name}</h5>
                    <small className="text-muted">
                      Active Version: <strong>V{selectedSchema.activeVersionNumber || 1}</strong>
                    </small>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm px-3 fw-bold"
                      onClick={() => handleDeleteSchema(selectedSchema)}
                      title="Delete this entire schema and all its versions"
                    >
                      🗑️ Delete Schema
                    </button>
                    <button
                      type="button"
                      className="btn btn-success btn-sm px-3 fw-bold"
                      onClick={() => handleCreateDraft(selectedSchema.id)}
                    >
                      + Open / Create Draft Version
                    </button>
                  </div>
                </div>

                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-hover mb-0 align-middle">
                      <thead className="table-light">
                        <tr>
                          <th>Version</th>
                          <th>Status</th>
                          <th>Academic Year</th>
                          <th>Published By</th>
                          <th>Published Date</th>
                          <th className="text-end">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {versions.map((v) => {
                          const isDraft = String(v.status || '').toUpperCase() === 'DRAFT';
                          const isActive = v.id === selectedSchema.activeVersionId;
                          return (
                            <tr key={v.id}>
                              <td className="fw-bold">
                                V{v.versionNumber}{' '}
                                {isActive && <span className="badge bg-primary ms-1">ACTIVE</span>}
                              </td>
                              <td>
                                <span
                                  className={`badge ${
                                    isDraft
                                      ? 'bg-warning text-dark'
                                      : isActive
                                      ? 'bg-success'
                                      : 'bg-secondary'
                                  }`}
                                >
                                  {v.status}
                                </span>
                              </td>
                              <td>{v.academicYear || '2025-26'}</td>
                              <td>{v.publishedBy || '-'}</td>
                              <td>
                                {v.publishedAt
                                  ? new Date(v.publishedAt).toLocaleDateString()
                                  : '-'}
                              </td>
                              <td className="text-end">
                                <div className="btn-group btn-group-sm">
                                  {isDraft ? (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-primary"
                                        onClick={() => onOpenBuilder(v.id)}
                                      >
                                        🛠️ Edit Draft
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-outline-danger"
                                        onClick={() => handleDeleteVersion(v)}
                                        title="Delete this draft version"
                                      >
                                        🗑️
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-outline-secondary"
                                        onClick={() => onOpenPreview(v.id)}
                                      >
                                        👁️ View
                                      </button>
                                      {!isActive && (
                                        <button
                                          type="button"
                                          className="btn btn-outline-warning"
                                          onClick={() => handleRollback(v.id)}
                                        >
                                          Rollback to this
                                        </button>
                                      )}
                                      {versions.length > 1 && (
                                        <button
                                          type="button"
                                          className="btn btn-outline-danger"
                                          onClick={() => handleDeleteVersion(v)}
                                          title="Delete this version"
                                        >
                                          🗑️
                                        </button>
                                      )}
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Schema Modal */}
      {showCreateModal && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">📋 Create New Form Schema</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                ></button>
              </div>
              <form onSubmit={handleCreateSchemaSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Audit Type*</label>
                    <select
                      className="form-select"
                      value={newSchemaForm.auditType}
                      onChange={(e) =>
                        setNewSchemaForm({ ...newSchemaForm, auditType: e.target.value })
                      }
                    >
                      <option value="academic">Academic Audit</option>
                      <option value="administrative">Administrative Audit</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Schema Title / Name*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Annual Academic Appraisal 2025-26"
                      required
                      value={newSchemaForm.name}
                      onChange={(e) =>
                        setNewSchemaForm({ ...newSchemaForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Form description..."
                      value={newSchemaForm.description}
                      onChange={(e) =>
                        setNewSchemaForm({ ...newSchemaForm, description: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4">
                    Create Schema & V1 Draft
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
