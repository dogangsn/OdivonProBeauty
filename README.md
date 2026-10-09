# OdivonProBeauty

OdivonProBeauty is the Angular web and PWA client for multi-branch beauty, spa and wellness businesses. It covers appointment planning, CRM, packages and sessions, staff, finance, inventory, campaigns, reports, privacy workflows and the customer portal.

## Local development

```bash
npm ci
npm start
```

The client authenticates with Firebase Authentication and sends the ID token to `MAIN_API_URL/api/v1/beauty`. Firestore and Storage are never accessed directly for business data.

## Verification

```bash
npm run test
npm run build
npm run format:check
```

Configuration examples live in `src/environments`. Never commit real Firebase credentials, service accounts or `.env` files. External SMS, WhatsApp, payment, e-invoice and AI providers are intentionally represented by `not-configured` ports in this release.

## Documentation

- [Architecture](docs/architecture.md)
- [API and DTO contracts](docs/api-and-dtos.md)
- [Firestore model](docs/firestore-model.md)
- [Roles and permissions](docs/roles-and-permissions.md)
- [Screens and wireframes](docs/screens-and-wireframes.md)
- [Business rules](docs/business-rules.md)
- [Testing, CI and operations](docs/testing-and-operations.md)
- [Delivery phases](docs/roadmap.md)

No license is granted by this repository.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.2.2.

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
