import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
import { User } from '../../types';
import UsuarioModal from './UsuarioModal';
import UsuarioList from './UsuarioList';
import './Equipe.css';

const Equipe: React.FC = () => {
  const { usuarios, deleteUsuario, refreshData, loading, user } = useApp();
  const { canAccess, canCreate, canEdit, canDelete } = usePermissions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<User | null>(null);

  // Debug para diagnosticar problema da lista vazia
  React.useEffect(() => {
    console.log('🔍 [EQUIPE] Debug completo:', {
      usuariosCarregados: usuarios.length,
      loading,
      usuarioLogado: user ? `${user.nome} (${user.tipoUsuario})` : 'Nenhum',
      token: localStorage.getItem('token') ? 'Presente' : 'Ausente',
      permissaoEquipe: canAccess('equipe')
    });
    
    if (usuarios.length === 0 && !loading) {
      console.warn('⚠️ [EQUIPE] Lista de usuários está vazia - tentando forçar carregamento...');
      setTimeout(() => {
        handleRefreshData();
      }, 1000);
    }
  }, [usuarios, loading, user]);

  // Verificar se o usuário tem permissão para acessar este módulo
  if (!canAccess('equipe')) {
    return (
      <div className="access-denied">
        <h1>Acesso Negado</h1>
        <p>Você não tem permissão para acessar esta seção.</p>
      </div>
    );
  }

  const handleNewUsuario = () => {
    if (!canCreate('equipe')) {
      alert('Você não tem permissão para criar usuários.');
      return;
    }
    setEditingUsuario(null);
    setModalOpen(true);
  };

  const handleEditUsuario = (usuario: User) => {
    if (!canEdit('equipe')) {
      alert('Você não tem permissão para editar usuários.');
      return;
    }
    setEditingUsuario(usuario);
    setModalOpen(true);
  };

  const handleDeleteUsuario = (id: number) => {
    if (!canDelete('equipe')) {
      alert('Você não tem permissão para excluir usuários.');
      return;
    }
    
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      deleteUsuario(id);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUsuario(null);
  };

  const handleRefreshData = async () => {
    console.log('🔄 Forçando atualização dos dados...');
    await refreshData();
  };

  // Função de debug removida - sistema usa APENAS usuários reais do backend

  return (
    <div className="equipe">
      <div className="equipe-header">
        <h1 className="equipe-title">Gerenciamento de Equipe</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleRefreshData}
            disabled={loading}
            style={{ 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            <span className="material-icons" style={{ fontSize: '18px', marginRight: '5px' }}>
              refresh
            </span>
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
          {canCreate('equipe') && (
            <button className="btn btn-primary" onClick={handleNewUsuario}>
              <span className="material-icons">person_add</span>
              Novo Usuário
            </button>
          )}
        </div>
      </div>

      <div className="equipe-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-icons">people</span>
          </div>
          <div className="stat-content">
            <h3>{usuarios.length}</h3>
            <p>Total de Usuários</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-icons">admin_panel_settings</span>
          </div>
          <div className="stat-content">
            <h3>{usuarios.filter(u => u.tipoUsuario === 'Gestor').length}</h3>
            <p>Gestores</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-icons">account_balance</span>
          </div>
          <div className="stat-content">
            <h3>{usuarios.filter(u => u.tipoUsuario === 'Financeiro').length}</h3>
            <p>Financeiro</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">
            <span className="material-icons">person</span>
          </div>
          <div className="stat-content">
            <h3>{usuarios.filter(u => u.tipoUsuario === 'Comum').length}</h3>
            <p>Usuários Comuns</p>
          </div>
        </div>
      </div>

      {/* Debug removido - sistema usa APENAS usuários reais do backend */}
      
      {/* Informação temporária de debug */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          background: '#f0f8ff', 
          border: '1px solid #0066cc', 
          padding: '10px', 
          margin: '10px 0',
          borderRadius: '4px',
          fontSize: '14px'
        }}>
          <strong>Debug Info:</strong> {usuarios.length} usuários carregados | 
          Loading: {loading ? 'Sim' : 'Não'} | 
          Token: {localStorage.getItem('token') ? 'Presente' : 'Ausente'}
          <br />
          <button 
            onClick={() => {
              console.log('🔍 Estado atual dos usuários:', usuarios);
              console.log('🔍 Token:', localStorage.getItem('token')?.substring(0, 30) + '...');
            }}
            style={{ marginTop: '5px', padding: '4px 8px', fontSize: '12px' }}
          >
            Log Debug
          </button>
        </div>
      )}

      <UsuarioList
        usuarios={usuarios}
        onEdit={handleEditUsuario}
        onDelete={handleDeleteUsuario}
        canEdit={canEdit('equipe')}
        canDelete={canDelete('equipe')}
      />

      {modalOpen && (
        <UsuarioModal
          usuario={editingUsuario}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default Equipe;

