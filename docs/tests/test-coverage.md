# Test Coverage

## Coverage Goals

The project maintains high test coverage, with a focus on:

- Unit test coverage for all services and controllers
- Integration tests for critical workflows
- End-to-end tests for key user journeys

## Coverage Requirements

- Minimum 90% coverage for all critical paths
- 100% coverage for authentication flows
- 100% coverage for security-related code
- 100% coverage for data validation

## Coverage Reports

Coverage reports are generated automatically when running tests with the coverage flag:

```bash
yarn test:cov
```

The coverage report will show:

- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

## Continuous Integration

Coverage reports are automatically generated in the CI pipeline and must meet the minimum requirements for the build to pass.
