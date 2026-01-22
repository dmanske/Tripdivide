# Regras de Interface do Usuário

## 🚫 NUNCA usar janelas do navegador

**PROIBIDO usar:**
- `prompt()` - Para pedir input do usuário
- `alert()` - Para mostrar mensagens
- `confirm()` - Para confirmações

**SEMPRE usar:**
- Inputs inline com estado React
- Modais customizados do componente `Modal`
- Componentes de UI do `CommonUI.tsx`

## Exemplo CORRETO de criar grupo:

```tsx
const [showNewGroupInput, setShowNewGroupInput] = useState(false);
const [newGroupName, setNewGroupName] = useState('');

// No JSX:
{!showNewGroupInput ? (
  <Button onClick={() => setShowNewGroupInput(true)}>+ Novo Grupo</Button>
) : (
  <div className="flex gap-2">
    <input
      type="text"
      value={newGroupName}
      onChange={e => setNewGroupName(e.target.value)}
      placeholder="Nome do grupo"
      autoFocus
      onKeyDown={async (e) => {
        if (e.key === 'Enter' && newGroupName.trim()) {
          await saveGroup(newGroupName);
          setShowNewGroupInput(false);
        } else if (e.key === 'Escape') {
          setShowNewGroupInput(false);
        }
      }}
    />
    <Button onClick={async () => {
      await saveGroup(newGroupName);
      setShowNewGroupInput(false);
    }}>Criar</Button>
    <Button onClick={() => setShowNewGroupInput(false)}>✕</Button>
  </div>
)}
```

## Exemplo ERRADO (NÃO FAZER):

```tsx
// ❌ NUNCA FAZER ISSO:
const name = prompt('Nome do grupo:');
if (name) {
  await saveGroup(name);
}

// ❌ NUNCA FAZER ISSO:
if (confirm('Deseja excluir?')) {
  await deleteItem();
}

// ❌ NUNCA FAZER ISSO:
alert('Operação concluída!');
```

## Benefícios da abordagem inline:

1. **Melhor UX**: Não interrompe o fluxo do usuário
2. **Mais controle**: Podemos estilizar e validar
3. **Acessibilidade**: Suporta teclado (Enter/Esc)
4. **Consistência**: Mantém o design system
5. **Mobile-friendly**: Funciona melhor em dispositivos móveis
