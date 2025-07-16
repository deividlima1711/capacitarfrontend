import { User, Processo, Tarefa } from '../types';

// Interfaces do Backend (baseadas na análise dos modelos)
export interface BackendUser {
  _id?: string;
  id?: string; // Pode vir como id ou _id
  username: string;
  name?: string; // Backend pode enviar como 'name'
  nome?: string; // ou como 'nome' (frontend)
  email: string;
  role: 'admin' | 'manager' | 'user';
  tipoUsuario?: string; // Campo adicional do frontend
  department?: string;
  departamento?: string; // Campo em português
  cargo?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt?: string;
  criadoEm?: string; // Campo em português
  updatedAt?: string;
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
  assignedTo?: string; // ObjectId - opcional
  process?: string; // ObjectId - OPCIONAL (algumas tarefas podem ser independentes)
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
const mapBackendIdToFrontend = (backendId: string): number => {
  // Validar se o ID é válido
  if (!backendId || typeof backendId !== 'string' || backendId.length < 8) {
    console.warn(`mapBackendIdToFrontend: backendId inválido: ${backendId}`);
    return 0; // Retorna 0 como ID padrão para casos inválidos
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
  // Validar se o ID é válido
  if (!frontendId || typeof frontendId !== 'number' || frontendId <= 0) {
    console.warn(`mapFrontendIdToBackend: frontendId inválido: ${frontendId}`);
    return '000000000000000000000000'; // ObjectId padrão
  }
  
  if (reverseUserIdMap.has(frontendId)) {
    return reverseUserIdMap.get(frontendId)!;
  }
  
  // Se não encontrar, retornar um ObjectId padrão (isso não deveria acontecer)
  console.warn(`ID ${frontendId} não encontrado no mapeamento`);
  return '000000000000000000000000';
};

// Transformadores de User
export const transformBackendUserToFrontend = (backendUser: BackendUser): User => {
  // Validar se o objeto backendUser é válido
  if (!backendUser) {
    console.error('❌ transformBackendUserToFrontend: backendUser é null/undefined');
    throw new Error('Dados de usuário inválidos recebidos do backend');
  }
  
  // Verificar se tem ID (pode ser _id ou id)
  const userId = backendUser._id || backendUser.id;
  if (!userId) {
    console.error('❌ transformBackendUserToFrontend: backendUser sem ID', backendUser);
    throw new Error('Dados de usuário inválidos recebidos do backend - ID ausente');
  }
  
  // Verificar campos obrigatórios (aceitar tanto 'name' quanto 'nome')
  const nome = backendUser.nome || backendUser.name;
  if (!backendUser.username || !nome || !backendUser.email) {
    console.error('❌ transformBackendUserToFrontend: campos obrigatórios ausentes', {
      username: !!backendUser.username,
      nome: !!nome,
      email: !!backendUser.email,
      data: backendUser
    });
    throw new Error('Dados de usuário incompletos recebidos do backend');
  }
  
  const frontendId = mapBackendIdToFrontend(userId);
  
  return {
    id: frontendId,
    username: backendUser.username,
    nome: nome,
    email: backendUser.email,
    role: backendUser.role,
    cargo: backendUser.cargo || (backendUser.role === 'admin' ? 'Administrador' : 
           backendUser.role === 'manager' ? 'Gerente' : 'Usuário'),
    departamento: backendUser.departamento || backendUser.department || 'Geral',
    tipoUsuario: (backendUser.tipoUsuario as 'Gestor' | 'Comum' | 'Financeiro') || 
                 (backendUser.role === 'admin' || backendUser.role === 'manager' ? 'Gestor' : 'Comum'),
    criadoEm: backendUser.criadoEm || backendUser.createdAt
  };
};

export const transformFrontendUserToBackend = (frontendUser: Partial<User>): Partial<BackendUser> => {
  // Mapear tipoUsuario para role do backend
  const roleMap: { [key: string]: 'admin' | 'manager' | 'user' } = {
    'Comum': 'user',
    'Gestor': 'manager', 
    'Financeiro': 'admin'
  };

  const backendData: Partial<BackendUser> = {
    username: frontendUser.username,
    nome: frontendUser.nome,                    // Manter nome em português
    email: frontendUser.email,
    role: roleMap[frontendUser.tipoUsuario || ''] || 'user',
    departamento: frontendUser.departamento,    // Manter departamento em português
    tipoUsuario: frontendUser.tipoUsuario
  };
  
  // Incluir password se fornecido (importante para criação de usuários)
  if ((frontendUser as any).password) {
    (backendData as any).password = (frontendUser as any).password;
  }
  
  if (frontendUser.id) {
    const backendId = mapFrontendIdToBackend(frontendUser.id);
    backendData._id = backendId;
  }
  
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
    status: frontendProcess.status ? getProcessStatusForBackend(frontendProcess.status) : undefined,
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

// Função auxiliar para mapear status de processos corretamente
const getProcessStatusForBackend = (frontendStatus: string): 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDO' | 'CANCELADO' => {
  const mapping = {
    'pendente': 'PENDENTE',
    'em-andamento': 'EM_ANDAMENTO',
    'concluido': 'CONCLUIDO', // Para processos usa CONCLUIDO
    'atrasado': 'CANCELADO'   // Para processos usa CANCELADO
  } as const;
  
  return mapping[frontendStatus as keyof typeof mapping] || 'PENDENTE';
};

// Transformadores de Task
export const transformBackendTaskToFrontend = (backendTask: BackendTask): Tarefa => {
  const responsavelId = mapBackendIdToFrontend(backendTask.assignedTo || '');
  
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
  console.log('🔄 [TRANSFORMER] Convertendo tarefa para backend:', {
    titulo: frontendTask.titulo,
    processoId: frontendTask.processoId,
    hasProcesso: !!(frontendTask.processoId && frontendTask.processoId.trim()),
    tipoTarefa: frontendTask.processoId ? 'VINCULADA_PROCESSO' : 'INDEPENDENTE'
  });
  
  const backendData: Partial<BackendTask> = {
    title: frontendTask.titulo,
    description: frontendTask.descricao,
    startDate: frontendTask.dataInicio,
    progress: frontendTask.progresso || 0
  };
  
  // Adicionar campos opcionais apenas se existirem
  if (frontendTask.status) {
    backendData.status = getTaskStatusForBackend(frontendTask.status);
  }
  
  if (frontendTask.prioridade) {
    backendData.priority = priorityFrontendToBackend[frontendTask.prioridade];
  }
  
  // IMPORTANTE: Campo 'process' é OPCIONAL
  // Só enviar se realmente há um processo vinculado
  if (frontendTask.processoId && frontendTask.processoId.trim()) {
    backendData.process = frontendTask.processoId;
    console.log('✅ [TRANSFORMER] Tarefa VINCULADA ao processo:', frontendTask.processoId);
  } else {
    console.log('ℹ️ [TRANSFORMER] Tarefa INDEPENDENTE (sem processo vinculado)');
    // NÃO adicionar o campo 'process' para tarefas independentes
  }
  
  if (frontendTask.responsavelId) {
    backendData.assignedTo = mapFrontendIdToBackend(frontendTask.responsavelId);
  }
  
  if (frontendTask.prazo) {
    backendData.dueDate = frontendTask.prazo;
  }
  
  if (frontendTask.dataFim) {
    backendData.completedDate = frontendTask.dataFim;
  }
  
  if (frontendTask.estimativaHoras) {
    backendData.estimatedHours = frontendTask.estimativaHoras;
  }
  
  if (frontendTask.horasGastas) {
    backendData.actualHours = frontendTask.horasGastas;
  }
  
  if (frontendTask.tags && frontendTask.tags.length > 0) {
    backendData.tags = frontendTask.tags;
  }
  
  console.log('📤 [TRANSFORMER] Payload final para backend:', backendData);
  return backendData;
};

// Função auxiliar para mapear status de tarefas corretamente
const getTaskStatusForBackend = (frontendStatus: string): 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA' | 'CANCELADA' => {
  const mapping = {
    'pendente': 'PENDENTE',
    'em-andamento': 'EM_ANDAMENTO',
    'concluido': 'CONCLUIDA', // Para tarefas usa CONCLUIDA
    'atrasado': 'CANCELADA'   // Para tarefas usa CANCELADA
  } as const;
  
  return mapping[frontendStatus as keyof typeof mapping] || 'PENDENTE';
};

// Função para inicializar mapeamento de usuários
export const initializeUserMapping = (backendUsers: BackendUser[]) => {
  userIdMap.clear();
  reverseUserIdMap.clear();
  
  backendUsers.forEach(user => {
    const userId = user._id || user.id;
    if (userId) {
      const frontendId = mapBackendIdToFrontend(userId);
      // O mapeamento já é feito na função mapBackendIdToFrontend
    }
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

