import React, { useState, useEffect } from 'react';
import { getUniversities } from './api/adminApi';
import { Navbar } from './components/Navbar';
import { UniversityManager } from './components/UniversityManager';
import { SchemaManager } from './components/SchemaManager';
import { FormBuilderCanvas } from './components/FormBuilderCanvas';
import { LiveFormPreview } from './components/LiveFormPreview';
import { UniversityLeadershipModal } from './components/UniversityLeadershipModal';

export default function App() {
  const [universities, setUniversities] = useState([]);
  const [selectedUniversity, setSelectedUniversity] = useState(null);
  const [leadershipModalUni, setLeadershipModalUni] = useState(null);
  const [currentTab, setCurrentTab] = useState('schemas'); // 'universities', 'schemas', 'builder', 'preview'
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUniversities = async () => {
    try {
      const data = await getUniversities();
      setUniversities(data);
      if (data.length > 0) {
        if (!selectedUniversity) {
          const dypiu = data.find((u) => u.code === 'dypiu') || data[0];
          setSelectedUniversity(dypiu);
        } else {
          const updated = data.find((u) => u.id === selectedUniversity.id) || data[0];
          setSelectedUniversity(updated);
        }
      }
    } catch (err) {
      console.error('Failed to load universities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUniversities();
  }, []);

  const handleOpenBuilder = (versionId) => {
    setActiveVersionId(versionId);
    setCurrentTab('builder');
  };

  const handleOpenPreview = (versionId) => {
    setActiveVersionId(versionId);
    setCurrentTab('preview');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="text-center">
          <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
          <h5 className="fw-bold text-dark">Initializing Appraisal Form Studio...</h5>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 d-flex flex-column">
      <Navbar
        universities={universities}
        selectedUniversity={selectedUniversity}
        onSelectUniversity={(u) => {
          setSelectedUniversity(u);
          if (currentTab === 'builder' || currentTab === 'preview') {
            setCurrentTab('schemas');
          }
        }}
        currentTab={currentTab}
        onChangeTab={setCurrentTab}
        onOpenNewUniversity={() => setCurrentTab('universities')}
        onOpenLeadership={(u) => setLeadershipModalUni(u)}
      />

      <main className="flex-grow-1">
        {currentTab === 'universities' && (
          <UniversityManager
            universities={universities}
            onReload={loadUniversities}
            onSelectUniversity={(u) => {
              setSelectedUniversity(u);
              setCurrentTab('schemas');
            }}
            selectedUniversity={selectedUniversity}
          />
        )}

        {currentTab === 'schemas' && (
          <SchemaManager
            selectedUniversity={selectedUniversity}
            onOpenBuilder={handleOpenBuilder}
            onOpenPreview={handleOpenPreview}
          />
        )}

        {currentTab === 'builder' && (
          <FormBuilderCanvas
            versionId={activeVersionId}
            onPublishSuccess={(published) => {
              // Stay on builder or go to preview
            }}
            onOpenPreview={handleOpenPreview}
            onBackToSchemas={() => setCurrentTab('schemas')}
          />
        )}

        {currentTab === 'preview' && (
          <LiveFormPreview
            versionId={activeVersionId}
            onBack={() => setCurrentTab('builder')}
          />
        )}
      </main>

      {/* Quick Access Leadership Modal */}
      <UniversityLeadershipModal
        university={leadershipModalUni}
        isOpen={!!leadershipModalUni}
        onClose={() => {
          setLeadershipModalUni(null);
          loadUniversities();
        }}
      />
    </div>
  );
}
