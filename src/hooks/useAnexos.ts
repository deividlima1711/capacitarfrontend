/**
 * 🪝 HOOK PERSONALIZADO PARA GERENCIAMENTO DE ANEXOS
 * 
 * Hook unificado que simplifica o uso do sistema de anexos
 * em qualquer componente do sistema.
 */

import { useState, useEffect, useCallback } from 'react';
import { Anexo } from '../types';

interface UseAnexosOptions {
  entityType: 'tasks' | 'processes' | 'models';
  entityId: string;
  autoLoad?: boolean;
  maxFileSize?: number;
  allowedTypes?: string[];
}

interface UseAnexosReturn {
  anexos: Anexo[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  
  // Ações
  loadAnexos: () => Promise<void>;
  uploadAnexo: (file: File) => Promise<Anexo>;
  downloadAnexo: (anexo: Anexo) => Promise<void>;
  removeAnexo: (anexoId: string) => Promise<void>;
  clearError: () => void;
  
  // Utilitários
  validateFile: (file: File) => string | null;
  formatFileSize: (bytes: number) => string;
  isImage: (mimeType: string) => boolean;
}

export const useAnexos = ({
  entityType,
  entityId,
  autoLoad = true,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.jpg', '.jpeg', '.png', '.gif', '.zip', '.rar']
}: UseAnexosOptions): UseAnexosReturn => {
  
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar anexos automaticamente quando entityId muda
  useEffect(() => {
    if (autoLoad && entityId) {
      loadAnexos();
    }
  }, [entityId, entityType, autoLoad]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const isImage = useCallback((mimeType: string): boolean => {
    return mimeType.startsWith('image/');
  }, []);

  const validateFile = useCallback((file: File): string | null => {
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
  }, [maxFileSize, allowedTypes, formatFileSize]);

  const loadAnexos = useCallback(async (): Promise<void> => {
    if (!entityId) {
      setAnexos([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { anexoAPI } = await import('../services/api');
      
      // Tentar carregar anexos - se falhar, manter lista vazia
      const anexosData = await anexoAPI.list(entityType, entityId);
      setAnexos(anexosData || []);
      
      console.log(`✅ Anexos carregados para ${entityType}/${entityId}:`, anexosData?.length || 0);
      
    } catch (err: any) {
      console.warn(`⚠️ Erro ao carregar anexos para ${entityType}/${entityId}:`, err);
      setError(err.message || 'Erro ao carregar anexos');
      setAnexos([]); // Manter lista vazia em caso de erro
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  const uploadAnexo = useCallback(async (file: File): Promise<Anexo> => {
    // Validar arquivo antes do upload
    const validationError = validateFile(file);
    if (validationError) {
      throw new Error(validationError);
    }

    try {
      setUploading(true);
      setError(null);
      
      const { anexoAPI } = await import('../services/api');
      
      // Fazer upload
      const novoAnexo = await anexoAPI.upload(entityType, entityId, file);
      
      // Atualizar lista local
      setAnexos(prev => [...prev, novoAnexo]);
      
      console.log(`✅ Upload concluído: ${file.name}`);
      return novoAnexo;
      
    } catch (err: any) {
      console.error(`❌ Erro no upload de ${file.name}:`, err);
      const errorMessage = err.message || 'Erro ao fazer upload do arquivo';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setUploading(false);
    }
  }, [entityType, entityId, validateFile]);

  const downloadAnexo = useCallback(async (anexo: Anexo): Promise<void> => {
    try {
      setError(null);
      
      const { anexoAPI } = await import('../services/api');
      
      // Fazer download
      const blob = await anexoAPI.download(entityType, entityId, anexo.id);
      
      // Criar link temporário para download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = anexo.nome;
      document.body.appendChild(link);
      link.click();
      
      // Limpar recursos
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      console.log(`✅ Download concluído: ${anexo.nome}`);
      
    } catch (err: any) {
      console.error(`❌ Erro no download de ${anexo.nome}:`, err);
      const errorMessage = err.message || 'Erro ao baixar arquivo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [entityType, entityId]);

  const removeAnexo = useCallback(async (anexoId: string): Promise<void> => {
    try {
      setError(null);
      
      const { anexoAPI } = await import('../services/api');
      
      // Remover do backend
      await anexoAPI.delete(entityType, entityId, anexoId);
      
      // Atualizar lista local
      setAnexos(prev => prev.filter(anexo => anexo.id !== anexoId));
      
      console.log(`✅ Anexo removido: ${anexoId}`);
      
    } catch (err: any) {
      console.error(`❌ Erro ao remover anexo ${anexoId}:`, err);
      const errorMessage = err.message || 'Erro ao remover anexo';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [entityType, entityId]);

  return {
    anexos,
    loading,
    uploading,
    error,
    
    loadAnexos,
    uploadAnexo,
    downloadAnexo,
    removeAnexo,
    clearError,
    
    validateFile,
    formatFileSize,
    isImage
  };
};

export default useAnexos;
