# Tipos de Tarefas no ProcessFlow

O sistema ProcessFlow suporta **dois tipos de tarefas**:

## 1. 📋 Tarefas Vinculadas a Processos

- **Criadas através de modelos de processo**
- **Fazem parte de um fluxo estruturado**
- **Campo `process` preenchido com ID do processo pai**
- **Exemplos:**
  - Tarefas de aprovação em um processo de compras
  - Etapas de revisão em processos de desenvolvimento
  - Tarefas de validação em processos de qualidade

## 2. 🔸 Tarefas Independentes

- **Criadas diretamente pelo usuário**
- **Não fazem parte de nenhum processo específico**
- **Campo `process` vazio/ausente**
- **Exemplos:**
  - Relatórios solicitados pelo gestor
  - Levantamentos de gastos
  - Análises pontuais
  - Tarefas de manutenção
  - Solicitações avulsas

## Implementação Técnica

### Frontend (React)
```typescript
// Tarefa independente
const tarefaIndependente = {
  titulo: "Levantamento de gastos Q1",
  descricao: "Analisar gastos do primeiro trimestre",
  // processoId: undefined (não enviado)
}

// Tarefa vinculada
const tarefaVinculada = {
  titulo: "Aprovar compra de equipamentos",
  descricao: "Revisar solicitação de compra",
  processoId: "processo123" // ID do processo pai
}
```

### Backend (Node.js/MongoDB)
```javascript
// Schema da tarefa
const taskSchema = {
  title: { type: String, required: true },
  description: String,
  process: { 
    type: ObjectId, 
    ref: 'Process',
    required: false // ✅ OPCIONAL para permitir tarefas independentes
  },
  // ... outros campos
}
```

## Visualização na Interface

No módulo **Tarefas**, o usuário verá:
- ✅ Todas as tarefas vinculadas a processos
- ✅ Todas as tarefas independentes criadas/atribuídas a ele
- 🔍 Filtros para distinguir entre os tipos
- 📊 Estatísticas separadas por tipo

## Benefícios

1. **Flexibilidade:** Permite gerenciar tanto fluxos estruturados quanto demandas pontuais
2. **Organização:** Separa claramente tarefas de processo vs. tarefas ad-hoc
3. **Visibilidade:** Gestor pode acompanhar todo tipo de demanda
4. **Simplicidade:** Interface unificada para ambos os tipos
