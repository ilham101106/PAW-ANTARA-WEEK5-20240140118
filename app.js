/**
 * LuminaStore - Native JavaScript Application Script
 * API Endpoint: https://dummyjson.com/products
 * Tugas PAW Antara Week 5 - NIM 20240140118
 */

// Application State Manager
const state = {
  products: [],
  categories: [],
  filteredProducts: [],
  currentCategory: 'all',
  searchQuery: '',
  sortBy: 'default',
  limitPerPage: 24,
  currentPage: 1,
  cart: JSON.parse(localStorage.getItem('lumina_cart')) || [],
  wishlist: JSON.parse(localStorage.getItem('lumina_wishlist')) || [],
  theme: localStorage.getItem('lumina_theme') || 'dark'
};

// DOM Elements Registry
const DOM = {
  // Theme
  html: document.documentElement,
  themeToggleBtn: document.getElementById('theme-toggle'),

  // Search Inputs
  navSearchInput: document.getElementById('nav-search-input'),
  clearSearchBtn: document.getElementById('clear-search-btn'),

  // Stats
  statTotalProducts: document.getElementById('stat-total-products'),
  statTotalCategories: document.getElementById('stat-total-categories'),

  // Controls
  categoryChips: document.getElementById('category-chips'),
  sortSelect: document.getElementById('sort-select'),
  limitSelect: document.getElementById('limit-select'),
  resultsCountText: document.getElementById('results-count-text'),
  resetFiltersBtn: document.getElementById('reset-filters-btn'),
  activeFiltersBar: document.getElementById('active-filters-bar'),
  activeFilterTags: document.getElementById('active-filter-tags'),

  // Product Grid & States
  skeletonGrid: document.getElementById('products-skeleton-grid'),
  productsGrid: document.getElementById('products-grid'),
  emptyState: document.getElementById('empty-state'),
  emptyResetBtn: document.getElementById('empty-reset-btn'),
  errorState: document.getElementById('error-state'),
  errorMessage: document.getElementById('error-message'),
  retryFetchBtn: document.getElementById('retry-fetch-btn'),

  // Pagination
  paginationContainer: document.getElementById('pagination-container'),
  prevPageBtn: document.getElementById('prev-page-btn'),
  nextPageBtn: document.getElementById('next-page-btn'),
  pageNumbers: document.getElementById('page-numbers'),

  // Badges & Counters
  cartCount: document.getElementById('cart-count'),
  wishlistCount: document.getElementById('wishlist-count'),
  drawerCartCount: document.getElementById('drawer-cart-count'),
  drawerWishlistCount: document.getElementById('drawer-wishlist-count'),

  // Modal
  productModal: document.getElementById('product-modal'),
  closeModalBtn: document.getElementById('close-modal-btn'),
  modalContent: document.getElementById('modal-content'),

  // Drawers
  cartBtn: document.getElementById('cart-btn'),
  cartDrawer: document.getElementById('cart-drawer'),
  closeCartBtn: document.getElementById('close-cart-btn'),
  cartItemsContainer: document.getElementById('cart-items-container'),
  cartSubtotal: document.getElementById('cart-subtotal'),
  cartTotal: document.getElementById('cart-total'),
  clearCartBtn: document.getElementById('clear-cart-btn'),
  checkoutBtn: document.getElementById('checkout-btn'),

  wishlistBtn: document.getElementById('wishlist-btn'),
  wishlistDrawer: document.getElementById('wishlist-drawer'),
  closeWishlistBtn: document.getElementById('close-wishlist-btn'),
  wishlistItemsContainer: document.getElementById('wishlist-items-container'),

  // Toast
  toastContainer: document.getElementById('toast-container')
};

/* ==========================================================================
   1. Initialization & Core Fetch Logic
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  renderSkeletonCards(8);
  updateBadges();

  // Fetch initial data
  initAppData();

  // Event Listeners Initialization
  setupEventListeners();
});

// Initialize Theme from localStorage
function initTheme() {
  DOM.html.setAttribute('data-theme', state.theme);
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  DOM.html.setAttribute('data-theme', state.theme);
  localStorage.setItem('lumina_theme', state.theme);
  showToast(`Mode ${state.theme === 'dark' ? 'Gelap 🌙' : 'Terang ☀️'} diaktifkan`, 'info');
}

// Main API Fetch Call
async function initAppData() {
  try {
    showLoadingState();

    // Fetch all products (limit=100 to enable rich local filtering and pagination)
    const [productsRes, categoriesRes] = await Promise.allSettled([
      fetch('https://dummyjson.com/products?limit=100'),
      fetch('https://dummyjson.com/products/category-list')
    ]);

    if (productsRes.status !== 'fulfilled' || !productsRes.value.ok) {
      throw new Error('Gagal mengambil data dari endpoint https://dummyjson.com/products');
    }

    const productsData = await productsRes.value.json();
    state.products = productsData.products || [];

    // Parse categories
    if (categoriesRes.status === 'fulfilled' && categoriesRes.value.ok) {
      state.categories = await categoriesRes.value.json();
    } else {
      // Fallback extract categories from products
      state.categories = [...new Set(state.products.map(p => p.category))];
    }

    // Update Stats Bar
    DOM.statTotalProducts.textContent = state.products.length;
    DOM.statTotalCategories.textContent = state.categories.length;

    // Render Categories Chips
    renderCategoryChips();

    // Apply Filter & Render Products
    applyFiltersAndRender();

  } catch (error) {
    console.error('Error fetching data:', error);
    showErrorState(error.message);
  }
}

/* ==========================================================================
   2. Renderers & UI Builders
   ========================================================================== */

// Render Skeleton Cards while loading
function renderSkeletonCards(count = 8) {
  DOM.skeletonGrid.innerHTML = Array(count).fill(0).map(() => `
    <div class="skeleton-card">
      <div class="skeleton-img skeleton-pulse"></div>
      <div class="skeleton-body">
        <div class="skeleton-line w-40 skeleton-pulse"></div>
        <div class="skeleton-line w-80 skeleton-pulse"></div>
        <div class="skeleton-line w-60 skeleton-pulse"></div>
        <div class="skeleton-line h-24 w-40 skeleton-pulse"></div>
        <div class="skeleton-btn skeleton-pulse"></div>
      </div>
    </div>
  `).join('');
}

// Render Category Filter Chips
function renderCategoryChips() {
  const chipsHTML = [
    `<button class="chip ${state.currentCategory === 'all' ? 'active' : ''}" data-category="all">Semua Produk</button>`,
    ...state.categories.map(cat => {
      const formattedName = cat.replace(/-/g, ' ');
      const isActive = state.currentCategory === cat ? 'active' : '';
      return `<button class="chip ${isActive}" data-category="${cat}">${formattedName}</button>`;
    })
  ].join('');

  DOM.categoryChips.innerHTML = chipsHTML;
}

// Filter, Sort, and Render Products Grid
function applyFiltersAndRender() {
  let result = [...state.products];

  // 1. Category Filter
  if (state.currentCategory !== 'all') {
    result = result.filter(p => p.category === state.currentCategory);
  }

  // 2. Search Query Filter
  if (state.searchQuery.trim() !== '') {
    const q = state.searchQuery.toLowerCase().trim();
    result = result.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      (p.brand && p.brand.toLowerCase().includes(q)) ||
      p.category.toLowerCase().includes(q)
    );
  }

  // 3. Sorting
  switch (state.sortBy) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'rating-desc':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'title-asc':
      result.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'discount-desc':
      result.sort((a, b) => b.discountPercentage - a.discountPercentage);
      break;
    default:
      // Default: retain original order
      break;
  }

  state.filteredProducts = result;
  state.currentPage = 1; // reset page

  // Update UI Elements
  updateToolbarInfo();
  renderCurrentPageProducts();
}

// Render Products Grid for Current Page
function renderCurrentPageProducts() {
  hideAllStates();

  if (state.filteredProducts.length === 0) {
    DOM.emptyState.classList.remove('hidden');
    DOM.paginationContainer.classList.add('hidden');
    return;
  }

  DOM.productsGrid.classList.remove('hidden');

  // Pagination Logic
  const limit = state.limitPerPage === 0 ? state.filteredProducts.length : state.limitPerPage;
  const totalPages = Math.ceil(state.filteredProducts.length / limit);
  const startIndex = (state.currentPage - 1) * limit;
  const pageProducts = state.filteredProducts.slice(startIndex, startIndex + limit);

  // Render Product Cards HTML
  DOM.productsGrid.innerHTML = pageProducts.map(product => createProductCardHTML(product)).join('');

  // Render Pagination Controls
  renderPagination(totalPages);
}

// Single Product Card Template Builder
function createProductCardHTML(product) {
  const originalPrice = (product.price / (1 - product.discountPercentage / 100)).toFixed(2);
  const isWishlisted = state.wishlist.some(id => id === product.id);
  const formattedCategory = product.category.replace(/-/g, ' ');

  return `
    <article class="product-card" data-id="${product.id}">
      <div class="card-media">
        <div class="card-badges">
          ${product.discountPercentage > 0 ? `<span class="badge-discount">-${Math.round(product.discountPercentage)}%</span>` : ''}
          <span class="badge-category">${formattedCategory}</span>
        </div>

        <div class="card-actions-float">
          <button type="button" class="action-float-btn wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" data-id="${product.id}" title="Favorit">
            <i class="${isWishlisted ? 'fa-solid fa-heart' : 'fa-regular fa-heart'}"></i>
          </button>
          <button type="button" class="action-float-btn quick-view-btn" data-id="${product.id}" title="Lihat Detail">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>

        <img src="${product.thumbnail}" alt="${product.title}" class="card-img" loading="lazy" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'">
      </div>

      <div class="card-content">
        <span class="card-brand">${product.brand || 'Lumina Brand'}</span>
        <h3 class="card-title quick-view-btn" data-id="${product.id}">${product.title}</h3>
        
        <div class="card-rating-row">
          <div class="rating-stars">
            <i class="fa-solid fa-star"></i>
            <span>${product.rating.toFixed(1)}</span>
          </div>
          <span class="stock-status ${product.stock < 10 ? 'low-stock' : 'in-stock'}">
            <i class="fa-solid fa-circle-dot"></i> ${product.stock} Stok
          </span>
        </div>

        <div class="card-price-row">
          <span class="price-current">$${product.price.toFixed(2)}</span>
          ${product.discountPercentage > 0 ? `<span class="price-original">$${originalPrice}</span>` : ''}
        </div>

        <div class="card-footer-btns">
          <button type="button" class="btn btn-primary add-to-cart-btn" data-id="${product.id}">
            <i class="fa-solid fa-cart-plus"></i> Tambah
          </button>
          <button type="button" class="btn btn-secondary btn-icon-only quick-view-btn" data-id="${product.id}" title="Detail">
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    </article>
  `;
}

// Update Active Filter Toolbar & Tags
function updateToolbarInfo() {
  const count = state.filteredProducts.length;
  DOM.resultsCountText.innerHTML = `Menampilkan <strong>${count}</strong> dari ${state.products.length} produk`;

  const hasFilter = state.currentCategory !== 'all' || state.searchQuery !== '' || state.sortBy !== 'default';
  DOM.resetFiltersBtn.classList.toggle('hidden', !hasFilter);

  // Render Tags
  const tags = [];
  if (state.currentCategory !== 'all') {
    tags.push(`Category: <strong>${state.currentCategory.replace(/-/g, ' ')}</strong> <button onclick="clearCategoryFilter()"><i class="fa-solid fa-xmark"></i></button>`);
  }
  if (state.searchQuery !== '') {
    tags.push(`Cari: <strong>"${state.searchQuery}"</strong> <button onclick="clearSearchFilter()"><i class="fa-solid fa-xmark"></i></button>`);
  }
  if (state.sortBy !== 'default') {
    tags.push(`Urutan: <strong>${DOM.sortSelect.options[DOM.sortSelect.selectedIndex].text}</strong> <button onclick="clearSortFilter()"><i class="fa-solid fa-xmark"></i></button>`);
  }

  if (tags.length > 0) {
    DOM.activeFiltersBar.classList.remove('hidden');
    DOM.activeFilterTags.innerHTML = tags.map(tag => `<span class="filter-tag">${tag}</span>`).join('');
  } else {
    DOM.activeFiltersBar.classList.add('hidden');
  }
}

// Render Pagination Buttons
function renderPagination(totalPages) {
  if (totalPages <= 1) {
    DOM.paginationContainer.classList.add('hidden');
    return;
  }

  DOM.paginationContainer.classList.remove('hidden');
  DOM.prevPageBtn.disabled = state.currentPage === 1;
  DOM.nextPageBtn.disabled = state.currentPage === totalPages;

  let pagesHTML = '';
  for (let i = 1; i <= totalPages; i++) {
    pagesHTML += `<button class="page-num-btn ${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }
  DOM.pageNumbers.innerHTML = pagesHTML;
}

/* ==========================================================================
   3. Modal Product Detail Render
   ========================================================================== */

function openProductModal(productId) {
  const product = state.products.find(p => p.id === Number(productId));
  if (!product) return;

  const originalPrice = (product.price / (1 - product.discountPercentage / 100)).toFixed(2);
  const images = product.images && product.images.length > 0 ? product.images : [product.thumbnail];
  const isWishlisted = state.wishlist.some(id => id === product.id);

  DOM.modalContent.innerHTML = `
    <div class="modal-product-layout">
      <!-- Gallery Column -->
      <div class="modal-gallery">
        <div class="main-image-wrapper">
          <img src="${images[0]}" id="modal-main-image" class="modal-main-img" alt="${product.title}">
        </div>
        ${images.length > 1 ? `
          <div class="thumbnails-list">
            ${images.map((img, idx) => `
              <img src="${img}" class="thumb-img ${idx === 0 ? 'active' : ''}" data-src="${img}" alt="Thumbnail ${idx}">
            `).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Info Column -->
      <div class="modal-info">
        <div class="modal-meta-row">
          <span class="badge-category">${product.category.replace(/-/g, ' ')}</span>
          <span class="stock-status ${product.stock < 10 ? 'low-stock' : 'in-stock'}">
            <i class="fa-solid fa-check"></i> ${product.availabilityStatus || 'Tersedia'} (${product.stock} unit)
          </span>
        </div>

        <h2 class="modal-title">${product.title}</h2>
        <span class="card-brand">Merek: <strong>${product.brand || 'Generik'}</strong> &bull; SKU: ${product.sku || 'N/A'}</span>

        <div class="modal-price-box">
          <span class="modal-price">$${product.price.toFixed(2)}</span>
          ${product.discountPercentage > 0 ? `<span class="price-original">$${originalPrice}</span>` : ''}
          ${product.discountPercentage > 0 ? `<span class="badge-discount">Hemat ${Math.round(product.discountPercentage)}%</span>` : ''}
        </div>

        <p class="modal-description">${product.description}</p>

        <!-- Product Specs Grid -->
        <div class="modal-specs-grid">
          <div class="spec-item">
            <span class="spec-label">Rating Pelanggan</span>
            <span class="spec-val text-amber"><i class="fa-solid fa-star"></i> ${product.rating.toFixed(2)} / 5.0</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Garansi</span>
            <span class="spec-val">${product.warrantyInformation || '1 Tahun Garansi Resmi'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Informasi Pengiriman</span>
            <span class="spec-val">${product.shippingInformation || 'Dikirim dalam 2-3 hari'}</span>
          </div>
          <div class="spec-item">
            <span class="spec-label">Kebijakan Pengembalian</span>
            <span class="spec-val">${product.returnPolicy || '30 Hari Pengembalian'}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="card-footer-btns" style="grid-template-columns: 1fr 1fr; margin-top: 1rem;">
          <button type="button" class="btn btn-primary add-to-cart-btn" data-id="${product.id}">
            <i class="fa-solid fa-cart-plus"></i> Tambah ke Keranjang
          </button>
          <button type="button" class="btn btn-secondary wishlist-toggle-btn ${isWishlisted ? 'active' : ''}" data-id="${product.id}">
            <i class="${isWishlisted ? 'fa-solid fa-heart text-rose' : 'fa-regular fa-heart'}"></i> ${isWishlisted ? 'Favorit Saya' : 'Tambah Favorit'}
          </button>
        </div>

        <!-- Reviews Section -->
        ${product.reviews && product.reviews.length > 0 ? `
          <div class="modal-reviews-section">
            <h4><i class="fa-solid fa-comments"></i> Ulasan Pembeli (${product.reviews.length})</h4>
            <div class="reviews-list">
              ${product.reviews.map(rev => `
                <div class="review-card">
                  <div class="review-author">
                    <span>${rev.reviewerName}</span>
                    <span class="text-amber"><i class="fa-solid fa-star"></i> ${rev.rating}</span>
                  </div>
                  <p class="text-secondary">${rev.comment}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  // Attach Thumbnail Switcher Event Listeners
  const thumbs = DOM.modalContent.querySelectorAll('.thumb-img');
  const mainImg = DOM.modalContent.querySelector('#modal-main-image');
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active'));
      thumb.classList.add('active');
      mainImg.src = thumb.getAttribute('data-src');
    });
  });

  DOM.productModal.classList.remove('hidden');
  DOM.productModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  DOM.productModal.classList.add('hidden');
  DOM.productModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* ==========================================================================
   4. Cart & Wishlist LocalStorage Handlers
   ========================================================================== */

function addToCart(productId) {
  const product = state.products.find(p => p.id === Number(productId));
  if (!product) return;

  const existingItem = state.cart.find(item => item.id === product.id);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    state.cart.push({
      id: product.id,
      title: product.title,
      price: product.price,
      thumbnail: product.thumbnail,
      quantity: 1
    });
  }

  saveCart();
  updateBadges();
  showToast(`"${product.title}" berhasil ditambahkan ke keranjang!`, 'success');
}

function updateCartQuantity(productId, delta) {
  const item = state.cart.find(i => i.id === Number(productId));
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    state.cart = state.cart.filter(i => i.id !== Number(productId));
  }

  saveCart();
  updateBadges();
  renderCartDrawer();
}

function saveCart() {
  localStorage.setItem('lumina_cart', JSON.stringify(state.cart));
}

function toggleWishlist(productId) {
  const id = Number(productId);
  const product = state.products.find(p => p.id === id);
  if (!product) return;

  const index = state.wishlist.indexOf(id);
  if (index > -1) {
    state.wishlist.splice(index, 1);
    showToast(`"${product.title}" dihapus dari favorit.`, 'info');
  } else {
    state.wishlist.push(id);
    showToast(`"${product.title}" ditambahkan ke favorit! ❤️`, 'success');
  }

  localStorage.setItem('lumina_wishlist', JSON.stringify(state.wishlist));
  updateBadges();

  // Re-render buttons if modal is open or in current grid
  renderCurrentPageProducts();
  if (!DOM.wishlistDrawer.classList.contains('hidden')) {
    renderWishlistDrawer();
  }
}

function updateBadges() {
  const totalCartCount = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  DOM.cartCount.textContent = totalCartCount;
  DOM.drawerCartCount.textContent = totalCartCount;

  DOM.wishlistCount.textContent = state.wishlist.length;
  DOM.drawerWishlistCount.textContent = state.wishlist.length;
}

// Cart Drawer Renderer
function renderCartDrawer() {
  if (state.cart.length === 0) {
    DOM.cartItemsContainer.innerHTML = `
      <div class="empty-state" style="padding: 2rem 1rem;">
        <i class="fa-solid fa-cart-flatbed empty-icon"></i>
        <h4>Keranjang Masih Kosong</h4>
        <p style="font-size: 0.85rem;">Jelajahi katalog dan tambahkan produk impian Anda.</p>
      </div>
    `;
    DOM.cartSubtotal.textContent = '$0.00';
    DOM.cartTotal.textContent = '$0.00';
    return;
  }

  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  DOM.cartItemsContainer.innerHTML = state.cart.map(item => `
    <div class="cart-item-card">
      <img src="${item.thumbnail}" alt="${item.title}" class="cart-item-img">
      <div class="cart-item-details">
        <span class="cart-item-title">${item.title}</span>
        <span class="cart-item-price">$${item.price.toFixed(2)}</span>
        <div class="qty-controls">
          <button class="qty-btn minus-qty" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn plus-qty" data-id="${item.id}">+</button>
        </div>
      </div>
      <button class="close-btn remove-cart-item" data-id="${item.id}" title="Hapus"><i class="fa-solid fa-trash-can" style="font-size: 0.9rem; color: var(--color-danger);"></i></button>
    </div>
  `).join('');

  DOM.cartSubtotal.textContent = `$${subtotal.toFixed(2)}`;
  DOM.cartTotal.textContent = `$${subtotal.toFixed(2)}`;
}

// Wishlist Drawer Renderer
function renderWishlistDrawer() {
  const wishlistedProducts = state.products.filter(p => state.wishlist.includes(p.id));

  if (wishlistedProducts.length === 0) {
    DOM.wishlistItemsContainer.innerHTML = `
      <div class="empty-state" style="padding: 2rem 1rem;">
        <i class="fa-regular fa-heart empty-icon"></i>
        <h4>Belum Ada Favorit</h4>
        <p style="font-size: 0.85rem;">Klik ikon hati pada produk untuk menyimpannya di sini.</p>
      </div>
    `;
    return;
  }

  DOM.wishlistItemsContainer.innerHTML = wishlistedProducts.map(p => `
    <div class="cart-item-card">
      <img src="${p.thumbnail}" alt="${p.title}" class="cart-item-img">
      <div class="cart-item-details">
        <span class="cart-item-title">${p.title}</span>
        <span class="cart-item-price">$${p.price.toFixed(2)}</span>
        <button class="btn btn-primary add-to-cart-btn" data-id="${p.id}" style="padding: 0.3rem 0.6rem; font-size: 0.75rem; margin-top: 0.25rem;">
          <i class="fa-solid fa-cart-plus"></i> Beli
        </button>
      </div>
      <button class="close-btn remove-wishlist-item" data-id="${p.id}" title="Hapus"><i class="fa-solid fa-xmark"></i></button>
    </div>
  `).join('');
}

/* ==========================================================================
   5. Toast Notification System
   ========================================================================== */

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i class="toast-icon fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-info'}"></i>
    <span>${message}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

/* ==========================================================================
   6. Global Event Listeners & Interactions
   ========================================================================== */

function setupEventListeners() {
  // Theme Switcher
  DOM.themeToggleBtn.addEventListener('click', toggleTheme);

  // Real-time Search Input with Debounce
  let debounceTimer;
  DOM.navSearchInput.addEventListener('input', (e) => {
    const val = e.target.value;
    DOM.clearSearchBtn.classList.toggle('hidden', val === '');

    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      state.searchQuery = val;
      applyFiltersAndRender();
    }, 300);
  });

  DOM.clearSearchBtn.addEventListener('click', () => {
    DOM.navSearchInput.value = '';
    DOM.clearSearchBtn.classList.add('hidden');
    state.searchQuery = '';
    applyFiltersAndRender();
  });

  // Category Chip Click (Event Delegation)
  DOM.categoryChips.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;

    DOM.categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    state.currentCategory = chip.getAttribute('data-category');
    applyFiltersAndRender();
  });

  // Sort & Limit Select Dropdowns
  DOM.sortSelect.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    applyFiltersAndRender();
  });

  DOM.limitSelect.addEventListener('change', (e) => {
    state.limitPerPage = Number(e.target.value);
    applyFiltersAndRender();
  });

  // Reset Filters Buttons
  DOM.resetFiltersBtn.addEventListener('click', resetAllFilters);
  DOM.emptyResetBtn.addEventListener('click', resetAllFilters);
  DOM.retryFetchBtn.addEventListener('click', initAppData);

  // Products Grid Actions (Event Delegation)
  DOM.productsGrid.addEventListener('click', (e) => {
    const target = e.target;

    // Quick View / Title Click
    const quickViewBtn = target.closest('.quick-view-btn');
    if (quickViewBtn) {
      const productId = quickViewBtn.getAttribute('data-id');
      openProductModal(productId);
      return;
    }

    // Add to Cart
    const addToCartBtn = target.closest('.add-to-cart-btn');
    if (addToCartBtn) {
      const productId = addToCartBtn.getAttribute('data-id');
      addToCart(productId);
      return;
    }

    // Wishlist Toggle
    const wishlistBtn = target.closest('.wishlist-toggle-btn');
    if (wishlistBtn) {
      const productId = wishlistBtn.getAttribute('data-id');
      toggleWishlist(productId);
      return;
    }
  });

  // Pagination Clicks
  DOM.prevPageBtn.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderCurrentPageProducts();
      scrollToGridTop();
    }
  });

  DOM.nextPageBtn.addEventListener('click', () => {
    const limit = state.limitPerPage === 0 ? state.filteredProducts.length : state.limitPerPage;
    const totalPages = Math.ceil(state.filteredProducts.length / limit);
    if (state.currentPage < totalPages) {
      state.currentPage++;
      renderCurrentPageProducts();
      scrollToGridTop();
    }
  });

  DOM.pageNumbers.addEventListener('click', (e) => {
    const btn = e.target.closest('.page-num-btn');
    if (btn) {
      state.currentPage = Number(btn.getAttribute('data-page'));
      renderCurrentPageProducts();
      scrollToGridTop();
    }
  });

  // Modal Close Events
  DOM.closeModalBtn.addEventListener('click', closeModal);
  DOM.productModal.addEventListener('click', (e) => {
    if (e.target === DOM.productModal) closeModal();
  });

  // Drawer Toggles
  DOM.cartBtn.addEventListener('click', () => {
    renderCartDrawer();
    DOM.cartDrawer.classList.remove('hidden');
  });
  DOM.closeCartBtn.addEventListener('click', () => DOM.cartDrawer.classList.add('hidden'));

  DOM.wishlistBtn.addEventListener('click', () => {
    renderWishlistDrawer();
    DOM.wishlistDrawer.classList.remove('hidden');
  });
  DOM.closeWishlistBtn.addEventListener('click', () => DOM.wishlistDrawer.classList.add('hidden'));

  // Drawer Cart Delegated Events
  DOM.cartItemsContainer.addEventListener('click', (e) => {
    const plusBtn = e.target.closest('.plus-qty');
    const minusBtn = e.target.closest('.minus-qty');
    const removeBtn = e.target.closest('.remove-cart-item');

    if (plusBtn) updateCartQuantity(plusBtn.getAttribute('data-id'), 1);
    if (minusBtn) updateCartQuantity(minusBtn.getAttribute('data-id'), -1);
    if (removeBtn) updateCartQuantity(removeBtn.getAttribute('data-id'), -9999);
  });

  // Drawer Wishlist Delegated Events
  DOM.wishlistItemsContainer.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('.remove-wishlist-item');
    const addToCartBtn = e.target.closest('.add-to-cart-btn');

    if (removeBtn) toggleWishlist(removeBtn.getAttribute('data-id'));
    if (addToCartBtn) addToCart(addToCartBtn.getAttribute('data-id'));
  });

  DOM.clearCartBtn.addEventListener('click', () => {
    if (confirm('Apakah Anda yakin ingin mengosongkan keranjang belanja?')) {
      state.cart = [];
      saveCart();
      updateBadges();
      renderCartDrawer();
      showToast('Keranjang belanja telah dikosongkan.', 'info');
    }
  });

  DOM.checkoutBtn.addEventListener('click', () => {
    if (state.cart.length === 0) return;
    alert('🎉 Terima kasih! Fitur pembayaran berhasil disimulasi untuk Tugas PAW.');
    state.cart = [];
    saveCart();
    updateBadges();
    DOM.cartDrawer.classList.add('hidden');
    showToast('Pesanan berhasil diproses!', 'success');
  });
}

/* ==========================================================================
   7. Helper Functions
   ========================================================================== */

function resetAllFilters() {
  state.currentCategory = 'all';
  state.searchQuery = '';
  state.sortBy = 'default';

  DOM.navSearchInput.value = '';
  DOM.clearSearchBtn.classList.add('hidden');
  DOM.sortSelect.value = 'default';

  renderCategoryChips();
  applyFiltersAndRender();
  showToast('Semua filter berhasil di-reset.', 'info');
}

function clearCategoryFilter() {
  state.currentCategory = 'all';
  renderCategoryChips();
  applyFiltersAndRender();
}

function clearSearchFilter() {
  state.searchQuery = '';
  DOM.navSearchInput.value = '';
  DOM.clearSearchBtn.classList.add('hidden');
  applyFiltersAndRender();
}

function clearSortFilter() {
  state.sortBy = 'default';
  DOM.sortSelect.value = 'default';
  applyFiltersAndRender();
}

function showLoadingState() {
  DOM.productsGrid.classList.add('hidden');
  DOM.emptyState.classList.add('hidden');
  DOM.errorState.classList.add('hidden');
  DOM.skeletonGrid.classList.remove('hidden');
}

function showErrorState(msg) {
  hideAllStates();
  DOM.errorMessage.textContent = msg;
  DOM.errorState.classList.remove('hidden');
}

function hideAllStates() {
  DOM.skeletonGrid.classList.add('hidden');
  DOM.productsGrid.classList.add('hidden');
  DOM.emptyState.classList.add('hidden');
  DOM.errorState.classList.add('hidden');
}

function scrollToGridTop() {
  document.querySelector('.main-content').scrollIntoView({ behavior: 'smooth' });
}
