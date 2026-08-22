import React, { useState, useEffect } from 'react';
import {
  getVersionTree,
  publishVersion,
  createSection,
  updateSection,
  deleteSection,
  createTable,
  updateTable,
  deleteTable,
  createField,
  updateField,
  deleteField,
} from '../api/adminApi';

export const FormBuilderCanvas = ({
  versionId,
  onPublishSuccess,
  onOpenPreview,
  onBackToSchemas,
}) => {
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [publishMessage, setPublishMessage] = useState(null);

  // Active navigation selection
  const [activeSectionId, setActiveSectionId] = useState(null);

  // Section Modal State
  const [sectionModal, setSectionModal] = useState({
    show: false,
    isEdit: false,
    data: { id: null, title: '', sectionNumber: '', ownerRole: 'director-schools', description: '' },
  });

  // Table Modal State
  const [tableModal, setTableModal] = useState({
    show: false,
    sectionId: null,
    isEdit: false,
    data: { id: null, title: '', tableKey: '', isRepeatable: true, showTitle: true },
  });

  // Field / Column Modal State
  const [fieldModal, setFieldModal] = useState({
    show: false,
    sectionId: null,
    tableId: null,
    isEdit: false,
    data: {
      id: null,
      label: '',
      fieldKey: '',
      fieldType: 'TEXT',
      isRequired: false,
      placeholder: '',
      optionsString: '',
    },
  });

  const loadTree = async () => {
    if (!versionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getVersionTree(versionId);
      setTree(data);
      if (data.sections && data.sections.length > 0 && !activeSectionId) {
        setActiveSectionId(data.sections[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load form tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTree();
  }, [versionId]);

  // Section Handlers
  const handleOpenAddSection = () => {
    setSectionModal({
      show: true,
      isEdit: false,
      data: { id: null, title: '', sectionNumber: '', ownerRole: 'director-schools', description: '' },
    });
  };

  const handleOpenEditSection = (sec) => {
    setSectionModal({
      show: true,
      isEdit: true,
      data: {
        id: sec.id,
        title: sec.title,
        sectionNumber: sec.number || '',
        ownerRole: sec.ownerRole || 'director-schools',
        description: sec.description || '',
      },
    });
  };

  const handleSaveSection = async (e) => {
    e.preventDefault();
    try {
      if (sectionModal.isEdit) {
        await updateSection(sectionModal.data.id, {
          title: sectionModal.data.title,
          sectionNumber: sectionModal.data.sectionNumber,
          ownerRole: sectionModal.data.ownerRole,
          description: sectionModal.data.description,
        });
      } else {
        await createSection({
          versionId: versionId,
          title: sectionModal.data.title,
          sectionNumber: sectionModal.data.sectionNumber,
          ownerRole: sectionModal.data.ownerRole,
          description: sectionModal.data.description,
        });
      }
      setSectionModal({ ...sectionModal, show: false });
      await loadTree();
    } catch (err) {
      alert('Error saving section: ' + err.message);
    }
  };

  const handleDeleteSection = async (secId) => {
    if (!confirm('Are you sure you want to delete this entire section and all its tables?')) return;
    try {
      await deleteSection(secId);
      await loadTree();
    } catch (err) {
      alert('Error deleting section: ' + err.message);
    }
  };

  // Table Handlers
  const handleOpenAddTable = (secId) => {
    setTableModal({
      show: true,
      sectionId: secId,
      isEdit: false,
      data: { id: null, title: '', tableKey: '', isRepeatable: true, showTitle: true },
    });
  };

  const handleOpenEditTable = (tbl, secId) => {
    setTableModal({
      show: true,
      sectionId: secId,
      isEdit: true,
      data: {
        id: tbl.id,
        title: tbl.title,
        tableKey: tbl.tableKey,
        isRepeatable: tbl.isRepeatable ?? true,
        showTitle: tbl.showTitle ?? true,
      },
    });
  };

  const handleSaveTable = async (e) => {
    e.preventDefault();
    try {
      if (tableModal.isEdit) {
        await updateTable(tableModal.data.id, {
          title: tableModal.data.title,
          tableKey: tableModal.data.tableKey,
          isRepeatable: tableModal.data.isRepeatable,
          showTitle: tableModal.data.showTitle,
        });
      } else {
        await createTable({
          sectionId: tableModal.sectionId,
          title: tableModal.data.title,
          tableKey: tableModal.data.tableKey,
          isRepeatable: tableModal.data.isRepeatable,
          showTitle: tableModal.data.showTitle,
        });
      }
      setTableModal({ ...tableModal, show: false });
      await loadTree();
    } catch (err) {
      alert('Error saving table: ' + err.message);
    }
  };

  const handleDeleteTable = async (tblId) => {
    if (!confirm('Are you sure you want to delete this table?')) return;
    try {
      await deleteTable(tblId);
      await loadTree();
    } catch (err) {
      alert('Error deleting table: ' + err.message);
    }
  };

  // Field Handlers
  const handleOpenAddField = (secId, tblId = null) => {
    setFieldModal({
      show: true,
      sectionId: secId,
      tableId: tblId,
      isEdit: false,
      data: {
        id: null,
        label: '',
        fieldKey: '',
        fieldType: 'TEXT',
        isRequired: false,
        placeholder: '',
        optionsString: '',
      },
    });
  };

  const handleOpenEditField = (f, secId, tblId = null) => {
    setFieldModal({
      show: true,
      sectionId: secId,
      tableId: tblId,
      isEdit: true,
      data: {
        id: f.id,
        label: f.label || '',
        fieldKey: f.fieldKey || '',
        fieldType: f.fieldType || 'TEXT',
        isRequired: f.isRequired ?? false,
        placeholder: f.placeholder || '',
        optionsString: Array.isArray(f.options) ? f.options.join(', ') : '',
      },
    });
  };

  const handleSaveField = async (e) => {
    e.preventDefault();
    try {
      const opts = fieldModal.data.optionsString
        ? JSON.stringify(fieldModal.data.optionsString.split(',').map((s) => s.trim()).filter(Boolean))
        : null;

      if (fieldModal.isEdit) {
        await updateField(fieldModal.data.id, {
          label: fieldModal.data.label,
          fieldKey: fieldModal.data.fieldKey,
          fieldType: fieldModal.data.fieldType,
          isRequired: fieldModal.data.isRequired,
          placeholder: fieldModal.data.placeholder,
          options: opts,
        });
      } else {
        await createField({
          sectionId: fieldModal.sectionId,
          tableId: fieldModal.tableId,
          label: fieldModal.data.label,
          fieldKey: fieldModal.data.fieldKey,
          fieldType: fieldModal.data.fieldType,
          isRequired: fieldModal.data.isRequired,
          placeholder: fieldModal.data.placeholder,
          options: opts,
        });
      }
      setFieldModal({ ...fieldModal, show: false });
      await loadTree();
    } catch (err) {
      alert('Error saving field: ' + err.message);
    }
  };

  const handleDeleteField = async (fId) => {
    if (!confirm('Are you sure you want to delete this field/column?')) return;
    try {
      await deleteField(fId);
      await loadTree();
    } catch (err) {
      alert('Error deleting field: ' + err.message);
    }
  };

  // Publish
  const handlePublish = async () => {
    if (!confirm('Publishing will freeze this schema version and activate it immediately for all contributors. Continue?')) {
      return;
    }
    setPublishing(true);
    setPublishMessage(null);
    try {
      const published = await publishVersion(versionId, 'admin');
      setPublishMessage('✅ Schema version published and activated successfully!');
      if (onPublishSuccess) onPublishSuccess(published);
      await loadTree();
    } catch (err) {
      alert('Publish Failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <p className="text-muted mt-2">Loading Form Studio Tree...</p>
      </div>
    );
  }

  if (error || !tree) {
    return (
      <div className="container py-5 text-center">
        <div className="alert alert-danger">{error || 'Version tree not found'}</div>
        <button className="btn btn-secondary" onClick={onBackToSchemas}>
          Back to Schemas
        </button>
      </div>
    );
  }

  const currentSection = tree.sections?.find((s) => s.id === activeSectionId) || tree.sections?.[0];

  return (
    <div className="container-fluid p-0">
      {/* Top Toolbar */}
      <div className="bg-white border-bottom px-4 py-3 d-flex justify-content-between align-items-center shadow-sm">
        <div className="d-flex align-items-center gap-3">
          <button className="btn btn-sm btn-outline-secondary" onClick={onBackToSchemas}>
            ← Back
          </button>
          <div>
            <h5 className="fw-bold text-dark mb-0">{tree.title}</h5>
            <span className="badge bg-warning text-dark me-2">Draft Version {tree.versionNumber}</span>
            <small className="text-muted">Type: {tree.auditType?.toUpperCase()}</small>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {publishMessage && <span className="text-success fw-semibold small me-2">{publishMessage}</span>}
          <button
            type="button"
            className="btn btn-outline-primary fw-semibold"
            onClick={() => onOpenPreview(versionId)}
          >
            👁️ Interactive Preview
          </button>
          <button
            type="button"
            className="btn btn-success fw-bold px-4"
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? 'Publishing...' : '🚀 Publish & Activate Version'}
          </button>
        </div>
      </div>

      {/* Main 2-Pane Editor Layout */}
      <div className="row g-0">
        {/* Left Tree Navigator */}
        <div className="col-md-3 builder-tree-panel p-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="fw-bold text-secondary text-uppercase small mb-0">Form Structure</h6>
            <button
              type="button"
              className="btn btn-sm btn-primary py-1 px-2"
              onClick={handleOpenAddSection}
            >
              + Section
            </button>
          </div>

          <div className="list-group list-group-flush">
            {tree.sections?.map((sec, idx) => {
              const isSelected = sec.id === currentSection?.id;
              return (
                <div
                  key={sec.id}
                  className={`list-group-item tree-node-item p-2 mb-1 rounded border-0 ${
                    isSelected ? 'active' : ''
                  }`}
                  onClick={() => setActiveSectionId(sec.id)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-truncate fw-semibold" style={{ maxWidth: '180px' }}>
                      <span className="badge bg-light text-dark me-1">{sec.number || idx + 1}</span>
                      {sec.title}
                    </div>
                    <span className="badge bg-secondary rounded-pill small">
                      {sec.tables?.length || 0} tbls
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Canvas / Section Editor */}
        <div className="col-md-9 builder-canvas-panel p-4">
          {currentSection ? (
            <div>
              {/* Section Header Card */}
              <div className="card-builder p-4 mb-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <span className="badge bg-primary px-2 py-1 mb-2">
                      Section {currentSection.number || 'A'}
                    </span>
                    <h4 className="fw-bold text-dark mb-1">{currentSection.title}</h4>
                    <p className="text-muted small mb-0">
                      Owner Role: <strong>{currentSection.ownerRole || 'director-schools'}</strong>
                    </p>
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => handleOpenEditSection(currentSection)}
                    >
                      ✏️ Edit Section Info
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-danger"
                      onClick={() => handleDeleteSection(currentSection.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Top-Level Fields in Section */}
              <div className="card-builder p-3 mb-4 shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="fw-bold text-dark mb-0">📌 Header Fields (Non-table Inputs)</h6>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleOpenAddField(currentSection.id, null)}
                  >
                    + Add Header Field
                  </button>
                </div>

                {currentSection.fields && currentSection.fields.length > 0 ? (
                  <div className="row g-2">
                    {currentSection.fields.map((f) => (
                      <div key={f.id} className="col-md-6">
                        <div className="p-2 border rounded bg-light d-flex justify-content-between align-items-center">
                          <div>
                            <span className="fw-bold small">{f.label}</span>
                            <span className="badge bg-info text-dark ms-2 small">{f.fieldType}</span>
                            {f.isRequired && <span className="text-danger ms-1">*</span>}
                          </div>
                          <div className="btn-group btn-group-sm">
                            <button
                              type="button"
                              className="btn btn-light btn-sm text-secondary"
                              onClick={() => handleOpenEditField(f, currentSection.id, null)}
                            >
                              ✏️
                            </button>
                            <button
                              type="button"
                              className="btn btn-light btn-sm text-danger"
                              onClick={() => handleDeleteField(f.id)}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted small mb-0">No header fields configured in this section.</p>
                )}
              </div>

              {/* Tables in Section */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0">📊 Tables in Section</h5>
                <button
                  type="button"
                  className="btn btn-primary btn-sm px-3"
                  onClick={() => handleOpenAddTable(currentSection.id)}
                >
                  + Add New Table
                </button>
              </div>

              {currentSection.tables && currentSection.tables.length > 0 ? (
                currentSection.tables.map((tbl, tIdx) => (
                  <div key={tbl.id} className="card-builder p-4 mb-4 shadow-sm">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="fw-bold text-dark mb-1">
                          {tbl.title || `Table ${tIdx + 1}`}
                        </h6>
                        <small className="text-muted">
                          Key: <code>{tbl.tableKey}</code> |{' '}
                          {tbl.isRepeatable ? 'Dynamic Rows' : 'Fixed Form'}
                        </small>
                      </div>
                      <div className="d-flex gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleOpenAddField(currentSection.id, tbl.id)}
                        >
                          + Add Column
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => handleOpenEditTable(tbl, currentSection.id)}
                        >
                          ✏️ Edit Table
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDeleteTable(tbl.id)}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Columns List / Visual Grid Preview */}
                    <div className="border rounded p-2 bg-light">
                      <div className="d-flex flex-wrap gap-2 align-items-center">
                        <span className="small fw-semibold text-secondary me-2">Columns:</span>
                        {tbl.fields && tbl.fields.length > 0 ? (
                          tbl.fields.map((col) => (
                            <span
                              key={col.id}
                              className="badge bg-white text-dark border p-2 d-inline-flex align-items-center gap-2 shadow-xs"
                            >
                              <span>{col.label || col.fieldKey}</span>
                              <span className="badge bg-primary small">{col.fieldType}</span>
                              <button
                                type="button"
                                className="btn btn-link p-0 text-secondary"
                                onClick={() => handleOpenEditField(col, currentSection.id, tbl.id)}
                                title="Edit Column"
                              >
                                ✏️
                              </button>
                              <button
                                type="button"
                                className="btn btn-link p-0 text-danger"
                                onClick={() => handleDeleteField(col.id)}
                                title="Delete Column"
                              >
                                ✕
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-danger small">⚠️ No columns defined. Add columns to allow data entry.</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="card shadow-sm p-4 text-center bg-white border-0">
                  <p className="text-muted mb-2">No tables created in this section yet.</p>
                  <div>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleOpenAddTable(currentSection.id)}
                    >
                      + Create First Table
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">Select or add a section to start editing.</p>
            </div>
          )}
        </div>
      </div>

      {/* Section Modal */}
      {sectionModal.show && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  {sectionModal.isEdit ? '✏️ Edit Section' : '➕ Add New Section'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSectionModal({ ...sectionModal, show: false })}
                ></button>
              </div>
              <form onSubmit={handleSaveSection}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Section Title*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Part A - Academic Activities"
                      required
                      value={sectionModal.data.title}
                      onChange={(e) =>
                        setSectionModal({
                          ...sectionModal,
                          data: { ...sectionModal.data, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Section Number/Code</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. A, B, 1, 2"
                        value={sectionModal.data.sectionNumber}
                        onChange={(e) =>
                          setSectionModal({
                            ...sectionModal,
                            data: { ...sectionModal.data, sectionNumber: e.target.value },
                          })
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Owner Role</label>
                      <select
                        className="form-select"
                        value={sectionModal.data.ownerRole}
                        onChange={(e) =>
                          setSectionModal({
                            ...sectionModal,
                            data: { ...sectionModal.data, ownerRole: e.target.value },
                          })
                        }
                      >
                        <option value="director-schools">Director / Dean</option>
                        <option value="registrar">Registrar</option>
                        <option value="hr">HR Office</option>
                        <option value="dean-student-welfare">Dean Student Welfare</option>
                        <option value="dean-placement">Dean Placement</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Optional section description..."
                      value={sectionModal.data.description}
                      onChange={(e) =>
                        setSectionModal({
                          ...sectionModal,
                          data: { ...sectionModal.data, description: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setSectionModal({ ...sectionModal, show: false })}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4">
                    Save Section
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Table Modal */}
      {tableModal.show && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  {tableModal.isEdit ? '✏️ Edit Table' : '➕ Add New Table'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setTableModal({ ...tableModal, show: false })}
                ></button>
              </div>
              <form onSubmit={handleSaveTable}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Table Title*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 1. Research Publications in UGC CARE / Scopus"
                      required
                      value={tableModal.data.title}
                      onChange={(e) =>
                        setTableModal({
                          ...tableModal,
                          data: { ...tableModal.data, title: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Unique Table Key</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. researchPublications (auto-generated if empty)"
                      value={tableModal.data.tableKey}
                      onChange={(e) =>
                        setTableModal({
                          ...tableModal,
                          data: { ...tableModal.data, tableKey: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="repeatableCheck"
                      checked={tableModal.data.isRepeatable}
                      onChange={(e) =>
                        setTableModal({
                          ...tableModal,
                          data: { ...tableModal.data, isRepeatable: e.target.checked },
                        })
                      }
                    />
                    <label className="form-check-label fw-semibold" htmlFor="repeatableCheck">
                      Allow adding dynamic rows (Dynamic Repeatable Table)
                    </label>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setTableModal({ ...tableModal, show: false })}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4">
                    Save Table
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Field / Column Modal */}
      {fieldModal.show && (
        <div
          className="modal fade show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow-lg border-0" style={{ borderRadius: '12px' }}>
              <div className="modal-header bg-light">
                <h5 className="modal-title fw-bold">
                  {fieldModal.isEdit ? '✏️ Edit Field / Column' : '➕ Add Field / Column'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setFieldModal({ ...fieldModal, show: false })}
                ></button>
              </div>
              <form onSubmit={handleSaveField}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Label / Column Header*</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Title of Paper, Date of Meeting, Link for Document"
                      required
                      value={fieldModal.data.label}
                      onChange={(e) =>
                        setFieldModal({
                          ...fieldModal,
                          data: { ...fieldModal.data, label: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Field Type*</label>
                    <select
                      className="form-select"
                      value={fieldModal.data.fieldType}
                      onChange={(e) =>
                        setFieldModal({
                          ...fieldModal,
                          data: { ...fieldModal.data, fieldType: e.target.value },
                        })
                      }
                    >
                      <option value="TEXT">Short Text</option>
                      <option value="NUMBER">Number</option>
                      <option value="DATE">Date Picker</option>
                      <option value="SELECT">Dropdown (Select)</option>
                      <option value="TEXTAREA">Multi-line Textarea</option>
                      <option value="ATTACHMENT">File / Document Attachment</option>
                      <option value="EMAIL">Email</option>
                      <option value="URL">Web URL</option>
                    </select>
                  </div>

                  {fieldModal.data.fieldType === 'SELECT' && (
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Dropdown Options (Comma-separated)*</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Available, Not Available OR SC, ST, OBC, General"
                        required
                        value={fieldModal.data.optionsString}
                        onChange={(e) =>
                          setFieldModal({
                            ...fieldModal,
                            data: { ...fieldModal.data, optionsString: e.target.value },
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="reqCheck"
                      checked={fieldModal.data.isRequired}
                      onChange={(e) =>
                        setFieldModal({
                          ...fieldModal,
                          data: { ...fieldModal.data, isRequired: e.target.checked },
                        })
                      }
                    />
                    <label className="form-check-label fw-semibold" htmlFor="reqCheck">
                      Required Field
                    </label>
                  </div>
                </div>
                <div className="modal-footer bg-light">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setFieldModal({ ...fieldModal, show: false })}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary px-4">
                    Save Field
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
