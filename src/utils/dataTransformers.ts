import { User, Processo, Tarefa } from '../types';

// Interfaces do Backend (baseadas na análise dos modelos)
export interface BackendUser {
  _id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'user';
  department?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendProcess {
  _id: string;
  title: string;
  description?: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO';
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  responsible: string; // ObjectId
  team?: string[]; // Array de ObjectIds
  startDate: string;
  dueDate?: string;
  completedDate?: string;
  progress: number;
  category?: string;
  tags?: string[];
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  comments?: Array<{
    user: string;
    text: string;
    createdAt: string;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTask {
  _id: string;
  title: string;
  description?: string;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA';
  priority: 'BAIXA' | 'MEDIA' | 'ALTA' | 'URGENTE';
  assignedTo: string; // ObjectId
  process: string; // ObjectId
  startDate: string;
  dueDate?: string;
  completedDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  progress: number;
  tags?: string[];
  checklist?: Array<{
    item: string;
    completed: boolean;
    completedAt?: string;
    completedBy?: string;
  }>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
  }>;
  comments?: Array<{
    user: string;
    text: string;
    createdAt: string;
  }>;
  dependencies?: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Mapeamento de Status
const statusBackendToFrontend = {
  'PENDENTE': 'pendente',
  'EM_ANDAMENTO': 'em-andamento',
  'CONCLUIDO': 'concluido',
  'CONCLUIDA': 'concluido', // Para tarefas
  'CANCELADO': 'atrasado', // Mapeamos cancelado para atrasado no frontend
  'CANCELADA': 'atrasado'
} as const;

const statusFrontendToBackend = {
  'pendente': 'PENDENTE',
  'em-andamento': 'EM_ANDAMENTO',
  'concluido': 'CONCLUIDO',
  'atrasado': 'CANCELADO' // Mapeamos atrasado para cancelado no backend
} as const;

// Mapeamento de Prioridade
const priorityBackendToFrontend = {
  'BAIXA': 'baixa',
  'MEDIA': 'media',
  'ALTA': 'alta',
  'URGENTE': 'critica'
} as const;

const priorityFrontendToBackend = {
  'baixa': 'BAIXA',
  'media': 'MEDIA',
  'alta': 'ALTA',
  'critica': 'URGENTE'
} as const;

// Cache para mapeamento de IDs de usuários
let userIdMap: Map<string, number> = new Map();
let reverseUserIdMap: Map<number, string> = new Map();

// Função para mapear ObjectId do backend para number do frontend
const mapBackendIdToFrontend = (backendId: string | undefined): number => {
  if (!backendId || typeof backendId !== 'string') {
    console.error('mapBackendIdToFrontend: backendId inválido:', backendId, new Error().stack);
    return 0; // ou outro valor padrão seguro
  }
  if (userIdMap.has(backendId)) {
    return userIdMap.get(backendId)!;
  }
  
  // Gerar ID numérico baseado no hash do ObjectId
  const numericId = parseInt(backendId.slice(-8), 16) % 1000000;
  userIdMap.set(backendId, numericId);
  reverseUserIdMap.set(numericId, backendId);
  
  return numericId;
};

// Função para mapear number do frontend para ObjectId do backend
const mapFrontendIdToBackend = (frontendId: number): string => {
  if (reverseUserIdMap.has(frontendId)) {
    return reverseUserIdMap.get(frontendId)!;
  }
  
  // Se não encontrar, retornar um ObjectId padrão (isso não deveria acontecer)
  console.warn(`ID ${frontendId} não encontrado no mapeamento`);
  return '000000000000000000000000';
};

// Transformadores de User
export const transformBackendUserToFrontend = (backendUser: BackendUser): User => {
  const frontendId = mapBackendIdToFrontend(backendUser._id);
  
  return {
    id: frontendId,
    username: backendUser.username,
    nome: backendUser.name,
    email: backendUser.email,
    role: backendUser.role,
    cargo: backendUser.role === 'admin' ? 'Administrador' : 
           backendUser.role === 'manager' ? 'Gerente' : 'Usuário',
    departamento: backendUser.department || 'Geral',
    tipoUsuario: backendUser.role === 'admin' || backendUser.role === 'manager' ? 'Gestor' : 'Comum',
    criadoEm: backendUser.createdAt
  };
};

export const transformFrontendUserToBackend = (frontendUser: Partial<User>): Partial<BackendUser> => {
  console.log('🔍 [TRANSFORMER] Dados de entrada do frontend:', frontendUser);
  
  const backendData: Partial<BackendUser> = {
    username: frontendUser.username,
    name: frontendUser.nome,
    email: frontendUser.email,
    role: frontendUser.role as 'admin' | 'manager' | 'user',
    department: frontendUser.departamento,
    isActive: true // Novos usuários são ativos por padrão
  };
  
  // Adicionar senha se fornecida (para criação ou atualização)
  if ((frontendUser as any).password) {
    (backendData as any).password = (frontendUser as any).password;
  }
  
  if (frontendUser.id) {
    const backendId = mapFrontendIdToBackend(frontendUser.id);
    backendData._id = backendId;
  }
  
  console.log('🔍 [TRANSFORMER] Dados transformados para o backend:');
  console.log('  - username:', backendData.username);
  console.log('  - name:', backendData.name);
  console.log('  - email:', backendData.email);
  console.log('  - role:', backendData.role);
  console.log('  - department:', backendData.department);
  console.log('  - isActive:', backendData.isActive);
  console.log('  - password definida?:', !!(backendData as any).password);
  console.log('  - _id:', backendData._id);
  console.log('  - Objeto completo:', JSON.stringify(backendData, null, 2));
  
  return backendData;
};

// Transformadores de Process
export const transformBackendProcessToFrontend = (backendProcess: BackendProcess): Processo => {
  const responsavelId = mapBackendIdToFrontend(backendProcess.responsible);
  const envolvidos = backendProcess.team?.map(id => mapBackendIdToFrontend(id)) || [];
  
  return {
    id: backendProcess._id,
    titulo: backendProcess.title,
    descricao: backendProcess.description || '',
    status: statusBackendToFrontend[backendProcess.status] || 'pendente',
    prioridade: priorityBackendToFrontend[backendProcess.priority] || 'media',
    responsavelId,
    envolvidos,
    dataInicio: backendProcess.startDate,
    dataFim: backendProcess.completedDate,
    prazo: backendProcess.dueDate || backendProcess.startDate,
    progresso: backendProcess.progress,
    categoria: backendProcess.category || 'Geral',
    tags: backendProcess.tags || [],
    criadoEm: backendProcess.createdAt,
    atualizadoEm: backendProcess.updatedAt
  };
};

export const transformFrontendProcessToBackend = (frontendProcess: Partial<Processo>): Partial<BackendProcess> => {
  const backendData: Partial<BackendProcess> = {
    title: frontendProcess.titulo,
    description: frontendProcess.descricao,
    status: frontendProcess.status ? statusFrontendToBackend[frontendProcess.status] : undefined,
    priority: frontendProcess.prioridade ? priorityFrontendToBackend[frontendProcess.prioridade] : undefined,
    startDate: frontendProcess.dataInicio,
    dueDate: frontendProcess.prazo,
    completedDate: frontendProcess.dataFim,
    progress: frontendProcess.progresso,
    category: frontendProcess.categoria,
    tags: frontendProcess.tags
  };
  
  if (frontendProcess.responsavelId) {
    backendData.responsible = mapFrontendIdToBackend(frontendProcess.responsavelId);
  }
  
  if (frontendProcess.envolvidos) {
    backendData.team = frontendProcess.envolvidos.map(id => mapFrontendIdToBackend(id));
  }
  
  return backendData;
};

// Transformadores de Task
export const transformBackendTaskToFrontend = (backendTask: BackendTask): Tarefa => {
  const responsavelId = mapBackendIdToFrontend(backendTask.assignedTo);
  
  return {
    id: backendTask._id,
    titulo: backendTask.title,
    descricao: backendTask.description || '',
    status: statusBackendToFrontend[backendTask.status] || 'pendente',
    prioridade: priorityBackendToFrontend[backendTask.priority] || 'media',
    responsavelId,
    processoId: backendTask.process,
    dataInicio: backendTask.startDate,
    dataFim: backendTask.completedDate,
    prazo: backendTask.dueDate || backendTask.startDate,
    progresso: backendTask.progress,
    estimativaHoras: backendTask.estimatedHours,
    horasGastas: backendTask.actualHours,
    tags: backendTask.tags || [],
    criadoEm: backendTask.createdAt,
    atualizadoEm: backendTask.updatedAt
  };
};

export const transformFrontendTaskToBackend = (frontendTask: Partial<Tarefa>): Partial<BackendTask> => {
  const backendData: Partial<BackendTask> = {
    title: frontendTask.titulo,
    description: frontendTask.descricao,
    status: frontendTask.status ? (statusFrontendToBackend[frontendTask.status] + 'A') as any : undefined, // Adiciona 'A' para tarefas
    priority: frontendTask.prioridade ? priorityFrontendToBackend[frontendTask.prioridade] : undefined,
    process: frontendTask.processoId,
    startDate: frontendTask.dataInicio,
    dueDate: frontendTask.prazo,
    completedDate: frontendTask.dataFim,
    estimatedHours: frontendTask.estimativaHoras,
    actualHours: frontendTask.horasGastas,
    progress: frontendTask.progresso,
    tags: frontendTask.tags
  };
  
  if (frontendTask.responsavelId) {
    backendData.assignedTo = mapFrontendIdToBackend(frontendTask.responsavelId);
  }
  
  return backendData;
};

// Função para inicializar mapeamento de usuários
export const initializeUserMapping = (backendUsers: BackendUser[]) => {
  userIdMap.clear();
  reverseUserIdMap.clear();
  
  backendUsers.forEach(user => {
    const frontendId = mapBackendIdToFrontend(user._id);
    // O mapeamento já é feito na função mapBackendIdToFrontend
  });
};

// Função para obter estatísticas de mapeamento
export const getMappingStats = () => {
  return {
    totalMappings: userIdMap.size,
    userMappings: Array.from(userIdMap.entries()).map(([backendId, frontendId]) => ({
      backend: backendId,
      frontend: frontendId
    }))
  };
};

