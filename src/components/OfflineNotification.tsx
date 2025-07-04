import React, { useState, useEffect } from 'react';
import { shouldUseMockData, setMockDataMode } from '../utils/mockData';

const OfflineNotification: React.FC = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    const checkOfflineMode = () => {
      const usingMockData = shouldUseMockData();
      setIsOffline(usingMockData);
      setShowNotification(usingMockData);
    };

    // Verificar inicialmente
    checkOfflineMode();

    // Verificar periodicamente
    const interval = setInterval(checkOfflineMode, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleRetryConnection = () => {
    setMockDataMode(false);
    window.location.reload();
  };

  const handleDismiss = () => {
    setShowNotification(false);
  };

  if (!showNotification) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: '#f59e0b',
      color: 'white',
      padding: '12px 16px',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-icons" style={{ fontSize: '20px' }}>
          cloud_off
        </span>
        <span>
          <strong>Modo Offline:</strong> A aplicação está funcionando com dados locais. 
          Algumas funcionalidades podem estar limitadas.
        </span>
      </div>
      
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={handleRetryConnection}
          style={{
            backgroundColor: 'rgba(255,255,255,0.2)',
            border: '1px solid rgba(255,255,255,0.3)',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Tentar Reconectar
        </button>
        
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px'
          }}
        >
          <span className="material-icons" style={{ fontSize: '18px' }}>
            close
          </span>
        </button>
      </div>
    </div>
  );
};

export default OfflineNotification;

