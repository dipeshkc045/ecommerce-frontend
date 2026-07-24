import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatChipsModule } from '@angular/material/chips';

import { LucideX, LucideRefreshCw, LucidePencil, LucideTrash2 } from '@lucide/angular';

import { ProductApi, type ProductPayload, type ProductResponse } from '../../core/api/product.api';

@Component({
  standalone: true,
  selector: 'app-admin-products-page',
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    LucideX,
    LucideRefreshCw,
    LucidePencil,
    LucideTrash2,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatChipsModule
  ],
  template: `
    <section class="hero">
      <div>
        <p class="eyebrow">Catalog control</p>
        <h1 class="mat-headline-medium">Product Admin</h1>
        <p class="muted">Create, edit, and delete products against the live API.</p>
      </div>
      <div class="hero-badge">Live</div>
    </section>

    <div class="actions">
      <mat-form-field appearance="outline" class="search">
        <mat-label>Search by name or SKU</mat-label>
        <input matInput type="search" [value]="searchTerm()" (input)="onSearch($any($event.target).value)" />
        <button mat-icon-button matSuffix aria-label="Clear" *ngIf="searchTerm()" (click)="onSearch('')">
          <svg lucideX></svg>
        </button>
      </mat-form-field>

      <div class="stat-pill">
        <span class="label">Total</span>
        <span class="value">{{ products()?.length ?? 0 }}</span>
      </div>

      <button mat-stroked-button color="primary" (click)="refresh()" [disabled]="busy()">
        <svg lucideRefreshCw></svg>
        Refresh
      </button>
    </div>

    <div class="layout">
      <mat-card class="glass" appearance="outlined">
        <mat-card-header>
          <mat-card-title>New product</mat-card-title>
          <mat-card-subtitle>All fields required unless noted.</mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <form class="form-grid" [formGroup]="form" (ngSubmit)="create()">
            <mat-form-field appearance="outline">
              <mat-label>Name</mat-label>
              <input matInput formControlName="name" required />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>SKU</mat-label>
              <input matInput formControlName="sku" required />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Price</mat-label>
              <input matInput type="number" min="0" step="0.01" formControlName="price" required />
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Image URL (optional)</mat-label>
              <input matInput type="url" formControlName="imageUrl" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="full">
              <mat-label>Description</mat-label>
              <textarea matInput rows="2" formControlName="description"></textarea>
            </mat-form-field>

            <mat-slide-toggle color="primary" formControlName="active">Active</mat-slide-toggle>

            <div class="form-actions">
              <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid || busy()">
                {{ busy() ? 'Saving…' : 'Create product' }}
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <mat-card class="glass" appearance="outlined">
        <mat-card-header>
          <mat-card-title>Products</mat-card-title>
          <mat-card-subtitle>Live data from product-service</mat-card-subtitle>
        </mat-card-header>

        <mat-card-content>
          <div class="table-wrap" *ngIf="products() === undefined" aria-busy="true">
            <mat-progress-spinner diameter="32" mode="indeterminate" />
          </div>

          <div class="table-wrap" *ngIf="products() && products()!.length === 0">
            <p class="muted">No products yet. Create one above.</p>
          </div>

          <div class="card-grid" *ngIf="products() && products()!.length > 0">
            <article class="product-card" *ngFor="let p of products()!">
              <div class="card-img" [style.background-image]="p.imageUrl ? 'url(' + p.imageUrl + ')' : 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))'"></div>
              <div class="card-body">
                <div class="card-head">
                  <div>
                    <div class="name">{{ p.name }}</div>
                    <div class="sku">{{ p.sku }}</div>
                  </div>
                  <mat-chip-set class="chip-set">
                    <mat-chip [color]="p.active ? 'primary' : undefined">{{ p.active ? 'Active' : 'Inactive' }}</mat-chip>
                  </mat-chip-set>
                </div>
                <p class="desc" *ngIf="p.description">{{ p.description }}</p>
                <div class="meta">
                  <span class="price">{{ p.price }}</span>
                  <span class="category" *ngIf="p.categoryName">{{ p.categoryName }}</span>
                </div>
                <div class="card-actions">
                  <button mat-stroked-button color="primary" (click)="beginEdit(p)">
                    <svg lucidePencil></svg>
                    Edit
                  </button>
                  <button mat-stroked-button color="warn" (click)="remove(p)" [disabled]="busy()">
                    <svg lucideTrash2></svg>
                    Delete
                  </button>
                </div>
              </div>
            </article>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <mat-card *ngIf="editing()" class="glass" appearance="outlined">
      <mat-card-header>
        <mat-card-title>Edit product</mat-card-title>
        <mat-card-subtitle>{{ editing()?.name }}</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <form class="form-grid" [formGroup]="editForm" (ngSubmit)="saveEdit()">
          <mat-form-field appearance="outline">
            <mat-label>Name</mat-label>
            <input matInput formControlName="name" required />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>SKU</mat-label>
            <input matInput formControlName="sku" required />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Price</mat-label>
            <input matInput type="number" min="0" step="0.01" formControlName="price" required />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Image URL (optional)</mat-label>
            <input matInput type="url" formControlName="imageUrl" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full">
            <mat-label>Description</mat-label>
            <textarea matInput rows="2" formControlName="description"></textarea>
          </mat-form-field>

          <mat-slide-toggle color="primary" formControlName="active">Active</mat-slide-toggle>

          <div class="form-actions">
            <button mat-stroked-button type="button" (click)="cancelEdit()">Cancel</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="editForm.invalid || busy()">
              {{ busy() ? 'Saving…' : 'Save changes' }}
            </button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .layout {
        display: grid;
        gap: 16px;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
      }

      .glass {
        background: var(--card-glass);
        border: 1px solid var(--card-stroke);
        box-shadow: var(--shadow-soft);
      }

      .form-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      }

      .full {
        grid-column: 1 / -1;
      }

      .form-actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        align-items: center;
      }

      .hero {
        margin-bottom: 18px;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: radial-gradient(circle at 20% 20%, rgba(99, 102, 241, 0.15), transparent 45%),
          radial-gradient(circle at 80% 0%, rgba(236, 72, 153, 0.18), transparent 40%),
          linear-gradient(135deg, rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.01));
        border: 1px solid var(--card-stroke);
        border-radius: 16px;
      }

      .eyebrow {
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
        font-size: 12px;
        margin: 0 0 4px;
      }

      .hero-badge {
        padding: 8px 12px;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--brand-primary), var(--brand-accent));
        color: #fff;
        font-weight: 700;
        box-shadow: 0 10px 30px rgba(37, 99, 235, 0.3);
      }

      .actions {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 12px;
        align-items: center;
        margin: 0 0 16px;
      }

      .search {
        width: 100%;
      }

      .stat-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 12px;
        border-radius: 12px;
        border: 1px solid var(--card-stroke);
        background: rgba(255, 255, 255, 0.04);
      }

      .stat-pill .label {
        color: var(--text-muted);
        font-size: 12px;
      }

      .stat-pill .value {
        font-weight: 700;
        font-size: 16px;
      }

      .card-grid {
        display: grid;
        gap: 12px;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      }

      .product-card {
        border: 1px solid var(--card-stroke);
        border-radius: 14px;
        overflow: hidden;
        background: rgba(255, 255, 255, 0.02);
        box-shadow: var(--shadow-soft);
        display: flex;
        flex-direction: column;
        min-height: 240px;
      }

      .card-img {
        height: 140px;
        background-size: cover;
        background-position: center;
      }

      .card-body {
        padding: 12px 14px 14px;
        display: grid;
        gap: 8px;
      }

      .card-head {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }

      .name {
        font-weight: 700;
        font-size: 16px;
      }

      .sku {
        color: var(--text-muted);
        font-size: 12px;
      }

      .desc {
        color: var(--text-muted);
        margin: 0;
        font-size: 13px;
      }

      .meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-weight: 600;
      }

      .price {
        font-size: 16px;
      }

      .category {
        color: var(--text-muted);
        font-size: 12px;
      }

      .card-actions {
        display: flex;
        gap: 8px;
        justify-content: flex-end;
        flex-wrap: wrap;
      }

      .chip-set {
        --mdc-chip-label-text-color: inherit;
      }

      @media (max-width: 720px) {
        .actions {
          grid-template-columns: 1fr;
        }
      }
    `
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProductsPage {
  private readonly api = inject(ProductApi);
  private readonly fb = inject(FormBuilder);

  readonly displayedColumns = ['name', 'price', 'actions'];

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    sku: ['', Validators.required],
    price: ['', Validators.required],
    description: [''],
    imageUrl: [''],
    active: [true]
  });

  readonly editForm = this.fb.nonNullable.group({
    id: [0],
    name: ['', Validators.required],
    sku: ['', Validators.required],
    price: ['', Validators.required],
    description: [''],
    imageUrl: [''],
    active: [true]
  });

  readonly products = signal<ProductResponse[] | undefined>(undefined);
  readonly busy = signal(false);
  readonly editing = signal<ProductResponse | null>(null);
  readonly searchTerm = signal('');

  constructor() {
    this.refresh();
  }

  refresh(): void {
    this.products.set(undefined);
    const term = this.searchTerm().trim();
    const req = term ? this.api.search(term) : this.api.getAll();
    req.subscribe({
      next: (res) => this.products.set(res),
      error: () => this.products.set([])
    });
  }

  private buildPayload(formValue: {
    name: string;
    sku: string;
    price: string | number;
    description?: string | null;
    imageUrl?: string | null;
    active?: boolean | null;
  }): ProductPayload {
    return {
      name: formValue['name'],
      sku: formValue['sku'],
      price: String(formValue['price']),
      description: formValue['description'] ?? null,
      imageUrl: formValue['imageUrl'] || null,
      active: formValue['active'] ?? true
    };
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.refresh();
  }

  create(): void {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    const payload = this.buildPayload(this.form.getRawValue());
    this.api.create(payload).subscribe({
      next: () => {
        this.form.reset();
        this.form.patchValue({ active: true });
        this.busy.set(false);
        this.refresh();
      },
      error: () => this.busy.set(false)
    });
  }

  beginEdit(product: ProductResponse): void {
    this.editing.set(product);
    this.editForm.reset({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: product.price,
      description: product.description ?? '',
      imageUrl: product.imageUrl ?? '',
      active: product.active ?? true
    });
  }

  cancelEdit(): void {
    this.editing.set(null);
  }

  saveEdit(): void {
    if (this.editForm.invalid || this.busy()) return;
    const value = this.editForm.getRawValue();
    const payload = this.buildPayload(value);
    this.busy.set(true);
    this.api.update(value.id, payload).subscribe({
      next: () => {
        this.busy.set(false);
        this.editing.set(null);
        this.refresh();
      },
      error: () => this.busy.set(false)
    });
  }

  remove(product: ProductResponse): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.api.delete(product.id).subscribe({
      next: () => {
        this.busy.set(false);
        this.refresh();
      },
      error: () => this.busy.set(false)
    });
  }
}
