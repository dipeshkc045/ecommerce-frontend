import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal} from '@angular/core';
import {CurrencyPipe, NgFor, NgIf} from '@angular/common';
import {ActivatedRoute, RouterLink} from '@angular/router';

import {MatButtonModule} from '@angular/material/button';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatTabsModule} from '@angular/material/tabs';

import {
  LucideCheckCircle,
  LucideCloudOff,
  LucideHeart,
  LucideInfo,
  LucideMinus,
  LucidePlus,
  LucideRefreshCw,
  LucideShieldCheck,
  LucideShoppingBag,
  LucideTruck
} from '@lucide/angular';

import {ProductsFacade} from '../../core/facades/products.facade';
import {CartFacade} from '../../core/facades/cart.facade';
import {PRODUCT_PLACEHOLDER_IMAGE} from '../../core/models';

@Component({
  standalone: true,
  selector: 'app-product-details-page',
  imports: [NgIf, NgFor, RouterLink, CurrencyPipe, LucideCloudOff, LucideRefreshCw, LucideInfo, LucideMinus, LucidePlus, LucideCheckCircle, LucideShoppingBag, LucideHeart, LucideTruck, LucideShieldCheck, MatButtonModule, MatProgressSpinnerModule, MatTabsModule],
  template: `
    <div class="center" *ngIf="isLoading()">
      <mat-progress-spinner diameter="40" mode="indeterminate" />
    </div>

    <!-- Error state (no fallback possible for details) -->
    <div class="error-container" *ngIf="loadError() && !product()">
      <div class="error-card">
        <svg lucideCloudOff class="error-icon"></svg>
        <h2>Unable to load product</h2>
        <p>{{ loadError() }}</p>
        <div class="error-actions">
          <button class="btn-primary" (click)="retryLoad()">
            <svg lucideRefreshCw></svg> Try Again
          </button>
          <a class="btn-outline" routerLink="/products">Browse Products</a>
        </div>
      </div>
    </div>

    <!-- Fallback banner (shown when product loaded from fallback data) -->
    <div class="fallback-notice" *ngIf="usingFallback() && product()">
      <svg lucideInfo></svg>
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
                <svg lucideMinus></svg>
              </button>
              <span class="qty-value">{{ quantity() }}</span>
              <button class="qty-btn" (click)="incrementQty()">
                <svg lucidePlus></svg>
              </button>
            </div>
          </div>

          <!-- STOCK STATUS -->
          <div class="stock-status" *ngIf="inventory() as inv">
            <svg lucideCheckCircle [class.in-stock]="inv.availableQuantity > 0"></svg>
            <span *ngIf="inv.availableQuantity > 0">In Stock ({{ inv.availableQuantity }} available)</span>
            <span *ngIf="inv.availableQuantity === 0" class="out-of-stock">Out of Stock</span>
          </div>
          <div class="stock-status loading" *ngIf="inventory() === undefined">
            <svg lucideRefreshCw></svg>
            <span>Checking availability...</span>
          </div>

          <!-- ACTION BUTTONS -->
          <div class="actions">
            <button class="btn-primary" (click)="addToCart(p.id)">
              <svg lucideShoppingBag></svg>
              Add to Cart
            </button>
            <button class="btn-outline" (click)="addToCart(p.id)">
              <svg lucideHeart></svg>
              Wishlist
            </button>
          </div>

          <!-- TRUST BADGES -->
          <div class="trust-badges">
            <div class="badge-item">
              <svg lucideTruck></svg>
              <span>Free Shipping</span>
            </div>
            <div class="badge-item">
              <svg lucideRefreshCw></svg>
              <span>Easy Returns</span>
            </div>
            <div class="badge-item">
              <svg lucideShieldCheck></svg>
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
  styleUrl: 'product-details.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductDetailsPage implements OnInit {
  readonly facade = inject(ProductsFacade);
  private readonly cart = inject(CartFacade);
  private readonly route = inject(ActivatedRoute);


  readonly product = this.facade.selectedProduct;
  readonly loadError = this.facade.error;
  readonly usingFallback = this.facade.usingFallback;
  readonly isLoading = this.facade.detailLoading;

  readonly inventory = computed(() => this.facade.inventoryFor(this.productId));

  private get productId(): number {
    return Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnInit(): void {
    this.facade.loadById(this.productId);
    this.facade.loadInventory(this.productId);
  }

  loadProduct(): void {
    this.facade.loadById(this.productId);
  }

  retryLoad(): void {
    this.loadProduct();
    this.facade.loadInventory(this.productId);
  }

  readonly fallbackImage = PRODUCT_PLACEHOLDER_IMAGE;
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
    const p = this.product();
    this.cart.addProduct(productId, this.quantity(), p ? {
      name: p.name,
      price: Number(p.price),
      imageUrl: p.imageUrl ?? undefined,
      categoryName: p.categoryName ?? undefined,
      sku: p.sku,
    } : undefined);
  }
}
