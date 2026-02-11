# Contributing to Newman Bot

Thank you for your interest in contributing to Newman Bot. This guide will help you understand our architecture, development workflow, and contribution standards.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Design Patterns](#design-patterns)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Git Workflow](#git-workflow)
- [Commit Standards](#commit-standards)
- [Issue Guidelines](#issue-guidelines)
- [Code Standards](#code-standards)
- [Testing](#testing)

---

## Architecture Overview

Newman Bot follows **Clean Architecture** principles, ensuring separation of concerns and maintainability.

<details>
<summary><b>Architecture Layers</b></summary>

```
┌─────────────────────────────────────────────────────────┐
│                     Presentation                         │
│              (Discord Commands & Handlers)               │
├─────────────────────────────────────────────────────────┤
│                     Application                          │
│            (Services, DTOs, Use Cases)                   │
├─────────────────────────────────────────────────────────┤
│                       Domain                             │
│        (Entities, Value Objects, Repositories)           │
├─────────────────────────────────────────────────────────┤
│                   Infrastructure                         │
│          (External APIs, Adapters, Config)               │
└─────────────────────────────────────────────────────────┘
```

**Layer Responsibilities:**

- **Presentation**: Discord.js integration, command handling, user interaction
- **Application**: Business logic coordination, service orchestration
- **Domain**: Core business entities, interfaces, validation rules
- **Infrastructure**: External integrations (Groq API, Brave Search, DuckDuckGo)

</details>

<details>
<summary><b>Key Principles</b></summary>

1. **Dependency Inversion**: High-level modules do not depend on low-level modules. Both depend on abstractions.
2. **Single Responsibility**: Each class has one reason to change.
3. **Interface Segregation**: Specific interfaces over general-purpose ones.
4. **Separation of Concerns**: Business logic separated from infrastructure.

</details>

---

## Design Patterns

<details>
<summary><b>Repository Pattern</b></summary>

Abstracts data access logic from business logic.

**Example:**
```typescript
// Domain layer - Abstract repository
export abstract class SearchRepository {
  abstract search(query: SearchQuery): Promise<SearchResultEntity[]>;
}

// Infrastructure layer - Concrete implementation
@Injectable()
export class SearchService implements SearchRepository {
  async search(query: SearchQuery): Promise<SearchResultEntity[]> {
    // Implementation
  }
}
```

**Location:** `src/core/domain/repositories/`

</details>

<details>
<summary><b>Adapter Pattern</b></summary>

Adapts external APIs to our domain interfaces.

**Adapters in the project:**
- `LLMAdapter` - Groq API integration
- `BraveAdapter` - Brave Search API
- `DuckDuckGoAdapter` - DuckDuckGo scraping

**Location:** `src/infrastructure/*/adapters/`

</details>

<details>
<summary><b>Use Case Pattern</b></summary>

Encapsulates specific business operations.

**Use cases:**
- `ChatWithAiUseCase` - AI conversation handling
- `ChatWithWebSearchUseCase` - AI with web search integration
- `SearchWithFactCheckUseCase` - Web search with analysis
- `VerifyClaimUseCase` - Fact-checking claims

**Location:** `src/core/use-cases/`

</details>

<details>
<summary><b>Value Object Pattern</b></summary>

Immutable objects representing domain concepts.

**Example:**
```typescript
export class SearchQuery {
  private constructor(private readonly value: string) {
    this.validate();
  }

  static create(query: string): SearchQuery {
    return new SearchQuery(query.trim());
  }
}
```

**Location:** `src/core/domain/value-objects/`

</details>

<details>
<summary><b>Dependency Injection</b></summary>

Implemented via NestJS's DI container.

**Example:**
```typescript
@Injectable()
export class ChatCommand implements ICommand {
  constructor(
    private readonly chatUseCase: ChatWithAiUseCase,
    private readonly chatWithWebSearchUseCase: ChatWithWebSearchUseCase,
  ) {}
}
```

Dependencies are automatically resolved by NestJS.

</details>

<details>
<summary><b>Decorator Pattern</b></summary>

Used for command metadata.

**Example:**
```typescript
@Injectable()
@DiscordCommand({
  name: 'chat',
  description: 'Conversa com a IA',
  aliases: ['conversar', 'c'],
  cooldown: 3,
})
export class ChatCommand implements ICommand {
  // Implementation
}
```

**Location:** `src/infrastructure/discord/decorators/`

</details>

---

## Project Structure

<details>
<summary><b>Complete Directory Tree</b></summary>

```
newman-bot/
├── src/
│   ├── application/              # Application services and DTOs
│   │   ├── dto/                  # Data Transfer Objects
│   │   │   ├── chat.dto.ts
│   │   │   ├── search.dto.ts
│   │   │   └── verify.dto.ts
│   │   └── services/             # Application-level services
│   │       ├── embed-builder.service.ts
│   │       └── fact-check.service.ts
│   │
│   ├── core/                     # Core business logic
│   │   ├── domain/               # Domain layer
│   │   │   ├── entities/         # Domain entities
│   │   │   │   ├── fact-check.entity.ts
│   │   │   │   ├── message.entity.ts
│   │   │   │   └── search-result.entity.ts
│   │   │   ├── repositories/     # Repository interfaces
│   │   │   │   ├── ai.repository.ts
│   │   │   │   └── search.repository.ts
│   │   │   └── value-objects/    # Value Objects
│   │   │       └── search-query.vo.ts
│   │   └── use-cases/            # Business use cases
│   │       ├── chat-with-ai.usecase.ts
│   │       ├── chat-with-search.usecase.ts
│   │       ├── search-with-fact-check.usecase.ts
│   │       └── verify-claim.usecase.ts
│   │
│   ├── infrastructure/           # External integrations
│   │   ├── ai/                   # AI integration
│   │   │   ├── adapters/
│   │   │   │   └── llm.adapter.ts
│   │   │   ├── ai.module.ts
│   │   │   └── ai.service.ts
│   │   ├── config/               # Configuration
│   │   │   ├── config.module.ts
│   │   │   └── env.validation.ts
│   │   ├── discord/              # Discord bot
│   │   │   ├── commands/         # Bot commands
│   │   │   │   ├── analyze.command.ts
│   │   │   │   ├── chat.command.ts
│   │   │   │   ├── help.command.ts
│   │   │   │   ├── search.command.ts
│   │   │   │   └── verify.command.ts
│   │   │   ├── decorators/       # Command decorators
│   │   │   │   └── discord-command.decorator.ts
│   │   │   ├── services/         # Discord services
│   │   │   │   └── conversation-memory.service.ts
│   │   │   ├── discord.module.ts
│   │   │   └── discord.service.ts
│   │   └── search/               # Search engines
│   │       ├── adapters/
│   │       │   ├── brave.adapter.ts
│   │       │   └── duckduckgo.adapter.ts
│   │       ├── search.module.ts
│   │       └── search.service.ts
│   │
│   ├── shared/                   # Shared utilities
│   │   ├── constants/            # Constants
│   │   │   └── prompts.constant.ts
│   │   ├── interfaces/           # Shared interfaces
│   │   │   └── command.interface.ts
│   │   └── utils/                # Utility functions
│   │       ├── discord.util.ts
│   │       ├── image-processor.util.ts
│   │       ├── link-formatter.util.ts
│   │       └── logger.util.ts
│   │
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts
│
├── test/                         # E2E tests
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── .env.example                  # Environment variables template
├── .eslintrc.js                  # ESLint configuration
├── .gitignore                    # Git ignore rules
├── .prettierrc                   # Prettier configuration
├── nest-cli.json                 # NestJS CLI config
├── package.json                  # Dependencies
├── README.md                     # Project documentation
├── tsconfig.json                 # TypeScript configuration
└── tsconfig.build.json           # Build configuration
```

</details>

<details>
<summary><b>Module Organization</b></summary>

Each module follows this structure:
```
module-name/
├── adapters/          # External integrations
├── services/          # Business services
├── module-name.module.ts
└── module-name.service.ts
```

**Key Modules:**
- **AiModule**: LLM integration and chat
- **SearchModule**: Web search engines
- **DiscordModule**: Bot commands and handlers

</details>

---

## Getting Started

<details>
<summary><b>Prerequisites</b></summary>

**Required:**
- Node.js 18 or higher
- pnpm 9.15 or higher
- Discord Bot Token
- Groq API Key

**Optional:**
- Brave Search API Key (for enhanced search)

**Verify installations:**
```bash
node --version  # Should be v18.0.0+
pnpm --version  # Should be 9.15.0+
```

**Install pnpm:**
```bash
npm install -g pnpm
```

</details>

<details>
<summary><b>Installation Steps</b></summary>

**1. Fork and Clone**
```bash
# Fork the repository on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/newman-bot.git
cd newman-bot
```

**2. Install Dependencies**
```bash
pnpm install
```

**3. Environment Setup**
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
DISCORD_TOKEN=your_discord_token_here
LLM_API_KEY=your_groq_api_key_here
BRAVE_API_KEY=your_brave_key_here  # Optional
BOT_PREFIX=!
NODE_ENV=development
```

**4. Run Development Server**
```bash
pnpm run start:dev
```

Bot should start and log: `Bot logado como Newman#1234`

</details>

<details>
<summary><b>Obtaining API Keys</b></summary>

**Discord Bot Token:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create New Application
3. Navigate to "Bot" section
4. Click "Reset Token" and copy it
5. Enable necessary intents: Server Members, Message Content

**Groq API Key:**
1. Visit [Groq Console](https://console.groq.com/)
2. Sign up/Login
3. Go to API Keys section
4. Create new API Key

**Brave Search API Key (Optional):**
1. Visit [Brave Search API](https://brave.com/search/api/)
2. Sign up for free tier
3. Get API key from dashboard

</details>

<details>
<summary><b>Running Commands</b></summary>

```bash
# Development with hot-reload
pnpm run start:dev

# Production build
pnpm run build
pnpm run start:prod

# Linting
pnpm run lint

# Format code
pnpm run format

# Run tests
pnpm run test

# E2E tests
pnpm run test:e2e
```

</details>

---

## Git Workflow

<details>
<summary><b>Branch Strategy</b></summary>

We follow a modified Git Flow:

![Git Flow Diagram](./docs/gitflow.png)

**Branch Types:**

- `main` - Production-ready code (PROTECTED)
- `homologation` - Staging/QA environment (PROTECTED)
- `develop` - Integration branch for features
- `feat/...` - Feature branches
- `fix/...` - Bug fix branches
- `refactor/...` - Code refactoring branches

**Workflow:**

1. Create issue on GitHub Projects
2. Create branch from `main`: `git checkout -b feat/your-feature`
3. Develop and commit following standards
4. After sprint completion: merge to `develop`
5. After testing: create Pull Request to `homologation`
6. After QA approval: merge to `main`

</details>

<details>
<summary><b>Working with Branches</b></summary>

**Creating a Feature Branch:**
```bash
# Always start from main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feat/add-new-command

# Or for fixes
git checkout -b fix/search-timeout
```

**Branch Naming Convention:**
```
feat/short-description      # New features
fix/bug-description         # Bug fixes
refactor/component-name     # Code refactoring
docs/what-changed           # Documentation
test/test-description       # Adding tests
```

**Merging Process:**
```bash
# After completing sprint - merge to develop
git checkout develop
git pull origin develop
git merge feat/your-feature
git push origin develop

# After testing - create PR to homologation via GitHub UI
# After QA - PR from homologation to main (requires approval)
```

</details>

<details>
<summary><b>Pull Request Guidelines</b></summary>

**Before Creating PR:**
- Code passes linting: `pnpm run lint`
- Code is formatted: `pnpm run format`
- Tests pass: `pnpm run test`
- Branch is up to date with target branch

**PR Template:**

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Documentation

## Related Issue
Closes #issue-number

## Testing
- [ ] Tested locally
- [ ] Added/updated tests
- [ ] All tests passing

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-reviewed code
- [ ] Commented complex areas
- [ ] Documentation updated
```

**Review Process:**
1. At least 1 approval required
2. All CI checks must pass
3. No merge conflicts
4. Branch protection rules enforced

</details>

---

## Commit Standards

<details>
<summary><b>Conventional Commits</b></summary>

We follow [Conventional Commits](https://www.conventionalcommits.org/) specification.

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI configuration changes
- `chore`: Other changes (dependencies, etc)

</details>

<details>
<summary><b>Commit Examples</b></summary>

**Good Commits:**
```bash
feat(chat): add image analysis support to chat command

Implemented multimodal chat capability using Llama 4 Scout vision model.
Users can now attach images with !chat command.

Closes #42

---

fix(search): handle DuckDuckGo rate limiting

Added exponential backoff and fallback to cached results when rate limited.

---

refactor(domain): extract fact-check logic to service

Moved fact-checking analysis from use case to dedicated service
for better separation of concerns.

---

docs(readme): update installation instructions

Added pnpm installation steps and API key setup guide.
```

**Bad Commits:**
```bash
# Too vague
update code

# Not following convention
Added new feature

# No description
fix bug

# Mixed concerns
feat: add chat images and fix search and update readme
```

</details>

<details>
<summary><b>Commit Best Practices</b></summary>

**Do:**
- Write commits in English
- Use imperative mood ("add" not "added")
- Keep subject line under 72 characters
- Reference issues in footer
- Explain "why" in body, not just "what"
- Make atomic commits (one logical change)

**Don't:**
- Commit broken code
- Mix multiple changes in one commit
- Use vague messages
- Commit commented-out code
- Commit sensitive data (.env files)

</details>

---

## Issue Guidelines

<details>
<summary><b>Creating Issues</b></summary>

Use GitHub Projects to create and track issues.

**Issue Template:**
```markdown
## Description
Clear description of the feature/bug

## Type
- [ ] Feature
- [ ] Bug
- [ ] Enhancement
- [ ] Documentation

## Difficulty
Select one:
- [ ] 1 - Easy (1-2 hours)
- [ ] 3 - Medium (half day)
- [ ] 5 - Hard (1-2 days)
- [ ] 8 - Very Hard (3-5 days)
- [ ] 13 - Complex (1+ week)

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Additional Context
Any extra information, screenshots, logs, etc.
```

</details>

<details>
<summary><b>Issue Labels</b></summary>

**Type Labels:**
- `feature` - New functionality
- `bug` - Something broken
- `enhancement` - Improvement to existing feature
- `documentation` - Documentation updates
- `refactor` - Code refactoring
- `test` - Testing related

**Priority Labels:**
- `priority: high` - Critical, needs immediate attention
- `priority: medium` - Important, schedule soon
- `priority: low` - Nice to have

**Status Labels:**
- `status: open` - Available to work on
- `status: in-progress` - Currently being worked on
- `status: review` - Waiting for review
- `status: blocked` - Blocked by other issue/dependency

</details>

<details>
<summary><b>Working on Issues</b></summary>

**Process:**

1. **Choose Issue**: Pick from GitHub Projects board
2. **Assign Yourself**: Add your name to the issue
3. **Estimate Time**: If you need more time, comment on the issue
4. **Create Branch**: Follow naming convention
5. **Develop**: Follow code standards
6. **Update Issue**: Keep issue updated with progress
7. **Submit PR**: Link PR to issue

**No Pressure:**
- Take the time you need
- Ask questions in issue comments
- Request help if blocked
- Update estimates if needed
- Communication is key

</details>

<details>
<summary><b>Difficulty Points Guide</b></summary>

**1 Point (Easy):**
- Documentation updates
- Simple bug fixes
- Minor UI tweaks
- Adding constants

**3 Points (Medium):**
- New Discord command
- Adapter implementation
- Utility function
- Test writing

**5 Points (Hard):**
- New use case
- Complex feature
- Integration with new API
- Significant refactoring

**8 Points (Very Hard):**
- Architecture changes
- Multiple modules affected
- Complex algorithms
- Performance optimization

**13 Points (Complex):**
- Major feature overhaul
- System redesign
- Multiple integrations
- Requires extensive testing

</details>

---

## Code Standards

<details>
<summary><b>TypeScript Guidelines</b></summary>

**General Rules:**
- Use TypeScript strict mode
- Avoid `any` type (use `unknown` if needed)
- Define interfaces for all public APIs
- Use type inference where obvious
- Document complex types

**Example:**
```typescript
// Good
interface ChatOptions {
  includeImages?: boolean;
  maxTokens?: number;
}

async function chat(message: string, options: ChatOptions): Promise<string> {
  // Implementation
}

// Bad
async function chat(message: any, options: any): Promise<any> {
  // Implementation
}
```

</details>

<details>
<summary><b>NestJS Conventions</b></summary>

**Decorators:**
```typescript
// Controllers
@Controller('api')
export class ApiController {}

// Services
@Injectable()
export class MyService {}

// Modules
@Module({
  imports: [],
  providers: [],
  exports: [],
})
export class MyModule {}
```

**Dependency Injection:**
```typescript
// Always use constructor injection
@Injectable()
export class MyService {
  constructor(
    private readonly dependency: DependencyService,
  ) {}
}
```

</details>

<details>
<summary><b>Clean Architecture Rules</b></summary>

**Dependency Direction:**
```
Infrastructure → Application → Domain
         ↓           ↓            ↓
    Depends on  Depends on  Depends on
    Application    Domain      Nothing
```

**Layer Rules:**

1. **Domain Layer:**
   - No external dependencies
   - Pure TypeScript
   - Contains entities, value objects, repository interfaces
   - Example: `SearchQuery`, `MessageEntity`

2. **Application Layer:**
   - Depends only on Domain
   - Use cases and services
   - Business logic orchestration
   - Example: `ChatWithAiUseCase`

3. **Infrastructure Layer:**
   - Implements domain interfaces
   - External API integrations
   - Framework-specific code
   - Example: `LLMAdapter`, `SearchService`

</details>

<details>
<summary><b>File Naming Conventions</b></summary>

```
component-name.type.ts
```

**Types:**
- `.entity.ts` - Domain entities
- `.vo.ts` - Value objects
- `.repository.ts` - Repository interfaces
- `.usecase.ts` - Use cases
- `.service.ts` - Services
- `.adapter.ts` - Adapters
- `.module.ts` - NestJS modules
- `.command.ts` - Discord commands
- `.util.ts` - Utility functions
- `.spec.ts` - Test files

**Examples:**
```
search-query.vo.ts
chat-with-ai.usecase.ts
llm.adapter.ts
fact-check.service.ts
```

</details>

<details>
<summary><b>Code Style</b></summary>

**Formatting:**
- Use Prettier for formatting
- 2 spaces indentation
- Single quotes
- Trailing commas
- 80 character line length (soft limit)

**Run formatter:**
```bash
pnpm run format
```

**Linting:**
```bash
pnpm run lint
```

**Key Rules:**
- No unused variables
- Explicit return types for functions
- Consistent naming (camelCase for variables, PascalCase for classes)
- Meaningful variable names
- Keep functions small (under 50 lines)
- One responsibility per function

</details>

<details>
<summary><b>Documentation Standards</b></summary>

**JSDoc Comments:**
```typescript
/**
 * Searches for information using multiple search engines.
 * Falls back to DuckDuckGo if Brave API is unavailable.
 * 
 * @param query - Search query to execute
 * @returns Array of search results from available engines
 * @throws {Error} If all search engines fail
 */
async search(query: SearchQuery): Promise<SearchResultEntity[]> {
  // Implementation
}
```

**Inline Comments:**
```typescript
// Only for complex logic
// Explain "why", not "what"

// Good
// Retry with exponential backoff to handle rate limiting
await retryWithBackoff(fetchData);

// Bad
// Call retry function
await retryWithBackoff(fetchData);
```

</details>

---

## Testing

<details>
<summary><b>Testing Strategy</b></summary>

**Test Pyramid:**
```
      /\
     /E2E\       (Few)
    /------\
   /  Int   \    (Some)
  /----------\
 /   Unit     \  (Many)
/--------------\
```

**Coverage Goals:**
- Unit tests: 80%+ coverage
- Integration tests: Critical paths
- E2E tests: Main user flows

</details>

<details>
<summary><b>Writing Tests</b></summary>

**Unit Test Example:**
```typescript
describe('SearchQuery', () => {
  describe('create', () => {
    it('should create valid query', () => {
      const query = SearchQuery.create('test query');
      expect(query.getValue()).toBe('test query');
    });

    it('should trim whitespace', () => {
      const query = SearchQuery.create('  test  ');
      expect(query.getValue()).toBe('test');
    });

    it('should throw on empty query', () => {
      expect(() => SearchQuery.create('')).toThrow();
    });
  });
});
```

**Test Structure:**
- Arrange: Set up test data
- Act: Execute the code
- Assert: Verify results

**Naming:**
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do X when Y', () => {
      // Test
    });
  });
});
```

</details>

<details>
<summary><b>Running Tests</b></summary>

```bash
# All tests
pnpm run test

# Watch mode
pnpm run test:watch

# Coverage
pnpm run test:cov

# E2E tests
pnpm run test:e2e

# Specific file
pnpm run test search.service.spec.ts
```

</details>

---

## Additional Resources

<details>
<summary><b>Helpful Links</b></summary>

**Project:**
- [Issues](https://github.com/newman-agent/newman-bot/issues)
- [GitHub Projects](https://github.com/newman-agent/newman-bot/projects)
- [Documentation](https://github.com/newman-agent/newman-bot/wiki)

**Technologies:**
- [NestJS Documentation](https://docs.nestjs.com/)
- [Discord.js Guide](https://discordjs.guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

**Standards:**
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/)

</details>

<details>
<summary><b>Getting Help</b></summary>

**Stuck?**
- Check existing issues
- Read documentation
- Ask in issue comments
- Contact maintainer: [@lucashenry](https://github.com/lucashenry)

**Found a Bug?**
- Check if already reported
- Create detailed issue
- Include reproduction steps
- Add relevant logs/screenshots

</details>

---

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

---

**Thank you for contributing to Newman Bot!**

Made with dedication by [Lucas Henry](https://github.com/lucashenry)
