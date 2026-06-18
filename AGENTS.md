# Backstage OpenShift Deployments Plugin

## Project Overview

A Backstage application with a custom OpenShift plugin that surfaces Kubernetes deployment information directly within the Backstage service catalog. This project brings real-time deployment status, resource usage metrics, and pod health information from OpenShift clusters into your developer portal. The plugin is distributed as a frontend-only Backstage plugin and can be packaged as a Red Hat Developer Hub (RHDH) dynamic plugin for deployment without rebuilding the entire Backstage application.

## Dependencies

Runtime dependencies: TypeScript 5.8.0, React 18, Backstage 1.48.0, Node.js 22 or 24, Yarn 1.22.22, Material-UI v4, PatternFly v5, `@kubernetes/client-node` 0.20.0, `graphql-request` 7.0.1.

Development and testing: Jest 30.2.0, Playwright 1.32.3, `@backstage/cli` 0.35.4, `@janus-idp/cli` 1.11.1, `@testing-library/react` 14.0.0, Prettier 2.3.2, ESLint (via `@backstage/cli`).

## Development Commands

See [Development Setup][readme-dev] in the README for the full command reference. Key agent-specific commands:

```sh
# Install all workspace dependencies (required first step)
yarn install --frozen-lockfile

# Run full test suite with coverage (CI equivalent)
yarn test:all

# Build all workspace packages
yarn build:all

# Build dynamic plugin distribution (for RHDH deployment)
yarn build:dynamic

# Lint all files (CI equivalent)
yarn lint:all

# Type-check all TypeScript (strict mode)
yarn tsc:full
```

CI runs `yarn test --watchAll=false --passWithNoTests --coverage` in the plugin workspace, `yarn audit --level high` for security checks, and TypeScript compilation via `yarn tsc --noEmit` for type validation. Local development uses `yarn start` for hot-reload frontend/backend development servers.

## Architecture

Three-tier architecture: Frontend SPA (Backstage React app) → Backend proxy (`/api/proxy/*`) → External APIs (App Interface GraphQL + OpenShift cluster REST APIs). The OpenShift plugin is frontend-only with no custom backend component — all external API calls route through Backstage's built-in proxy backend. The plugin uses dual UI frameworks (Material-UI v4 for layout, PatternFly v5 for Red Hat status indicators) and performs client-side data processing (resource unit parsing, deployment-pod correlation, metric aggregation). For detailed information about component hierarchy, data flow, proxy configuration, and design decisions, see [ARCHITECTURE.md][architecture].

## Code Style

All linting and formatting is handled through `@backstage/cli` with Backstage's standard ESLint and Prettier configurations. Line length: 100 characters (Prettier default via `@backstage/cli/config/prettier`). TypeScript 5.8 with strict mode enabled (`tsc --skipLibCheck false --incremental false` for full checks). React 18 with hooks patterns. Use `yarn fix` to auto-fix linting and formatting issues (runs `eslint --fix` and `prettier --write` via lint-staged). Material-UI v4 components for layout, PatternFly v5 selectively for status icons and tooltips only.

## Testing

Run tests: `yarn test` (watch mode) or `yarn test:all` (coverage mode). E2E tests: `yarn test:e2e` (Playwright). Test files follow the pattern `*.test.ts` or `*.test.tsx` and live alongside source files (e.g., `plugin.test.ts`, `ResourceUsageProgress.test.tsx`). Use `@testing-library/react` for component testing with user-event interactions. Mock external API calls with `msw` (Mock Service Worker). CI enforces coverage collection via `--coverage` flag but does not enforce a specific threshold — coverage is tracked and reported to Codecov but will not fail builds. Use `describe` blocks for grouping related tests and descriptive test names in imperative mood (e.g., `it('parses CPU nanocores to cores')`).

## Deployment

Dynamic plugin export: `yarn build:dynamic` runs `janus-cli package export-dynamic-plugin`, creates an npm tarball from `dist-dynamic/`, and computes a SHA-256 checksum for RHDH dynamic plugin deployment. Docker image build: `yarn build-image` builds the backend container using `packages/backend/Dockerfile` (based on `node:24-trixie-slim`). The Docker build follows Backstage's skeleton-first pattern (copy workspace `package.json` files, install production deps, copy pre-built `bundle.tar.gz`). Production database: PostgreSQL (configured in `app-config.production.yaml` with environment variables `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_USER`, `POSTGRES_PASSWORD`). Production configuration layers `app-config.yaml` and `app-config.production.yaml`. Environment variables required for production: `GITHUB_TOKEN`, `STAGE_CLUSTER_API_TOKEN`, `PROD_CLUSTER_API_TOKEN`, `OPENSHIFT_DEPLOYMENTS_URL`, `STAGE_CLUSTER_API_URL`, `PROD_CLUSTER_API_URL`.

## Common Mistakes

1. **Missing entity labels for OpenShift plugin.** The plugin requires both `metadata.labels.platform` and `metadata.labels.service` on catalog entities to resolve App Interface namespace paths. If either label is missing, the plugin will fail to query Qontract and display no data. Verify catalog entities with `type: service` include both labels before expecting the "Deployments" tab to show cluster data.

2. **Workspace dependency resolution failures.** This is a Yarn 1 workspace monorepo — always run `yarn install` from the repository root, never from individual workspace packages (`packages/app`, `packages/backend`, `plugins/openshift`). Installing from a workspace package will bypass workspace resolution and create duplicate `node_modules` directories. If dependency resolution fails, delete all `node_modules` directories and `yarn.lock`, then run `yarn install --frozen-lockfile` from the root.

3. **Proxy configuration mismatch with environment variables.** The backend proxy endpoints (`/openshift-deployments`, `/stage`, `/prod`) require corresponding environment variables (`OPENSHIFT_DEPLOYMENTS_URL`, `STAGE_CLUSTER_API_URL`, `PROD_CLUSTER_API_URL`, `STAGE_CLUSTER_API_TOKEN`, `PROD_CLUSTER_API_TOKEN`). If environment variables are unset or point to incorrect URLs, all plugin API calls will fail with proxy errors. Verify `app-config.yaml` proxy configuration matches your environment before starting the backend.

4. **Backstage CLI commands fail without full workspace context.** Commands like `yarn lint`, `yarn test`, and `yarn build:all` use `backstage-cli repo` subcommands that operate on the entire workspace, not individual packages. Running `backstage-cli package lint` directly from a workspace package will fail if the package doesn't exist in the workspace manifest (`packages/*`, `plugins/*`). Always use the root-level scripts defined in the root `package.json` or ensure you're in the correct workspace package directory when using `backstage-cli package` commands.

5. **Hardcoded cluster map requires code changes for new environments.** The `clusterMap` in `plugins/openshift/src/components/OpenshiftComponent/OpenshiftComponent.tsx` maps cluster identifiers (`crcs02ue1`, `crcp01ue1`) to human-readable names and console URLs. Adding new OpenShift clusters (e.g., a development or DR environment) requires editing this map and redeploying the plugin. This is not configurable via `app-config.yaml` — verify the target cluster identifier from App Interface matches an entry in `clusterMap` before expecting the environment selector to show it.

6. **PatternFly components conflict with Material-UI theming.** The plugin uses both Material-UI v4 (Backstage standard) and PatternFly v5 (Red Hat visual identity). Mixing PatternFly layout components (e.g., `Card`, `Grid`, `Stack`) with Material-UI components can cause CSS specificity conflicts and broken styles. Use Material-UI for all layout and navigation components, and restrict PatternFly to status icons (`CheckCircleIcon`, `ExclamationTriangleIcon`, `TimesCircleIcon`) and tooltips (`Tooltip`) only. Never wrap Material-UI components in PatternFly layout containers.

[readme-dev]: ./README.md#development-setup
[architecture]: ./ARCHITECTURE.md
