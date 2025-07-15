/**
 * 🔧 UNIVERSAL ANEXO MANAGER - VERSÃO PADRONIZADA
 * 
 * Componente unificado para gerenciamento de anexos em todo o sistema.
 * Suporta tarefas, processos e modelos de processo.
 * Funciona com qualquer endpoint que siga o padrão: /{entityType}/{id}/anexos
 */

import React, { useState, useRef, useEffect } from 'react';
import { Anexo, User } from '../../types';
import './UniversalAnexoManager.css';

interface UniversalAnexoManagerProps {
  /** Tipo da entidade (tasks, processes, models) */
  entityType: 'tasks' | 'processes' | 'models';
  /** ID da entidade */
  entityId: string;
  /** Lista de anexos existentes (opcional - será carregada automaticamente se não fornecida) */
  anexos?: Anexo[];
  /** Lista de usuários (para exibir nome do uploader) */
  usuarios?: User[];
  /** Se pode editar (adicionar/remover anexos) */
  canEdit?: boolean;
  /** Se deve mostrar preview de imagens */
  showPreview?: boolean;
  /** Tamanho máximo do arquivo em bytes (padrão: 10MB) */
  maxFileSize?: number;
  /** Tipos de arquivo permitidos */
  allowedTypes?: string[];
  /** Callbacks para sincronização */
  onAnexosChange?: (anexos: Anexo[]) => void;
  onError?: (error: string) => void;
  /** Classes CSS adicionais */
  className?: string;
}

const UniversalAnexoManager: React.FC<UniversalAnexoManagerProps> = ({
  entityType,
  entityId,
  anexos: anexosProps = [],
  usuarios = [],
  canEdit = false,
  showPreview = true,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar'],
  onAnexosChange,
  onError,
  className = ''
}) => {
  const [anexos, setAnexos] = useState<Anexo[]>(anexosProps);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    anexo: Anexo | null;
    imageUrl: string | null;
    loading: boolean;
  }>({
    isOpen: false,
    anexo: null,
    imageUrl: null,
    loading: false
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar anexos externos com estado interno
  useEffect(() => {
    setAnexos(anexosProps);
  }, [anexosProps]);

  // Sincronizar mudanças internas com componente pai
  useEffect(() => {
    if (onAnexosChange) {
      onAnexosChange(anexos);
    }
  }, [anexos, onAnexosChange]);

  // Carregar anexos na inicialização (se não foram fornecidos)
  useEffect(() => {
    if (entityId) {
      loadAnexos();
    }
  }, [entityId, entityType]);

  // Notificar mudanças para componente pai
  useEffect(() => {
    if (onAnexosChange) {
      onAnexosChange(anexos);
    }
  }, [anexos, onAnexosChange]);

  const loadAnexos = async () => {
    try {
      setLoading(true);
      const { anexoAPI } = await import('../../services/api');
      
      // API unificada que funciona para todos os tipos de entidade
      const anexosData = await anexoAPI.list(entityType, entityId);
      setAnexos(anexosData);
    } catch (error) {
      console.error(`Erro ao carregar anexos para ${entityType}:`, error);
      // Em caso de erro, manter lista vazia ao invés de falhar
      setAnexos([]);
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (tipo: string): string => {
    if (tipo.includes('image')) return 'image';
    if (tipo.includes('pdf')) return 'picture_as_pdf';
    if (tipo.includes('word') || tipo.includes('document')) return 'description';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'table_chart';
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return 'slideshow';
    if (tipo.includes('zip') || tipo.includes('rar')) return 'archive';
    return 'attach_file';
  };

  const validateFile = (file: File): string | null => {
    // Validar tamanho
    if (file.size > maxFileSize) {
      return `Arquivo muito grande! Máximo ${formatFileSize(maxFileSize)} permitido.`;
    }

    // Validar tipo de arquivo
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isAllowedType = allowedTypes.some(type => 
      type.toLowerCase() === fileExtension || 
      file.type.startsWith(type.replace('*', '').replace('.', ''))
    );

    if (!isAllowedType) {
      return `Tipo de arquivo não permitido. Tipos aceitos: ${allowedTypes.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = () => {
    if (canEdit) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      // Validar arquivo
      const validationError = validateFile(file);
      if (validationError) {
        alert(validationError);
        continue;
      }

      try {
        setUploading(true);
        await handleAddAnexo(file);
      } catch (error) {
        console.error('Erro ao fazer upload:', error);
        alert(`Erro ao fazer upload do arquivo "${file.name}". Tente novamente.`);
      }
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploading(false);
  };

  const handleAddAnexo = async (file: File): Promise<void> => {
    try {
      const { anexoAPI } = await import('../../services/api');
      
      // Upload unificado que funciona para todos os tipos
      const novoAnexo = await anexoAPI.upload(entityType, entityId, file);
      
      // Atualizar lista local
      setAnexos(prev => [...prev, novoAnexo]);
      
      console.log(`✅ Anexo adicionado com sucesso: ${file.name}`);
    } catch (error) {
      console.error(`❌ Erro ao adicionar anexo:`, error);
      throw error;
    }
  };

  const handleDownload = async (anexo: Anexo) => {
    try {
      const { anexoAPI } = await import('../../services/api');
      
      // Download unificado
      const blob = await anexoAPI.download(entityType, entityId, anexo.id);
      
      // Criar link temporário para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = anexo.nome;
      document.body.appendChild(link);
      link.click();
      
      // Limpar
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      alert('Erro ao baixar arquivo. Tente novamente.');
    }
  };

  const handleRemove = async (anexo: Anexo) => {
    if (!window.confirm(`Tem certeza que deseja remover o anexo "${anexo.nome}"?`)) {
      return;
    }

    try {
      const { anexoAPI } = await import('../../services/api');
      
      // Remoção unificada
      await anexoAPI.delete(entityType, entityId, anexo.id);
      
      // Atualizar lista local
      setAnexos(prev => prev.filter(a => a.id !== anexo.id));
      
      console.log(`✅ Anexo removido com sucesso: ${anexo.nome}`);
    } catch (error) {
      console.error('Erro ao remover anexo:', error);
      alert('Erro ao remover anexo. Tente novamente.');
    }
  };

  const getUserName = (userId: number): string => {
    const user = usuarios.find(u => u.id === userId);
    return user?.nome || user?.username || 'Usuário desconhecido';
  };

  const isImage = (tipo: string): boolean => {
    return tipo.includes('image');
  };

  const handlePreview = async (anexo: Anexo) => {
    if (!showPreview) {
      // Se preview está desabilitado, fazer download direto
      await handleDownload(anexo);
      return;
    }

    if (isImage(anexo.tipo)) {
      setPreviewModal({ isOpen: true, anexo, imageUrl: null, loading: true });
      
      try {
        const { anexoAPI } = await import('../../services/api');
        
        // Fazer download para gerar URL temporária de preview
        const blob = await anexoAPI.download(entityType, entityId, anexo.id);
        const imageUrl = window.URL.createObjectURL(blob);
        
        setPreviewModal(prev => ({ ...prev, imageUrl, loading: false }));
      } catch (error) {
        console.error('Erro ao carregar preview:', error);
        setPreviewModal(prev => ({ ...prev, loading: false }));
        alert('Erro ao carregar preview da imagem.');
      }
    } else {
      // Para não-imagens, fazer download direto
      await handleDownload(anexo);
    }
  };

  const closePreview = () => {
    // Limpar URL temporária se existir
    if (previewModal.imageUrl) {
      window.URL.revokeObjectURL(previewModal.imageUrl);
    }
    setPreviewModal({ isOpen: false, anexo: null, imageUrl: null, loading: false });
  };

  const getEntityDisplayName = () => {
    const names = {
      tasks: 'Tarefa',
      processes: 'Processo', 
      models: 'Modelo'
    };
    return names[entityType] || 'Item';
  };

  if (loading) {
    return (
      <div className="universal-anexo-manager loading">
        <div className="loading-spinner">
          <span className="material-icons">hourglass_empty</span>
          <p>Carregando anexos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="universal-anexo-manager">
      <div className="anexo-header">
        <h4>
          <span className="material-icons">attach_file</span>
          Anexos do {getEntityDisplayName()} ({anexos.length})
        </h4>
        
        {canEdit && (
          <button
            className="btn-add-anexo"
            onClick={handleFileSelect}
            disabled={uploading}
            title="Adicionar anexos"
          >
            <span className="material-icons">
              {uploading ? 'upload' : 'add'}
            </span>
            {uploading ? 'Enviando...' : 'Adicionar Anexo'}
          </button>
        )}
        
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          accept={allowedTypes.join(',')}
          multiple
        />
      </div>

      <div className="anexo-list">
        {anexos.length === 0 ? (
          <div className="no-anexos">
            <span className="material-icons">folder_open</span>
            <p>Nenhum anexo adicionado</p>
            {canEdit && (
              <small>Clique em "Adicionar Anexo" para incluir arquivos</small>
            )}
          </div>
        ) : (
          anexos.map((anexo) => (
            <div key={anexo.id} className="anexo-item">
              <div className="anexo-icon">
                <span className="material-icons">
                  {getFileIcon(anexo.tipo)}
                </span>
              </div>
              
              <div className="anexo-info">
                <div className="anexo-nome" title={anexo.nome}>
                  {anexo.nome}
                </div>
                <div className="anexo-details">
                  <span className="anexo-size">
                    {typeof anexo.tamanho === 'number' 
                      ? formatFileSize(anexo.tamanho) 
                      : anexo.tamanho}
                  </span>
                  {anexo.uploadedBy && (
                    <>
                      <span className="anexo-separator">•</span>
                      <span className="anexo-uploader">
                        {getUserName(anexo.uploadedBy)}
                      </span>
                    </>
                  )}
                  {(anexo.criadoEm || anexo.data) && (
                    <>
                      <span className="anexo-separator">•</span>
                      <span className="anexo-date">
                        {anexo.criadoEm 
                          ? new Date(anexo.criadoEm).toLocaleDateString('pt-BR')
                          : anexo.data}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="anexo-actions">
                {showPreview && (
                  <button
                    className="btn-preview"
                    onClick={() => handlePreview(anexo)}
                    title={isImage(anexo.tipo) ? "Visualizar imagem" : "Abrir arquivo"}
                  >
                    <span className="material-icons">
                      {isImage(anexo.tipo) ? 'visibility' : 'open_in_new'}
                    </span>
                  </button>
                )}
                
                <button
                  className="btn-download"
                  onClick={() => handleDownload(anexo)}
                  title="Baixar arquivo"
                >
                  <span className="material-icons">download</span>
                </button>
                
                {canEdit && (
                  <button
                    className="btn-remove"
                    onClick={() => handleRemove(anexo)}
                    title="Remover anexo"
                  >
                    <span className="material-icons">delete</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Preview de Imagem */}
      {previewModal.isOpen && previewModal.anexo && (
        <div className="preview-modal-overlay" onClick={closePreview}>
          <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>{previewModal.anexo.nome}</h3>
              <button className="btn-close-preview" onClick={closePreview}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="preview-modal-body">
              {previewModal.loading ? (
                <div className="loading-preview">
                  <span className="material-icons">hourglass_empty</span>
                  <p>Carregando preview...</p>
                </div>
              ) : previewModal.imageUrl ? (
                <img
                  src={previewModal.imageUrl}
                  alt={previewModal.anexo.nome}
                  style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }}
                />
              ) : (
                <div className="error-preview">
                  <span className="material-icons">error_outline</span>
                  <p>Erro ao carregar preview</p>
                </div>
              )}
            </div>
            <div className="preview-modal-actions">
              <button
                className="btn-download-preview"
                onClick={() => {
                  handleDownload(previewModal.anexo!);
                  closePreview();
                }}
              >
                <span className="material-icons">download</span>
                Baixar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Informações de Upload */}
      {canEdit && (
        <div className="upload-info">
          <small>
            <strong>Tipos aceitos:</strong> {allowedTypes.join(', ')} |{' '}
            <strong>Tamanho máximo:</strong> {formatFileSize(maxFileSize)}
          </small>
        </div>
      )}
    </div>
  );
};

export default UniversalAnexoManager;
