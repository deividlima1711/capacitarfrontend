# 📎 ROADMAP DE PADRONIZAÇÃO - SISTEMA DE ANEXOS

## 🎯 OBJETIVO
Padronizar e unificar o sistema de upload/download/visualização de anexos em todo o sistema ProcessFlow.

## 🔍 DIAGNÓSTICO ATUAL

### ✅ IMPLEMENTADO
- [x] Componente `AnexoManager` funcional
- [x] Interface `Anexo` unificada 
- [x] API de anexos para tarefas (`anexoAPI`)
- [x] Upload, download, delete e preview funcionais em tarefas
- [x] Validação de arquivos (10MB, tipos permitidos)

### ❌ PROBLEMAS IDENTIFICADOS
- [ ] **Backend**: Endpoint `/tasks/:id/anexos` retorna 404 (rota não implementada)
- [ ] **Processos**: Sem sistema de anexos no backend
- [ ] **Modelos**: Upload apenas local, sem persistência
- [ ] **Inconsistência**: Cada área usa implementação diferente

## 📋 PLANO DE AÇÃO

### FASE 1: CORREÇÃO DO BACKEND (CRÍTICO)
#### 1.1 Implementar Rotas de Anexos
```javascript
// Backend: routes/tasks.js
router.post('/:id/anexos', upload.single('file'), uploadAnexo);
router.get('/:id/anexos', listAnexos);
router.get('/:id/anexos/:anexoId/download', downloadAnexo);
router.delete('/:id/anexos/:anexoId', deleteAnexo);
```

#### 1.2 Configurar Middleware Multer
```javascript
// Backend: middleware/upload.js
const multer = require('multer');
const storage = multer.diskStorage({
  destination: 'uploads/anexos/',
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

#### 1.3 Implementar Controllers
```javascript
// Backend: controllers/anexoController.js
exports.uploadAnexo = async (req, res) => {
  // Lógica de upload
};
exports.downloadAnexo = async (req, res) => {
  // Lógica de download
};
// ... outros métodos
```

### FASE 2: PADRONIZAÇÃO DE ENDPOINTS
#### 2.1 Endpoints Unificados
- **Tarefas**: `/api/tasks/:id/anexos`
- **Processos**: `/api/processes/:id/anexos` 
- **Modelos**: `/api/models/:id/anexos`

#### 2.2 Schema de Banco Unificado
```javascript
// Backend: models/Anexo.js
const anexoSchema = {
  filename: String,
  originalname: String,
  mimetype: String,
  size: Number,
  path: String,
  uploadedBy: ObjectId,
  uploadedAt: Date,
  // Referências polimórficas
  entityType: { type: String, enum: ['Task', 'Process', 'Model'] },
  entityId: ObjectId
};
```

### FASE 3: REFATORAÇÃO DO FRONTEND
#### 3.1 API Service Unificado
```typescript
// Frontend: services/anexoAPI.ts
export const anexoAPI = {
  upload: (entityType: 'tasks'|'processes'|'models', entityId: string, file: File) => {
    return api.post(`/${entityType}/${entityId}/anexos`, formData);
  },
  download: (entityType: string, entityId: string, anexoId: string) => {
    return api.get(`/${entityType}/${entityId}/anexos/${anexoId}/download`);
  },
  // ... outros métodos
};
```

#### 3.2 Hook Customizado
```typescript
// Frontend: hooks/useAnexos.ts
export const useAnexos = (entityType: string, entityId: string) => {
  const [anexos, setAnexos] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const upload = async (file: File) => {
    // Lógica de upload unificada
  };
  
  return { anexos, upload, download, delete, loading };
};
```

#### 3.3 Componente Universal
```typescript
// Frontend: components/AnexoManager/UniversalAnexoManager.tsx
interface UniversalAnexoManagerProps {
  entityType: 'tasks' | 'processes' | 'models';
  entityId: string;
  canEdit: boolean;
  showPreview?: boolean;
}
```

### FASE 4: INTEGRAÇÃO COMPLETA
#### 4.1 Atualizar Componentes Existentes
- [ ] `TarefaModal.tsx` - Usar sistema unificado
- [ ] `ProcessoModal.tsx` - Implementar sistema de anexos
- [ ] `ModeloForm.tsx` - Integrar com backend

#### 4.2 Implementar em Novos Locais
- [ ] `ProcessoDetalhesModal.tsx` - Sistema real de anexos
- [ ] `ModelosProcessos.tsx` - Anexos persistentes

## 🧪 CHECKLIST DE VALIDAÇÃO

### Backend Testing
- [ ] `POST /api/tasks/123/anexos` → Status 201
- [ ] `GET /api/tasks/123/anexos` → Lista de anexos
- [ ] `GET /api/tasks/123/anexos/456/download` → Arquivo binário
- [ ] `DELETE /api/tasks/123/anexos/456` → Status 204

### Frontend Testing
- [ ] Upload funciona em todas as telas
- [ ] Preview de imagens funciona
- [ ] Download funciona corretamente
- [ ] Delete remove arquivo do servidor
- [ ] Estados de loading são mostrados

### Integration Testing
- [ ] Anexos persistem após refresh
- [ ] Anexos são removidos quando entidade é deletada
- [ ] Permissões de upload respeitadas
- [ ] Validação de arquivo funciona

## 📚 DOCUMENTAÇÃO NECESSÁRIA

### API Documentation
```yaml
# swagger.yml
/api/{entityType}/{entityId}/anexos:
  post:
    summary: Upload de anexo
    parameters:
      - name: entityType
        in: path
        required: true
        schema:
          type: string
          enum: [tasks, processes, models]
    requestBody:
      content:
        multipart/form-data:
          schema:
            type: object
            properties:
              file:
                type: string
                format: binary
```

### Frontend Documentation
```markdown
# AnexoManager Component Usage

## Basic Usage
```tsx
<AnexoManager
  entityType="tasks"
  entityId="123"
  canEdit={true}
  showPreview={true}
/>
```

## Advanced Usage with Custom Handlers
```tsx
const { anexos, upload, download } = useAnexos('tasks', '123');
```

## 🚀 IMPLEMENTAÇÃO PRIORIZADA

### Semana 1: Backend Critical Fix
1. Implementar rota `/tasks/:id/anexos` 
2. Configurar Multer middleware
3. Testar upload/download básico

### Semana 2: Frontend Integration  
1. Corrigir erro 404 em `TarefaResolucaoModal`
2. Validar `AnexoManager` funcionando
3. Testar todos os fluxos de anexo em tarefas

### Semana 3: Expansion
1. Implementar anexos em processos
2. Implementar anexos em modelos
3. Criar documentação da API

### Semana 4: Polish & Testing
1. Testes automatizados
2. Validação de performance
3. Documentação de uso

## 🔧 CONFIGURAÇÕES NECESSÁRIAS

### Environment Variables
```env
# Backend
UPLOAD_DIR=uploads/anexos
MAX_FILE_SIZE=10485760  # 10MB
ALLOWED_TYPES=image/*,application/pdf,application/msword

# Frontend  
REACT_APP_MAX_FILE_SIZE=10485760
```

### Package Dependencies
```json
// Backend package.json
{
  "multer": "^1.4.5",
  "mime-types": "^2.1.35"
}

// Frontend package.json  
{
  "@types/file-saver": "^2.0.5",
  "file-saver": "^2.0.5"
}
```

## ⚠️ CONSIDERAÇÕES DE SEGURANÇA

1. **Validação de Tipo**: Verificar MIME type real do arquivo
2. **Sanitização**: Remover caracteres especiais do nome
3. **Autorização**: Verificar permissões do usuário
4. **Armazenamento**: Considerar cloud storage (AWS S3, Azure Blob)
5. **Vírus Scan**: Implementar verificação de malware

## 📊 MÉTRICAS DE SUCESSO

- [ ] 0 erros 404 em uploads
- [ ] 100% dos anexos são salvos corretamente
- [ ] Tempo de upload < 5 segundos para arquivos de 10MB
- [ ] Preview de imagens funciona em 100% dos casos
- [ ] Sistema unificado usado em todas as telas
