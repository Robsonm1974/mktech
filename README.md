# MKTECH

Sistema de tecnologia gamificada para educação fundamental (EF1/EF2).

## 🚀 Características

- **Next.js 15** com TypeScript strict
- **Supabase** para backend e autenticação
- **Tailwind CSS** com design tokens OKLCH
- **shadcn/ui** para componentes
- **i18n** (PT-BR pronto, EN/ES estruturado)
- **MCP** (Model Context Protocol) configurado
- **Multitenant** com RLS por tenant_id

## 🛠️ Tecnologias

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS 3.4.15
- **UI Components:** shadcn/ui + Radix UI
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **State Management:** React Context + TanStack Query
- **Validation:** Zod
- **Icons:** Lucide React
- **Package Manager:** PNPM

## 📋 Pré-requisitos

- Node.js ≥ 20.11.0
- PNPM ≥ 9
- Conta Supabase

## 🚀 Instalação

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/Robsonm1974/mktech.git
   cd mktech
   ```

2. **Instale as dependências:**
   ```bash
   pnpm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp env.example .env.local
   ```
   
   Edite `.env.local` com suas credenciais Supabase:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Execute o preflight:**
   ```bash
   pnpm preflight
   ```

5. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   ```

## 📁 Estrutura do Projeto

```
mktech/
├── src/
│   ├── app/                    # App Router (Next.js 15)
│   │   ├── (public)/          # Rotas públicas
│   │   ├── (auth)/            # Autenticação
│   │   ├── app/[tenant]/      # Rotas dinâmicas por tenant
│   │   └── api/               # API Routes
│   ├── components/
│   │   └── ui/                # Componentes shadcn/ui
│   ├── contexts/              # React Contexts
│   ├── lib/
│   │   ├── supabase/          # Clientes Supabase
│   │   ├── i18n/              # Internacionalização
│   │   └── utils/             # Utilitários
│   └── hooks/                 # Custom hooks
├── scripts/
│   └── preflight.ts           # Script de verificação
└── .mcprc                     # Configuração MCP
```

## 🔧 Scripts Disponíveis

- `pnpm dev` - Servidor de desenvolvimento
- `pnpm build` - Build de produção
- `pnpm start` - Servidor de produção
- `pnpm lint` - Linter ESLint
- `pnpm type-check` - Verificação TypeScript
- `pnpm preflight` - Verificação de ambiente
- `pnpm mcp:filesystem` - Servidor MCP filesystem
- `pnpm mcp:supabase` - Servidor MCP Supabase

## 🌐 Rotas

- `/` - Página inicial
- `/app/[tenant]/join` - Entrada em aula (QR + PIN)
- `/api/health` - Health check

## 🔐 Configuração MCP

O projeto está configurado com Model Context Protocol (MCP) para integração:

- **Filesystem:** Acesso ao código local
- **Supabase:** Integração com banco de dados

Configuração em `.mcprc`:
```json
{
  "mcpServers": {
    "mktech-filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem", "caminho/do/projeto"]
    },
    "mktech-supabase": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-supabase", "--project-url", "url", "--api-key", "key"]
    }
  }
}
```

## 🚀 Próximos Passos

1. **Configurar Supabase CLI** e gerar tipos do banco
2. **Criar migrations** do schema base
3. **Implementar endpoint** `/api/session/join`
4. **Desenvolver CMS** interno `/admin-mktech`
5. **Configurar buckets** de storage
6. **Implementar PWA** para modo quiosque

## 📝 Desenvolvimento

- **TypeScript strict:** `noImplicitAny: true`
- **ESLint anti-any:** Bloqueia uso de `any`
- **Preflight:** Verifica ambiente antes do build
- **CI/CD:** GitHub Actions configurado

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte, abra uma issue no [GitHub](https://github.com/Robsonm1974/mktech/issues).