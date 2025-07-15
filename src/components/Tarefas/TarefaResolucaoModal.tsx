import React, { useState, useEffect } from 'react';
import { Tarefa } from '../../types';
import { useApp } from '../../contexts/AppContext';
import { anexoAPI } from '../../services/api';

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
  const [anexos, setAnexos] = useState<Array<{
    id: string, 
    nome: string, 
    tipo: string, 
    tamanho: string, 
    data: string,
    url?: string,
    isUploading?: boolean
  }>>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Set<string>>(new Set());

  // Carregar anexos existentes da tarefa (se houver)
  useEffect(() => {
    if (tarefa?.anexos) {
      setAnexos(tarefa.anexos.map(anexo => ({
        id: anexo.id || String(Date.now()),
        nome: anexo.nome || anexo.name || 'Arquivo',
        tipo: anexo.tipo || anexo.type || 'application/octet-stream',
        tamanho: typeof anexo.tamanho === 'number' 
          ? `${(anexo.tamanho / 1024).toFixed(1)} KB` 
          : String(anexo.tamanho || anexo.size || '0 KB'),
        data: anexo.data || anexo.uploadDate || anexo.criadoEm || new Date().toLocaleString('pt-BR'),
        url: anexo.url
      })));
    }
  }, [tarefa?.anexos]);

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

  const handleAddAnexo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !tarefa) return;

    for (const file of Array.from(files)) {
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      
      // Adicionar arquivo com status de upload
      const novoAnexo = {
        id: tempId,
        nome: file.name,
        tipo: file.type || 'application/octet-stream',
        tamanho: `${(file.size / 1024).toFixed(1)} KB`,
        data: new Date().toLocaleString('pt-BR'),
        isUploading: true
      };
      
      setAnexos(prev => [...prev, novoAnexo]);
      setUploadingFiles(prev => new Set([...prev, tempId]));

      try {
        console.log(`📎 Fazendo upload do arquivo: ${file.name}`);
        
        if (!tarefa) {
          throw new Error('Tarefa não encontrada');
        }
        
        // Fazer upload via API
        const uploadResult = await anexoAPI.upload(tarefa.id, file);
        
        console.log(`✅ Upload concluído:`, uploadResult);

        // Atualizar o anexo com dados reais do backend
        setAnexos(prev => prev.map(anexo => 
          anexo.id === tempId 
            ? { 
                ...anexo, 
                id: uploadResult.url, // Usar URL como ID único
                url: uploadResult.url,
                nome: uploadResult.name || file.name,
                isUploading: false 
              }
            : anexo
        ));

        // Adicionar ao timeline
        setTimeline(prev => [
          { 
            id: prev.length + 1, 
            data: new Date().toLocaleString('pt-BR'), 
            usuario: 'Administrador', 
            acao: 'Anexo adicionado', 
            detalhes: uploadResult.name || file.name, 
            tipo: 'anexo', 
            icone: '📎' 
          },
          ...prev
        ]);

      } catch (error: any) {
        console.error(`❌ Erro no upload do arquivo ${file.name}:`, error);
        
        // Remover anexo em caso de erro
        setAnexos(prev => prev.filter(anexo => anexo.id !== tempId));
        
        // Mostrar erro para o usuário
        alert(`Erro ao enviar arquivo ${file.name}: ${error.message || 'Erro desconhecido'}`);
      } finally {
        setUploadingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(tempId);
          return newSet;
        });
      }
    }
    
    // Limpar input
    event.target.value = '';
  };

  const handleVisualizarAnexo = async (anexo: typeof anexos[0]) => {
    if (!anexo.url) {
      alert('URL do arquivo não encontrada');
      return;
    }

    try {
      console.log(`👀 Visualizando anexo: ${anexo.nome}`);
      
      // Abrir em nova aba para visualização
      window.open(anexo.url, '_blank');
      
    } catch (error: any) {
      console.error(`❌ Erro ao visualizar anexo ${anexo.nome}:`, error);
      alert(`Erro ao visualizar arquivo: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleBaixarAnexo = async (anexo: typeof anexos[0]) => {
    if (!anexo.id || anexo.id.startsWith('temp-')) {
      alert('Anexo ainda está sendo processado');
      return;
    }

    if (!tarefa) {
      alert('Tarefa não encontrada');
      return;
    }

    try {
      console.log(`💾 Baixando anexo: ${anexo.nome}`);
      
      // Fazer download via API
      const blob = await anexoAPI.download(tarefa.id, anexo.id);
      
      // Criar link temporário para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = anexo.nome;
      document.body.appendChild(link);
      link.click();
      
      // Limpar recursos
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      console.log(`✅ Download concluído: ${anexo.nome}`);
      
    } catch (error: any) {
      console.error(`❌ Erro no download do anexo ${anexo.nome}:`, error);
      alert(`Erro ao baixar arquivo: ${error.message || 'Erro desconhecido'}`);
    }
  };

  const handleRemoverAnexo = async (anexo: typeof anexos[0]) => {
    if (anexo.isUploading) {
      alert('Aguarde o upload terminar antes de remover');
      return;
    }

    const confirmar = window.confirm(`Tem certeza que deseja remover o anexo "${anexo.nome}"?`);
    if (!confirmar) return;

    if (!tarefa) {
      alert('Tarefa não encontrada');
      return;
    }

    try {
      console.log(`🗑️ Removendo anexo: ${anexo.nome}`);
      
      // Se tem ID real (não é temp), remover do backend
      if (anexo.id && !anexo.id.startsWith('temp-')) {
        await anexoAPI.delete(tarefa.id, anexo.id);
      }
      
      // Remover da lista local
      setAnexos(prev => prev.filter(a => a.id !== anexo.id));
      
      // Adicionar ao timeline
      setTimeline(prev => [
        { 
          id: prev.length + 1, 
          data: new Date().toLocaleString('pt-BR'), 
          usuario: 'Administrador', 
          acao: 'Anexo removido', 
          detalhes: anexo.nome, 
          tipo: 'anexo', 
          icone: '🗑️' 
        },
        ...prev
      ]);
      
      console.log(`✅ Anexo removido: ${anexo.nome}`);
      
    } catch (error: any) {
      console.error(`❌ Erro ao remover anexo ${anexo.nome}:`, error);
      alert(`Erro ao remover arquivo: ${error.message || 'Erro desconhecido'}`);
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .anexo-item:hover {
            background-color: #f8f9fa !important;
            border-color: #d1ecf1 !important;
          }
          .anexo-item button:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        `}
      </style>
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
                  <h4 style={{fontSize: 15, marginBottom: 8}}>Anexos ({anexos.length})</h4>
                  {anexos.map((anexo) => (
                    <div key={anexo.id} className="anexo-item" style={{
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 8, 
                      marginBottom: 8,
                      padding: '8px 12px',
                      background: anexo.isUploading ? '#f8f9fa' : '#ffffff',
                      border: '1px solid #e1e5e9',
                      borderRadius: 6,
                      opacity: anexo.isUploading ? 0.7 : 1
                    }}>
                      <div style={{flex: 1, minWidth: 0}}>
                        <div style={{
                          fontWeight: 500, 
                          fontSize: 14,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {anexo.isUploading ? (
                            <span style={{color: '#6b778c'}}>📤 Enviando: {anexo.nome}</span>
                          ) : (
                            anexo.nome
                          )}
                        </div>
                        <div style={{
                          fontSize: 12, 
                          color: '#6b778c',
                          marginTop: 2
                        }}>
                          {anexo.tamanho} • {anexo.data}
                        </div>
                      </div>
                      
                      {!anexo.isUploading && (
                        <div style={{display: 'flex', gap: 4}}>
                          <button
                            style={{
                              background: '#e3f2fd',
                              border: '1px solid #2196f3',
                              color: '#1976d2',
                              fontSize: 12,
                              padding: '4px 8px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontWeight: 500
                            }}
                            title="Visualizar anexo"
                            onClick={() => handleVisualizarAnexo(anexo)}
                          >
                            👁️ Ver
                          </button>
                          <button
                            style={{
                              background: '#e8f5e8',
                              border: '1px solid #4caf50',
                              color: '#388e3c',
                              fontSize: 12,
                              padding: '4px 8px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontWeight: 500
                            }}
                            title="Baixar anexo"
                            onClick={() => handleBaixarAnexo(anexo)}
                          >
                            💾 Baixar
                          </button>
                          <button
                            style={{
                              background: '#ffebee',
                              border: '1px solid #f44336',
                              color: '#d32f2f',
                              fontSize: 12,
                              padding: '4px 8px',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontWeight: 500
                            }}
                            title="Remover anexo"
                            onClick={() => handleRemoverAnexo(anexo)}
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                      
                      {anexo.isUploading && (
                        <div style={{
                          width: 20,
                          height: 20,
                          border: '2px solid #e3f2fd',
                          borderTop: '2px solid #2196f3',
                          borderRadius: '50%',
                          animation: 'spin 1s linear infinite'
                        }}></div>
                      )}
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
    </>
  );
};

export default TarefaResolucaoModal;
