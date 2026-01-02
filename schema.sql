-- 1. 创建商品表
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    unit TEXT, -- 价格单位，如 '箱', '个', '发'
    price DECIMAL(10, 2) NOT NULL,
    image_filename TEXT,
    qr_filename TEXT
);

-- 2. 创建商品统计表
CREATE TABLE product_stats (
    id INT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
    view_count INT DEFAULT 0,
    cart_add_count INT DEFAULT 0
);

-- 3. 创建订单表 (可选，用于后台记录)
CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    order_no TEXT, -- 订单编号 (ORD-...)
    items JSONB,
    total_price DECIMAL(10, 2)
);

-- 4. 创建增加浏览量的 RPC 函数 (Atomic Increment)
CREATE OR REPLACE FUNCTION increment_view_count(p_id INT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO product_stats (id, view_count)
    VALUES (p_id, 1)
    ON CONFLICT (id)
    DO UPDATE SET view_count = product_stats.view_count + 1;
END;
$$ LANGUAGE plpgsql;

-- 5. 创建增加加购次数的 RPC 函数 (Atomic Increment)
CREATE OR REPLACE FUNCTION increment_cart_add_count(p_id INT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO product_stats (id, cart_add_count)
    VALUES (p_id, 1)
    ON CONFLICT (id)
    DO UPDATE SET cart_add_count = product_stats.cart_add_count + 1;
END;
$$ LANGUAGE plpgsql;

-- 6. 插入示例数据
INSERT INTO products (name, unit, price, image_filename, qr_filename) VALUES
('金色满天星', '箱', 128.00, 'fireworks_01.jpg', 'qr_01.png'),
('五彩斑斓', '组', 299.00, 'fireworks_02.jpg', 'qr_02.png'),
('银龙飞舞', '支', 158.00, 'fireworks_03.jpg', 'qr_03.png'),
('幸福花开', '个', 58.00, 'fireworks_04.jpg', 'qr_04.png'),
('盛世中华', '组', 888.00, 'fireworks_05.jpg', 'qr_05.png'),
('儿童仙女棒', '盒', 15.00, 'fireworks_06.jpg', 'qr_06.png');

-- 初始化统计表
INSERT INTO product_stats (id, view_count, cart_add_count)
SELECT id, 0, 0 FROM products;
