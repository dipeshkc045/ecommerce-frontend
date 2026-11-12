# ecommerce-frontend (storefront)

Angular 21 storefront with SSR (`@angular/ssr`, Express), standalone components, signals, Lucide icons, RxJS. Unit tests with Vitest (`ng test`). Stylelint for SCSS.

Talks to `ecommerce-platform` (`commerce-core`, the new Nepal platform), not to the old `ecommerce-backend` gateway. The API is documented in that repo's `docs/06-api-design.md`; JSON is snake_case, money is whole paisa (`amount_minor`).

## Commands

```bash
npm start                         # ng serve on :4200, forwards /web to commerce-core on :8180 (proxy.conf.json)
npm run build
npm test                          # stylelint + ng test
npm run lint:style
```

To try the whole flow: start commerce-core, payment-service and the Khalti simulator from `ecommerce-platform` (see its README). Start payment-service with `KHALTI_RETURN_URL=http://localhost:4200/checkout/return` so Khalti sends the customer back to this app.

## Layout

- `src/app/core/shop/`: `shop.api.ts` (the only place that makes HTTP calls), `shop.types.ts`, `money.ts`, `problem.ts` (error codes to customer-facing sentences).
- `src/app/core/auth/`: `AuthService` (access and refresh token in `localStorage`, signals, SSR-safe), `authGuard`.
- `src/app/core/http/`: `api-base-url.interceptor.ts` (relative URLs in the browser, commerce-core address on the server), `auth.interceptor.ts` (Bearer token; on 401 one shared refresh, then retry).
- `src/app/core/cart/cart.service.ts`: the server's cart as a signal; prices and stock always come from the server.
- `src/app/features/shop/`: products, product, cart, checkout, checkout-return, orders, order and login pages. One shared `shop.scss`.
- `src/app/core/layout/`: header, footer and layouts (public and auth).

## Rules

- Never compute prices, VAT or totals in the browser: show what the server returns.
- Khalti results come from the server's lookup (`/web/v1/checkout/return`), never from the query string.
- A checkout attempt uses one `Idempotency-Key`; keep it on retry after a lost connection, renew it after any server answer.
- Pages that need a signed-in customer render in the browser only (`app.routes.server.ts`): the server has no tokens.
- SSR: never touch `window`/`localStorage` without a platform check.
- Fields bound with `ngModel` in OnPush components must be signals (`[ngModel]="x()" (ngModelChange)="x.set($event)"`), or the template will not update.
