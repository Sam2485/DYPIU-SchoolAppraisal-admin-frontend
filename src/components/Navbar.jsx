import React from 'react';

export const Navbar = ({
  universities = [],
  selectedUniversity = null,
  onSelectUniversity,
  onOpenNewUniversity,
  onOpenLeadership,
}) => {
  return (
    <nav className="navbar navbar-expand-lg navbar-dark studio-navbar px-4 py-3 sticky-top shadow" style={{ background: 'linear-gradient(90deg, #0f172a 0%, #1e293b 100%)' }}>
      <div className="container-fluid p-0">
        {/* Brand */}
        <div className="d-flex align-items-center me-4">
          <span className="fs-3 me-2">🏛️</span>
          <div>
            <span className="navbar-brand fw-bold mb-0 text-white fs-5">
              Appraisal SaaS Super Admin
            </span>
            <span className="badge bg-primary ms-2 small">Platform Console</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="d-flex align-items-center ms-auto gap-3">
          <div className="text-white-50 small me-2">
            Registered Universities: <strong className="text-white">{universities.length}</strong>
          </div>

          <button
            className="btn btn-sm btn-primary fw-bold px-3 py-2 shadow-sm"
            type="button"
            onClick={onOpenNewUniversity}
          >
            ➕ Onboard New University
          </button>

          {selectedUniversity && (
            <button
              className="btn btn-sm btn-warning text-dark fw-bold px-3 py-2 shadow-sm"
              type="button"
              onClick={() => onOpenLeadership(selectedUniversity)}
              title="Provision IQAC and VC Accounts for this University"
            >
              👥 Provision Leadership ({selectedUniversity.code?.toUpperCase()})
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};
