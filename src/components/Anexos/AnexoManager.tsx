import React, { useState, useRef } from 'react';
import { Anexo, User } from '../../types';
import './AnexoManager.css';

interface AnexoManagerProps {
  anexos: Anexo[];
  tarefaId: string;
  canEdit: boolean;
  usuarios: User[];
  onAddAnexo: (file: File) => Promise<void>;
  onRemoveAnexo: (anexoId: string) => Promise<void>;
}

const AnexoManager: React.FC<AnexoManagerProps> = ({
  anexos,
  tarefaId,
  canEdit,
  usuarios,
  onAddAnexo,
  onRemoveAnexo
}) => {
  const [uploading, setUploading] = useState(false);
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

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('Arquivo muito grande! Máximo 10MB permitido.');
      return;
    }

    try {
      setUploading(true);
      await onAddAnexo(file);
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      alert('Erro ao fazer upload do arquivo. Tente novamente.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (anexo: Anexo) => {
    try {
      // Importar a API de download
      const { anexoAPI } = await import('../../services/api');
      
      // Fazer download do arquivo via API
      const blob = await anexoAPI.download(tarefaId, anexo.id);
      
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
    if (window.confirm(`Tem certeza que deseja remover o anexo "${anexo.nome}"?`)) {
      try {
        await onRemoveAnexo(anexo.id);
      } catch (error) {
        console.error('Erro ao remover anexo:', error);
        alert('Erro ao remover anexo. Tente novamente.');
      }
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
    if (isImage(anexo.tipo)) {
      setPreviewModal({ isOpen: true, anexo, imageUrl: null, loading: true });
      
      try {
        // Importar a API de download
        const { anexoAPI } = await import('../../services/api');
        
        // Fazer download do arquivo via API para gerar URL temporária
        const blob = await anexoAPI.download(tarefaId, anexo.id);
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

  return (
    <div className="anexo-manager">
      <div className="anexo-header">
        <h4>
          <span className="material-icons">attach_file</span>
          Anexos ({anexos.length})
        </h4>
        
        {canEdit && (
          <button
            className="btn-add-anexo"
            onClick={handleFileSelect}
            disabled={uploading}
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
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.zip,.rar"
        />
      </div>

      <div className="anexo-list">
        {anexos.length === 0 ? (
          <div className="no-anexos">
            <span className="material-icons">folder_open</span>
            <p>Nenhum anexo adicionado</p>
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
                <div className="anexo-nome">{anexo.nome}</div>
                <div className="anexo-details">
                  <span className="anexo-size">{formatFileSize(Number(anexo.tamanho))}</span>
                  <span className="anexo-separator">•</span>
                  <span className="anexo-uploader">
                    {anexo.uploadedBy ? `Enviado por ${getUserName(anexo.uploadedBy)}` : 'Enviado por usuário desconhecido'}
                  </span>
                  <span className="anexo-separator">•</span>
                  <span className="anexo-date">
                    {anexo.criadoEm ? new Date(anexo.criadoEm).toLocaleDateString('pt-BR') : (anexo.data || 'Data desconhecida')}
                  </span>
                </div>
              </div>
              
              <div className="anexo-actions">
                <button
                  className="btn-preview"
                  onClick={() => handlePreview(anexo)}
                  title={isImage(anexo.tipo) ? "Visualizar imagem" : "Abrir arquivo"}
                >
                  <span className="material-icons">
                    {isImage(anexo.tipo) ? 'visibility' : 'open_in_new'}
                  </span>
                </button>
                
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
    </div>
  );
};

export default AnexoManager;
