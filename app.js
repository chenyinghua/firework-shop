// Initialize Supabase Client
// NOTE: In a real Vercel/Vite setup, these are replaced by environment variables.
// For local testing without Vite, replace these strings with your actual Supabase credentials.
const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) || 'YOUR_SUPABASE_URL';
const supabaseKey = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) || 'YOUR_SUPABASE_ANON_KEY';

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global State
let allProducts = [];
let currentCart = JSON.parse(localStorage.getItem('fireworks_cart')) || {};

// DOM Elements
const productGrid = document.getElementById('product-grid');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalCount = document.getElementById('cart-total-count');
const cartTotalPrice = document.getElementById('cart-total-price');
const clearCartBtn = document.getElementById('clear-cart-btn');
const generateOrderBtn = document.getElementById('generate-order-btn');
const orderModal = document.getElementById('order-modal');
const closeModalBtns = document.querySelectorAll('.close-modal');
const saveImageBtn = document.getElementById('save-image-btn');
const qrModal = document.getElementById('qr-modal');
const qrLargeImg = document.getElementById('qr-large-img');
const qrProductName = document.getElementById('qr-product-name');

// Image Preview Elements
const imagePreviewModal = document.getElementById('image-preview-modal');
const previewLargeImg = document.getElementById('preview-large-img');
const saveResultModal = document.getElementById('save-result-modal');
const generatedResultImg = document.getElementById('generated-result-img');
let imgPanzoom = null;

// Mobile Cart Elements
const cartFab = document.getElementById('cart-fab');
const cartOverlay = document.getElementById('cart-overlay');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartSidebar = document.querySelector('.cart-sidebar');
const fabCount = document.getElementById('fab-count');

// 1. Initialization
async function init() {
    console.log('App Initializing...');
    await loadAndRenderProducts();
    renderCart();
    setupEventListeners();
}

// 2. Load Data
async function loadAndRenderProducts() {
    // Keep skeleton visible while loading
    // productGrid.innerHTML = '<div class="loading">正在加载烟花数据...</div>';

    try {
        // Fetch products with their stats
        const { data, error } = await supabase
            .from('products')
            .select(`
                *,
                product_stats (
                    view_count,
                    cart_add_count
                )
            `);

        if (error) throw error;

        // Transform data to flatten stats
        allProducts = data.map(p => ({
            ...p,
            view_count: p.product_stats ? p.product_stats.view_count : 0,
            cart_add_count: p.product_stats ? p.product_stats.cart_add_count : 0
        }));

        filterProducts(); // Apply default sort immediately

    } catch (err) {
        console.error('Error loading products:', err);
        productGrid.innerHTML = `<div class="loading" style="color:red">加载失败: ${err.message}<br>请检查Supabase连接配置。</div>`;
    }
}

// 3. Render Functions
function renderProductGrid(products) {
    if (products.length === 0) {
        productGrid.innerHTML = '<div class="loading">未找到匹配的烟花。</div>';
        return;
    }

    productGrid.innerHTML = products.map(product => {
        // Build relative paths
        const imagePath = product.image_filename ? `/image/commodity/${product.image_filename}` : 'https://via.placeholder.com/300x200?text=Fireworks';
        
        // Conditional QR Code
        let qrHtml = '';
        if (product.qr_filename) {
            const qrPath = `/image/code/${product.qr_filename}`;
            qrHtml = `<i class="fa-solid fa-qrcode qr-icon" onclick="openQrModal('${qrPath}', '${product.name}')"></i>`;
        }

        return `
        <div class="product-card" data-id="${product.id}">
            <div class="card-img-wrapper">
                <img src="${imagePath}" alt="${product.name}" loading="lazy" decoding="async" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
                ${qrHtml}
            </div>
            <div class="card-body">
                <h3 class="card-title">${product.name}</h3>
                <div class="card-stats">
                    <span><i class="fa-regular fa-eye"></i> ${product.view_count}</span>
                    <span><i class="fa-solid fa-cart-plus"></i> ${product.cart_add_count}</span>
                </div>
                <div class="card-footer">
                    <span class="price">¥${product.price} <span style="font-size:0.8em;color:#aaa">/${product.unit || '个'}</span></span>
                    <button class="btn btn-primary" onclick="addToCart(${product.id})">加入选货单</button>
                </div>
            </div>
        </div>
    `}).join('');
    
    // Add image preview listeners
    document.querySelectorAll('.card-img-wrapper img').forEach(img => {
        img.addEventListener('click', (e) => {
            const src = e.target.src;
            const card = e.target.closest('.product-card');
            const id = card.dataset.id;
            
            // Open Preview
            if (previewLargeImg && imagePreviewModal) {
                previewLargeImg.src = src;
                previewLargeImg.style.transform = ''; // Reset transform
                imagePreviewModal.style.display = 'block';
                
                // Initialize Panzoom
                if (window.panzoom) {
                    // Dispose previous instance if somehow exists
                    if (imgPanzoom) imgPanzoom.dispose();
                    
                    imgPanzoom = window.panzoom(previewLargeImg, {
                        maxZoom: 5,
                        minZoom: 0.1,
                        initialZoom: 1,
                        bounds: false,
                        boundsPadding: 0.1
                    });
                }
            }

            // Increment View Count
            incrementViewCount(id);
        });
    });
}

// 4. Logic & Interactions

// Increment View Count
async function incrementViewCount(id) {
    const product = allProducts.find(p => p.id == id);
    if (product) {
        product.view_count++;
        const cardStat = document.querySelector(`.product-card[data-id="${id}"] .card-stats span:first-child`);
        if (cardStat) cardStat.innerHTML = `<i class="fa-regular fa-eye"></i> ${product.view_count}`;

        // If currently sorting by views, refresh grid to reflect new ranking
        if (sortSelect.value === 'views') {
            filterProducts();
        }
    }

    // Call Supabase RPC
    const { error } = await supabase.rpc('increment_view_count', { p_id: id });
    if (error) console.error('Error incrementing view:', error);
}

// Add to Cart
window.addToCart = async function(id) {
    const product = allProducts.find(p => p.id == id);
    if (!product) return;

    // 1. Update Local Cart State
    if (currentCart[id]) {
        currentCart[id].quantity++;
    } else {
        currentCart[id] = {
            id: product.id,
            name: product.name,
            price: product.price,
            unit: product.unit || '个',
            image_filename: product.image_filename,
            quantity: 1
        };
    }
    saveCart();
    renderCart();

    // 2. Increment Cart Add Count (Server)
    // Optimistic UI update
    product.cart_add_count++;
    const cardStat = document.querySelector(`.product-card[data-id="${id}"] .card-stats span:last-child`);
    if (cardStat) cardStat.innerHTML = `<i class="fa-solid fa-cart-plus"></i> ${product.cart_add_count}`;

    // If currently sorting by adds, refresh grid to reflect new ranking
    if (sortSelect.value === 'adds') {
        filterProducts();
    }

    // Call Supabase RPC
    const { error } = await supabase.rpc('increment_cart_add_count', { p_id: id });
    if (error) console.error('Error incrementing cart add:', error);
};

// Cart Management
function saveCart() {
    localStorage.setItem('fireworks_cart', JSON.stringify(currentCart));
}

function renderCart() {
    const items = Object.values(currentCart);
    const totalCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    cartTotalCount.textContent = totalCount;
    cartTotalPrice.textContent = `¥${totalPrice.toFixed(2)}`;

    // Update FAB count
    if (fabCount) fabCount.textContent = totalCount;

    if (items.length === 0) {
        cartItemsContainer.innerHTML = '<div class="empty-cart">暂无商品</div>';
    } else {
        cartItemsContainer.innerHTML = items.map(item => {
            // Handle existing cart items that might not have image_filename stored yet
            const imagePath = item.image_filename 
                ? `/image/commodity/${item.image_filename}` 
                : 'https://via.placeholder.com/80?text=FW';

            return `
            <div class="cart-item">
                <div class="cart-item-img">
                     <img src="${imagePath}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/80?text=FW'">
                </div>
                <div class="cart-item-details">
                    <div class="cart-item-header">
                        <h4>${item.name}</h4>
                        <div class="cart-item-price">¥${item.price}/${item.unit}</div>
                    </div>
                    <div class="cart-item-controls">
                         <button class="qty-btn" onclick="updateCartQty(${item.id}, -1)"><i class="fa-solid fa-minus"></i></button>
                         <span class="qty-display">${item.quantity}</span>
                         <button class="qty-btn" onclick="updateCartQty(${item.id}, 1)"><i class="fa-solid fa-plus"></i></button>
                    </div>
                </div>
            </div>
        `}).join('');
    }
}

window.updateCartQty = function(id, change) {
    if (currentCart[id]) {
        currentCart[id].quantity += change;
        if (currentCart[id].quantity <= 0) {
            delete currentCart[id];
        }
        saveCart();
        renderCart();
    }
};

function toggleCart(show) {
    if (show) {
        cartSidebar.classList.add('open');
        cartOverlay.classList.add('open');
    } else {
        cartSidebar.classList.remove('open');
        cartOverlay.classList.remove('open');
    }
}

function setupEventListeners() {
    clearCartBtn.addEventListener('click', () => {
        if(confirm('确定清空选货单吗？')) {
            currentCart = {};
            saveCart();
            renderCart();
        }
    });

    searchInput.addEventListener('input', filterProducts);
    sortSelect.addEventListener('change', filterProducts);

    // Mobile Cart Toggles
    if (cartFab) cartFab.addEventListener('click', () => toggleCart(true));
    if (closeCartBtn) closeCartBtn.addEventListener('click', () => toggleCart(false));
    if (cartOverlay) cartOverlay.addEventListener('click', () => toggleCart(false));
    
    // Order Generation
    generateOrderBtn.addEventListener('click', () => {
        const items = Object.values(currentCart);
        if (items.length === 0) {
            alert('请先添加商品到选货单');
            return;
        }

        // Populate Modal
        const tbody = document.getElementById('order-table-body');
        tbody.innerHTML = items.map(item => `
            <tr>
                <td>${item.name}</td>
                <td>¥${item.price}/${item.unit}</td>
                <td>${item.quantity}</td>
                <td>¥${(item.price * item.quantity).toFixed(2)}</td>
            </tr>
        `).join('');

        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        document.getElementById('order-sheet-total').textContent = `¥${total.toFixed(2)}`;
        
        const now = new Date();
        // Format: ORD-YYYYMMDD-HHMMSS-MS-RAND (e.g., ORD-20231001-123005-123-4567)
        const timestamp = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}-${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
        const ms = now.getMilliseconds().toString().padStart(3, '0');
        const random = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
        const orderId = `ORD-${timestamp}-${ms}-${random}`;
        
        document.getElementById('order-date').textContent = now.toLocaleDateString() + ' ' + now.toLocaleTimeString();
        document.getElementById('order-id-display').textContent = orderId;

        orderModal.style.display = 'flex';
    });

    // Save Image
    saveImageBtn.addEventListener('click', async () => {
        // Prevent double click
        saveImageBtn.disabled = true;
        const originalBtnContent = saveImageBtn.innerHTML;
        saveImageBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 正在生成...';
        
        // Save to DB
        const items = Object.values(currentCart);
        const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        try {
            await supabase.from('orders').insert({
                items: items,
                total_price: total
            });
        } catch (e) {
            console.error("Failed to save order history", e);
        }

        // Generate Image (High Quality & Full Height)
        const originalElement = document.getElementById('order-sheet-preview');
        
        // 1. Clone the element
        const clone = originalElement.cloneNode(true);
        
        // 2. Style the clone to ensure full capture
        // Set a fixed width for consistent output (e.g., standard A4-ish width or just 800px)
        clone.style.width = '600px'; 
        clone.style.position = 'absolute';
        clone.style.top = '0';
        clone.style.left = '-9999px'; // Move off-screen
        clone.style.zIndex = '-1';
        clone.style.height = 'auto'; // Force full height
        clone.style.overflow = 'visible'; // No scrolling
        
        document.body.appendChild(clone);

        // 3. Capture
        html2canvas(clone, {
            scale: 2, // Retina quality
            backgroundColor: '#ffffff',
            useCORS: true // Attempt to load external images if any
        }).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            
            // Show result in modal for Long Press (WeChat compatible)
            generatedResultImg.src = imgData;
            saveResultModal.style.display = 'flex';
            
            // 4. Cleanup & Restore
            document.body.removeChild(clone);
            saveImageBtn.disabled = false;
            saveImageBtn.innerHTML = originalBtnContent;
        }).catch(err => {
            console.error("Image generation failed:", err);
            document.body.removeChild(clone);
            alert("图片生成失败，请重试");
            saveImageBtn.disabled = false;
            saveImageBtn.innerHTML = originalBtnContent;
        });
    });
}

// Search & Filter
function filterProducts() {
    const term = searchInput.value.toLowerCase();
    const sortType = sortSelect.value;

    let filtered = allProducts.filter(p => {
        return p.name.toLowerCase().includes(term);
    });

    // Calculate average price for "medium price" logic
    const avgPrice = filtered.length > 0 
        ? filtered.reduce((sum, p) => sum + Number(p.price), 0) / filtered.length 
        : 0;

    // Sort
    filtered.sort((a, b) => {
        if (sortType === 'price-asc') return a.price - b.price;
        if (sortType === 'price-desc') return b.price - a.price;
        if (sortType === 'views') return b.view_count - a.view_count;
        if (sortType === 'adds') return b.cart_add_count - a.cart_add_count;
        
        // Default: Adds (desc) -> Views (desc) -> Price (closer to average)
        if (b.cart_add_count !== a.cart_add_count) return b.cart_add_count - a.cart_add_count;
        if (b.view_count !== a.view_count) return b.view_count - a.view_count;
        
        const diffA = Math.abs(a.price - avgPrice);
        const diffB = Math.abs(b.price - avgPrice);
        return diffA - diffB;
    });

    renderProductGrid(filtered);
}

// Modals Logic
window.openQrModal = function(filename, name) {
    qrLargeImg.src = filename || 'https://via.placeholder.com/200?text=QR';
    qrProductName.textContent = name;
    qrModal.style.display = 'block';
};

window.closeAllModals = function() {
    orderModal.style.display = 'none';
    qrModal.style.display = 'none';
    if (saveResultModal) saveResultModal.style.display = 'none';
    if (imagePreviewModal) {
        imagePreviewModal.style.display = 'none';
        if (imgPanzoom) {
            imgPanzoom.dispose();
            imgPanzoom = null;
        }
        if (previewLargeImg) previewLargeImg.style.transform = '';
    }
}

closeModalBtns.forEach(btn => {
    btn.addEventListener('click', window.closeAllModals);
});

// Specific listener for dynamic or specific close buttons
const closePreviewBtn = document.getElementById('close-image-preview');
if (closePreviewBtn) {
    closePreviewBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent bubbling
        closeAllModals();
    });
}

window.onclick = function(event) {
    if (event.target == orderModal || event.target == qrModal || event.target == imagePreviewModal) {
        closeAllModals();
    }
};


// Start
init();
