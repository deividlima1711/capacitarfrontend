/**
 * Hook para gerenciar notificações de tarefas com navegação interativa
 * Implementa navegação direta para tarefas atribuídas através de notificações
 */

import { useCallback } from 'react';
import { useApp } from '../contexts/AppContext';
import { Notificacao, Tarefa, User } from '../types';

export const useTaskNotifications = () => {
  const { addNotification, usuarios } = useApp();

  /**
   * Cria notificação quando uma tarefa é atribuída a um usuário
   */
  const notifyTaskAssignment = useCallback((tarefa: Tarefa, responsavel: User) => {
    const notification: Omit<Notificacao, 'id' | 'criadoEm'> = {
      titulo: 'Nova Tarefa Atribuída',
      mensagem: `Você foi atribuído à tarefa: "${tarefa.titulo}"`,
      tipo: 'info',
      lida: false,
      usuarioId: responsavel.id,
      tarefaId: tarefa.id,
      action: 'open_task'
    };

    addNotification(notification);
    
    console.log(`📨 Notificação enviada para ${responsavel.nome}: Tarefa "${tarefa.titulo}" atribuída`);
  }, [addNotification]);

  /**
   * Cria notificação quando status de uma tarefa é alterado
   */
  const notifyTaskStatusChange = useCallback((tarefa: Tarefa, oldStatus: string, newStatus: string, responsavel: User) => {
    const statusLabels = {
      'pendente': 'Pendente',
      'em-andamento': 'Em Andamento',
      'concluido': 'Concluído',
      'atrasado': 'Atrasado'
    };

    const notification: Omit<Notificacao, 'id' | 'criadoEm'> = {
      titulo: 'Status da Tarefa Alterado',
      mensagem: `Tarefa "${tarefa.titulo}" mudou de ${statusLabels[oldStatus as keyof typeof statusLabels]} para ${statusLabels[newStatus as keyof typeof statusLabels]}`,
      tipo: newStatus === 'concluido' ? 'success' : 'info',
      lida: false,
      usuarioId: responsavel.id,
      tarefaId: tarefa.id,
      action: 'open_task'
    };

    addNotification(notification);
    
    console.log(`📨 Notificação de status enviada para ${responsavel.nome}: ${oldStatus} → ${newStatus}`);
  }, [addNotification]);

  /**
   * Cria notificação quando uma tarefa está próxima do prazo
   */
  const notifyTaskDeadlineApproaching = useCallback((tarefa: Tarefa, responsavel: User, daysLeft: number) => {
    const notification: Omit<Notificacao, 'id' | 'criadoEm'> = {
      titulo: 'Prazo da Tarefa se Aproximando',
      mensagem: `A tarefa "${tarefa.titulo}" vence em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`,
      tipo: daysLeft <= 1 ? 'warning' : 'info',
      lida: false,
      usuarioId: responsavel.id,
      tarefaId: tarefa.id,
      action: 'open_task'
    };

    addNotification(notification);
    
    console.log(`📨 Notificação de prazo enviada para ${responsavel.nome}: ${daysLeft} dias restantes`);
  }, [addNotification]);

  /**
   * Cria notificação quando uma tarefa é comentada
   */
  const notifyTaskComment = useCallback((tarefa: Tarefa, responsavel: User, commentAuthor: string) => {
    if (responsavel.nome === commentAuthor) return; // Não notificar o próprio autor

    const notification: Omit<Notificacao, 'id' | 'criadoEm'> = {
      titulo: 'Novo Comentário na Tarefa',
      mensagem: `${commentAuthor} comentou na tarefa "${tarefa.titulo}"`,
      tipo: 'info',
      lida: false,
      usuarioId: responsavel.id,
      tarefaId: tarefa.id,
      action: 'open_task'
    };

    addNotification(notification);
    
    console.log(`📨 Notificação de comentário enviada para ${responsavel.nome}`);
  }, [addNotification]);

  /**
   * Encontra o usuário responsável por uma tarefa
   */
  const getTaskResponsible = useCallback((tarefaId: string | number): User | null => {
    const tarefa = Array.isArray(tarefaId) ? null : 
      usuarios.find(u => u.id === tarefaId);
    return tarefa || null;
  }, [usuarios]);

  /**
   * Cria notificações automáticas baseadas em mudanças de tarefa
   */
  const handleTaskUpdate = useCallback((tarefa: Tarefa, updates: Partial<Tarefa>, oldValues?: Partial<Tarefa>) => {
    const responsavel = usuarios.find(u => u.id === tarefa.responsavelId);
    if (!responsavel) return;

    // Notificar mudança de responsável
    if (updates.responsavelId && updates.responsavelId !== tarefa.responsavelId) {
      const novoResponsavel = usuarios.find(u => u.id === updates.responsavelId);
      if (novoResponsavel) {
        notifyTaskAssignment({ ...tarefa, ...updates } as Tarefa, novoResponsavel);
      }
    }

    // Notificar mudança de status
    if (updates.status && updates.status !== tarefa.status && oldValues?.status) {
      notifyTaskStatusChange(tarefa, oldValues.status, updates.status, responsavel);
    }
  }, [usuarios, notifyTaskAssignment, notifyTaskStatusChange]);

  return {
    notifyTaskAssignment,
    notifyTaskStatusChange,
    notifyTaskDeadlineApproaching,
    notifyTaskComment,
    getTaskResponsible,
    handleTaskUpdate
  };
};

export default useTaskNotifications;
