# Running Tests

## Available Commands

The project provides several commands for running tests:

```bash
# Run all tests
yarn test

# Run tests with coverage
yarn test:cov

# Run tests in watch mode
yarn test:watch

# Run e2e tests
yarn test:e2e
```

## Test Modes

### Unit Tests

Unit tests are run using the `yarn test` command. These tests:

- Run in isolation
- Mock external dependencies
- Focus on individual components

### Coverage Tests

Coverage tests are run using `yarn test:cov`. This will:

- Run all tests
- Generate coverage reports
- Show coverage statistics

### Watch Mode

Watch mode (`yarn test:watch`) is useful during development as it:

- Watches for file changes
- Re-runs affected tests automatically
- Provides immediate feedback

### E2E Tests

End-to-end tests (`yarn test:e2e`) test the application as a whole:

- Start the application
- Run tests against the running instance
- Test complete user flows
