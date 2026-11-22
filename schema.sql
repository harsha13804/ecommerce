CREATE DATABASE IF NOT EXISTS ecommerce_db
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE ecommerce_db;

-- USERS
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- PRODUCTS
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(80) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    mrp DECIMAL(10,2) DEFAULT NULL,
    rating DECIMAL(3,2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CHECK (price >= 0),
    CHECK (stock >= 0),
    CHECK (rating >= 0 AND rating <= 5),
    CHECK (mrp IS NULL OR mrp >= price),

    INDEX idx_category (category),
    INDEX idx_product_name (name)
) ENGINE=InnoDB;

-- ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(150) NOT NULL,
    shipping_address TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(40) NOT NULL DEFAULT 'CONFIRMED',
    payment_status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CHECK (total_amount >= 0),

    FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,

    INDEX idx_order_user (user_id),
    INDEX idx_order_status (status)
) ENGINE=InnoDB;

-- ORDER ITEMS
CREATE TABLE IF NOT EXISTS order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,

    subtotal DECIMAL(10,2)
        GENERATED ALWAYS AS (quantity * unit_price) STORED,

    CHECK (quantity > 0),
    CHECK (unit_price >= 0),

    FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE RESTRICT,

    INDEX idx_order_items_order (order_id)
) ENGINE=InnoDB;

-- SAMPLE PRODUCTS
INSERT INTO products
(name, category, description, price, mrp, rating, stock, image_url)
VALUES
(
'Wireless Noise-Canceling Headphones',
'Electronics',
'Over-ear Bluetooth headphones with 30-hour battery life.',
4999, 5999, 4.5, 15,
'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80'
),
(
'Mechanical Gaming Keyboard',
'Electronics',
'RGB backlit compact keyboard with tactile switches.',
3299, 3999, 4.3, 20,
'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&auto=format&fit=crop&q=80'
),
(
'Minimalist Cotton Hoodie',
'Fashion',
'Heavyweight 100% combed cotton unisex hoodie.',
1499, 1999, 4.2, 35,
'https://images.unsplash.com/photo-1609873814058-a8928924184a?w=600&auto=format&fit=crop&q=80'
),
(
'Running Sneakers',
'Fashion',
'Lightweight breathable mesh running shoes.',
2799, 3299, 4.4, 12,
'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80'
),
(
'Stainless Steel Water Bottle',
'Home',
'Insulated 1L flask keeps drinks cold for 24 hours.',
699, 999, 4.1, 50,
'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80'
),
(
'Ceramic Coffee Mug Set',
'Home',
'Handcrafted matte finish ceramic mugs (Set of 2).',
899, 1199, 4.6, 25,
'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=600&auto=format&fit=crop&q=80'
);
