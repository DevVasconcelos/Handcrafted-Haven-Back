DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS product_images CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS sellers CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS product_status CASCADE;

CREATE TYPE user_role AS ENUM ('BUYER', 'SELLER');
CREATE TYPE product_status AS ENUM ('ACTIVE', 'OUT_OF_STOCK', 'DELETED');

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'BUYER',
  avatar VARCHAR(500),
  newsletter BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

CREATE TABLE sellers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  location VARCHAR(255),
  specialty VARCHAR(255),
  bio TEXT,
  member_since INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_TIMESTAMP),
  gradient VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sellers_user_id ON sellers(user_id);
CREATE INDEX idx_sellers_slug ON sellers(slug);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(10),
  gradient VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  price DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  compare_price DECIMAL(10, 2) CHECK (compare_price >= 0),
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku VARCHAR(100),
  
  rating DECIMAL(3, 2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  sales_count INTEGER DEFAULT 0 CHECK (sales_count >= 0),
  
  tags TEXT,
  materials VARCHAR(255),
  dimensions VARCHAR(100),
  weight VARCHAR(50),
  color VARCHAR(100),
  
  shipping_time VARCHAR(50),
  handmade BOOLEAN DEFAULT TRUE,
  customizable BOOLEAN DEFAULT FALSE,
  gift_wrapping BOOLEAN DEFAULT FALSE,
  
  status product_status DEFAULT 'ACTIVE',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_rating ON products(rating);
CREATE INDEX idx_products_created_at ON products(created_at DESC);

CREATE INDEX idx_products_search ON products USING GIN(
  to_tsvector('english', title || ' ' || description || ' ' || COALESCE(tags, ''))
);

CREATE TABLE product_images (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_display_order ON product_images(product_id, display_order);

CREATE TABLE reviews (
  id SERIAL PRIMARY KEY,
  reviewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id INTEGER NOT NULL REFERENCES sellers(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_reviews_seller_id ON reviews(seller_id);
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_reviewer_id ON reviews(reviewer_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE UNIQUE INDEX idx_reviews_reviewer_product ON reviews(reviewer_id, product_id);
CREATE UNIQUE INDEX idx_reviews_reviewer_seller_when_no_product ON reviews(reviewer_id, seller_id) WHERE product_id IS NULL;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sellers_updated_at
  BEFORE UPDATE ON sellers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION update_product_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.stock = 0 THEN
    NEW.status = 'OUT_OF_STOCK';
  ELSIF NEW.stock > 0 AND OLD.status = 'OUT_OF_STOCK' THEN
    NEW.status = 'ACTIVE';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_status
  BEFORE UPDATE OF stock ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_product_status();

CREATE OR REPLACE VIEW products_full AS
SELECT 
  p.*,
  s.slug as seller_slug,
  u.first_name || ' ' || u.last_name as seller_name,
  u.avatar as seller_avatar,
  s.location as seller_location,
  s.specialty as seller_specialty,
  COALESCE(ss.products_count, 0) as seller_products_count,
  COALESCE(ss.total_sales, 0) as seller_total_sales,
  COALESCE(ss.average_rating, 0) as seller_average_rating,
  COALESCE(ss.reviews_count, 0) as seller_reviews_count,
  c.name as category_name,
  c.slug as category_slug,
  c.icon as category_icon,
  (SELECT url FROM product_images WHERE product_id = p.id AND is_primary = true LIMIT 1) as primary_image
FROM products p
JOIN sellers s ON p.seller_id = s.id
JOIN users u ON s.user_id = u.id
JOIN categories c ON p.category_id = c.id
LEFT JOIN seller_stats ss ON ss.id = s.id;

CREATE OR REPLACE VIEW seller_stats AS
SELECT 
  s.id,
  s.slug,
  u.first_name || ' ' || u.last_name as name,
  u.avatar,
  s.location,
  s.specialty,
  s.member_since,
  COUNT(DISTINCT p.id) as products_count,
  COALESCE(AVG(r.rating), 0) as average_rating,
  COUNT(DISTINCT r.id) as reviews_count,
  COALESCE(SUM(p.sales_count), 0) as total_sales
FROM sellers s
JOIN users u ON s.user_id = u.id
LEFT JOIN products p ON s.id = p.seller_id
LEFT JOIN reviews r ON s.id = r.seller_id
GROUP BY s.id, s.slug, u.first_name, u.last_name, u.avatar, s.location, s.specialty, s.member_since;

SELECT 'Schema criado com sucesso!' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
