import { User, Processo, Tarefa } from '../types';

// Dados mockados para fallback quando a API não está disponível
export const mockUsers: User[] = [
  {
    id: 1,
    username: 'admin',
    nome: 'Administrador',
    email: 'admin@capacitar.com',
    role: 'admin',
    cargo: 'Administrador',
    departamento: 'TI',
    tipoUsuario: 'Gestor',
    criadoEm: new Date().toISOString()
  },
  {
    id: 2,
    username: 'usuario1',
    nome: 'João Silva',
    email: 'joao@capacitar.com',
    role: 'user',
    cargo: 'Analista',
    departamento: 'Operações',
    tipoUsuario: 'Comum',
    criadoEm: new Date().toISOString()
  },
  {
    id: 3,
    username: 'usuario2',
    nome: 'Maria Santos',
    email: 'maria@capacitar.com',
    role: 'user',
    cargo: 'Coordenadora',
    departamento: 'Financeiro',
    tipoUsuario: 'Financeiro',
    criadoEm: new Date().toISOString()
  }
];

export const mockProcessos: Processo[] = [
  {
    id: '1',
    titulo: 'Processo de Onboarding',
    descricao: 'Processo para integração de novos funcionários',
    status: 'em-andamento',
    prioridade: 'alta',
    responsavelId: 1,
    envolvidos: [1, 2],
    dataInicio: new Date().toISOString(),
    prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    progresso: 60,
    categoria: 'RH',
    tags: ['onboarding', 'rh'],
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  },
  {
    id: '2',
    titulo: 'Revisão de Processos Financeiros',
    descricao: 'Análise e otimização dos processos financeiros',
    status: 'pendente',
    prioridade: 'media',
    responsavelId: 3,
    envolvidos: [3],
    dataInicio: new Date().toISOString(),
    prazo: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    progresso: 0,
    categoria: 'Financeiro',
    tags: ['financeiro', 'revisão'],
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  }
];

export const mockTarefas: Tarefa[] = [
  {
    id: '1',
    titulo: 'Configurar ambiente de trabalho',
    descricao: 'Preparar computador e acessos para novo funcionário',
    status: 'concluido',
    prioridade: 'alta',
    responsavelId: 2,
    processoId: '1',
    dataInicio: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dataFim: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    prazo: new Date().toISOString(),
    progresso: 100,
    estimativaHoras: 4,
    horasGastas: 3,
    tags: ['setup', 'ti'],
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  },
  {
    id: '2',
    titulo: 'Apresentação da empresa',
    descricao: 'Realizar apresentação institucional para novo funcionário',
    status: 'em-andamento',
    prioridade: 'media',
    responsavelId: 1,
    processoId: '1',
    dataInicio: new Date().toISOString(),
    prazo: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    progresso: 50,
    estimativaHoras: 2,
    horasGastas: 1,
    tags: ['apresentação', 'rh'],
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  },
  {
    id: '3',
    titulo: 'Análise de fluxo de caixa',
    descricao: 'Revisar e analisar o fluxo de caixa mensal',
    status: 'pendente',
    prioridade: 'alta',
    responsavelId: 3,
    processoId: '2',
    dataInicio: new Date().toISOString(),
    prazo: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    progresso: 0,
    estimativaHoras: 8,
    horasGastas: 0,
    tags: ['financeiro', 'análise'],
    criadoEm: new Date().toISOString(),
    atualizadoEm: new Date().toISOString()
  }
];

// Função para simular delay de API
export const simulateApiDelay = (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Função para verificar se deve usar dados mockados
export const shouldUseMockData = (): boolean => {
  // NUNCA usar dados mockados - sempre forçar uso do backend real
  // Apenas para debug explícito se necessário
  const mockMode = localStorage.getItem('useMockData') === 'true';
  
  if (mockMode) {
    console.warn('⚠️ MODO MOCK ATIVADO - Usando dados locais ao invés do backend');
  }
  
  return false; // SEMPRE retornar false para forçar uso do backend
};

// Função para ativar/desativar modo mock
export const setMockDataMode = (enabled: boolean): void => {
  localStorage.setItem('useMockData', enabled.toString());
};

