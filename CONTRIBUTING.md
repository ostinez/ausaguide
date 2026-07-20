# Contributing Guidelines

Thank you for contributing to Ausaguide! To keep code quality high and project history clean, please follow these guidelines when submitting pull requests.

---

## 1. Branching Strategy

- **`main`**: Represents the current stable production environment. Direct commits to `main` are restricted.
- **Feature Branches**: Branch out from `main` using descriptive naming:
  - For new features: `feature/your-feature-name`
  - For bug fixes: `bugfix/issue-description`
  - For operational documentation: `docs/documentation-topic`

---

## 2. Commit Message Convention

Ausaguide follows the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- **Format**: `<type>(<scope>): <short summary>`
- **Types**:
  - `feat`: A new user-facing feature.
  - `fix`: A code bug fix.
  - `docs`: Documentation updates only.
  - `style`: Changes that do not affect code logic (formatting, spacing).
  - `refactor`: Restructuring code without changing behavior.
  - `test`: Adding or correcting tests.
- **Example**:
  ```bash
  feat(gdpr): implement export-user-data edge function and update settings UI
  ```

---

## 3. Coding Style & Standards

- **TypeScript**: Always write clean, explicitly-typed code. Avoid using `any` unless absolutely necessary (e.g. mock integrations).
- **JSDoc Standard**: Add JSDoc comments to all exportable functions, Edge Functions, and core UI components.
- **CSS / Styling**: Rely on Tailwind classes. Maintain responsive structures using standard grid/flex components.

---

## 4. Pull Request & Verification Workflow

Before submitting a pull request for review, perform the following verification pipeline locally:

1. **Verify Compilation**:
   ```bash
   npm run build
   ```
2. **Execute Unit Tests**:
   ```bash
   npm run test
   ```
3. **Verify Linting**: Check that there are no unused variables or syntax compiler warnings in your workspace.
