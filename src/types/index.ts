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
  tipo: 'info' | 'warning' | 'error' | 'success';
  lida: boolean;
  usuarioId: number;
  criadoEm: string;
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
