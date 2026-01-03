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
INSERT INTO products (name, price, unit, image_filename, qr_filename) VALUES
('长城炮', 0.00, '根', 'commodity(0).png', 'code0.png'),
('哪吒加特林', 0.00, '根', 'commodity(1).png', 'code1.png'),
('黄金飞瀑加特林', 0.00, '根', 'commodity(2).png', 'code2.png'),
('超级英雄加特林', 0.00, '根', 'commodity(3).png', 'code3.png'),
('舞动天使', 0.00, '根', 'commodity(4).png', 'code4.png'),
('大号舞龙棒', 0.00, '根', 'commodity(5).png', 'code5.png'),
('烈火英雄', 0.00, '根', 'commodity(6).png', 'code6.png'),
('红缨枪', 0.00, '根', 'commodity(7).png', 'code7.png'),
('哪吒加特林（迷你）', 0.00, '根', 'commodity(8).png', 'code8.png'),
('金色麦浪', 0.00, '根', 'commodity(9).png', NULL),
('六脉神剑', 0.00, '把', 'commodity(10).png', 'code10.png'),
('金箍棒', 0.00, '根', 'commodity(11).png', 'code11.png'),
('银河之星', 0.00, '盒', 'commodity(12).png', 'code12.png'),
('狼嚎火箭', 0.00, '把', 'commodity(13).png', 'code13.png'),
('行星卫士', 0.00, '把', 'commodity(14).png', 'code14.png'),
('仙女棒', 0.00, '板', 'commodity(15).png', 'code15.png'),
('超级变变变（火花棒）', 0.00, '把', 'commodity(16).png', NULL),
('小金鱼', 0.00, '盒', 'commodity(17).png', NULL),
('水母王子', 0.00, '盒', 'commodity(18).png', 'code18.png'),
('凤舞九天', 0.00, '个', 'commodity(19).png', 'code19.png'),
('钻石宝贝', 0.00, '盒', 'commodity(20).png', 'code20.png'),
('机甲猎鹰', 0.00, '把', 'commodity(21).png', 'code21.png'),
('向日葵', 0.00, '盒', 'commodity(22).png', 'code22.png'),
('芝麻开门', 0.00, '个', 'commodity(23).png', NULL),
('孔雀开屏', 0.00, '个', 'commodity(24).png', 'code24.png'),
('一朵鲜花（点炮）', 0.00, '盒', 'commodity(25).png', 'code25.png'),
('爆米花', 0.00, '个', 'commodity(26).png', 'code26.png'),
('黄金三分钟', 0.00, '个', 'commodity(27).png', 'code27.png'),
('霹雳小子（摔炮）', 0.00, '盒', 'commodity(28).png', 'code28.png'),
('招财树', 0.00, '个', 'commodity(29).png', 'code29.png'),
('精彩三分钟', 0.00, '个', 'commodity(30).png', 'code30.png'),
('疯狂坦克', 0.00, '个', 'commodity(31).png', 'code31.png'),
('黄金战锤', 0.00, '个', 'commodity(32).png', 'code32.png'),
('潮玩天团', 0.00, '盒', 'commodity(33).png', 'code33.png'),
('双人舞', 0.00, '盒', 'commodity(34).png', 'code34.png'),
('群星水母', 0.00, '盒', 'commodity(35).png', 'code35.png'),
('超级小霸王（摔炮）', 0.00, '盒', 'commodity(36).png', 'code36.png'),
('降落伞', 0.00, '打', 'commodity(37).png', 'code37.png'),
('开心转盘', 0.00, '个', 'commodity(38).png', NULL),
('交好运', 0.00, '个', 'commodity(39).png', 'code39.png'),
('潮流五变色', 0.00, '板', 'commodity(40).png', 'code40.png'),
('核能导弹', 0.00, '个', 'commodity(41).png', 'code41.png'),
('嗨玩时刻', 0.00, '盒', 'commodity(42).png', NULL),
('网红仙女棒', 0.00, '盒', 'commodity(43).png', 'code43.png'),
('花蝴蝶', 0.00, '个', 'commodity(44).png', 'code44.png'),
('彩菊（旋转小陀螺）', 0.00, '盒', 'commodity(45).png', 'code45.png'),
('美猴王', 0.00, '个', 'commodity(46).png', 'code46.png'),
('潮玩派', 0.00, '个', 'commodity(47).png', 'code47.png'),
('发财树', 0.00, '个', 'commodity(48).png', NULL),
('挖宝达人', 0.00, '个', 'commodity(49).png', 'code49.png'),
('街舞小将', 0.00, '个', 'commodity(50).png', 'code50.png'),
('梦幻荧光棒', 0.00, '把', 'commodity(51).png', 'code51.png'),
('心动派对', 0.00, '个', 'commodity(52).png', 'code52.png'),
('拉布布', 0.00, '个', 'commodity(53).png', 'code53.png'),
('机甲火箭', 0.00, '个', 'commodity(54).png', 'code54.png'),
('极速跑车', 0.00, '个', 'commodity(55).png', 'code55.png'),
('神奇魔方', 0.00, '个', 'commodity(56).png', 'code56.png'),
('想你/红宝石', 0.00, '个', 'commodity(57).png', 'code57.png'),
('越野车小金鱼', 0.00, '个', 'commodity(58).png', NULL),
('银色喷泉', 0.00, '盒', 'commodity(59).png', 'code59.png'),
('激情三分钟', 0.00, '个', 'commodity(60).png', 'code60.png'),
('阳光小子', 0.00, '盒', 'commodity(61).png', 'code61.png'),
('黄金战车', 0.00, '个', 'commodity(62).png', 'code62.png'),
('超级棒棒糖', 0.00, '个', 'commodity(63).png', 'code63.png'),
('百变旋律', 0.00, '个', 'commodity(64).png', 'code64.png'),
('十朵金花', 0.00, '盒', 'commodity(65).png', 'code65.png'),
('莲花开', 0.00, '盒', 'commodity(66).png', 'code66.png'),
('特级升空', 0.00, '盒', 'commodity(67).png', 'code67.png'),
('舞动青春', 0.00, '盒', 'commodity(68).png', 'code68.png'),
('霹雳风暴', 0.00, '盒', 'commodity(69).png', 'code69.png'),
('烟花弹', 0.00, '把', 'commodity(70).png', NULL),
('超级火箭（窜天猴）', 0.00, '把', 'commodity(71).png', 'code71.png'),
('音乐蓝色海洋（蓝火）', 0.00, '根', 'commodity(72).png', 'code72.png'),
('连发火箭炮', 0.00, '盒', 'commodity(73).png', 'code73.png'),
('DF-5C加特林', 0.00, '盒', 'commodity(74).png', 'code74.png'),
('迷你加特林', 0.00, '盒', 'commodity(75).png', 'code75.png'),
('炫彩魔方', 0.00, '盒', 'commodity(76).png', 'code76.png'),
('摇钱树', 25.00, '盒', 'commodity(77).png', 'code77.png'),
('招财进宝', 35.00, '盒', 'commodity(78).png', NULL),
('百花报春', 120.00, '盒', 'commodity(79).png', 'code79.png');

-- 初始化统计表
INSERT INTO product_stats (id, view_count, cart_add_count)
SELECT id, 0, 0 FROM products;



-- 1. 清空所有相关表（注意顺序，先删子表，再删主表）
TRUNCATE TABLE orders;
TRUNCATE TABLE product_stats;
TRUNCATE TABLE products CASCADE;

-- 2. 重置自增 ID (序列)
-- 注意：'products_id_seq' 是 Postgrest 默认生成的序列名，格式通常是 表名_列名_seq
ALTER SEQUENCE products_id_seq RESTART WITH 1;

-- 3. (可选) 确认清空结果
SELECT count(*) FROM products; -- 应该返回 0