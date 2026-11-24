# EcommerceWeb

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.0.3.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running the built app (Docker, Vercel, any Node host)

`node dist/ecommerce-web/server/server.mjs` serves the pages and forwards the browser's API calls (`/web/...`) to
commerce-core, so the browser only ever talks to this site and no CORS is needed. Set:

| Variable | Example | What it is |
|---|---|---|
| `COMMERCE_API_URL` | `https://api.example.com` | commerce-core. Used for the forwarded `/web` calls and for pages rendered on the server. Default `http://localhost:8180`. |
| `NG_ALLOWED_HOSTS` | `shop.example.com` | Host names this site answers on (comma-separated). Without it Angular refuses to render on the server and every page falls back to rendering in the browser. |
| `PORT` | `3000` | Port to listen on (the Dockerfile exposes 3000). |

Point payment-service's `KHALTI_RETURN_URL` at this site's `/checkout/return`, so Khalti sends the customer back here.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
