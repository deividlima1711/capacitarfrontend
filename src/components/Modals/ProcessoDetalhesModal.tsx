import React, { useState } from 'react';
import { Processo, Tarefa } from '../../types';
import { useApp } from '../../contexts/AppContext';
import './Modal.css';

interface ProcessoDetalhesModalProps {
  processo: Processo | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProcessoDetalhesModal: React.FC<ProcessoDetalhesModalProps> = ({
  processo,
  isOpen,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'tarefas' | 'timeline' | 'comentarios'>('tarefas');
  const [novoComentario, setNovoComentario] = useState('');
  const [anexos, setAnexos] = useState<Array<{id: number, nome: string, tipo: string, tamanho: string, data: string}>>([]);
  const { tarefas, usuarios, addTarefa, updateTarefa, deleteTarefa } = useApp();

  // Mock de timeline/histórico - Vamos criar um sistema mais dinâmico
  const [timeline, setTimeline] = useState([
    {
      id: 1,
      data: new Date().toLocaleString('pt-BR'),
      usuario: 'Administrador',
      acao: 'Processo criado',
      detalhes: processo ? `Processo "${processo.titulo}" foi criado` : 'Processo criado',
      tipo: 'criacao',
      icone: '🆕'
    },
    {
      id: 2,
      data: new Date(Date.now() - 2 * 60 * 60 * 1000).toLocaleString('pt-BR'),
      usuario: 'Administrador',
      acao: 'Status alterado',
      detalhes: processo ? `Status alterado para "${processo.status}"` : 'Status alterado',
      tipo: 'status',
      icone: '🔄'
    },
    {
      id: 3,
      data: new Date(Date.now() - 4 * 60 * 60 * 1000).toLocaleString('pt-BR'),
      usuario: 'Administrador',
      acao: 'Tarefa adicionada',
      detalhes: 'Nova tarefa foi associada ao processo',
      tipo: 'tarefa',
      icone: '📋'
    },
    {
      id: 4,
      data: new Date(Date.now() - 6 * 60 * 60 * 1000).toLocaleString('pt-BR'),
      usuario: 'Administrador',
      acao: 'Progresso atualizado',
      detalhes: processo ? `Progresso atualizado para ${processo.progresso}%` : 'Progresso atualizado',
      tipo: 'progresso',
      icone: '📊'
    },
    {
      id: 5,
      data: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleString('pt-BR'),
      usuario: 'Sistema',
      acao: 'Lembrete de prazo',
      detalhes: 'Lembrete automático: prazo se aproximando',
      tipo: 'lembrete',
      icone: '⏰'
    }
  ]);

  // Mock de comentários
  const [comentarios, setComentarios] = useState([
    {
      id: 1,
      data: '2025-06-09 09:45',
      usuario: 'Administrador',
      texto: 'Processo iniciado conforme planejamento.'
    }
  ]);

  if (!isOpen || !processo) return null;

  // Filtrar tarefas associadas ao processo
  const tarefasAssociadas = tarefas.filter(tarefa => tarefa.processoId === processo.id);

  // Função para obter nome do responsável
  const getResponsavelNome = (responsavelId: number) => {
    const usuario = usuarios.find(u => u.id === responsavelId);
    return usuario?.nome || 'Não atribuído';
  };

  // Funções para gerenciar tarefas
  const handleAddTarefa = () => {
    const novaTarefa = {
      titulo: 'Nova Tarefa',
      descricao: '',
      status: 'pendente' as const,
      prioridade: 'media' as const,
      responsavelId: 1, // Admin por padrão
      processoId: processo.id,
      dataInicio: new Date().toISOString().split('T')[0],
      prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 dias
      progresso: 0,
      estimativaHoras: 8,
      horasGastas: 0,
      tags: []
    };
    addTarefa(novaTarefa);
  };

  // Função para alterar status da tarefa
  const handleAlterarStatusTarefa = (tarefa: Tarefa, novoStatus: 'pendente' | 'em-andamento' | 'concluido' | 'atrasado') => {
    const novoProgresso = novoStatus === 'concluido' ? 100 : novoStatus === 'em-andamento' ? 50 : 0;
    updateTarefa(tarefa.id, { 
      status: novoStatus,
      progresso: novoProgresso
    });

    // Adicionar evento na timeline
    const novoEvento = {
      id: timeline.length + 1,
      data: new Date().toLocaleString('pt-BR'),
      usuario: 'Administrador',
      acao: 'Status da tarefa alterado',
      detalhes: `Tarefa "${tarefa.titulo}" alterada para ${getStatusLabel(novoStatus)}`,
      tipo: 'status',
      icone: '🔄'
    };
    setTimeline([novoEvento, ...timeline]);
  };

  const handleEditTarefa = (tarefa: Tarefa) => {
    // Por simplicidade, vamos apenas alternar entre alguns status
    const statusSequence = ['pendente', 'em-andamento', 'concluido'];
    const currentIndex = statusSequence.indexOf(tarefa.status);
    const nextStatus = statusSequence[(currentIndex + 1) % statusSequence.length];
    
    handleAlterarStatusTarefa(tarefa, nextStatus as 'pendente' | 'em-andamento' | 'concluido' | 'atrasado');
  };

  const handleToggleTarefa = (tarefa: Tarefa) => {
    const novoStatus = tarefa.status === 'concluido' ? 'pendente' : 'concluido';
    handleAlterarStatusTarefa(tarefa, novoStatus);
  };

  const handleRemoveTarefa = (tarefaId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta tarefa?')) {
      deleteTarefa(tarefaId);
      
      // Adicionar evento na timeline
      const novoEvento = {
        id: timeline.length + 1,
        data: new Date().toLocaleString('pt-BR'),
        usuario: 'Administrador',
        acao: 'Tarefa removida',
        detalhes: 'Uma tarefa foi removida do processo',
        tipo: 'remocao',
        icone: '🗑️'
      };
      setTimeline([novoEvento, ...timeline]);
    }
  };

  const handleAddComentario = () => {
    if (novoComentario.trim()) {
      const novoComent = {
        id: comentarios.length + 1,
        data: new Date().toLocaleString('pt-BR'),
        usuario: 'Administrador',
        texto: novoComentario
      };
      setComentarios([...comentarios, novoComent]);
      setNovoComentario('');

      // Adicionar evento na timeline
      const novoEvento = {
        id: timeline.length + 1,
        data: new Date().toLocaleString('pt-BR'),
        usuario: 'Administrador',
        acao: 'Comentário adicionado',
        detalhes: `Novo comentário: "${novoComentario.substring(0, 50)}${novoComentario.length > 50 ? '...' : ''}"`,
        tipo: 'comentario',
        icone: '💬'
      };
      setTimeline([novoEvento, ...timeline]);
    }
  };

  // Função para adicionar anexos
  const handleAddAnexo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const novoAnexo = {
          id: anexos.length + 1,
          nome: file.name,
          tipo: file.type || 'application/octet-stream',
          tamanho: formatFileSize(file.size),
          data: new Date().toLocaleString('pt-BR')
        };
        setAnexos(prev => [...prev, novoAnexo]);

        // Adicionar evento na timeline
        const novoEvento = {
          id: timeline.length + 1,
          data: new Date().toLocaleString('pt-BR'),
          usuario: 'Administrador',
          acao: 'Anexo adicionado',
          detalhes: `Arquivo "${file.name}" foi anexado`,
          tipo: 'anexo',
          icone: '📎'
        };
        setTimeline([novoEvento, ...timeline]);
      });
    }
    // Limpar o input
    event.target.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusLabel = (status: string): string => {
    const statusMap = {
      'pendente': 'Pendente',
      'em-andamento': 'Em Andamento',
      'concluido': 'Concluído',
      'atrasado': 'Atrasado'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      'pendente': { class: 'pendente', label: 'Pendente' },
      'em-andamento': { class: 'in-progress', label: 'Em Andamento' },
      'concluido': { class: 'completed', label: 'Concluído' },
      'atrasado': { class: 'delayed', label: 'Atrasado' },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pendente;
    
    return (
      <span className={`chip-status ${statusInfo.class}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getFileIcon = (tipo: string): string => {
    if (tipo.includes('image')) return '🖼️';
    if (tipo.includes('pdf')) return '📄';
    if (tipo.includes('word')) return '📝';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return '📊';
    if (tipo.includes('zip') || tipo.includes('rar')) return '📦';
    return '📎';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Processo: {processo.titulo}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'tarefas' ? 'active' : ''}`}
            onClick={() => setActiveTab('tarefas')}
          >
            Tarefas
          </button>
          <button
            className={`tab-button ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            Timeline
          </button>
          <button
            className={`tab-button ${activeTab === 'comentarios' ? 'active' : ''}`}
            onClick={() => setActiveTab('comentarios')}
          >
            Comentários
          </button>
        </div>

        <div className="modal-body">
          {activeTab === 'tarefas' && (
          <div className="tab-content">
            <div className="tab-header">
              <h3>Tarefas Associadas</h3>
              <button 
                className="btn btn-primary btn-sm"
                onClick={() => handleAddTarefa()}
              >
                + Adicionar Tarefa
              </button>
            </div>
            
            {tarefasAssociadas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📋</div>
                <p>Nenhuma tarefa associada a este processo.</p>
                <small>Clique em "Adicionar Tarefa" para começar</small>
              </div>
            ) : (
              <div className="tarefas-list">
                {tarefasAssociadas.map((tarefa) => (
                  <div key={tarefa.id} className="tarefa-item">
                    <div className="tarefa-checkbox">
                      <input 
                        type="checkbox" 
                        checked={tarefa.status === 'concluido'}
                        onChange={() => handleToggleTarefa(tarefa)}
                      />
                    </div>
                    <div className="tarefa-content">
                      <h4>{tarefa.titulo}</h4>
                      <div className="tarefa-meta">
                        <span className="tarefa-status">
                          Status: {getStatusBadge(tarefa.status)}
                        </span>
                        <span className="tarefa-prazo">
                          Prazo: {new Date(tarefa.prazo).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="tarefa-responsavel">
                          Responsável: {getResponsavelNome(tarefa.responsavelId)}
                        </span>
                      </div>
                      {tarefa.descricao && (
                        <p className="tarefa-descricao">{tarefa.descricao}</p>
                      )}
                      <div className="tarefa-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${tarefa.progresso}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{tarefa.progresso}%</span>
                      </div>
                      
                      {/* Controles de Status */}
                      <div className="tarefa-status-controls">
                        <label>Alterar Status:</label>
                        <div className="status-buttons">
                          <button 
                            className={`btn-status ${tarefa.status === 'pendente' ? 'active' : ''}`}
                            onClick={() => handleAlterarStatusTarefa(tarefa, 'pendente')}
                          >
                            📋 Pendente
                          </button>
                          <button 
                            className={`btn-status ${tarefa.status === 'em-andamento' ? 'active' : ''}`}
                            onClick={() => handleAlterarStatusTarefa(tarefa, 'em-andamento')}
                          >
                            ⚡ Em Andamento
                          </button>
                          <button 
                            className={`btn-status ${tarefa.status === 'concluido' ? 'active' : ''}`}
                            onClick={() => handleAlterarStatusTarefa(tarefa, 'concluido')}
                          >
                            ✅ Concluído
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="tarefa-actions">
                      <button 
                        className="btn-icon btn-primary" 
                        title="Editar"
                        onClick={() => handleEditTarefa(tarefa)}
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-icon btn-danger" 
                        title="Remover"
                        onClick={() => handleRemoveTarefa(tarefa.id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

          {activeTab === 'timeline' && (
            <div className="tab-content">
              <div className="tab-header">
                <h3>Timeline (Histórico)</h3>
                <small className="timeline-info">
                  {timeline.length} eventos registrados
                </small>
              </div>
              
              {timeline.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⏰</div>
                  <p>Nenhum histórico registrado.</p>
                  <small>Os eventos aparecerão aqui conforme as ações forem realizadas</small>
                </div>
              ) : (
                <div className="timeline-list">
                  {timeline.map((item) => (
                    <div key={item.id} className={`timeline-item timeline-${item.tipo}`}>
                      <div className="timeline-marker">
                        <span className="timeline-icon">{item.icone}</span>
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-header">
                          <div className="timeline-action">
                            <strong>{item.acao}</strong>
                            <span className="timeline-user">por {item.usuario}</span>
                          </div>
                          <span className="timeline-date">{item.data}</span>
                        </div>
                        <p className="timeline-details">{item.detalhes}</p>
                        <div className="timeline-badge">
                          <span className={`badge badge-${item.tipo}`}>
                            {item.tipo.charAt(0).toUpperCase() + item.tipo.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comentarios' && (
            <div className="tab-content">
              <div className="tab-header">
                <h3>Comentários</h3>
                <small className="comentarios-info">
                  {comentarios.length} comentário{comentarios.length !== 1 ? 's' : ''}
                </small>
              </div>
              
              <div className="comentarios-form">
                <div className="form-user">
                  <div className="user-avatar">
                    <img 
                      src="https://cdn-icons-png.flaticon.com/512/9131/9131546.png" 
                      alt="Avatar" 
                    />
                    <span>Administrador</span>
                  </div>
                </div>
                <textarea
                  value={novoComentario}
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Escreva um comentário sobre este processo..."
                  rows={3}
                  className="comentario-input"
                />
                
                {/* Sistema de Anexos */}
                <div className="anexos-section">
                  <div className="anexos-upload">
                    <input
                      type="file"
                      id="anexo-input"
                      multiple
                      onChange={handleAddAnexo}
                      style={{ display: 'none' }}
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar"
                    />
                    <label htmlFor="anexo-input" className="btn btn-secondary btn-sm">
                      📎 Adicionar Anexos
                    </label>
                    <small className="anexos-info">
                      Máx. 5MB por arquivo. Formatos: PDF, DOC, XLS, imagens, ZIP
                    </small>
                  </div>
                  
                  {anexos.length > 0 && (
                    <div className="anexos-list">
                      <h4>Anexos ({anexos.length})</h4>
                      {anexos.map((anexo) => (
                        <div key={anexo.id} className="anexo-item">
                          <span className="anexo-icon">{getFileIcon(anexo.tipo)}</span>
                          <div className="anexo-info">
                            <span className="anexo-nome">{anexo.nome}</span>
                            <small className="anexo-meta">{anexo.tamanho} • {anexo.data}</small>
                          </div>
                          <button 
                            className="btn-icon btn-danger btn-sm"
                            onClick={() => setAnexos(anexos.filter(a => a.id !== anexo.id))}
                            title="Remover anexo"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <div className="form-tips">
                    <small>💡 Dica: Use @nome para mencionar alguém</small>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={handleAddComentario}
                    disabled={!novoComentario.trim()}
                  >
                    <span className="btn-icon">💬</span>
                    Enviar
                  </button>
                </div>
              </div>

              {comentarios.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <p>Nenhum comentário ainda.</p>
                  <small>Seja o primeiro a comentar sobre este processo</small>
                </div>
              ) : (
                <div className="comentarios-list">
                  {comentarios.map((comentario) => (
                    <div key={comentario.id} className="comentario-item">
                      <div className="comentario-avatar">
                        <img 
                          src="https://cdn-icons-png.flaticon.com/512/9131/9131546.png" 
                          alt="Avatar" 
                        />
                      </div>
                      <div className="comentario-content">
                        <div className="comentario-header">
                          <strong className="comentario-author">{comentario.usuario}</strong>
                          <span className="comentario-date">{comentario.data}</span>
                        </div>
                        <p className="comentario-text">{comentario.texto}</p>
                        <div className="comentario-actions">
                          <button className="btn-link">👍 Curtir</button>
                          <button className="btn-link">💬 Responder</button>
                          <button className="btn-link">⚠️ Reportar</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessoDetalhesModal;

