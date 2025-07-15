import React, { useState, useEffect } from 'react';
import { useApp } from '../../contexts/AppContext';
import NotificationPanel from './NotificationPanel';
import './NotificationButton.css';

const NotificationButton: React.FC = () => {
  const { notificacoes } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unread = notificacoes.filter(n => !n.lida).length;
    setUnreadCount(unread);
  }, [notificacoes]);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  const closePanel = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button 
        className="notification-button"
        onClick={togglePanel}
        title="Notificações"
      >
        <span className="material-icons">notifications</span>
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      <NotificationPanel 
        isOpen={isOpen} 
        onClose={closePanel} 
      />
      
      {isOpen && (
        <div 
          className="notification-overlay" 
          onClick={closePanel}
        />
      )}
    </>
  );
};

export default NotificationButton;
