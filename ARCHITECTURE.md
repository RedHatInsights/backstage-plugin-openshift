# Architecture

## System Overview

This project is a Backstage application with a custom OpenShift plugin that surfaces Kubernetes deployment information directly within the Backstage service catalog. The system follows a three-tier architecture:

1. **Frontend application** (`packages/app`) -- a standard Backstage React SPA that assembles core Backstage plugins and the custom OpenShift plugin into a unified developer portal.
2. **Backend application** (`packages/backend`) -- a Backstage backend instance using the new backend system (`@backstage/backend-defaults`). It hosts the proxy, catalog, auth, and other core backend plugins. It does not contain custom backend plugin code; instead, the OpenShift plugin communicates with external APIs through the built-in proxy backend.
3. **OpenShift plugin** (`plugins/openshift`) -- a frontend-only Backstage plugin (`role: frontend-plugin`) that queries OpenShift/Kubernetes cluster APIs and App Interface (Qontract) to display deployment status, resource usage, and pod health for catalog entities.

```
                                          ┌──────────────────────┐
                                          │   App Interface      │
                                          │  (Qontract GraphQL)  │
                                          └──────────┬───────────┘
                                                     │
┌──────────────────┐    ┌──────────────────┐    ┌────┴────────────┐    ┌──────────────────┐
│                  │    │                  │    │                 │    │   OpenShift       │
│   Browser /      │───▶│   Backstage      │───▶│  Proxy Backend  │───▶│   Cluster APIs    │
│   React SPA      │    │   Backend (:7007)│    │  (/api/proxy/*) │    │  (stage / prod)   │
│                  │    │                  │    │                 │    │                   │
└──────────────────┘    └──────────────────┘    └─────────────────┘    └──────────────────┘
       │                        │
       │ includes               │ hosts
       ▼                        ▼
 ┌──────────────┐     ┌──────────────────────┐
 │  OpenShift   │     │  Catalog, Auth,      │
 │  Plugin UI   │     │  Scaffolder, Search, │
 │  Components  │     │  TechDocs, K8s, ...  │
 └──────────────┘     └──────────────────────┘
```

## Monorepo Structure

The project uses Yarn 1 workspaces with three workspace packages:

| Package | Path | Backstage Role | Purpose |
|---|---|---|---|
| `app` | `packages/app` | `frontend` | Backstage frontend shell. Assembles routes, entity pages, and plugin registrations. |
| `backend` | `packages/backend` | `backend` | Backstage backend instance. Registers backend plugins declaratively via the new backend system. |
| `@redhatinsights/backstage-plugin-openshift` | `plugins/openshift` | `frontend-plugin` | Custom OpenShift deployments plugin. Provides a component extension for the entity page. |

The root `package.json` defines workspace resolution for `packages/*` and `plugins/*`, pins React 18 types via `resolutions`, and provides repo-level scripts through `backstage-cli repo`.

The `app` package depends on the OpenShift plugin as `@redhatinsights/backstage-plugin-openshift` (workspace link). The `backend` package depends on `app` via `"app": "link:../app"` to serve the frontend bundle in production.

## Plugin Architecture

### Registration

The OpenShift plugin follows standard Backstage plugin conventions:

- **`plugin.ts`** creates the plugin instance with `createPlugin({ id: 'openshift-deployments' })` and provides a single component extension `EntityOpenshiftInfoContent` via `createComponentExtension` with lazy loading.
- **`index.ts`** re-exports the plugin and the extension as the public API surface.

### Integration with the Entity Page

In `packages/app/src/components/catalog/EntityPage.tsx`, the plugin is wired into the `serviceEntityPage` layout as a dedicated tab:

```tsx
<EntityLayout.Route path="/openshift-deployments" title="Deployments">
  <EntityOpenshiftInfoContent />
</EntityLayout.Route>
```

This means the "Deployments" tab appears only on entities rendered through the service entity page (components with `type: service`). Website-type components and other entity kinds do not show this tab.

### Entity Label Convention

The plugin derives its App Interface query path from the catalog entity's metadata labels:

- `metadata.labels.platform` -- the platform segment
- `metadata.labels.service` -- the service segment

These are combined into the path `/services/{platform}/{service}/app.yml`, which is sent as a GraphQL variable to the Qontract API. Catalog entities must carry both labels for the plugin to resolve their namespace configuration.

### Dynamic Plugin Support

The plugin includes `@janus-idp/cli` as a dev dependency and exposes an `export-dynamic` script. The root-level `build` shell script runs the Janus CLI export, creates an npm tarball from `dist-dynamic/`, and computes a SHA-256 checksum. This enables deployment as a dynamic plugin in Red Hat Developer Hub (RHDH) without rebuilding the entire Backstage application.

## Component Hierarchy

```
EntityOpenshiftInfoContent (lazy-loaded extension)
  └─▶ OpenshiftComponent
        ├── Queries App Interface (Qontract) via QueryQontract hook
        ├── Resolves namespace per cluster from Qontract response
        ├── Provides cluster selector (Stage / Prod dropdown)
        └── Renders DeploymentsListComponent
              ├── Queries OpenShift cluster API via QueryOpenshift hook
              ├── Correlates deployments with pod metrics
              ├── Computes resource usage (CPU in nanocores, memory in MiB)
              └── Renders per-deployment rows with:
                    ├── Status icon (healthy / degraded / down)
                    ├── Links to OpenShift console
                    ├── ResourceUsageProgress (CPU + memory bars)
                    └── Pagination controls
```

## Data Flow

### Phase 1: Namespace Discovery (App Interface / Qontract)

1. `OpenshiftComponent` mounts and invokes the `QueryQontract` hook with a GraphQL query (`NSQuery`).
2. The hook reads the current catalog entity via `useEntity()` to extract `platform` and `service` labels.
3. It constructs the proxy URL as `{backend.baseUrl}/api/proxy/openshift-deployments/graphql`.
4. The GraphQL query resolves `apps_v1` by path, returning an array of namespace objects, each containing `name`, `path`, `cluster.name`, and `cluster.jumpHost`.
5. The component filters the namespace list by cluster identifier (matching against a hardcoded `clusterMap`) to determine the namespace name for the selected environment.

### Phase 2: Cluster Data Retrieval (OpenShift API)

1. `DeploymentsListComponent` mounts and invokes the `QueryOpenshift` hook with the resolved `environmentName` and `namespace`.
2. The hook makes two parallel requests through the Backstage proxy:
   - **Deployments:** `GET /api/proxy/{env}/apis/apps/v1/namespaces/{ns}/deployments`
   - **Pod metrics:** `GET /api/proxy/{env}/apis/metrics.k8s.io/v1beta1/namespaces/{ns}/pods`
3. Both requests use Backstage's `fetchApi` for consistent authentication handling.
4. The proxy endpoints (`/stage` and `/prod`) are configured in `app-config.yaml` with bearer token authentication headers injected from environment variables.

### Phase 3: Data Correlation and Display

1. Deployment data and pod metrics are correlated by matching pod names against deployment name patterns (regex: `^{deploymentName}-[a-z0-9]{8,10}-[a-z0-9]{5}$`).
2. For each deployment, the component aggregates:
   - Container resource requests (CPU, memory) multiplied by replica count
   - Actual resource usage across all matching pods
   - Deployment health status (ready replicas vs. desired replicas)
3. Resource values are normalized: CPU from millicores to cores, memory from Ki/Mi/Gi/bytes to MiB.
4. The `ResourceUsageProgress` component renders a color-coded progress bar (green < 60%, yellow 60-90%, red > 90%) with a tooltip showing exact requested vs. used values.

## Proxy Configuration

The backend proxy is the sole communication channel between the frontend plugin and external services. Three proxy endpoints are configured:

| Endpoint | Target | Authentication |
|---|---|---|
| `/openshift-deployments` | App Interface / Qontract GraphQL API | Unauthenticated (`dangerously-allow-unauthenticated`) |
| `/stage` | Stage OpenShift cluster API | Bearer token via `STAGE_CLUSTER_API_TOKEN` |
| `/prod` | Production OpenShift cluster API | Bearer token via `PROD_CLUSTER_API_TOKEN` |

The plugin itself carries no credentials. All authentication is handled at the proxy layer through environment variable injection.

## Key Design Decisions

### Frontend-only plugin with proxy-based API access

The plugin has no backend component. All external API calls route through Backstage's built-in proxy backend. This simplifies the plugin to a single workspace package, avoids the complexity of backend plugin registration, and centralizes credential management in `app-config.yaml`. The tradeoff is that all data transformation (resource unit parsing, deployment-pod correlation) happens client-side.

### Dual UI framework usage (Material-UI v4 + PatternFly v5)

The plugin uses Material-UI v4 for layout, tables, and form controls (consistent with Backstage's own UI layer) and PatternFly v5 selectively for tooltips and status icons. PatternFly icons (`CheckCircle`, `ExclamationTriangleIcon`, `TimesCircle`) provide the Red Hat / OpenShift visual language for deployment health indicators. This avoids a full PatternFly migration while maintaining brand consistency where it matters most.

### GraphQL for App Interface, REST for Kubernetes

App Interface (Qontract) is queried via GraphQL because it exposes a GraphQL endpoint natively, and the query needs only a narrow slice of namespace data. Kubernetes cluster APIs are queried via REST because the Kubernetes API is inherently RESTful. The `graphql-request` library is used directly rather than a heavier client like Apollo, keeping bundle size small for a single query.

### Hardcoded cluster map

The `clusterMap` in `OpenshiftComponent` maps cluster identifiers (`crcs02ue1`, `crcp01ue1`) to human-readable names and OpenShift console URLs. This is a deliberate simplification for a known, fixed set of target clusters. The tradeoff is that adding or changing clusters requires a code change rather than a configuration update.

### Client-side resource computation

CPU and memory usage calculations (nanocores-to-cores conversion, Kubernetes unit parsing for Ki/Mi/Gi suffixes, percentage computation) all run in the browser. This avoids needing a backend processing layer but means the plugin must handle edge cases like missing resource requests, zero values, and mixed unit formats in JavaScript.

## Backend Plugin Composition

The backend uses the new Backstage backend system (`createBackend()`) with declarative plugin registration. The registered plugins are:

- **app-backend** -- serves the frontend bundle
- **proxy-backend** -- critical for the OpenShift plugin's external API calls
- **auth-backend** + **guest-provider** -- authentication (guest mode for development)
- **catalog-backend** -- service catalog with scaffolder entity model integration
- **kubernetes-backend** -- Backstage's native Kubernetes plugin (separate from the custom OpenShift plugin)
- **permission-backend** -- permission framework with allow-all policy
- **scaffolder-backend** -- software templates with GitHub module
- **search-backend** -- search with PostgreSQL engine and catalog/techdocs collators
- **techdocs-backend** -- technical documentation
- **notifications-backend** + **signals-backend** -- real-time notification system

## Database Strategy

- **Development:** In-memory SQLite via `better-sqlite3` (configured in `app-config.yaml`).
- **Production:** PostgreSQL via `pg` (configured in `app-config.production.yaml` with environment variables for host, port, user, and password).

Both drivers are listed as backend dependencies, allowing the same build artifact to serve either environment based on configuration.

## Deployment

The backend includes a Dockerfile based on `node:24-trixie-slim`. The build follows Backstage's recommended skeleton-first approach:

1. Copy workspace skeleton (`package.json` files) and install production dependencies.
2. Copy the pre-built backend bundle (`bundle.tar.gz`).
3. Run with both `app-config.yaml` and `app-config.production.yaml` layered.

The container runs as the unprivileged `node` user and sets `NODE_ENV=production`.

## Tradeoffs

| Decision | Benefit | Cost |
|---|---|---|
| Frontend-only plugin (no backend component) | Simpler package structure; no backend plugin API to maintain | All data processing is client-side; cannot cache or aggregate across users |
| Proxy-based external API access | Centralized credential management; no secrets in plugin code | Adds a network hop; proxy must be configured for each cluster |
| Hardcoded cluster map | No configuration overhead for known environments | Adding clusters requires code changes and redeployment |
| Mixed Material-UI v4 + PatternFly v5 | Backstage layout consistency + Red Hat visual identity for status indicators | Two UI frameworks in the bundle; potential style conflicts |
| `graphql-request` over Apollo Client | Minimal bundle size; sufficient for single-query use case | No client-side caching, no subscription support, no normalized store |
| `dangerously-allow-unauthenticated` on Qontract proxy | Simplifies local development and environments without auth | Qontract data accessible without Backstage user authentication |
| Client-side Kubernetes unit parsing | No backend dependency for unit conversion | Duplicates logic that exists in `@kubernetes/client-node`; parsing edge cases handled in component code |
