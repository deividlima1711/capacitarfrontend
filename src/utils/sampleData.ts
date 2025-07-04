import { User, Processo, Tarefa } from '../types';

// Dados de exemplo removidos - agora usa dados reais do backend
export const sampleUsers: User[] = [];
export const sampleProcessos: Processo[] = [];
export const sampleTarefas: Tarefa[] = [];

// Função para inicializar dados de exemplo (agora vazia)
export const initializeSampleData = () => {
  // Dados de exemplo removidos - sistema agora usa dados reais do backend
  console.log('Sistema configurado para usar dados reais do backend');
};

// Função para limpar tarefas órfãs (mantida para compatibilidade)
export const clearOrphanTarefas = () => {
  try {
    const savedTarefas = localStorage.getItem('pf_tarefas');
    const savedProcessos = localStorage.getItem('pf_processos');
    
    if (savedTarefas && savedProcessos) {
      const tarefas = JSON.parse(savedTarefas);
      const processos = JSON.parse(savedProcessos);
      const processosIds = processos.map((p: any) => p.id);
      
      const tarefasValidas = tarefas.filter((t: any) => 
        !t.processoId || processosIds.includes(t.processoId)
      );
      
      localStorage.setItem('pf_tarefas', JSON.stringify(tarefasValidas));
    }
  } catch (error) {
    console.error('Erro ao limpar tarefas órfãs:', error);
  }
};

