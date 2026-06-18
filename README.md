# Backstage OpenShift Deployments Plugin

A Backstage application with a custom OpenShift plugin that surfaces Kubernetes deployment information directly within the Backstage service catalog. This project brings real-time deployment status, resource usage metrics, and pod health information from OpenShift clusters into your developer portal.

## What Makes This Special

- **Custom OpenShift Plugin**: A frontend-only Backstage plugin that displays deployment status, CPU/memory usage, and pod health for catalog services
- **Dual-Cluster Support**: Connects to both stage and production OpenShift environments with automatic namespace discovery
- **App Interface Integration**: Queries Red Hat's App Interface (Qontract) for namespace configuration and cluster mapping
- **Dynamic Plugin Support**: Can be packaged as a Red Hat Developer Hub (RHDH) dynamic plugin without rebuilding the entire Backstage application
- **Real-time Resource Monitoring**: Displays live CPU and memory usage with color-coded progress bars (green/yellow/red based on utilization)

## Prerequisites

- **Node.js**: Version 22 or 24 (see `engines` in `package.json`)
- **Yarn**: Version 1.22.22 (specified in `packageManager` field)
- **Git**: For cloning the repository

## Installation

Clone the repository and install dependencies:

```sh
git clone <repository-url>
cd backstage-plugin-openshift
yarn install
```

The installation uses Yarn workspaces to manage the monorepo structure across `packages/app`, `packages/backend`, and `plugins/openshift`.

## Running the Application

Start both the frontend and backend in development mode:

```sh
yarn start
```

This launches:
- **Frontend** at `http://localhost:3000`
- **Backend** at `http://localhost:7007`

The backend uses an in-memory SQLite database in development mode.

### Environment Variables

For full functionality, set the following environment variables:

```sh
export GITHUB_TOKEN=<your-github-token>
export STAGE_CLUSTER_API_TOKEN=<stage-openshift-token>
export PROD_CLUSTER_API_TOKEN=<prod-openshift-token>
```

The GitHub token is required for catalog integration. OpenShift cluster tokens are needed for deployment data retrieval.

## Development Setup

### Building

Build all workspace packages:

```sh
yarn build:all
```

Build only the backend:

```sh
yarn build:backend
```

Build the dynamic plugin distribution:

```sh
yarn build:dynamic
```

### Testing

Run tests with coverage:

```sh
yarn test:all
```

Run tests in watch mode:

```sh
yarn test
```

Run end-to-end tests (Playwright):

```sh
yarn test:e2e
```

The project maintains a 70% coverage threshold enforced through Jest configuration.

### Linting and Formatting

Lint all files:

```sh
yarn lint:all
```

Lint only changed files (since `origin/main`):

```sh
yarn lint
```

Check code formatting:

```sh
yarn prettier:check
```

Auto-fix linting and formatting issues:

```sh
yarn fix
```

### Type Checking

Run TypeScript compiler checks:

```sh
yarn tsc
```

For full type checking (no incremental builds, no `skipLibCheck`):

```sh
yarn tsc:full
```

## Project Structure

This is a Yarn workspace monorepo with three main packages:

```
backstage-plugin-openshift/
├── packages/
│   ├── app/              # Backstage frontend application
│   │   └── src/
│   │       ├── App.tsx
│   │       └── components/catalog/EntityPage.tsx  # Plugin integration point
│   └── backend/          # Backstage backend application
│       └── src/index.ts  # Backend plugin registration
├── plugins/
│   └── openshift/        # Custom OpenShift deployments plugin
│       ├── src/
│       │   ├── plugin.ts               # Plugin definition
│       │   ├── components/             # React components
│       │   └── hooks/                  # Data fetching hooks
│       └── package.json                # Plugin package definition
├── app-config.yaml       # Development configuration
├── app-config.production.yaml  # Production configuration
└── package.json          # Workspace root
```

### Key Components

- **`packages/app`**: Standard Backstage React SPA that assembles core Backstage plugins and the custom OpenShift plugin into a unified developer portal
- **`packages/backend`**: Backstage backend using the new backend system (`@backstage/backend-defaults`) with proxy, catalog, auth, and other core plugins
- **`plugins/openshift`**: Frontend-only plugin (`@redhatinsights/backstage-plugin-openshift`) that queries OpenShift APIs and App Interface to display deployment information

The OpenShift plugin integrates into the service entity page as a "Deployments" tab, visible only for catalog entities with `type: service` and the required labels (`platform` and `service`).

## Architecture

For detailed information about the system architecture, component hierarchy, data flow, and design decisions, see [ARCHITECTURE.md](./ARCHITECTURE.md).

Key architectural highlights:

- **Three-tier architecture**: Frontend SPA → Backend proxy → External APIs (App Interface + OpenShift clusters)
- **Frontend-only plugin**: No custom backend component; all external API calls route through Backstage's proxy
- **Dual UI frameworks**: Material-UI v4 (Backstage standard) + PatternFly v5 (Red Hat visual identity for status indicators)
- **Client-side data processing**: Resource unit parsing, deployment-pod correlation, and metric aggregation happen in the browser

## Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:

- Opening pull requests
- Writing commit messages
- Code review process
- Commit signing requirements
- AI-assisted commit message disclosure

All commits must be signed with a GPG or SSH key.

## License

Apache-2.0

See the [LICENSE](./LICENSE) file for details.
