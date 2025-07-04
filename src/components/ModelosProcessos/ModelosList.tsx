import React, { useState } from 'react';
import { ModeloProcesso } from '../../types';

interface ModelosListProps {
  modelos: ModeloProcesso[];
  onCreateModelo: () => void;
  onEditModelo: (modelo: ModeloProcesso) => void;
  onViewModelo: (modelo: ModeloProcesso) => void;
  onDeleteModelo: (id: number) => void;
  loading: boolean;
}

const ModelosList: React.FC<ModelosListProps> = ({
  modelos,
  onCreateModelo,
  onEditModelo,
  onViewModelo,
  onDeleteModelo,
  loading
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyActive, setShowOnlyActive] = useState(true);

  const filteredModelos = modelos.filter(modelo => {
    const matchesSearch = modelo.nome.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesActive = !showOnlyActive || modelo.ativo;
    return matchesSearch && matchesActive;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="modelos-list">
      <div className="list-controls">
        <button className="btn-primary" onClick={onCreateModelo}>
          <span className="material-icons">add</span>
          Novo Modelo
        </button>
        
        <div className="search-filters">
          <div className="search-container">
            <span className="material-icons">search</span>
            <input
              type="text"
              placeholder="Pesquise pelo nome do modelo"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="filter-container">
            <label className="filter-label">
              <input
                type="checkbox"
                checked={showOnlyActive}
                onChange={(e) => setShowOnlyActive(e.target.checked)}
              />
              Somente ativos
            </label>
          </div>
        </div>
      </div>

      <div className="modelos-table-container">
        <table className="modelos-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Criação</th>
              <th>Última edição</th>
              <th>Atividades</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredModelos.length === 0 ? (
              <tr>
                <td colSpan={6} className="no-data">
                  {searchTerm ? 'Nenhum modelo encontrado' : 'Nenhum modelo cadastrado'}
                </td>
              </tr>
            ) : (
              filteredModelos.map(modelo => (
                <tr key={modelo.id}>
                  <td>
                    <div className="modelo-name">
                      <strong>{modelo.nome}</strong>
                    </div>
                  </td>
                  <td>
                    <div className="creation-info">
                      <div>{modelo.criadoPor}</div>
                      <small>{formatDate(modelo.dataCriacao)}</small>
                    </div>
                  </td>
                  <td>
                    <div className="edition-info">
                      <div>{modelo.ultimaEdicaoPor}</div>
                      <small>{formatDate(modelo.dataUltimaEdicao)}</small>
                    </div>
                  </td>
                  <td>
                    <span className="activities-count">{modelo.totalAtividades}</span>
                  </td>
                  <td>
                    <span className={`status-badge ${modelo.ativo ? 'active' : 'inactive'}`}>
                      {modelo.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-icon"
                        onClick={() => onViewModelo(modelo)}
                        title="Ver detalhes"
                      >
                        <span className="material-icons">visibility</span>
                      </button>
                      <button
                        className="btn-icon"
                        onClick={() => onEditModelo(modelo)}
                        title="Editar modelo"
                      >
                        <span className="material-icons">edit</span>
                      </button>
                      <button
                        className="btn-icon btn-danger"
                        onClick={() => onDeleteModelo(modelo.id)}
                        title="Remover modelo"
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredModelos.length > 0 && (
        <div className="table-footer">
          <span>Total: {filteredModelos.length} modelo(s)</span>
        </div>
      )}
    </div>
  );
};

export default ModelosList;

