# Handcrafted Haven - Back-end API

API REST para o marketplace de produtos artesanais Handcrafted Haven.

## 🚀 Tecnologias

- **Node.js** + **Express** - Framework web
- **PostgreSQL** - Banco de dados relacional
- **pg** (node-postgres) - Driver PostgreSQL (sem ORM)
- **JWT** - Autenticação
- **Vercel Blob** - Storage de imagens
- **Zod** - Validação de dados

## 📁 Estrutura do Projeto

```
Handcrafted-Haven-Back/
├── src/
│   ├── config/          # Configurações (database, multer, vercelBlob)
│   ├── controllers/     # Controllers das rotas
│   ├── db/
│   │   └── repositories/  # Camada de acesso a dados (queries SQL)
│   ├── middlewares/     # Middlewares (auth, validation, error handling)
│   ├── routes/          # Definição de rotas
│   ├── services/        # Lógica de negócio
│   └── utils/           # Utilitários e helpers
├── sql/
│   ├── schema.sql       # Script para criar tabelas
│   └── seeds/           # Scripts de dados iniciais
├── .env                 # Variáveis de ambiente (não commitar)
├── .env.example         # Exemplo de variáveis
└── package.json
```

## ⚙️ Configuração Inicial

### 1. Variáveis de Ambiente

Já existe um arquivo `.env` criado. Configure as seguintes variáveis:

```env
# Database - Substitua com suas credenciais PostgreSQL
DATABASE_URL=postgresql://usuario:senha@localhost:5432/handcrafted_haven

# Vercel Blob - Obtenha em: https://vercel.com/dashboard → Storage
BLOB_READ_WRITE_TOKEN=seu_token_aqui
```

### 2. Banco de Dados

Você precisará:
1. Ter PostgreSQL instalado
2. Criar o banco de dados: `handcrafted_haven`
3. Executar o script SQL (será criado em breve) para criar as tabelas

### 3. Scripts Disponíveis

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

## 📦 Dependências Instaladas

- `express` - Framework web
- `pg` - Driver PostgreSQL
- `dotenv` - Gerenciamento de variáveis de ambiente
- `cors` - CORS middleware
- `helmet` - Segurança HTTP headers
- `bcryptjs` - Hash de senhas
- `jsonwebtoken` - JWT tokens
- `zod` - Validação de schemas
- `multer` - Upload de arquivos
- `@vercel/blob` - Storage Vercel
- `express-rate-limit` - Rate limiting

### Dev Dependencies
- `nodemon` - Auto-reload durante desenvolvimento

## 🔄 Próximos Passos

1. ✅ Setup inicial e estrutura de pastas
2. ⏳ Configurar conexão com PostgreSQL
3. ⏳ Criar schema do banco de dados
4. ⏳ Implementar sistema de autenticação
5. ⏳ Implementar CRUD de produtos
6. ⏳ Implementar upload de imagens com Vercel Blob

## 📝 Status

**Fase 1 - Setup e Infraestrutura**: ✅ Concluído (Ponto 1)
- [x] Dependências instaladas
- [x] Estrutura de pastas criada
- [x] Arquivos de configuração (.env, .gitignore) criados
- [x] Scripts npm configurados

---

**Desenvolvido por**: Equipe Handcrafted Haven
