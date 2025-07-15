import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { Notificacao } from '../../types';
import './NotificationPanel.css';

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel: React.FC<NotificationPanelProps> = ({ isOpen, onClose }) => {
  const { user, notificacoes, markNotificationAsRead } = useApp();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notificacoes.filter(n => !n.lida).length;
    setUnreadCount(unread);
  }, [notificacoes]);

  const handleNotificationClick = (notificacao: Notificacao) => {
    // Marcar como lida
    markNotificationAsRead(notificacao.id);
    
    // Navegar para a tarefa específica
    if (notificacao.tarefaId) {
      navigate(`/tarefas/${notificacao.tarefaId}`);
      onClose();
    } else if (notificacao.processoId) {
      navigate(`/processos/${notificacao.processoId}`);
      onClose();
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} dia${days > 1 ? 's' : ''} atrás`;
    } else if (hours > 0) {
      return `${hours} hora${hours > 1 ? 's' : ''} atrás`;
    } else if (minutes > 0) {
      return `${minutes} minuto${minutes > 1 ? 's' : ''} atrás`;
    } else {
      return 'Agora';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notificações</h3>
        <button className="close-btn" onClick={onClose}>
          <span className="material-icons">close</span>
        </button>
      </div>
      
      <div className="notification-list">
        {notificacoes.length === 0 ? (
          <div className="no-notifications">
            <span className="material-icons">notifications_none</span>
            <p>Nenhuma notificação</p>
          </div>
        ) : (
          notificacoes
            .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
            .map((notificacao) => (
              <div
                key={notificacao.id}
                className={`notification-item ${!notificacao.lida ? 'unread' : ''} ${
                  notificacao.tarefaId || notificacao.processoId ? 'clickable' : ''
                }`}
                onClick={() => handleNotificationClick(notificacao)}
              >
                <div className="notification-icon">
                  <span className="material-icons">
                    {notificacao.tipo === 'tarefa' ? 'assignment' : 
                     notificacao.tipo === 'processo' ? 'business_center' : 
                     'info'}
                  </span>
                </div>
                
                <div className="notification-content">
                  <div className="notification-message">
                    {notificacao.mensagem}
                  </div>
                  <div className="notification-time">
                    {formatTime(new Date(notificacao.criadoEm))}
                  </div>
                </div>
                
                {!notificacao.lida && (
                  <div className="unread-indicator"></div>
                )}
                
                {(notificacao.tarefaId || notificacao.processoId) && (
                  <div className="notification-action">
                    <span className="material-icons">arrow_forward_ios</span>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;
