import React, { useState } from 'react';

interface DebugUserPayloadProps {
  onSendTest: (payload: any) => void;
}

const DebugUserPayload: React.FC<DebugUserPayloadProps> = ({ onSendTest }) => {
  const [testPayload, setTestPayload] = useState({
    username: 'testuser123',
    name: 'Usuário de Teste',
    email: 'teste@exemplo.com',
    password: '123456',
    role: 'user',
    department: 'TI',
    isActive: true
  });

  const handleFieldChange = (field: string, value: any) => {
    setTestPayload(prev => ({ ...prev, [field]: value }));
  };

  const sendTest = () => {
    console.log('🧪 [DEBUG] Enviando payload de teste:', testPayload);
    onSendTest(testPayload);
  };

  return (
    <div style={{ 
      background: '#f8f9fa', 
      border: '1px solid #dee2e6', 
      padding: '20px', 
      borderRadius: '8px',
      margin: '20px 0' 
    }}>
      <h3>🧪 Debug - Teste de Payload para Backend</h3>
      <p>Use este formulário para testar diferentes payloads e identificar o problema:</p>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div>
          <label>Username:</label>
          <input 
            type="text" 
            value={testPayload.username} 
            onChange={(e) => handleFieldChange('username', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        
        <div>
          <label>Name:</label>
          <input 
            type="text" 
            value={testPayload.name} 
            onChange={(e) => handleFieldChange('name', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        
        <div>
          <label>Email:</label>
          <input 
            type="email" 
            value={testPayload.email} 
            onChange={(e) => handleFieldChange('email', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        
        <div>
          <label>Password:</label>
          <input 
            type="password" 
            value={testPayload.password} 
            onChange={(e) => handleFieldChange('password', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
        
        <div>
          <label>Role:</label>
          <select 
            value={testPayload.role} 
            onChange={(e) => handleFieldChange('role', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          >
            <option value="user">user</option>
            <option value="admin">admin</option>
            <option value="manager">manager</option>
          </select>
        </div>
        
        <div>
          <label>Department:</label>
          <input 
            type="text" 
            value={testPayload.department} 
            onChange={(e) => handleFieldChange('department', e.target.value)}
            style={{ width: '100%', padding: '5px' }}
          />
        </div>
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <h4>Payload JSON que será enviado:</h4>
        <pre style={{ 
          background: '#e9ecef', 
          padding: '10px', 
          borderRadius: '4px',
          fontSize: '12px',
          overflow: 'auto'
        }}>
          {JSON.stringify(testPayload, null, 2)}
        </pre>
      </div>
      
      <button 
        onClick={sendTest}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '10px'
        }}
      >
        🧪 Testar este Payload
      </button>
    </div>
  );
};

export default DebugUserPayload;
