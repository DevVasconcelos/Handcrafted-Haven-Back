# 🗄️ Database Schema

Estrutura do banco de dados PostgreSQL para o Handcrafted Haven.

## 📋 Tabelas

### 1. **users**
Usuários do sistema (buyers e sellers)

**Colunas principais:**
- `id` - ID único
- `first_name`, `last_name` - Nome do usuário
- `email` - Email único (usado para login)
- `password` - Hash bcrypt da senha
- `role` - ENUM: 'BUYER' ou 'SELLER'
- `avatar` - Iniciais do nome (gerado automaticamente)
- `newsletter` - Aceita newsletter

### 2. **sellers**
Perfil estendido para usuários vendedores

**Colunas principais:**
- `id` - ID único
- `user_id` - Referência ao usuário (1:1)
- `slug` - URL amigável única (ex: "maria-ceramics")
- `location` - Localização do artesão
- `specialty` - Especialidade (ex: "Ceramic Artist")
- `bio` - Array de parágrafos sobre o vendedor
- `member_since` - Ano de cadastro
- `gradient` - String CSS para gradiente de cor

### 3. **categories**
Categorias de produtos artesanais

**Categorias disponíveis:**
1. Pottery (🏺)
2. Jewelry (💍)
3. Textiles (🧶)
4. Woodwork (🪵)
5. Art & Prints (🎨)
6. Home Decor (🏠)
7. Glass & Metal (✨)
8. Accessories (👜)
9. Toys & Games (🧸)

### 4. **products**
Produtos cadastrados pelos sellers

**Colunas principais:**
- Informações básicas: title, description
- Preço: price, compare_price (preço antes do desconto)
- Estoque: stock, sku
- Métricas: rating, review_count, sales_count
- Especificações: materials, dimensions, weight, color
- Opções: handmade, customizable, gift_wrapping
- Status: ENUM ('ACTIVE', 'OUT_OF_STOCK', 'DELETED')

**Triggers automáticos:**
- Atualiza `status` para 'OUT_OF_STOCK' quando `stock = 0`
- Atualiza `updated_at` em cada modificação

### 5. **product_images**
Imagens dos produtos (armazenadas no Vercel Blob)

**Colunas principais:**
- `product_id` - Referência ao produto
- `url` - URL completa do Vercel Blob
- `is_primary` - Imagem principal (primeira)
- `display_order` - Ordem de exibição

### 6. **reviews**
Avaliações dos sellers pelos buyers

**Colunas principais:**
- `reviewer_id` - Usuário que fez a review (buyer)
- `seller_id` - Vendedor sendo avaliado
- `product_id` - Produto relacionado (opcional)
- `rating` - Nota de 1 a 5
- `text` - Texto da avaliação

**Constraints:**
- Um usuário só pode avaliar um seller uma vez

## 📊 Views

### **products_full**
View com todas as informações do produto incluindo:
- Dados do seller (nome, avatar, localização)
- Dados da categoria
- URL da imagem principal

### **seller_stats**
Estatísticas agregadas dos sellers:
- Total de produtos
- Média de rating
- Total de reviews
- Total de vendas

## 🔍 Índices

Índices criados para otimizar queries:

- **users**: email, role
- **sellers**: user_id, slug
- **categories**: slug
- **products**: seller_id, category_id, status, price, rating, created_at
- **products (full-text)**: índice GIN para busca em title/description/tags
- **product_images**: product_id, display_order
- **reviews**: seller_id, product_id, reviewer_id, rating

## 🔄 Relacionamentos

```
users (1) ←→ (1) sellers
users (1) ←→ (N) reviews (como reviewer)
sellers (1) ←→ (N) products
sellers (1) ←→ (N) reviews
categories (1) ←→ (N) products
products (1) ←→ (N) product_images
products (1) ←→ (N) reviews
```

## 🚀 Como usar

### Executar o schema (criar/recriar tabelas):
```bash
npm run db:schema
```

### Testar conexão:
```bash
npm run test:db
```

### Executar seeds (dados iniciais):
```bash
npm run db:seed
```

## ⚠️ Importante

- O script `npm run db:schema` **dropa todas as tabelas** antes de recriar
- Use apenas em desenvolvimento ou com backup em produção
- As senhas são sempre armazenadas com hash bcrypt
- Imagens são armazenadas no Vercel Blob (não no banco)
- SSL está habilitado automaticamente para Railway

## 📝 Próximos passos

1. ✅ Schema criado
2. ⏳ Criar seeds de dados
3. ⏳ Implementar repositories
4. ⏳ Implementar API endpoints
