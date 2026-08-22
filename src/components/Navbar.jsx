import React from 'react';

export const Navbar = ({
  universities = [],
  selectedUniversity = null,
  onSelectUniversity,
  currentTab,
  onChangeTab,
  onOpenNewUniversity,
}) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark studio-navbar px-4 py-2 sticky-top shadow">
      <div className="container-fluid p-0">
        {/* Brand */}
        <div className="d-flex align-items-center me-4">
          <span className="fs-4 me-2">⚡</span>
          <div>
            <span className="navbar-brand fw-bold mb-0 text-white fs-5">
              Appraisal Form Studio
            </span>
            <span className="badge bg-primary ms-2 small">Multi-University</span>
          </div>
        </div>

        {/* University Selector Dropdown */}
        <div className="d-flex align-items-center me-auto">
          <div className="input-group input-group-sm">
            <span className="input-group-text bg-secondary text-white border-0 fw-semibold">
              🏛️ University:
            </span>
            <select
              className="form-select form-select-sm bg-dark text-white border-secondary fw-semibold"
              value={selectedUniversity?.id || ''}
              onChange={(e) => {
                const found = universities.find((u) => u.id === Number(e.target.value));
                if (found) onSelectUniversity(found);
              }}
              style={{ minWidth: '220px' }}
            >
              {universities.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.code.toUpperCase()})
                </option>
              ))}
            </select>
            <button
              className="btn btn-sm btn-outline-light border-secondary"
              type="button"
              onClick={onOpenNewUniversity}
              title="Add New University"
            >
              + New University
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            className={`btn btn-sm ${
              currentTab === 'universities' ? 'btn-light text-dark fw-bold' : 'btn-outline-light'
            }`}
            onClick={() => onChangeTab('universities')}
          >
            🏢 Universities
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              currentTab === 'schemas' ? 'btn-light text-dark fw-bold' : 'btn-outline-light'
            }`}
            onClick={() => onChangeTab('schemas')}
          >
            📋 Schemas & Versions
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              currentTab === 'builder' ? 'btn-primary fw-bold' : 'btn-outline-light'
            }`}
            onClick={() => onChangeTab('builder')}
          >
            🛠️ Form Builder
          </button>
          <button
            type="button"
            className={`btn btn-sm ${
              currentTab === 'preview' ? 'btn-success fw-bold' : 'btn-outline-light'
            }`}
            onClick={() => onChangeTab('preview')}
          >
            👁️ Live Preview
          </button>
        </div>
      </div>
    </nav>
  );
};
