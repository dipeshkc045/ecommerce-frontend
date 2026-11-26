import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, of, switchMap, map } from 'rxjs';

import { CartService } from '../../core/cart/cart.service';
import { MoneyPipe, NumPipe, TPipe, WhenPipe } from '../../core/i18n/pipes';
import { addressProblem, messageFor } from '../../core/shop/problem';
import { ShopApi } from '../../core/shop/shop.api';
import { PROVINCES } from '../../core/shop/shop.types';
import type { Address, AddressBody, PaymentMethod } from '../../core/shop/shop.types';

/** Only http(s) addresses are followed; the payment page is never taken from anything else. */
export function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

type FormField = 'recipient_name' | 'phone' | 'province' | 'district' | 'municipality' | 'ward' | 'street' | 'landmark';
type AddressForm = Record<FormField, string>;

const EMPTY_FORM: AddressForm = {
  recipient_name: '', phone: '', province: '', district: '', municipality: '', ward: '', street: '', landmark: '',
};

const REQUIRED: [FormField, string][] = [
  ['recipient_name', 'Enter the name of the person who will receive the order.'],
  ['phone', 'Enter a mobile number the courier can call.'],
  ['province', 'Choose a province.'],
  ['district', 'Enter the district.'],
  ['municipality', 'Enter the municipality or rural municipality.'],
  ['ward', 'Enter the ward number (1 to 33).'],
  ['landmark', 'Enter a landmark so the courier can find you.'],
];

/** Same rule as the server: a Nepal mobile starts 96, 97 or 98. Only for a friendlier early message. */
export function formError(f: AddressForm): { field: FormField; message: string } | null {
  for (const [field, message] of REQUIRED) {
    if (!f[field].trim()) return { field, message };
  }
  const ward = Number(f.ward);
  if (!Number.isInteger(ward) || ward < 1 || ward > 33) return { field: 'ward', message: 'Ward must be a number from 1 to 33.' };
  return null;
}

@Component({
  standalone: true,
  selector: 'app-checkout-page',
  imports: [FormsModule, RouterLink, TPipe, MoneyPipe, NumPipe],
  styleUrl: './shop.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shop">
      <h1>{{ 'Checkout' | t }}</h1>
      @if (error()) {
        <p class="notice notice--error" role="alert">
          {{ error() | t }} <a routerLink="/cart">{{ 'Back to cart' | t }}</a>
        </p>
      }
      @if (!cart.cart() || addresses() === null) {
        <div class="skeleton" aria-busy="true"></div>
      } @else if (cart.totalItems() === 0) {
        <div class="card center"><p>{{ 'Your cart is empty.' | t }}</p><a class="btn" routerLink="/products">{{ 'Browse products' | t }}</a></div>
      } @else {
        <form class="layout-2" (ngSubmit)="place()" novalidate>
          <div>
            <fieldset class="card methods" style="margin-bottom: 16px">
              <legend><h2>{{ 'Delivery address' | t }}</h2></legend>
              @for (a of addresses(); track a.address_id) {
                <label class="method">
                  <input type="radio" name="address" [value]="a.address_id" [checked]="!newMode() && selectedId() === a.address_id"
                         (change)="chooseSaved(a.address_id)" />
                  <span>
                    <strong>{{ a.recipient_name }}</strong> · {{ a.phone }}<br />
                    <span class="muted">{{ describe(a) }}</span>
                  </span>
                </label>
              }
              @if (addresses()!.length > 0) {
                <label class="method">
                  <input type="radio" name="address" value="new" [checked]="newMode()" (change)="newMode.set(true)" />
                  <span><strong>{{ 'Use a new address' | t }}</strong></span>
                </label>
              }
              @if (newMode()) {
                <div class="address-form">
                  <div class="field">
                    <label for="a-name">{{ 'Receiver’s name' | t }}</label>
                    <input id="a-name" autocomplete="name" [value]="form().recipient_name" (input)="set('recipient_name', $any($event.target).value)" />
                  </div>
                  <div class="field">
                    <label for="a-phone">{{ 'Mobile number (the courier will call)' | t }}</label>
                    <input id="a-phone" type="tel" inputmode="numeric" autocomplete="tel-national" placeholder="98XXXXXXXX"
                           [value]="form().phone" (input)="set('phone', $any($event.target).value)" />
                  </div>
                  <div class="field">
                    <label for="a-province">{{ 'Province' | t }}</label>
                    <select id="a-province" [value]="form().province" (change)="set('province', $any($event.target).value)">
                      <option value="">{{ 'Choose…' | t }}</option>
                      @for (p of provinces; track p) { <option [value]="p" [selected]="form().province === p">{{ p | t }}</option> }
                    </select>
                  </div>
                  <div class="field">
                    <label for="a-district">{{ 'District' | t }}</label>
                    <input id="a-district" [value]="form().district" (input)="set('district', $any($event.target).value)" />
                  </div>
                  <div class="field">
                    <label for="a-muni">{{ 'Municipality or rural municipality' | t }}</label>
                    <input id="a-muni" [value]="form().municipality" (input)="set('municipality', $any($event.target).value)" />
                  </div>
                  <div class="field">
                    <label for="a-ward">{{ 'Ward number' | t }}</label>
                    <input id="a-ward" type="number" min="1" max="33" inputmode="numeric" [value]="form().ward"
                           (input)="set('ward', $any($event.target).value)" />
                  </div>
                  <div class="field">
                    <label for="a-street">{{ 'Street or tole (optional)' | t }}</label>
                    <input id="a-street" [value]="form().street" (input)="set('street', $any($event.target).value)" />
                  </div>
                  <div class="field">
                    <label for="a-landmark">{{ 'Landmark' | t }}</label>
                    <input id="a-landmark" [placeholder]="'Near a temple, school, shop…' | t" [value]="form().landmark"
                           (input)="set('landmark', $any($event.target).value)" />
                  </div>
                  @if (fieldError()) {
                    <p class="notice notice--error" role="alert">{{ fieldError() | t }}</p>
                  }
                  <p class="muted">{{ 'This address is saved to your account for next time.' | t }}</p>
                </div>
              }
            </fieldset>

            <fieldset class="card methods">
              <legend><h2>{{ 'Payment method' | t }}</h2></legend>
              <label class="method">
                <input type="radio" name="method" value="KHALTI" [checked]="method() === 'KHALTI'" (change)="method.set('KHALTI')" />
                <span><strong>{{ 'Pay with Khalti' | t }}</strong><br /><span class="muted">{{ 'You pay on the Khalti page, then come back here.' | t }}</span></span>
              </label>
              <label class="method">
                <input type="radio" name="method" value="COD" [checked]="method() === 'COD'" (change)="method.set('COD')" />
                <span><strong>{{ 'Cash on delivery' | t }}</strong><br /><span class="muted">{{ 'Pay when your order arrives.' | t }}</span></span>
              </label>
            </fieldset>
          </div>
          <aside class="card summary" [attr.aria-label]="'Order summary' | t">
            <h2>{{ 'Summary' | t }}</h2>
            <div class="summary-row"><span>{{ 'Items ({n})' | t: { n: (cart.totalItems() | num) } }}</span><span>{{ cart.cart()?.subtotal | money }}</span></div>
            <div class="summary-row"><span>{{ 'Delivery' | t }}</span><span>{{ cart.cart()?.delivery | money }}</span></div>
            <div class="summary-row summary-row--total"><span>{{ 'Total' | t }}</span><span>{{ cart.cart()?.total | money }}</span></div>
            <p class="muted">{{ 'Prices include 13% VAT.' | t }}</p>
            <button class="btn btn--block" type="submit" [disabled]="busy()">
              {{ (busy() ? 'Placing your order…' : method() === 'KHALTI' ? 'Pay with Khalti' : 'Place order') | t }}
            </button>
          </aside>
        </form>
      }
    </div>
  `,
})
export class CheckoutPage implements OnInit {
  readonly cart = inject(CartService);
  private readonly api = inject(ShopApi);
  private readonly router = inject(Router);

  readonly provinces = PROVINCES;
  readonly method = signal<PaymentMethod>('KHALTI');
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  readonly fieldError = signal<string | null>(null);
  readonly addresses = signal<Address[] | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly newMode = signal(false);
  readonly form = signal<AddressForm>({ ...EMPTY_FORM });
  readonly canPick = computed(() => !this.newMode() && this.selectedId() !== null);

  /** One key and one new-address id per attempt: a double press or a retry after a lost answer cannot make two orders or two addresses. */
  private key = newId();
  private newAddressId = newId();

  ngOnInit(): void {
    this.cart.load().subscribe({ error: (e) => this.error.set(messageFor(e, 'We could not load your cart.')) });
    this.api.addresses().subscribe({
      next: ({ items }) => {
        this.addresses.set(items);
        const first = items.find((a) => a.is_default) ?? items[0];
        this.selectedId.set(first?.address_id ?? null);
        this.newMode.set(items.length === 0);
      },
      error: (e) => {
        this.addresses.set([]);
        this.newMode.set(true);
        this.error.set(messageFor(e, 'We could not load your saved addresses.'));
      },
    });
  }

  chooseSaved(id: string): void {
    this.selectedId.set(id);
    this.newMode.set(false);
    this.fieldError.set(null);
  }

  set(field: FormField, value: string): void {
    this.form.update((f) => ({ ...f, [field]: value }));
  }

  describe(a: Address): string {
    return [a.street, `${a.municipality}-${a.ward}`, a.district, a.province, a.landmark].filter(Boolean).join(', ');
  }

  place(): void {
    if (this.busy()) return;
    this.error.set(null);
    this.fieldError.set(null);

    let address$: Observable<string>;
    if (this.newMode()) {
      const problem = formError(this.form());
      if (problem) {
        this.fieldError.set(problem.message);
        document.getElementById('a-' + (problem.field === 'recipient_name' ? 'name' : problem.field === 'municipality' ? 'muni' : problem.field))?.focus();
        return;
      }
      address$ = this.api
        .saveAddress(this.newAddressId, toBody(this.form(), (this.addresses()?.length ?? 0) === 0))
        .pipe(map((saved) => saved.address_id));
    } else if (this.selectedId()) {
      address$ = of(this.selectedId() as string);
    } else {
      this.error.set('Choose a delivery address.');
      return;
    }

    this.busy.set(true);
    address$.pipe(switchMap((addressId) => this.api.placeOrder(this.method(), this.key, addressId))).subscribe({
      next: (placement) => {
        const url = placement.next_action?.url;
        if (placement.status === 'AWAITING_CUSTOMER_ACTION' && url && isHttpUrl(url)) {
          window.location.assign(url); // leave for the payment page; the cart empties when payment completes
          return;
        }
        this.cart.reset();
        void this.router.navigate(['/orders', placement.order_id], { queryParams: { placed: 1 } });
      },
      error: (e) => {
        this.busy.set(false);
        const bad = addressProblem(e);
        if (bad) {
          this.fieldError.set(bad.message);
          this.newAddressId = newId(); // the server refused it; a corrected address is a new try
        } else {
          this.error.set(messageFor(e, 'We could not place your order.'));
        }
        // A lost connection may still have created the order: keep the key so a retry returns it.
        // Any answer from the server is final for this attempt; the next one starts fresh.
        if (e?.status !== 0) this.key = newId();
        this.cart.load().subscribe({ error: () => undefined });
      },
    });
  }
}

function toBody(f: AddressForm, makeDefault: boolean): AddressBody {
  return {
    recipient_name: f.recipient_name.trim(),
    phone: f.phone.trim(),
    province: f.province,
    district: f.district.trim(),
    municipality: f.municipality.trim(),
    ward: Number(f.ward),
    street: f.street.trim() || undefined,
    landmark: f.landmark.trim(),
    make_default: makeDefault,
  };
}

function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
