# 🔍 Guia de Diagnóstico - Erro 400 na Criação de Usuários

## Problema Atual
O frontend está retornando erro 400 (Bad Request) ao tentar criar usuários via POST /users, indicando que o payload enviado não está alinhado com o que o backend espera.

## Logs Melhorados
Adicionei logs detalhados nos seguintes arquivos:
- `UsuarioModal.tsx` - mostra os dados do formulário antes do envio
- `dataTransformers.ts` - mostra a transformação dos dados
- `api.ts` - mostra o payload final e a resposta de erro completa

## Componente de Debug Adicionado
Criei um componente `DebugUserPayload` temporário na página de Equipe que permite:
- Testar diferentes payloads diretamente
- Fazer requisições HTTP manuais
- Ver respostas de erro detalhadas

## Passos para Diagnóstico

### 1. Teste com o Componente de Debug
1. Acesse a página "Equipe" no frontend
2. Use o formulário de debug que aparece no topo
3. Teste com payload mínimo primeiro:
```json
{
  "username": "testuser",
  "name": "Test User",
  "email": "test@example.com",
  "password": "123456",
  "role": "user"
}
```

### 2. Verificar os Logs no Console
Abra o Developer Tools (F12) e:
1. Vá para a aba "Console"
2. Tente criar um usuário
3. Procure pelos logs que começam com:
   - `🔍 [MODAL]` - dados do formulário
   - `🔍 [TRANSFORMER]` - transformação dos dados
   - `🔍 [USER CREATION]` - requisição HTTP
   - `❌ [USER CREATION]` - detalhes do erro

### 3. Verificar a Aba Network
1. Abra Developer Tools (F12)
2. Vá para a aba "Network"
3. Tente criar um usuário
4. Procure pela requisição POST para `/users`
5. Clique na requisição e veja:
   - **Request Headers** - headers enviados
   - **Request Payload** - dados enviados
   - **Response** - resposta do backend

### 4. Possíveis Problemas e Soluções

#### A. Campo obrigatório ausente
**Sintoma**: Erro 400 com mensagem sobre campo obrigatório
**Solução**: Adicionar o campo ao payload

#### B. Tipo de dados incorreto
**Sintoma**: Erro 400 sobre tipo inválido
**Solução**: Ajustar o tipo na transformação

#### C. Estrutura do payload incorreta
**Sintoma**: Erro 400 genérico
**Solução**: Comparar com o schema esperado pelo backend

#### D. Problema de autenticação
**Sintoma**: Erro 401 ou token ausente
**Solução**: Verificar se o token JWT está sendo enviado

### 5. Campos Comuns que Podem Estar Causando Problema

Baseado na estrutura atual, verifique se o backend espera:

```typescript
// Payload atual enviado:
{
  username: string,
  name: string,     // Mapeado de 'nome'
  email: string,
  password: string,
  role: 'admin' | 'manager' | 'user',
  department: string, // Mapeado de 'departamento'
  isActive: boolean
}

// Possíveis variações que o backend pode esperar:
{
  // Campos alternativos:
  fullName: string,      // ao invés de 'name'
  userType: string,      // ao invés de 'role'
  active: boolean,       // ao invés de 'isActive'
  
  // Campos que podem ser obrigatórios:
  confirmPassword: string,
  profile: string,
  permissions: string[],
  createdBy: string
}
```

### 6. Comandos para Teste Manual

Se quiser testar diretamente no terminal, use:

```bash
# Teste básico
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "username": "testuser",
    "name": "Test User", 
    "email": "test@example.com",
    "password": "123456",
    "role": "user"
  }'
```

## Próximos Passos

1. **Execute o diagnóstico**: Use o componente de debug e verifique os logs
2. **Identifique o erro específico**: Anote a mensagem de erro exata do backend
3. **Ajuste o payload**: Modifique a função `transformFrontendUserToBackend` conforme necessário
4. **Teste e valide**: Repita até funcionar
5. **Remova o debug**: Depois que funcionar, remova o componente de debug

## Informações para Compartilhar

Quando tiver os logs, compartilhe:
1. A mensagem de erro completa do backend
2. O payload que está sendo enviado
3. O status HTTP exato
4. Qualquer informação adicional dos headers de resposta

Isso ajudará a identificar exatamente o que o backend espera!
