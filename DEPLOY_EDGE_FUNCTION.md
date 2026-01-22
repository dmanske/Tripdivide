# 🚀 Deploy Manual da Edge Function encrypt-document

## ⚠️ Por que manual?
O Supabase CLI não tem permissões para fazer deploy no projeto `mateqvfogzwictdpaurj`.

## 📋 Instruções Passo a Passo

### 1. Acesse o Dashboard
**URL:** https://supabase.com/dashboard/project/mateqvfogzwictdpaurj/functions

### 2. Localize a função
- Procure por `encrypt-document` na lista de Edge Functions
- Clique nela para abrir

### 3. Edite a função
- Clique no botão **"Edit function"** ou **"Deploy new version"**

### 4. Substitua o código
- Apague todo o código atual
- Cole o código atualizado do arquivo: `supabase/functions/encrypt-document/index.ts`

### 5. Deploy
- Clique em **"Deploy"** ou **"Save"**
- Aguarde a confirmação de deploy bem-sucedido

## ✅ O que foi corrigido?

A função agora suporta **perfis globais de viajantes**:

### Antes (❌ Erro 400):
```typescript
// Só funcionava com td_travelers (legado)
if (action === 'encrypt') {
  // Sempre usava RPC save_encrypted_document
  await supabaseClient.rpc('save_encrypted_document', {...})
}
```

### Depois (✅ Funciona):
```typescript
if (action === 'encrypt') {
  if (isProfileDocument) {
    // Salva em td_traveler_profile_documents (perfis globais)
    await supabaseClient
      .from('td_traveler_profile_documents')
      .insert({...})
  } else {
    // Salva em td_travelers (legado)
    await supabaseClient.rpc('save_encrypted_document', {...})
  }
}
```

## 🔍 Como testar após deploy

1. Abra a aplicação
2. Vá em **Viajantes** (modo geral)
3. Clique em um perfil existente
4. Os documentos devem carregar sem erro 400
5. Tente adicionar um novo documento
6. Deve salvar com sucesso

## 📝 Resumo das mudanças

- ✅ Suporte para `isProfileDocument: true`
- ✅ Salva em `td_traveler_profile_documents` (perfis globais)
- ✅ Salva em `td_traveler_documents` (legado) quando necessário
- ✅ Descriptografia funciona para ambos os tipos
- ✅ Mantém compatibilidade com código existente

## 🆘 Problemas?

Se após o deploy ainda houver erros:
1. Verifique os logs da Edge Function no Dashboard
2. Confirme que a variável `DOCUMENT_ENCRYPTION_KEY` está configurada
3. Teste com um documento simples primeiro

---

**Arquivo gerado automaticamente em:** $(date)
