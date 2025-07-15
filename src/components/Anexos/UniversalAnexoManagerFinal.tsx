/**
 * 🔧 UNIVERSAL ANEXO MANAGER - VERSÃO PADRONIZADA FINAL
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
    if (anexosProps.length > 0) {
      setAnexos(anexosProps);
    }
  }, [anexosProps]);

  // Sincronizar mudanças internas com componente pai
  useEffect(() => {
    if (onAnexosChange) {
      onAnexosChange(anexos);
    }
  }, [anexos, onAnexosChange]);

  // Carregar anexos na inicialização (se não foram fornecidos)
  useEffect(() => {
    if (anexosProps.length === 0 && entityId) {
      loadAnexos();
    }
  }, [entityId, entityType]);

  // 🛠️ UTILITÁRIOS
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

  const getFileIcon = (tipo: string): string => {
    if (tipo.includes('image')) return 'image';
    if (tipo.includes('pdf')) return 'picture_as_pdf';
    if (tipo.includes('word')) return 'description';
    if (tipo.includes('excel') || tipo.includes('spreadsheet')) return 'table_chart';
    if (tipo.includes('powerpoint') || tipo.includes('presentation')) return 'slideshow';
    if (tipo.includes('zip') || tipo.includes('rar')) return 'archive';
    return 'attach_file';
  };

  const getEntityDisplayName = (): string => {
    const names = {
      tasks: 'Tarefa',
      processes: 'Processo', 
      models: 'Modelo'
    };
    return names[entityType] || 'Item';
  };

  const getUserName = (userId: number): string => {
    const user = usuarios.find(u => u.id === userId);
    return user?.nome || user?.username || 'Usuário desconhecido';
  };

  const isImage = (tipo: string): boolean => {
    return tipo.includes('image');
  };

  // 🔄 AÇÕES PRINCIPAIS
  const loadAnexos = async () => {
    if (!entityId) return;
    
    try {
      setLoading(true);
      const { anexoAPI } = await import('../../services/api');
      
      const anexosData = await anexoAPI.list(entityType, entityId);
      setAnexos(anexosData);
    } catch (error: any) {
      console.error('Erro ao carregar anexos:', error);
      // Não exibir erro 404 para usuário (endpoint pode não estar implementado)
      if (error.response?.status !== 404) {
        const errorMsg = 'Erro ao carregar anexos.';
        if (onError) onError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = () => {
    if (canEdit && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    for (const file of Array.from(files)) {
      // Validar arquivo
      const validationError = validateFile(file);
      if (validationError) {
        if (onError) onError(validationError);
        else alert(validationError);
        continue;
      }

      try {
        await handleAddAnexo(file);
      } catch (error: any) {
        const errorMsg = `Erro ao fazer upload do arquivo "${file.name}": ${error.message}`;
        if (onError) onError(errorMsg);
        else console.error(errorMsg);
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
      
      // Upload unificado
      const novoAnexo = await anexoAPI.upload(entityType, entityId, file);
      
      // Atualizar lista local
      setAnexos(prev => [...prev, novoAnexo]);
      
      console.log(`✅ Anexo adicionado: ${file.name} para ${entityType}/${entityId}`);
    } catch (error: any) {
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
      
      console.log(`✅ Download concluído: ${anexo.nome}`);
    } catch (error: any) {
      const errorMsg = `Erro ao baixar arquivo: ${error.message}`;
      if (onError) onError(errorMsg);
      else console.error(errorMsg);
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
      
      console.log(`✅ Anexo removido: ${anexo.nome}`);
    } catch (error: any) {
      const errorMsg = `Erro ao remover anexo: ${error.message}`;
      if (onError) onError(errorMsg);
      else console.error(errorMsg);
    }
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
      } catch (error: any) {
        console.error('Erro ao carregar preview:', error);
        setPreviewModal(prev => ({ ...prev, loading: false }));
        const errorMsg = 'Erro ao carregar preview da imagem.';
        if (onError) onError(errorMsg);
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

  return (
    <div className={`universal-anexo-manager ${className}`}>
      <div className="anexo-header">
        <h4 className="anexo-title">
          <span className="material-icons">attach_file</span>
          Anexos do {getEntityDisplayName()} ({anexos.length})
        </h4>
        
        {canEdit && (
          <button
            className="btn-add-anexo"
            onClick={handleFileSelect}
            disabled={uploading || loading}
            title="Adicionar anexo"
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
        {loading ? (
          <div className="loading-state">
            <span className="material-icons spinning">sync</span>
            <p>Carregando anexos...</p>
          </div>
        ) : anexos.length === 0 ? (
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
                <div className="anexo-name" title={anexo.nome}>
                  {anexo.nome}
                </div>
                <div className="anexo-meta">
                  <span className="anexo-size">
                    {typeof anexo.tamanho === 'number' 
                      ? formatFileSize(anexo.tamanho) 
                      : anexo.tamanho
                    }
                  </span>
                  <span className="anexo-date">
                    {anexo.data || anexo.uploadDate || anexo.criadoEm || 'Data desconhecida'}
                  </span>
                  {anexo.uploadedBy && (
                    <span className="anexo-uploader">
                      por {getUserName(anexo.uploadedBy)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="anexo-actions">
                {showPreview && (
                  <button
                    className="btn-icon btn-preview"
                    onClick={() => handlePreview(anexo)}
                    title={isImage(anexo.tipo) ? "Visualizar imagem" : "Baixar arquivo"}
                  >
                    <span className="material-icons">
                      {isImage(anexo.tipo) ? 'visibility' : 'download'}
                    </span>
                  </button>
                )}
                
                <button
                  className="btn-icon btn-download"
                  onClick={() => handleDownload(anexo)}
                  title="Baixar arquivo"
                >
                  <span className="material-icons">download</span>
                </button>
                
                {canEdit && (
                  <button
                    className="btn-icon btn-delete"
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

      {/* Modal de Preview */}
      {previewModal.isOpen && (
        <div className="preview-modal-overlay" onClick={closePreview}>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-modal-header">
              <h3>{previewModal.anexo?.nome}</h3>
              <button className="btn-close-preview" onClick={closePreview}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="preview-modal-body">
              {previewModal.loading ? (
                <div className="loading-preview">
                  <span className="material-icons spinning">sync</span>
                  <p>Carregando preview...</p>
                </div>
              ) : previewModal.imageUrl ? (
                <img
                  src={previewModal.imageUrl}
                  alt={previewModal.anexo?.nome}
                  className="preview-image"
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
