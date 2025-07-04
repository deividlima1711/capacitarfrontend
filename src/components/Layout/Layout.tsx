import React, { useState } from 'react';
import { User, Processo, Tarefa } from '../../types';
import { usePermissions } from '../../hooks/usePermissions';
import { useApp } from '../../contexts/AppContext';
import GlobalSearchResults from './GlobalSearchResults';
import './Layout.css';
import './GlobalSearchResults.css';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  currentSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  user,
  currentSection,
  onSectionChange,
  onLogout,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { canAccess, userType } = usePermissions();
  const { notificacoes, markNotificationAsRead, usuarios, processos, tarefas } = useApp();

  const allMenuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
    { id: 'processos', label: 'Processos', icon: 'assignment', badge: 0 },
    { id: 'tarefas', label: 'Tarefas', icon: 'check_circle', badge: 0 },
    { id: 'equipe', label: 'Equipe', icon: 'people' },
    { id: 'modelos-processos', label: 'Modelos de Processos', icon: 'account_tree' },
    { id: 'relatorios', label: 'Relatórios', icon: 'assessment' },
    { id: 'configuracoes', label: 'Configurações', icon: 'settings' },
  ];

  // Filtrar itens do menu baseado nas permissões
  const menuItems = allMenuItems.filter(item => canAccess(item.id));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowResults(true);
  };

  // Filtros de busca geral
  const filteredUsers = usuarios.filter(u =>
    searchQuery && (
      u.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  const filteredProcessos = processos.filter(p =>
    searchQuery && (
      p.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.descricao?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );
  const filteredTarefas = tarefas.filter(t =>
    searchQuery && (
      t.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.descricao?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Navegação ao clicar no resultado
  const handleNavigate = (type: 'user' | 'processo' | 'tarefa', id: string | number) => {
    setShowResults(false);
    setSearchQuery('');
    if (type === 'user') {
      onSectionChange('equipe');
      // Poderia abrir modal de usuário, se existir
    } else if (type === 'processo') {
      onSectionChange('processos');
      // Poderia abrir detalhes do processo, se existir
    } else if (type === 'tarefa') {
      onSectionChange('tarefas');
      // Poderia abrir detalhes da tarefa, se existir
    }
  };

  const getUserTypeDisplay = () => {
    switch (userType) {
      case 'Gestor':
        return 'Gestor do Sistema';
      case 'Financeiro':
        return 'Usuário Financeiro';
      case 'Comum':
        return 'Usuário Comum';
      default:
        return user.cargo || user.role;
    }
  };

  // Notificações do usuário logado
  const minhasNotificacoes = notificacoes.filter(n => n.usuarioId === user.id);
  const notificacoesNaoLidas = minhasNotificacoes.filter(n => !n.lida);

  return (
    <div className="app-container">
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'active' : ''}`}>
        <div className="logo" style={{ padding: '16px', textAlign: 'center' }}>
          <img
            src="/Logo.png"
            alt="Capacitar"
            style={{ height: '100px', objectFit: 'contain', maxWidth: '100%' }}
          />
        </div>
        
        <ul className="main-menu">
          {menuItems.map((item) => (
            <li key={item.id} className={currentSection === item.id ? 'active' : ''}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSectionChange(item.id);
                  setSidebarOpen(false);
                }}
              >
                <span className="material-icons">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="badge">{item.badge}</span>
                )}
              </a>
            </li>
          ))}
        </ul>

        <div className="user-info">
          <div className="user-info-details">
            <div className="avatar">
              <img src={user.avatar || "https://cdn-icons-png.flaticon.com/512/9131/9131546.png"} alt="Avatar" />
            </div>
            <div>
              <h3>{user.nome || user.username}</h3>
              <p>{getUserTypeDisplay()}</p>
            </div>
          </div>
          <button className="user-profile-btn" onClick={onLogout}>
            <span className="material-icons">logout</span>
            Sair
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        <div className="header">
          <button 
            className="menu-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span className="material-icons">menu</span>
          </button>
          
          <div className="header-welcome">
            Bem-vindo, {user.nome || user.username}!
          </div>

          {/* Search */}
          <form className="search-container" onSubmit={handleSearch} style={{ position: 'relative' }}>
            <span className="material-icons search-icon">search</span>
            <input
              type="text"
              className="search-input"
              placeholder="Buscar processos, tarefas ou usuários..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value);
                setShowResults(!!e.target.value);
              }}
              onFocus={() => setShowResults(!!searchQuery)}
              autoComplete="off"
            />
            {showResults && (
              <GlobalSearchResults
                query={searchQuery}
                users={filteredUsers}
                processos={filteredProcessos}
                tarefas={filteredTarefas}
                onNavigate={handleNavigate}
              />
            )}
          </form>

          {/* Header Actions */}
          <div className="header-actions">
            <div className="notification-container">
              <button 
                className="notification-btn"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
              >
                <span className="material-icons">notifications</span>
                {notificacoesNaoLidas.length > 0 && (
                  <span className="notification-badge">{notificacoesNaoLidas.length}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className="notification-dropdown">
                  <div className="notification-header">Notificações</div>
                  <div className="notification-list">
                    {minhasNotificacoes.length === 0 ? (
                      <div className="notification-empty">Nenhuma notificação</div>
                    ) : (
                      minhasNotificacoes.slice().reverse().map((n) => (
                        <div key={n.id} className={`notification-item${n.lida ? '' : ' unread'}`}
                          onClick={() => markNotificationAsRead(n.id)}
                          style={{ cursor: 'pointer', padding: 8, borderBottom: '1px solid #eee', background: n.lida ? '#fff' : '#e3f2fd' }}
                        >
                          <div style={{ fontWeight: 600 }}>{n.titulo}</div>
                          <div style={{ fontSize: 13 }}>{n.mensagem}</div>
                          <div style={{ fontSize: 11, color: '#888' }}>{new Date(n.criadoEm).toLocaleString('pt-BR')}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="avatar">
              <img src={user.avatar || "https://cdn-icons-png.flaticon.com/512/9131/9131546.png"} alt="Avatar" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="content">
          {children}
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

