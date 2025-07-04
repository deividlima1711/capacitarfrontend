import React from 'react';
import { User } from '../../types';

interface UsuarioListProps {
  usuarios: User[];
  onEdit: (usuario: User) => void;
  onDelete: (id: number) => void;
  canEdit: boolean;
  canDelete: boolean;
}

const UsuarioList: React.FC<UsuarioListProps> = ({
  usuarios,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
}) => {
  const getTipoUsuarioColor = (tipo?: string) => {
    switch (tipo) {
      case 'Gestor':
        return 'tipo-gestor';
      case 'Financeiro':
        return 'tipo-financeiro';
      case 'Comum':
        return 'tipo-comum';
      default:
        return 'tipo-comum';
    }
  };

  const getTipoUsuarioIcon = (tipo?: string) => {
    switch (tipo) {
      case 'Gestor':
        return 'admin_panel_settings';
      case 'Financeiro':
        return 'account_balance';
      case 'Comum':
        return 'person';
      default:
        return 'person';
    }
  };

  if (usuarios.length === 0) {
    return (
      <div className="empty-state">
        <span className="material-icons">people_outline</span>
        <h3>Nenhum usuário encontrado</h3>
        <p>Comece adicionando o primeiro usuário à equipe.</p>
      </div>
    );
  }

  return (
    <div className="usuario-list">
      <div className="list-header">
        <h2>Usuários ({usuarios.length})</h2>
      </div>

      <div className="usuario-table">
        <div className="table-header">
          <div className="table-cell">Usuário</div>
          <div className="table-cell">Email</div>
          <div className="table-cell">Tipo</div>
          <div className="table-cell">Departamento</div>
          <div className="table-cell">Cargo</div>
          <div className="table-cell">Ações</div>
        </div>

        {usuarios.map((usuario) => (
          <div key={usuario.id} className="table-row">
            <div className="table-cell user-info">
              <div className="user-avatar">
                {usuario.avatar ? (
                  <img src={usuario.avatar} alt={usuario.nome} />
                ) : (
                  <div className="avatar-placeholder">
                    {usuario.nome.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="user-details">
                <div className="user-name">{usuario.nome}</div>
                <div className="user-username">@{usuario.username}</div>
              </div>
            </div>

            <div className="table-cell">
              <span className="user-email">{usuario.email}</span>
            </div>

            <div className="table-cell">
              <span className={`tipo-badge ${getTipoUsuarioColor(usuario.tipoUsuario)}`}>
                <span className="material-icons">{getTipoUsuarioIcon(usuario.tipoUsuario)}</span>
                {usuario.tipoUsuario || 'Comum'}
              </span>
            </div>

            <div className="table-cell">
              <span className="departamento">{usuario.departamento || '-'}</span>
            </div>

            <div className="table-cell">
              <span className="cargo">{usuario.cargo || '-'}</span>
            </div>

            <div className="table-cell actions">
              {canEdit && (
                <button
                  className="btn-icon btn-edit"
                  onClick={() => onEdit(usuario)}
                  title="Editar usuário"
                >
                  <span className="material-icons">edit</span>
                </button>
              )}
              {canDelete && (
                <button
                  className="btn-icon btn-delete"
                  onClick={() => onDelete(usuario.id)}
                  title="Excluir usuário"
                >
                  <span className="material-icons">delete</span>
                </button>
              )}
              {!canEdit && !canDelete && (
                <span className="no-actions">-</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UsuarioList;

