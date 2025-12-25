# 📘 PipeDesk Koa

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

> Plataforma moderna de Deal Flow Management para bancos de investimento e profissionais de M&A

---

## 🚀 Quick Start

```bash
# Clone o repositório
git clone https://github.com/lucasvrm/pipedesk-koa.git
cd pipedesk-koa

# Instale dependências
npm install --legacy-peer-deps

# Configure o ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:5173**

---

## 📚 Documentação

### 📖 Documentação Principal
- **[Documentação Completa](/docs/README.md)** - Guia completo do projeto
- **[Instalação](/docs/getting-started/installation.md)** - Guia detalhado de instalação
- **[Contribuição](/docs/development/CONTRIBUTING.md)** - Como contribuir para o projeto

### 🤖 Para Desenvolvedores e Agentes de IA
- **[GOLDEN_RULES.md](./GOLDEN_RULES.md)** - Regras de código, padrões e melhores práticas (v2.0)
- **[AGENTS.md](./AGENTS.md)** - Configuração de agentes de IA (Cursor, Windsurf, etc.)

### 🎯 Links Rápidos
- [Features](/docs/status/FEATURES_STATUS.md)
- [Roadmap](/docs/overview/ROADMAP.md)
- [Segurança](/docs/security/SECURITY.md)
- [Testes](/docs/development/TESTING.md)

---

## 🛠️ Stack Tecnológica

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **UI:** shadcn/ui + Radix UI + Tailwind CSS
- **State:** React Query (TanStack Query)
- **Forms:** React Hook Form + Zod
- **Routing:** React Router v6

### Backend
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **APIs:** Google Calendar, Gmail

---

## 📦 Estrutura do Projeto

```
pipedesk-koa/
├── docs/                    # Documentação completa
├── src/                     # Código fonte
│   ├── components/          # Componentes React
│   ├── features/            # Features do app
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Configurações de libs
│   └── utils/               # Utilitários
├── supabase/                # Migrations e config
├── GOLDEN_RULES.md          # Regras de código (LEIA PRIMEIRO)
├── AGENTS.md                # Config de agentes IA
└── README.md                # Este arquivo
```

---

## 🤝 Contribuindo

1. Leia **[GOLDEN_RULES.md](./GOLDEN_RULES.md)** primeiro
2. Consulte **[CONTRIBUTING.md](/docs/development/CONTRIBUTING.md)**
3. Siga os padrões de código e commit
4. Crie um PR com descrição clara

---

## 📝 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes

---

## 👥 Suporte

- **Issues:** [GitHub Issues](https://github.com/lucasvrm/pipedesk-koa/issues)
- **Documentação:** [/docs](/docs/README.md)
- **Email:** lucasvrm@gmail.com

---

**Desenvolvido com ❤️ por [@lucasvrm](https://github.com/lucasvrm)**