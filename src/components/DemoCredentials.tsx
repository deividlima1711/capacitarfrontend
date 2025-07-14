import React from 'react';
import { shouldUseMockData } from '../utils/mockData';

interface DemoCredentialsProps {
  onCredentialClick: (username: string, password: string) => void;
}

const DemoCredentials: React.FC<DemoCredentialsProps> = ({ onCredentialClick }) => {
  // DESABILITADO: Não mostrar credenciais demo quando usar backend real
  return null;

  const credentials = [
    { username: 'admin', password: 'Lima12345', role: 'Administrador' },
    { username: 'usuario1', password: '123456', role: 'Usuário Comum' },
    { username: 'usuario2', password: '123456', role: 'Financeiro' }
  ];

  return (
    <div style={{
      marginTop: '20px',
      padding: '16px',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      border: '1px solid #d1d5db'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px'
      }}>
        <span className="material-icons" style={{ color: '#6b7280', fontSize: '20px' }}>
          info
        </span>
        <h4 style={{ margin: 0, color: '#374151', fontSize: '14px', fontWeight: '600' }}>
          Modo Demonstração - Credenciais Disponíveis
        </h4>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {credentials.map((cred, index) => (
          <button
            key={index}
            onClick={() => onCredentialClick(cred.username, cred.password)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '8px 12px',
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#9ca3af';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.borderColor = '#d1d5db';
            }}
          >
            <div>
              <strong>{cred.username}</strong> - {cred.role}
            </div>
            <div style={{ color: '#6b7280' }}>
              Clique para usar
            </div>
          </button>
        ))}
      </div>
      
      <p style={{
        margin: '12px 0 0 0',
        fontSize: '12px',
        color: '#6b7280',
        lineHeight: '1.4'
      }}>
        <span className="material-icons" style={{ fontSize: '14px', verticalAlign: 'middle', marginRight: '4px' }}>
          cloud_off
        </span>
        Estas credenciais funcionam apenas em modo offline/demonstração.
      </p>
    </div>
  );
};

export default DemoCredentials;

