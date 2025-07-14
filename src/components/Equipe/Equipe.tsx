import React, { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { usePermissions } from '../../hooks/usePermissions';
import { User } from '../../types';
import UsuarioModal from './UsuarioModal';
import UsuarioList from './UsuarioList';
import './Equipe.css';

const Equipe: React.FC = () => {
  const { usuarios, deleteUsuario } = useApp();
  const { canAccess, canCreate, canEdit, canDelete } = usePermissions();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<User | null>(null);

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

  // Função de debug removida - sistema usa APENAS usuários reais do backend

  return (
    <div className="equipe">
      <div className="equipe-header">
        <h1 className="equipe-title">Gerenciamento de Equipe</h1>
        {canCreate('equipe') && (
          <button className="btn btn-primary" onClick={handleNewUsuario}>
            <span className="material-icons">person_add</span>
            Novo Usuário
          </button>
        )}
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

