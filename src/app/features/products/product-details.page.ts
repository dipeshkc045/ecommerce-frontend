import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { NgIf, NgFor, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map, catchError, of } from 'rxjs';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';

import { ProductApi, type ProductResponse } from '../../core/api/product.api';
import { CartService } from '../../core/cart/cart.service';
import { InventoryApi } from '../../core/api/inventory.api';
import { FALLBACK_PRODUCTS } from './fallback-products.data';

@Component({
  standalone: true,
  selector: 'app-product-details-page',
  imports: [NgIf, NgFor, RouterLink, CurrencyPipe, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatTabsModule],
  template: `
    <div class="center" *ngIf="isLoading()">
      <mat-progress-spinner diameter="40" mode="indeterminate" />
    </div>

    <!-- Error state (no fallback possible for details) -->
    <div class="error-container" *ngIf="loadError() && !product()">
      <div class="error-card">
        <mat-icon class="error-icon">cloud_off</mat-icon>
        <h2>Unable to load product</h2>
        <p>{{ loadError() }}</p>
        <div class="error-actions">
          <button class="btn-primary" (click)="retryLoad()">
            <mat-icon>refresh</mat-icon> Try Again
          </button>
          <a class="btn-outline" routerLink="/products">Browse Products</a>
        </div>
      </div>
    </div>

    <!-- Fallback banner (shown when product loaded from fallback data) -->
    <div class="fallback-notice" *ngIf="usingFallback() && product()">
      <mat-icon>info</mat-icon>
      <span>Showing cached product info. Live data unavailable.</span>
      <button (click)="retryLoad()">Retry</button>
    </div>

    <div class="product-detail" *ngIf="product() as p">
      <!-- BREADCRUMB -->
      <nav class="breadcrumb">
        <a routerLink="/">Home</a> / 
        <a routerLink="/products">Products</a> / 
        <span>{{ p.name }}</span>
      </nav>

      <div class="detail-layout">
        <!-- IMAGE GALLERY -->
        <div class="gallery">
          <div class="thumbnails">
            <button *ngFor="let img of galleryImages; let i = index"
                    class="thumb-btn"
                    [class.active]="selectedImage() === i"
                    (click)="selectedImage.set(i)">
              <img [src]="img" alt="Thumbnail" />
            </button>
          </div>
          <div class="main-image">
            <img [src]="galleryImages[selectedImage()] || p.imageUrl || fallbackImage" [alt]="p.name" />
            <span class="badge bestseller">Bestseller</span>
          </div>
        </div>

        <!-- PRODUCT INFO -->
        <div class="info">
          <div class="rating">
            <span class="stars">★★★★★</span>
            <span class="rating-text">4.8 (128 reviews)</span>
          </div>

          <h1>{{ p.name }}</h1>
          <p class="sku">SKU: {{ p.sku }}</p>

          <div class="price-section">
            <span class="current-price">{{ p.price | currency:'USD':'symbol' }}</span>
            <span class="original-price" *ngIf="+p.price > 50">{{ +p.price * 1.2 | currency:'USD':'symbol' }}</span>
            <span class="discount" *ngIf="+p.price > 50">20% OFF</span>
          </div>

          <p class="description" *ngIf="p.description">{{ p.description }}</p>

          <!-- SIZE SELECTOR -->
          <div class="option-section">
            <h3>Size</h3>
            <div class="size-options">
              <button *ngFor="let size of sizes"
                      class="size-btn"
                      [class.active]="selectedSize() === size"
                      (click)="selectedSize.set(size)">
                {{ size }}
              </button>
            </div>
          </div>

          <!-- COLOR SELECTOR -->
          <div class="option-section">
            <h3>Color</h3>
            <div class="color-options">
              <button *ngFor="let color of colors"
                      class="color-btn"
                      [class.active]="selectedColor() === color.name"
                      [style.background]="color.hex"
                      (click)="selectedColor.set(color.name)"
                      [title]="color.name">
              </button>
            </div>
          </div>

          <!-- QUANTITY -->
          <div class="option-section">
            <h3>Quantity</h3>
            <div class="quantity-control">
              <button class="qty-btn" (click)="decrementQty()" [disabled]="quantity() <= 1">
                <mat-icon>remove</mat-icon>
              </button>
              <span class="qty-value">{{ quantity() }}</span>
              <button class="qty-btn" (click)="incrementQty()">
                <mat-icon>add</mat-icon>
              </button>
            </div>
          </div>

          <!-- STOCK STATUS -->
          <div class="stock-status" *ngIf="inventory() as inv">
            <mat-icon [class.in-stock]="inv.availableQuantity > 0">check_circle</mat-icon>
            <span *ngIf="inv.availableQuantity > 0">In Stock ({{ inv.availableQuantity }} available)</span>
            <span *ngIf="inv.availableQuantity === 0" class="out-of-stock">Out of Stock</span>
          </div>
          <div class="stock-status loading" *ngIf="inventory() === undefined">
            <mat-icon>sync</mat-icon>
            <span>Checking availability...</span>
          </div>

          <!-- ACTION BUTTONS -->
          <div class="actions">
            <button class="btn-primary" (click)="addToCart(p.id)">
              <mat-icon>shopping_bag</mat-icon>
              Add to Cart
            </button>
            <button class="btn-outline" (click)="addToCart(p.id)">
              <mat-icon>favorite_border</mat-icon>
              Wishlist
            </button>
          </div>

          <!-- TRUST BADGES -->
          <div class="trust-badges">
            <div class="badge-item">
              <mat-icon>local_shipping</mat-icon>
              <span>Free Shipping</span>
            </div>
            <div class="badge-item">
              <mat-icon>autorenew</mat-icon>
              <span>Easy Returns</span>
            </div>
            <div class="badge-item">
              <mat-icon>verified_user</mat-icon>
              <span>Secure Payment</span>
            </div>
          </div>
        </div>
      </div>

      <!-- PRODUCT TABS -->
      <mat-tab-group class="product-tabs">
        <mat-tab label="Description">
          <div class="tab-content">
            <h3>Product Details</h3>
            <p>{{ p.description || 'Premium quality product crafted with attention to detail. Made from high-quality materials designed for comfort and durability.' }}</p>
            <ul>
              <li>Premium quality materials</li>
              <li>Designed for everyday comfort</li>
              <li>Easy care instructions</li>
              <li>Available in multiple sizes</li>
            </ul>
          </div>
        </mat-tab>
        <mat-tab label="Specifications">
          <div class="tab-content">
            <table class="specs-table">
              <tr><td>SKU</td><td>{{ p.sku }}</td></tr>
              <tr><td>Category</td><td>{{ p.categoryName || 'General' }}</td></tr>
              <tr><td>Weight</td><td>0.5 kg</td></tr>
              <tr><td>Material</td><td>Premium Cotton Blend</td></tr>
            </table>
          </div>
        </mat-tab>
        <mat-tab label="Reviews">
          <div class="tab-content">
            <div class="review">
              <div class="review-header">
                <strong>Sarah J.</strong>
                <span class="stars">★★★★★</span>
              </div>
              <p>"Excellent quality! The product exceeded my expectations. Fast shipping too."</p>
            </div>
            <div class="review">
              <div class="review-header">
                <strong>Michael C.</strong>
                <span class="stars">★★★★☆</span>
              </div>
              <p>"Great value for the price. Would definitely recommend to others."</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      background:
        radial-gradient(circle at top right, rgba(255, 111, 97, 0.08), transparent 22%),
        linear-gradient(180deg, #fbfcfe 0%, #f5f7fb 100%);
      min-height: 100vh;
    }

    .center {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
    }

    .product-detail {
      max-width: 1360px;
      margin: 0 auto;
      padding: 36px 24px 72px;
    }

    .breadcrumb {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 28px;
    }

    .breadcrumb a {
      color: #64748b;
      text-decoration: none;
    }

    .breadcrumb a:hover {
      color: #ff6f61;
    }

    .detail-layout {
      display: grid;
      grid-template-columns: minmax(0, 1.02fr) minmax(0, 0.98fr);
      gap: 40px;
      margin-bottom: 40px;
      align-items: start;
    }

    /* GALLERY */
    .gallery {
      display: grid;
      grid-template-columns: 72px 1fr;
      gap: 18px;
      padding: 22px;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 20px;
      box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
    }

    .thumbnails {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .thumb-btn {
      width: 72px;
      height: 72px;
      border: 2px solid transparent;
      border-radius: 14px;
      overflow: hidden;
      background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
      padding: 0;
      cursor: pointer;
      transition: border-color 0.2s, transform 0.2s;
    }

    .thumb-btn.active {
      border-color: #1a1a2e;
    }

    .thumb-btn:hover {
      transform: translateY(-1px);
    }

    .thumb-btn img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      padding: 8px;
    }

    .main-image {
      position: relative;
      border-radius: 18px;
      overflow: hidden;
      background: linear-gradient(180deg, #f8fafc 0%, #eef2f7 100%);
      border: 1px solid rgba(226, 232, 240, 0.92);
      min-height: 460px;
    }

    .main-image img {
      width: 100%;
      height: 100%;
      min-height: 460px;
      object-fit: contain;
      padding: 28px;
    }

    .main-image .badge {
      position: absolute;
      top: 16px;
      left: 16px;
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .badge.bestseller { background: #ef4444; color: #fff; }

    /* INFO */
    .info {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(226, 232, 240, 0.9);
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
    }

    .info h1 {
      font-size: 30px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 8px;
      line-height: 1.15;
    }

    .sku {
      font-size: 13px;
      color: #94a3b8;
      margin: 0 0 16px;
    }

    .rating {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .stars { color: #f59e0b; font-size: 16px; }
    .rating-text { color: #64748b; font-size: 14px; }

    .price-section {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 22px;
      flex-wrap: wrap;
    }

    .current-price {
      font-size: 30px;
      font-weight: 700;
      color: #1a1a2e;
    }

    .original-price {
      font-size: 18px;
      color: #94a3b8;
      text-decoration: line-through;
    }

    .discount {
      background: #10b981;
      color: #fff;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 700;
    }

    .description {
      color: #475569;
      line-height: 1.6;
      margin-bottom: 28px;
    }

    .option-section {
      margin-bottom: 22px;
    }

    .option-section h3 {
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 12px;
    }

    .size-options {
      display: flex;
      gap: 10px;
    }

    .size-btn {
      width: 44px;
      height: 44px;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      background: #fff;
      font-size: 14px;
      font-weight: 600;
      color: #1a1a2e;
      cursor: pointer;
      transition: all 0.2s;
    }

    .size-btn:hover {
      border-color: #1a1a2e;
    }

    .size-btn.active {
      background: #1a1a2e;
      color: #fff;
      border-color: #1a1a2e;
    }

    .color-options {
      display: flex;
      gap: 10px;
    }

    .color-btn {
      width: 36px;
      height: 36px;
      border: 2px solid transparent;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s;
    }

    .color-btn.active {
      border-color: #1a1a2e;
      box-shadow: 0 0 0 2px #fff, 0 0 0 4px #1a1a2e;
    }

    .quantity-control {
      display: flex;
      align-items: center;
      gap: 0;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      width: fit-content;
    }

    .qty-btn {
      width: 44px;
      height: 44px;
      border: none;
      background: transparent;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #1a1a2e;
    }

    .qty-btn:disabled {
      color: #cbd5e1;
      cursor: not-allowed;
    }

    .qty-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .qty-value {
      width: 50px;
      text-align: center;
      font-size: 16px;
      font-weight: 600;
      color: #1a1a2e;
      border-left: 1px solid #e5e7eb;
      border-right: 1px solid #e5e7eb;
      padding: 10px 0;
    }

    .stock-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 24px;
      font-size: 14px;
      color: #475569;
    }

    .stock-status mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }

    .stock-status mat-icon.in-stock {
      color: #10b981;
    }

    .stock-status .out-of-stock {
      color: #ef4444;
    }

    .stock-status.loading mat-icon {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .actions {
      display: flex;
      gap: 14px;
      margin-bottom: 28px;
      flex-wrap: wrap;
    }

    .btn-primary {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: center;
      min-height: 52px;
      padding: 14px 28px;
      background: #1a1a2e;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-primary:hover {
      background: #ff6f61;
    }

    .btn-outline {
      display: flex;
      align-items: center;
      gap: 10px;
      justify-content: center;
      min-height: 52px;
      padding: 14px 24px;
      border: 1px solid #e5e7eb;
      background: #fff;
      color: #1a1a2e;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-outline:hover {
      border-color: #ff6f61;
      color: #ff6f61;
    }

    .trust-badges {
      display: flex;
      gap: 18px;
      flex-wrap: wrap;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
    }

    .badge-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: #f8fafc;
      border-radius: 999px;
      font-size: 13px;
      color: #64748b;
    }

    .badge-item mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* TABS */
    .product-tabs {
      background: rgba(255, 255, 255, 0.96);
      border-radius: 20px;
      border: 1px solid rgba(226, 232, 240, 0.9);
      box-shadow: 0 18px 44px rgba(15, 23, 42, 0.08);
      overflow: hidden;
    }

    .tab-content {
      padding: 28px 30px 32px;
    }

    .tab-content h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 16px;
    }

    .tab-content p {
      color: #475569;
      line-height: 1.6;
    }

    .tab-content ul {
      color: #475569;
      padding-left: 20px;
    }

    .tab-content li {
      margin-bottom: 8px;
    }

    .specs-table {
      width: 100%;
      border-collapse: collapse;
    }

    .specs-table td {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .specs-table td:first-child {
      font-weight: 600;
      color: #1a1a2e;
      width: 150px;
    }

    .specs-table td:last-child {
      color: #475569;
    }

    .review {
      padding: 20px 0;
      border-bottom: 1px solid #e5e7eb;
    }

    .review:last-child {
      border-bottom: none;
    }

    .review-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 8px;
    }

    .review-header .stars {
      color: #f59e0b;
    }

    .review p {
      color: #475569;
      margin: 0;
    }

    /* ERROR STATE */
    .error-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 400px;
      padding: 40px;
    }

    .error-card {
      text-align: center;
      background: #fff;
      border-radius: 16px;
      padding: 48px 40px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      max-width: 460px;
    }

    .error-card .error-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #94a3b8;
      margin-bottom: 16px;
    }

    .error-card h2 {
      font-size: 22px;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 8px;
    }

    .error-card p {
      font-size: 14px;
      color: #64748b;
      margin: 0 0 24px;
      line-height: 1.6;
    }

    .error-actions {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    .error-actions .btn-outline {
      background: #fff;
      border: 1px solid #e5e7eb;
      color: #1a1a2e;
      text-decoration: none;
    }

    .error-actions .btn-outline:hover {
      border-color: #ff6f61;
      color: #ff6f61;
    }

    /* FALLBACK NOTICE */
    .fallback-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      max-width: 1200px;
      margin: 16px auto 0;
      padding: 12px 20px;
      background: #fffbeb;
      border: 1px solid #f59e0b33;
      border-radius: 8px;
      font-size: 13px;
      color: #92400e;
    }

    .fallback-notice mat-icon {
      color: #d97706;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    .fallback-notice span {
      flex: 1;
    }

    .fallback-notice button {
      background: #fff;
      border: 1px solid #f59e0b55;
      border-radius: 6px;
      padding: 4px 14px;
      font-size: 13px;
      font-weight: 600;
      color: #92400e;
      cursor: pointer;
      transition: background 0.2s;
    }

    .fallback-notice button:hover {
      background: #fef3c7;
    }

    /* RESPONSIVE */
    @media (max-width: 1024px) {
      .product-detail { padding: 28px 20px 56px; }
      .detail-layout {
        grid-template-columns: 1fr;
        gap: 24px;
      }
      .gallery {
        grid-template-columns: 1fr;
      }
      .thumbnails {
        flex-direction: row;
        order: 1;
        flex-wrap: wrap;
      }
      .main-image { order: 0; }
    }

    @media (max-width: 640px) {
      .product-detail { padding: 24px 16px 48px; }
      .gallery,
      .info,
      .product-tabs {
        border-radius: 18px;
      }
      .gallery {
        padding: 16px;
      }
      .main-image,
      .main-image img {
        min-height: 320px;
      }
      .main-image img {
        padding: 18px;
      }
      .info {
        padding: 22px 18px;
      }
      .info h1,
      .current-price {
        font-size: 26px;
      }
      .actions { flex-direction: column; }
      .btn-primary,
      .btn-outline {
        width: 100%;
      }
      .trust-badges {
        flex-direction: column;
        gap: 12px;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(ProductApi);
  private readonly cart = inject(CartService);
  private readonly inventoryApi = inject(InventoryApi);

  readonly product = signal<ProductResponse | null | undefined>(undefined);
  readonly loadError = signal<string | null>(null);
  readonly usingFallback = signal(false);
  readonly isLoading = computed(() => this.product() === undefined);

  readonly inventory = signal<any>(undefined);

  private get productId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.loadProduct();
    this.loadInventory();
  }

  loadProduct(): void {
    const id = this.productId;
    this.product.set(undefined);
    this.loadError.set(null);
    this.usingFallback.set(false);

    this.api.getById(id).subscribe({
      next: (p) => {
        this.product.set(p);
        this.usingFallback.set(false);
      },
      error: (err) => {
        console.warn('Product details API unavailable, using fallback:', err?.message ?? err);
        const fallback = this.buildFallbackProduct(id);
        this.product.set(fallback);
        this.usingFallback.set(true);
        this.loadError.set(
          err?.status === 0
            ? 'Server is unreachable. Showing placeholder info.'
            : err?.error?.message ?? 'Could not load product details.'
        );
      },
    });
  }

  retryLoad(): void {
    this.loadProduct();
    this.loadInventory();
  }

  private loadInventory(): void {
    const id = this.productId;
    this.inventoryApi.getInventory(id).pipe(
      map((res) => res.data),
      catchError(() => of(null))
    ).subscribe((data) => this.inventory.set(data));
  }

  private buildFallbackProduct(id: number): ProductResponse {
    const match = FALLBACK_PRODUCTS.find(p => p.id === id);
    if (match) return match;

    return {
      id,
      name: `Product #${id}`,
      description: 'Product details are temporarily unavailable. Please try again later to see full information.',
      price: '0.00',
      sku: `SKU-${id}`,
      categoryId: null,
      categoryName: null,
      active: true,
      imageUrl: this.fallbackImage,
      createdAt: null,
      updatedAt: null,
    };
  }

  readonly fallbackImage = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
  readonly galleryImages = [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1560343090-f0409e92791a?auto=format&fit=crop&w=800&q=80'
  ];

  readonly sizes = ['XS', 'S', 'M', 'L', 'XL'];
  readonly colors = [
    { name: 'Black', hex: '#1a1a2e' },
    { name: 'Navy', hex: '#1e3a5f' },
    { name: 'Cream', hex: '#f5f0e6' },
    { name: 'Coral', hex: '#ff6f61' }
  ];

  readonly selectedImage = signal(0);
  readonly selectedSize = signal('M');
  readonly selectedColor = signal('Black');
  readonly quantity = signal(1);

  incrementQty(): void {
    this.quantity.update(q => q + 1);
  }

  decrementQty(): void {
    this.quantity.update(q => Math.max(1, q - 1));
  }

  addToCart(productId: number): void {
    this.cart.add(String(productId), this.quantity());
  }
}
