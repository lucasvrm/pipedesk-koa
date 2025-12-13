# Integração Backend Python - Google Drive

Este documento descreve os requisitos e passos necessários para finalizar a integração entre o Frontend (Pipedesk) e o Backend Python (Render).

## 1. Configuração do Frontend

### Variáveis de Ambiente
O Frontend agora espera a seguinte variável de ambiente em `.env` (ou na configuração de build):

```env
VITE_DRIVE_API_URL="https://<seu-app>.onrender.com"
```

Esta URL será usada como base para todas as chamadas de API do Drive.

## 2. Requisitos para o Backend (Python)

Como o Frontend agora se comunica diretamente com o Render (sem proxy intermediário), as seguintes atualizações são críticas para a segurança e funcionamento.

### A. Autenticação (Crítico)
O Frontend envia o token JWT do Supabase no header `Authorization`.

**Ação Necessária:**
1.  Implementar um middleware no Backend Python que valide o token JWT do Supabase.
2.  Extrair o `sub` (User ID) e `role` do token.
3.  **IGNORAR** os headers `x-user-id` e `x-user-role` vindos da requisição, pois eles podem ser forjados pelo cliente.
    *   *Nota:* O Frontend ainda envia estes headers para compatibilidade temporária, mas eles devem ser descontinuados assim que a validação JWT estiver ativa.

### B. CORS (Cross-Origin Resource Sharing)
O navegador bloqueará requisições diretas se o Backend não retornar os headers CORS corretos.

**Ação Necessária:**
1.  Configurar o CORS no Backend (ex: `FastAPI.middleware.cors`) para permitir a origem do Frontend de produção (e localhost para dev).
    *   Origins: `https://app.pipedesk.com` (exemplo), `http://localhost:12000`, `http://localhost:5173`.
    *   Methods: `GET`, `POST`, `DELETE`, `OPTIONS`.
    *   Headers: `Authorization`, `Content-Type`, `x-user-id`, `x-user-role`.

### C. Endpoints Esperados

O Frontend espera a seguinte estrutura de API:

| Método | Rota | Descrição |
| :--- | :--- | :--- |
| `GET` | `/drive/{type}/{id}` | Lista arquivos/pastas. Deve retornar JSON com `files` (lista) e `permission`. |
| `POST` | `/drive/{type}/{id}/folder` | Cria pasta. Body: `{"name": "..."}`. |
| `POST` | `/drive/{type}/{id}/upload` | Upload de arquivo. Multipart/Form-data com campo `file`. |
| `DELETE` | `/drive/{type}/{id}/files/{file_id}` | Deleta um arquivo específico. |
| `DELETE` | `/drive/{type}/{id}/folders/{folder_id}` | Deleta uma pasta específica. |

> **Nota:** O Frontend já implementa a lógica para distinguir se o item a ser deletado é `file` ou `folder` e chama a rota correta.

## 3. Próximos Passos
1.  Deploy do Backend com as alterações de Autenticação e CORS.
2.  Configuração da variável `VITE_DRIVE_API_URL` no ambiente de produção do Frontend (Vercel/Netlify/etc).
