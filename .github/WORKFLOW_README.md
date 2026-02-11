# GitHub Actions Workflows

This repository contains several GitHub Actions workflows to ensure code quality and test coverage for the OpenShift Backstage plugin.

## Workflows

### 1. Test OpenShift Plugin (`test.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Changes to OpenShift plugin files

**Features:**
- Tests on Node.js 22.x
- Runs Jest tests with coverage
- Uploads coverage to Codecov
- Linting and TypeScript type checking
- Build verification
- Artifact archiving

### 2. OpenShift Plugin CI (`openshift-plugin-ci.yml`)

**Triggers:**
- Push/PR with changes to `plugins/openshift/**`

**Features:**
- Fast CI feedback for plugin-specific changes
- Coverage threshold checking (70% minimum)
- PR comments with test results
- Build verification

### 3. Status Checks (`status-checks.yml`)

**Triggers:**
- Push to `main`
- Pull requests to `main`

**Features:**
- Generates status badges
- Security vulnerability scanning
- Coverage percentage extraction
- Test status reporting

## Test Commands

### Running Tests Locally

```bash
# Navigate to the plugin directory
cd plugins/openshift

# Run tests
yarn test

# Run tests with coverage
yarn test --coverage

# Run tests in CI mode (no watch)
yarn test --watchAll=false --passWithNoTests
```

### Available Test Scripts

- `yarn test` - Run tests in watch mode
- `yarn test --coverage` - Run tests with coverage report
- `yarn lint` - Run ESLint checks
- `yarn build` - Build the plugin

## Coverage Requirements

The workflows are configured with the following coverage thresholds:
- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

## Artifacts

Each workflow generates artifacts that are stored for debugging and review:

- **Test Results:** Coverage reports and test outputs
- **Build Artifacts:** Built plugin distributions
- **Status Badges:** Test and coverage status badges

## Badge Integration

You can add these badges to your README:

```markdown
![Tests](https://github.com/your-username/backstage-plugin-openshift/workflows/Test%20OpenShift%20Plugin/badge.svg)
![OpenShift Plugin CI](https://github.com/your-username/backstage-plugin-openshift/workflows/OpenShift%20Plugin%20CI/badge.svg)
```

## Security

The workflows include security scanning:
- Dependency vulnerability checks
- Audit of high-severity issues
- Dependency review for pull requests

## Troubleshooting

### Common Issues

1. **Tests fail on dependencies:** Ensure all dependencies are properly mocked in test files
2. **Coverage below threshold:** Add more comprehensive tests for uncovered code paths
3. **Build failures:** Check TypeScript compilation errors and fix type issues

### Debugging

- Check the Actions tab in GitHub for detailed logs
- Download artifacts to view coverage reports locally
- Use `yarn test --verbose` for detailed test output

## Contributing

When adding new tests:
1. Ensure they follow the existing naming pattern (`*.test.ts` or `*.test.tsx`)
2. Mock external dependencies appropriately
3. Aim for meaningful test coverage, not just high percentages
4. Update this documentation if adding new workflows 