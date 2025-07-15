# 🔧 EXEMPLO DE IMPLEMENTAÇÃO BACKEND - SISTEMA DE ANEXOS

## 📋 ENDPOINTS NECESSÁRIOS

### 1. CONFIGURAÇÃO INICIAL

```javascript
// server.js ou app.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

// Configuração do Multer para upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { entityType, entityId } = req.params;
    const uploadPath = path.join(__dirname, 'uploads', entityType, entityId);
    
    // Criar diretório se não existir
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Nome único: timestamp + nome original
    const uniqueName = `${Date.now()}_${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    // Validar tipos de arquivo
    const allowedTypes = /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|jpg|jpeg|png|gif|zip|rar)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'), false);
    }
  }
});
```

### 2. ROTAS UNIVERSAIS DE ANEXOS

```javascript
// routes/anexos.js

// 📤 UPLOAD DE ANEXO
app.post('/:entityType/:entityId/anexos', upload.single('file'), async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }
    
    // Validar entityType
    const allowedTypes = ['tasks', 'processes', 'models'];
    if (!allowedTypes.includes(entityType)) {
      return res.status(400).json({ error: 'Tipo de entidade inválido' });
    }
    
    // Salvar informações do anexo no banco de dados
    const anexo = {
      id: generateUniqueId(), // ou usar auto-increment
      nome: file.originalname,
      tipo: file.mimetype,
      tamanho: file.size,
      caminho: file.path,
      entityType,
      entityId,
      uploadedBy: req.user?.id || 1, // ID do usuário logado
      criadoEm: new Date().toISOString()
    };
    
    // Salvar no banco (exemplo com Sequelize/Prisma/etc)
    const novoAnexo = await Anexo.create(anexo);
    
    res.status(201).json({
      id: novoAnexo.id,
      nome: novoAnexo.nome,
      tipo: novoAnexo.tipo,
      tamanho: novoAnexo.tamanho,
      data: novoAnexo.criadoEm,
      uploadedBy: novoAnexo.uploadedBy
    });
    
  } catch (error) {
    console.error('Erro no upload:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 📋 LISTAR ANEXOS
app.get('/:entityType/:entityId/anexos', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    
    // Buscar anexos no banco
    const anexos = await Anexo.findAll({
      where: { entityType, entityId },
      order: [['criadoEm', 'DESC']]
    });
    
    // Formatar resposta
    const anexosFormatados = anexos.map(anexo => ({
      id: anexo.id,
      nome: anexo.nome,
      tipo: anexo.tipo,
      tamanho: anexo.tamanho,
      data: anexo.criadoEm,
      uploadedBy: anexo.uploadedBy
    }));
    
    res.json({ anexos: anexosFormatados });
    
  } catch (error) {
    console.error('Erro ao listar anexos:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 💾 DOWNLOAD DE ANEXO
app.get('/:entityType/:entityId/anexos/:anexoId/download', async (req, res) => {
  try {
    const { entityType, entityId, anexoId } = req.params;
    
    // Buscar anexo no banco
    const anexo = await Anexo.findOne({
      where: { id: anexoId, entityType, entityId }
    });
    
    if (!anexo) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }
    
    // Verificar se arquivo existe
    if (!fs.existsSync(anexo.caminho)) {
      return res.status(404).json({ error: 'Arquivo não encontrado no servidor' });
    }
    
    // Configurar headers para download
    res.setHeader('Content-Disposition', `attachment; filename="${anexo.nome}"`);
    res.setHeader('Content-Type', anexo.tipo);
    res.setHeader('Content-Length', anexo.tamanho);
    
    // Enviar arquivo
    const fileStream = fs.createReadStream(anexo.caminho);
    fileStream.pipe(res);
    
  } catch (error) {
    console.error('Erro no download:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// 🗑️ REMOVER ANEXO
app.delete('/:entityType/:entityId/anexos/:anexoId', async (req, res) => {
  try {
    const { entityType, entityId, anexoId } = req.params;
    
    // Buscar anexo no banco
    const anexo = await Anexo.findOne({
      where: { id: anexoId, entityType, entityId }
    });
    
    if (!anexo) {
      return res.status(404).json({ error: 'Anexo não encontrado' });
    }
    
    // Remover arquivo físico
    if (fs.existsSync(anexo.caminho)) {
      fs.unlinkSync(anexo.caminho);
    }
    
    // Remover do banco
    await anexo.destroy();
    
    res.status(204).send();
    
  } catch (error) {
    console.error('Erro ao remover anexo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});
```

### 3. MODELO DE BANCO DE DADOS

```sql
-- SQL para criar tabela de anexos
CREATE TABLE anexos (
  id INT PRIMARY KEY AUTO_INCREMENT,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(100) NOT NULL,
  tamanho INT NOT NULL,
  caminho VARCHAR(500) NOT NULL,
  entity_type ENUM('tasks', 'processes', 'models') NOT NULL,
  entity_id VARCHAR(50) NOT NULL,
  uploaded_by INT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_uploaded_by (uploaded_by),
  
  FOREIGN KEY (uploaded_by) REFERENCES usuarios(id) ON DELETE SET NULL
);
```

```javascript
// Modelo Sequelize
const { DataTypes } = require('sequelize');

const Anexo = sequelize.define('Anexo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tipo: {
    type: DataTypes.STRING,
    allowNull: false
  },
  tamanho: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  caminho: {
    type: DataTypes.STRING,
    allowNull: false
  },
  entityType: {
    type: DataTypes.ENUM('tasks', 'processes', 'models'),
    allowNull: false
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  uploadedBy: {
    type: DataTypes.INTEGER,
    references: {
      model: 'usuarios',
      key: 'id'
    }
  }
}, {
  tableName: 'anexos',
  timestamps: true,
  createdAt: 'criadoEm',
  updatedAt: 'atualizadoEm'
});
```

### 4. MIDDLEWARE DE VALIDAÇÃO

```javascript
// middleware/validateEntity.js
const validateEntity = async (req, res, next) => {
  const { entityType, entityId } = req.params;
  
  try {
    // Verificar se a entidade existe
    let entity;
    switch (entityType) {
      case 'tasks':
        entity = await Task.findByPk(entityId);
        break;
      case 'processes':
        entity = await Process.findByPk(entityId);
        break;
      case 'models':
        entity = await Model.findByPk(entityId);
        break;
      default:
        return res.status(400).json({ error: 'Tipo de entidade inválido' });
    }
    
    if (!entity) {
      return res.status(404).json({ error: `${entityType.slice(0, -1)} não encontrado` });
    }
    
    req.entity = entity;
    next();
    
  } catch (error) {
    res.status(500).json({ error: 'Erro ao validar entidade' });
  }
};

// Usar o middleware
app.use('/:entityType/:entityId/anexos', validateEntity);
```

### 5. MIDDLEWARE DE PERMISSÕES

```javascript
// middleware/checkPermissions.js
const checkPermissions = async (req, res, next) => {
  const { entityType, entityId } = req.params;
  const userId = req.user?.id;
  
  if (!userId) {
    return res.status(401).json({ error: 'Usuário não autenticado' });
  }
  
  try {
    // Verificar permissões baseado no tipo de entidade
    let hasPermission = false;
    
    switch (entityType) {
      case 'tasks':
        const task = await Task.findByPk(entityId);
        hasPermission = task.responsavelId === userId || req.user.role === 'admin';
        break;
      case 'processes':
        const process = await Process.findByPk(entityId);
        hasPermission = process.responsavelId === userId || req.user.role === 'admin';
        break;
      case 'models':
        hasPermission = req.user.role === 'admin' || req.user.role === 'manager';
        break;
    }
    
    if (!hasPermission) {
      return res.status(403).json({ error: 'Sem permissão para esta ação' });
    }
    
    next();
    
  } catch (error) {
    res.status(500).json({ error: 'Erro ao verificar permissões' });
  }
};

// Usar apenas em operações de modificação
app.post('/:entityType/:entityId/anexos', checkPermissions, upload.single('file'), ...);
app.delete('/:entityType/:entityId/anexos/:anexoId', checkPermissions, ...);
```

## 🔧 CONFIGURAÇÃO ADICIONAL

### CORS
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}));
```

### Tratamento de Erros
```javascript
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Arquivo muito grande' });
    }
  }
  
  res.status(500).json({ error: 'Erro interno do servidor' });
});
```

### Limpeza de Arquivos Órfãos
```javascript
// Função para limpar arquivos órfãos (executar periodicamente)
const cleanupOrphanedFiles = async () => {
  const uploadsDir = path.join(__dirname, 'uploads');
  const allFiles = await getAllFilesRecursively(uploadsDir);
  
  for (const filePath of allFiles) {
    const anexo = await Anexo.findOne({ where: { caminho: filePath } });
    if (!anexo) {
      fs.unlinkSync(filePath);
      console.log(`Arquivo órfão removido: ${filePath}`);
    }
  }
};

// Executar limpeza diariamente
setInterval(cleanupOrphanedFiles, 24 * 60 * 60 * 1000);
```

## 🚀 DEPLOYMENT

### Docker
```dockerfile
# Dockerfile
FROM node:16
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Criar diretório de uploads
RUN mkdir -p /app/uploads

EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables
```bash
# .env
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=capacitar
DB_USER=user
DB_PASS=password
UPLOAD_DIR=/app/uploads
MAX_FILE_SIZE=10485760
```

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

- [ ] Instalar dependências (`multer`, `express`, etc.)
- [ ] Criar tabela `anexos` no banco de dados
- [ ] Implementar rotas de upload, download, list, delete
- [ ] Configurar middleware de validação
- [ ] Implementar sistema de permissões
- [ ] Configurar CORS adequadamente
- [ ] Implementar tratamento de erros
- [ ] Testar todos os endpoints
- [ ] Configurar limpeza de arquivos órfãos
- [ ] Configurar backup dos arquivos
- [ ] Documentar API no Swagger/OpenAPI

Com essa implementação, o sistema de anexos estará **100% funcional** e integrado com o frontend universal desenvolvido.
