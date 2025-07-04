import React, { useState } from 'react';
import { Tarefa } from '../../types';
import { useApp } from '../../contexts/AppContext';

interface TarefaResolucaoModalProps {
  tarefa: Tarefa | null;
  aberto: boolean;
  onClose: () => void;
  onStatusChange: (novoStatus: Tarefa['status']) => void;
}

const getStatusBadge = (status: Tarefa['status']) => {
  const statusMap = {
    'pendente': { class: 'pendente', label: 'Pendente' },
    'em-andamento': { class: 'in-progress', label: 'Em Andamento' },
    'concluido': { class: 'completed', label: 'Concluído' },
    'atrasado': { class: 'delayed', label: 'Atrasado' },
  };
  const info = statusMap[status] || { class: '', label: status };
  return <span className={`chip-status ${info.class}`}>{info.label}</span>;
};

const TarefaResolucaoModal: React.FC<TarefaResolucaoModalProps> = ({
  tarefa,
  aberto,
  onClose,
  onStatusChange
}) => {
  const { usuarios } = useApp();
  const [activeTab, setActiveTab] = useState<'detalhes' | 'comentarios' | 'timeline'>('detalhes');
  const [comentarios, setComentarios] = useState([
    { id: 1, usuario: 'Administrador', texto: 'Tarefa criada.', data: new Date().toLocaleString('pt-BR') }
  ]);
  const [novoComentario, setNovoComentario] = useState('');
  const [timeline, setTimeline] = useState([
    { id: 1, data: new Date().toLocaleString('pt-BR'), usuario: 'Administrador', acao: 'Tarefa criada', detalhes: tarefa?.titulo, tipo: 'criacao', icone: '🆕' }
  ]);
  const [anexos, setAnexos] = useState<Array<{id: number, nome: string, tipo: string, tamanho: string, data: string}>>([]);

  if (!aberto || !tarefa) return null;
  const responsavel = usuarios.find(u => u.id === tarefa.responsavelId)?.nome || tarefa.responsavelId;

  const handleAddComentario = () => {
    if (novoComentario.trim()) {
      const novoComent = {
        id: comentarios.length + 1,
        usuario: 'Administrador',
        texto: novoComentario,
        data: new Date().toLocaleString('pt-BR')
      };
      setComentarios([...comentarios, novoComent]);
      setNovoComentario('');
      setTimeline([
        { id: timeline.length + 1, data: novoComent.data, usuario: 'Administrador', acao: 'Comentário adicionado', detalhes: novoComentario, tipo: 'comentario', icone: '💬' },
        ...timeline
      ]);
    }
  };

  const handleAddAnexo = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const novoAnexo = {
          id: anexos.length + 1,
          nome: file.name,
          tipo: file.type || 'application/octet-stream',
          tamanho: `${(file.size / 1024).toFixed(1)} KB`,
          data: new Date().toLocaleString('pt-BR')
        };
        setAnexos(prev => [...prev, novoAnexo]);
        setTimeline([
          { id: timeline.length + 1, data: novoAnexo.data, usuario: 'Administrador', acao: 'Anexo adicionado', detalhes: file.name, tipo: 'anexo', icone: '📎' },
          ...timeline
        ]);
      });
    }
    event.target.value = '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content tarefa-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 480, position: 'relative' }}>
        <button
          className="modal-close"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 8,
            right: 14,
            background: 'none',
            border: 'none',
            fontSize: 22,
            color: '#888',
            cursor: 'pointer',
            zIndex: 2,
            padding: 0,
            lineHeight: 1,
            boxShadow: 'none',
            outline: 'none',
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Fechar"
        >
          ×
        </button>
        <div className="modal-tabs" style={{marginBottom: 16}}>
          <button className={`tab-button${activeTab === 'detalhes' ? ' active' : ''}`} onClick={() => setActiveTab('detalhes')}>Detalhes</button>
          <button className={`tab-button${activeTab === 'comentarios' ? ' active' : ''}`} onClick={() => setActiveTab('comentarios')}>Comentários</button>
          <button className={`tab-button${activeTab === 'timeline' ? ' active' : ''}`} onClick={() => setActiveTab('timeline')}>Timeline</button>
        </div>
        {activeTab === 'detalhes' && (
          <>
            <h3 style={{marginBottom: 8}}>{tarefa.titulo}</h3>
            <div className="tarefa-card-meta" style={{marginBottom: 8}}>
              <span>Status: {getStatusBadge(tarefa.status)}</span>
              <span>Prazo: {new Date(tarefa.prazo).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="tarefa-card-meta" style={{marginBottom: 8}}>
              <span>Responsável: {responsavel}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <button
                className={`btn-status ${tarefa.status === 'pendente' ? 'active' : ''}`}
                onClick={() => onStatusChange('pendente')}
                title="Marcar como Pendente"
                style={{
                  fontSize: 15,
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#FFEB99', // amarelo suave
                  color: '#b38600',
                  fontWeight: 600,
                  boxShadow: tarefa.status === 'pendente' ? '0 0 0 2px #ffe066' : 'none',
                  opacity: tarefa.status === 'pendente' ? 1 : 0.85,
                  cursor: 'pointer',
                  transition: 'background 0.2s, box-shadow 0.2s'
                }}
              >📋 Pendente</button>
              <button
                className={`btn-status ${tarefa.status === 'em-andamento' ? 'active' : ''}`}
                onClick={() => onStatusChange('em-andamento')}
                title="Marcar como Em Andamento"
                style={{
                  fontSize: 15,
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#B3E5FC', // azul suave
                  color: '#0277bd',
                  fontWeight: 600,
                  boxShadow: tarefa.status === 'em-andamento' ? '0 0 0 2px #4fc3f7' : 'none',
                  opacity: tarefa.status === 'em-andamento' ? 1 : 0.85,
                  cursor: 'pointer',
                  transition: 'background 0.2s, box-shadow 0.2s'
                }}
              >⚡ Em Andamento</button>
              <button
                className={`btn-status ${tarefa.status === 'concluido' ? 'active' : ''}`}
                onClick={() => onStatusChange('concluido')}
                title="Marcar como Concluído"
                style={{
                  fontSize: 15,
                  padding: '3px 10px',
                  borderRadius: 6,
                  border: 'none',
                  background: '#C8F7C5', // verde suave
                  color: '#218838',
                  fontWeight: 600,
                  boxShadow: tarefa.status === 'concluido' ? '0 0 0 2px #81c784' : 'none',
                  opacity: tarefa.status === 'concluido' ? 1 : 0.85,
                  cursor: 'pointer',
                  transition: 'background 0.2s, box-shadow 0.2s'
                }}
              >✅ Concluído</button>
            </div>
            <div className="tarefa-card-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${tarefa.progresso}%` }}></div>
              </div>
              <span className="progress-text">{tarefa.progresso}%</span>
            </div>
            <div style={{marginTop: 18, textAlign: 'center'}}>
              <input
                type="file"
                id="anexo-input"
                multiple
                onChange={handleAddAnexo}
                style={{ display: 'none' }}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar"
              />
              <label htmlFor="anexo-input" style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: '#f4f5f7',
                color: '#172b4d',
                border: '1px solid #dfe1e6',
                borderRadius: 6,
                padding: '8px 18px',
                fontWeight: 500,
                fontSize: 15,
                cursor: 'pointer',
                transition: 'background 0.2s',
                marginBottom: 8
              }}>
                <span style={{fontSize: 20}}>📎</span>
                Anexar arquivo
              </label>
              {anexos.length > 0 && (
                <div className="anexos-list" style={{marginTop: 12, textAlign: 'left'}}>
                  <h4 style={{fontSize: 15, marginBottom: 6}}>Anexos ({anexos.length})</h4>
                  {anexos.map((anexo) => (
                    <div key={anexo.id} className="anexo-item" style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4}}>
                      <span className="anexo-nome" style={{fontWeight: 500}}>{anexo.nome}</span>
                      <small className="anexo-meta" style={{color: '#6b778c'}}>{anexo.tamanho} • {anexo.data}</small>
                      <button
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ff5630',
                          fontSize: 18,
                          cursor: 'pointer',
                          marginLeft: 4
                        }}
                        title="Remover anexo"
                        onClick={() => setAnexos(anexos.filter(a => a.id !== anexo.id))}
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {activeTab === 'comentarios' && (
          <div className="comentarios-tab">
            <div className="comentarios-form">
              <textarea
                value={novoComentario}
                onChange={e => setNovoComentario(e.target.value)}
                placeholder="Escreva um comentário..."
                rows={3}
                className="comentario-input"
                style={{width: '100%', marginBottom: 8}}
              />
              <button className="btn btn-primary" onClick={handleAddComentario} disabled={!novoComentario.trim()}>
                💬 Enviar
              </button>
            </div>
            <div className="comentarios-list" style={{marginTop: 12}}>
              {comentarios.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💬</div>
                  <p>Nenhum comentário ainda.</p>
                </div>
              ) : (
                comentarios.map(comentario => (
                  <div key={comentario.id} className="comentario-item">
                    <div className="comentario-content">
                      <div className="comentario-header">
                        <strong>{comentario.usuario}</strong>
                        <span className="comentario-date">{comentario.data}</span>
                      </div>
                      <p className="comentario-text">{comentario.texto}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
        {activeTab === 'timeline' && (
          <div className="timeline-tab">
            <div className="timeline-list">
              {timeline.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">⏰</div>
                  <p>Nenhum histórico registrado.</p>
                </div>
              ) : (
                timeline.map(item => (
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
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TarefaResolucaoModal;
