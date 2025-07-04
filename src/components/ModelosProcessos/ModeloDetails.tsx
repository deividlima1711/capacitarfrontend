import React from 'react';
import { ModeloProcesso } from '../../types';

interface ModeloDetailsProps {
  modelo: ModeloProcesso;
  onEdit: () => void;
  onDelete: () => void;
  onBack: () => void;
}

const ModeloDetails: React.FC<ModeloDetailsProps> = ({
  modelo,
  onEdit,
  onDelete,
  onBack
}) => {
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
    <div className="modelo-details">
      <div className="details-header">
        <div className="header-info">
          <button className="btn-secondary" onClick={onBack}>
            <span className="material-icons">arrow_back</span>
            Voltar
          </button>
          <div className="breadcrumb">
            <span>Home</span>
            <span className="material-icons">chevron_right</span>
            <span>Modelos de processos</span>
            <span className="material-icons">chevron_right</span>
            <span>{modelo.nome}</span>
          </div>
        </div>
        
        <div className="header-actions">
          <button className="btn-secondary" onClick={onEdit}>
            <span className="material-icons">edit</span>
            Editar
          </button>
          <button className="btn-danger" onClick={onDelete}>
            <span className="material-icons">delete</span>
            Remover
          </button>
        </div>
      </div>

      <div className="modelo-info">
        <div className="info-header">
          <h1>{modelo.nome}</h1>
          <span className={`status-badge ${modelo.ativo ? 'active' : 'inactive'}`}>
            {modelo.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        <div className="info-details">
          <div className="detail-item">
            <span className="label">Criado por:</span>
            <span className="value">{modelo.criadoPor} em {formatDate(modelo.dataCriacao)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Última edição por:</span>
            <span className="value">{modelo.ultimaEdicaoPor} em {formatDate(modelo.dataUltimaEdicao)}</span>
          </div>
          <div className="detail-item">
            <span className="label">Total de atividades:</span>
            <span className="value">{modelo.totalAtividades}</span>
          </div>
        </div>
      </div>

      <div className="atividades-section">
        <h2>Atividades do modelo</h2>
        
        <div className="atividades-container">
          {modelo.atividades.map((atividade, index) => (
            <div key={atividade.id} className="atividade-detail-card">
              <div className="atividade-detail-header">
                <div className="atividade-title">
                  <span className="atividade-number">{atividade.ordem}</span>
                  <h3>{atividade.nome}</h3>
                </div>
              </div>

              <div className="atividade-detail-content">
                <div className="detail-row">
                  <div className="detail-column">
                    <span className="detail-label">Cargos executores:</span>
                    <div className="cargos-list">
                      {atividade.cargosExecutores.map((cargo, i) => (
                        <span key={i} className="cargo-tag">{cargo}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-column">
                    <span className="detail-label">Usuários adicionais executores:</span>
                    <span className="detail-value">
                      {atividade.usuariosAdicionais.length > 0 
                        ? atividade.usuariosAdicionais.join(', ')
                        : 'Nenhum'
                      }
                    </span>
                  </div>
                </div>

                {atividade.descricao && (
                  <div className="detail-row">
                    <div className="detail-column">
                      <span className="detail-label">Descrição:</span>
                      <p className="detail-description">{atividade.descricao}</p>
                    </div>
                  </div>
                )}

                <div className="detail-row">
                  <div className="detail-column">
                    <span className="detail-label">Anexos:</span>
                    <span className="detail-value">
                      {atividade.anexos && atividade.anexos.length > 0 
                        ? atividade.anexos.join(', ')
                        : 'Nenhum'
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModeloDetails;

