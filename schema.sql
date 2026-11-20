CREATE DATABASE IF NOT EXISTS ecommerce_db;
USE ecommerce_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    shipping_address TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(40) DEFAULT 'CONFIRMED',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Seed Sample Products
INSERT INTO products (name, category, description, price, stock, image_url) VALUES
('Wireless Noise-Canceling Headphones', 'Electronics', 'Over-ear Bluetooth headphones with 30-hour battery life.', 4999.00, 15, 'https://picsum.photos/seed/headphones/400/300'),
('Mechanical Gaming Keyboard', 'Electronics', 'RGB backlit compact keyboard with tactile switches.', 3299.00, 20, 'https://picsum.photos/seed/keyboard/400/300'),
('Minimalist Cotton Hoodie', 'Fashion', 'Heavyweight 100% combed cotton unisex hoodie.', 1499.00, 35, 'https://picsum.photos/seed/hoodie/400/300'),
('Running Sneakers', 'Fashion', 'Lightweight breathable mesh running shoes.', 2799.00, 12, 'https://picsum.photos/seed/sneakers/400/300'),
('Stainless Steel Water Bottle', 'Home', 'Insulated 1L flask keeps drinks cold for 24 hours.', 699.00, 50, 'https://picsum.photos/seed/bottle/400/300'),
('Ceramic Coffee Mug Set', 'Home', 'Handcrafted matte finish ceramic mugs (Set of 2).', 899.00, 25, 'https://picsum.photos/seed/mug/400/300');


UPDATE products 
SET image_url = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
WHERE name = 'Wireless Noise-Canceling Headphones';

UPDATE products 
SET image_url = 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'
WHERE name = 'Mechanical Gaming Keyboard';

UPDATE products 
SET image_url = 'https://images.unsplash.com/photo-1609873814058-a8928924184a?w=600&auto=format&fit=crop&q=80'
WHERE name = 'Minimalist Cotton Hoodie';

UPDATE products 
SET image_url = 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80'
WHERE name = 'Running Sneakers';

UPDATE products 
SET image_url = 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80'
WHERE name = 'Stainless Steel Water Bottle';

UPDATE products 
SET image_url = 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&auto=format&fit=crop&q=80'
WHERE name = 'Ceramic Coffee Mug Set';