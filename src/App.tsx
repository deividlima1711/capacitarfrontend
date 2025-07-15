import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './contexts/AppContext';
import Login from './components/Login';
import Layout from './components/Layout/Layout';
import Dashboard from './components/Dashboard/Dashboard';
import Processos from './components/Processos/Processos';
import Tarefas from './components/Tarefas/Tarefas';
import Equipe from './components/Equipe/Equipe';
import Relatorios from './components/Relatorios/Relatorios';
import ModelosProcessos from './components/ModelosProcessos/ModelosProcessos';
import OfflineNotification from './components/OfflineNotification';
import TestAnexoManager from './TestAnexoManager';
import { validateBackendConfig, enforceRealUsersOnly } from './utils/backendConfig';
import { initializeRealUsersOnly } from './config/realUsersOnly';
import { User } from './types';
import './App.css';

const Configuracoes: React.FC = () => (
  <div className="section-placeholder">
    <h1>Configurações</h1>
    <p>Seção de configurações em desenvolvimento...</p>
  </div>
);

const AppContent: React.FC = () => {
  const { user, setUser } = useApp();
  const [currentSection, setCurrentSection] = useState('dashboard');

  // Verificar se há usuário logado ao inicializar
  useEffect(() => {
    // GARANTIR que sistema use APENAS usuários reais do backend
    initializeRealUsersOnly();
    enforceRealUsersOnly();
    validateBackendConfig();
    validateBackendConfig();
    
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    
    if (savedUser && savedToken && !user) {
      try {
        const userData = JSON.parse(savedUser);
        console.log('🔄 Recuperando sessão de usuário real:', userData.nome);
        setUser(userData);
      } catch (error) {
        console.error('❌ Erro ao recuperar dados do usuário:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
  }, [user, setUser]);

  const handleLoginSuccess = (userData: User, userToken: string) => {
    console.log('✅ Login bem-sucedido para usuário real:', userData.nome);
    setUser(userData);
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    console.log('👋 Fazendo logout do usuário real');
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('useMockData'); // Garantir limpeza
    setCurrentSection('dashboard');
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <Dashboard />;
      case 'processos':
        return <Processos />;
      case 'tarefas':
        return <Tarefas />;
      case 'equipe':
        return <Equipe />;
      case 'relatorios':
        return <Relatorios />;
      case 'modelos-processos':
        return <ModelosProcessos />;
      case 'configuracoes':
        return <Configuracoes />;
      case 'test-anexos':
        return <TestAnexoManager />;
      default:
        return <Dashboard />;
    }
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <Layout
      user={user}
      currentSection={currentSection}
      onSectionChange={setCurrentSection}
      onLogout={handleLogout}
    >
      {renderCurrentSection()}
    </Layout>
  );
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento inicial
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando ProcessFlow...</p>
        </div>
      </div>
    );
  }

  return (
    <AppProvider>
      <div className="App">
        <OfflineNotification />
        <AppContent />
      </div>
    </AppProvider>
  );
}

export default App;

