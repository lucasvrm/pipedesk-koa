# Guia de logs do frontend (produção + source maps)

Este guia explica como coletar logs detalhados do frontend em produção agora que o build Vite publica **source maps**. Use estes passos para capturar o stack trace completo do erro 185 no `/leads` e compartilhar evidências acionáveis.

## Pré-requisitos
- Chrome/Edge com DevTools.
- Acesso ao deployment no Vercel (CLI autenticada):
  ```bash
  npm i -g vercel
  vercel login
  ```

## 1) Capturar o erro no navegador com source maps
1. Abra o `/leads` em produção.
2. DevTools → aba **Console** e marque **Preserve log** para não perder mensagens após reload.
3. Em **Settings (ícone ⚙️)** dentro do DevTools confirme que **Enable JavaScript source maps** está ativado (padrão é sim).
4. Recarregue a página e reproduza o erro. As mensagens `[Auth]`, `[ProtectedRoute]`, etc. continuarão aparecendo e a stack do erro 185 vai mostrar arquivos `.tsx` originais em vez de bundles minificados.
5. Clique na linha do stack trace para abrir o arquivo original (ex.: `src/pages/leads/views/sales/LeadsSalesList.tsx`) e copie o trecho exato que quebrou.

## 2) Exportar um pacote de evidências do frontend
1. No Console, clique com o botão direito → **Save as...** para baixar todas as mensagens e stack trace já expandidos.
2. Na aba **Network**, filtre por `leads` e exporte o HAR (botão **Export HAR...**) para incluir requisições e respostas que antecederam o erro.

## 3) Checar logs de runtime do Vercel
Se precisar confirmar erros de runtime (ex.: falha de asset ou 404 de API), colete os logs do deployment:

```bash
# Últimos 30 minutos do deploy atual
vercel logs https://pipdesk.vercel.app --since 30m --source=all

# Se estiver investigando um deploy específico
vercel logs <url-ou-alias-do-deploy> --source=all --since 1h
```

Dicas:
- Use `--output=json` se quiser importar os logs em outro ferramental.
- Inclua o horário aproximado do erro ao compartilhar os logs para facilitar o cruzamento com a stack mapeada.

## 4) Próximo passo
Com o stack trace mapeado (via source map) e os logs do console + Vercel, abra um issue ou compartilhe o pacote de evidências. Foque na linha/arquivo que aparece no stack; isso elimina a ambiguidade do erro minificado e agiliza a correção.
