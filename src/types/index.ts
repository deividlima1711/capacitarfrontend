export interface User {
  id: number;
  username: string;
  nome: string;
  email: string;
  role: string;
  cargo?: string;
  departamento?: string;
  tipoUsuario?: 'Gestor' | 'Comum' | 'Financeiro';
  avatar?: string;
  criadoEm?: string;
}

export type TipoUsuario = 'Gestor' | 'Comum' | 'Financeiro';

export interface Cargo {
  id: string;
  nome: TipoUsuario;
  descricao: string;
  permissoes: Permissao[];
}

export interface Permissao {
  modulo: string;
  acoes: ('visualizar' | 'criar' | 'editar' | 'excluir')[];
}

export interface PermissaoConfig {
  [key: string]: {
    visualizar: boolean;
    criar: boolean;
    editar: boolean;
    excluir: boolean;
  };
}

export interface Processo {
  id: string;
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em-andamento' | 'concluido' | 'atrasado';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  responsavelId: number;
  envolvidos?: number[]; // ✅ NOVO CAMPO: IDs dos usuários envolvidos
  dataInicio: string;
  dataFim?: string;
  prazo: string;
  progresso: number;
  categoria: string;
  tags?: string[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface Tarefa {
  id: string;
  titulo: string;
  descricao: string;
  status: 'pendente' | 'em-andamento' | 'concluido' | 'atrasado';
  prioridade: 'baixa' | 'media' | 'alta' | 'critica';
  responsavelId: number;
  processoId?: string;
  dataInicio: string;
  dataFim?: string;
  prazo: string;
  progresso: number;
  estimativaHoras?: number;
  horasGastas?: number;
  tags?: string[];
  comentarios?: Comentario[];
  anexos?: Anexo[];
  modeloOrigem?: {
    modeloId: number;
    modeloNome: string;
    atividadeOriginal: any;
    cargosExecutores: string[];
    usuariosAdicionais: string[];
    anexos: string[];
  };
  criadoEm: string;
  atualizadoEm: string;
}

export interface Anexo {
  id: string;
  nome: string;
  name?: string; // Alias para compatibilidade
  tipo: string; // MIME type
  type?: string; // Alias para compatibilidade
  tamanho: number | string; // em bytes (number) ou formatado (string)
  size?: number | string; // Alias para compatibilidade
  data?: string; // Data de upload formatada
  uploadDate?: string; // Alias para compatibilidade
  criadoEm?: string; // Data ISO de criação
  url?: string; // URL de acesso ao arquivo
  uploadedBy?: number; // ID do usuário que fez upload
  isUploading?: boolean; // Estado de upload em progresso
}

export interface Comentario {
  id: number;
  texto: string;
  autorId: number;
  criadoEm: string;
}

export interface Notificacao {
  id: number;
  titulo: string;
  mensagem: string;
  tipo: 'info' | 'warning' | 'error' | 'success' | 'tarefa' | 'processo';
  lida: boolean;
  usuarioId: number;
  criadoEm: string;
  // Navegação para tarefas/processos
  tarefaId?: string;
  processoId?: string;
  action?: 'open_task' | 'open_process' | 'navigate';
  link?: string;
}

export interface Estatisticas {
  processosAtivos: number;
  tarefasPendentes: number;
  tempoMedio: string;
  processosAtrasados: number;
  tendencias: {
    processosAtivos: number;
    tarefasPendentes: number;
    tempoMedio: number;
    processosAtrasados: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// Novos tipos para Modelos de Processos
export interface AtividadeModelo {
  id: number;
  nome: string;
  ordem: number;
  cargosExecutores: string[];
  usuariosAdicionais: string[];
  descricao?: string;
  anexos?: string[];
}

export interface ModeloProcesso {
  id: number;
  nome: string;
  ativo: boolean;
  criadoPor: string;
  dataCriacao: string;
  ultimaEdicaoPor: string;
  dataUltimaEdicao: string;
  totalAtividades: number;
  atividades: AtividadeModelo[];
}

export interface AppState {
  user: User | null;
  processos: Processo[];
  tarefas: Tarefa[];
  usuarios: User[];
  notificacoes: Notificacao[];
  estatisticas: Estatisticas;
  modelosProcessos: ModeloProcesso[];
  loading: boolean;
  error: string | null;
}

export type ViewMode = 'table' | 'kanban' | 'calendar';
export type SectionType = 'dashboard' | 'processos' | 'tarefas' | 'equipe' | 'relatorios' | 'configuracoes' | 'modelos-processos';
