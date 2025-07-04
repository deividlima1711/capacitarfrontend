import React, { useState, useEffect } from 'react';
import { userAPI, generalAPI } from '../services/api';
import { User } from '../types';
import './Dashboard.css';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Carregar status do sistema
        const statusData = await generalAPI.getStatus();
        setStatus(statusData);

        // Se for admin, carregar lista de usuários
        if (user.role === 'admin') {
          try {
            const usersData = await userAPI.getAll();
            setUsers(usersData || []);
          } catch (err) {
            console.log('Erro ao carregar usuários:', err);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user.role]);

  if (loading) {
    return (
      <div className="dashboard">
        <div className="loading">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Bem-vindo, {user.nome || user.username}!</span>
          <button onClick={onLogout} className="logout-btn">
            Sair
          </button>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Status do Sistema</h3>
            <p>{status ? 'Online' : 'Verificando...'}</p>
          </div>

          {user.role === 'admin' && (
            <div className="stat-card">
              <h3>Total de Usuários</h3>
              <p>{users.length}</p>
            </div>
          )}

          <div className="stat-card">
            <h3>Seu Perfil</h3>
            <p>Role: {user.role}</p>
            <p>Email: {user.email}</p>
          </div>
        </div>

        {user.role === 'admin' && users.length > 0 && (
          <div className="users-section">
            <h2>Usuários do Sistema</h2>
            <div className="users-list">
              {users.map((u) => (
                <div key={u.id} className="user-item">
                  <span>{u.nome || u.username}</span>
                  <span className="user-role">{u.role}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

