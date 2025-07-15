// Arquivo temporário para verificação de tipos
import { Anexo, Tarefa, User } from './types';
import { anexoAPI } from './services/api';
import { useApp } from './contexts/AppContext';

// Verificação de tipos para AnexoManager
interface AnexoManagerProps {
  anexos: Anexo[];
  tarefaId: string;
  canEdit: boolean;
  usuarios: User[];
  onAddAnexo: (file: File) => Promise<void>;
  onRemoveAnexo: (anexoId: string) => Promise<void>;
}

// Verificação do estado do TarefaResolucaoModal
interface AnexoState {
  id: string;
  nome: string;
  tipo: string;
  tamanho: string;
  data: string;
  url?: string;
  isUploading?: boolean;
}

// Verificação de compatibilidade de tipos
const testAnexo: Anexo = {
  id: 'test',
  nome: 'test.pdf',
  tipo: 'application/pdf',
  tamanho: 1024, // ou string "1024 KB"
  url: 'https://example.com/file.pdf',
  uploadedBy: 1,
  isUploading: false
};

// Teste de conversão de tipos
const convertAnexo = (anexo: Anexo): AnexoState => ({
  id: anexo.id,
  nome: anexo.nome,
  tipo: anexo.tipo,
  tamanho: typeof anexo.tamanho === 'number' 
    ? `${(anexo.tamanho / 1024).toFixed(1)} KB` 
    : String(anexo.tamanho),
  data: anexo.data || anexo.criadoEm || new Date().toLocaleString('pt-BR'),
  url: anexo.url,
  isUploading: anexo.isUploading
});

export { testAnexo, convertAnexo };
