This document outlines a phased, Agile sprint plan to develop CodeContextPro-MES, ensuring that our stringent security specifications are integrated into every stage of the build, rather than being an afterthought.
CodeContextPro-MES (Memory + Execution Sandbox) Detailed Build Specification
Document Version: 1.0
Date: July 19, 2025
Prepared By: [Your Name/Team Lead], Senior Google Cloud, Firebase, Firestore, Client-Side CLI Tools Security Expert & Backend/Frontend Next.js Specialist (Anthropic AI Team Lead)
1. Executive Summary
This document details the phased development plan for CodeContextPro-MES, a revolutionary AI cognitive upgrade that provides persistent memory and a secure execution sandbox for AI coding assistants. Leveraging the strengths of Firebase, Google Cloud, Next.js, and a globally installable CLI, CodeContextPro-MES aims to eradicate "AI amnesia" and empower developers with unprecedented productivity, while prioritizing top-tier security from its inception. This plan is structured in Agile sprints, embedding a security-first philosophy into every deliverable.
2. Product Vision & Value Proposition
Problem: Current AI coding assistants suffer from "AI amnesia," forgetting project context, architectural decisions, and learning outcomes between conversations. This leads to constant re-explanation, wasted time, and reduced productivity. Additionally, they lack secure, real-time code execution capabilities for validation.
Solution: CodeContextPro-MES offers:
Infinite Persistent Memory: Remembers project architecture, patterns, decisions, and conversation history across all sessions and projects, eliminating the need for repeated context setting.
Secure Execution Sandbox: Provides a safe, isolated environment to execute and verify AI-generated code snippets in real-time, building confidence and accelerating development cycles.
Seamless Integration: Works with existing AI assistants (via prompt augmentation) and integrates deeply with development environments like VS Code.
Privacy-First: Local-first memory storage with strong encryption for sensitive data.
Target Market: Individual developers, startup teams, and enterprises seeking to maximize AI assistant utility, improve code quality, and accelerate onboarding.
3. Core Principles: Security-First Agile Development
Our development methodology is founded on these non-negotiable principles:
Security by Design: Every feature and architectural choice prioritizes security from conception. Security is not an add-on.
Least Privilege: All users, services, and components operate with the absolute minimum necessary permissions.
Defense in Depth: Multiple layers of security controls protect against threats.
Agile Iteration: We build in short, focused sprints, continuously integrating feedback and adapting to emerging requirements and security best practices.
Transparency & Auditability: Security-relevant actions are logged, monitored, and auditable.
Trust & User Control: Empowering users with control over their data and transparency in its handling.
4. Security Foundations (MUST_HAVE Integration)
The following security specifications, previously detailed, are MUST_HAVE features integrated into every phase and sprint. They serve as a checklist and guiding ethos for all AI-generated or AI-assisted code.
4.1. Access Control & Permissions (Firebase / Google Cloud)
Default to Deny: Firestore rules allow read, write: if false; by default.
Server-Side Only: Critical collections (e.g., public/stats, payments, admin data) allow write: if false; for clients.
Authenticated Access: User data restricted via request.auth.uid or request.auth.token.email.
No Public Admin Endpoints: Administrative Cloud Functions are strictly protected or removed.
Webhook Signature Verification: Webhooks (Stripe) are meticulously verified.
Least Privileged IAM: Cloud Functions run with minimal IAM roles.
4.2. Sensitive Data Handling & Encryption
Zero Hardcoding of Secrets: All API keys, encryption keys, and sensitive values are stored in secure environment variables (Firebase Functions: Secret Manager/Config; Client-side: build-time injection, secure local storage).
Unique User Encryption Keys: Cloud-synced user data and code payloads are encrypted with unique, server-generated, user-specific keys, not a shared or hardcoded key.
Secure Client-Side Local Storage: Locally stored sensitive data (e.g., license file, local AI model keys) is encrypted using machine-specific derived keys (not hardcoded), and integrity-checked.
HTTPS/TLS Everywhere: All communications use secure protocols.
4.3. Secure Execution Environments (Cloud Code Sandbox)
Robust Isolation: Code execution occurs in isolated, ephemeral containers with strict CPU, memory, and network limits.
Filesystem & Network Restriction: Read-only filesystem, minimal/no external network access for executed code.
Privilege Dropping: Code runs as a non-privileged user.
Language-Specific Protections: Mitigation for dangerous functions (e.g., eval).
4.4. Input Validation & Output Encoding
Comprehensive Server-Side Validation: All API inputs are rigorously validated, sanitized, and type-checked on the backend.
Parameterized Queries: SQLite interactions use parameterized queries to prevent SQL injection.
Command Injection Mitigation: User inputs in CLI commands are properly escaped.
Output Encoding: Data rendered to HTML or CLI is encoded/escaped to prevent XSS.
4.5. Configuration Management
Externalized Config: All variable parameters are externalized (Firebase Functions config, Firestore, .env).
Clear Separation of Secrets: Sensitive vs. non-sensitive config.
4.6. Logging & Monitoring
Audit Logging: Critical security events are logged (authentication, license activity, executions).
Generic Error Messages: Detailed errors are logged server-side, but generic messages returned to clients.
Monitoring & Alerting: Set up for anomalies (failed logins, unusual resource usage, etc.).
4.7. Secure Defaults & Fail-Safes
Fail-Closed: Default to denying access on permission check failures.
Robust Retries: Implement for external API calls.
Rate Limiting: Protect API endpoints from abuse.
4.8. Local AI Model Integration (Future Phase)
Model Integrity: Verify local AI model authenticity (checksums, digital signatures).
Local Runtime Isolation: Sandbox local AI inference processes.
Controlled Memory Access: Local AI interacts with CodeContext MemoryEngine via API, not direct DB access.
Prompt/Output Sanitization: Local AI instructed to redact sensitive data from outputs.
Secure Update Mechanism: Cryptographically signed updates for local models.
5. Pricing Model & Tier Structure
Founders Special (Limited Time/Licenses):
Price: $59/month (locked forever for early adopters)
Limit: Maximum 10,000 licenses available.
Features: Unlimited Memory Storage, Unlimited Memory Recalls, Unlimited Execution Sandbox functions, Cloud Sync, Multi-Project Support, VS Code Integration, Priority Support.
Free Tier:
Price: Free
Limits: 20 Memory Recalls/month, 20 Memory Storage operations/month, 20 Execution Sandbox functions/month.
Features: Basic Persistent Memory (local-only), Single Project Support, Basic VS Code Integration.
6. Architecture Overview (High-Level)
Client-Side CLI (Node.js/TypeScript): The primary user interface. Handles local project scanning, memory interaction, and communication with the Firebase backend.
Firebase Backend (Cloud Functions, Firestore, Authentication):
Cloud Functions: Handles payment processing (Stripe webhooks), license validation/activation, usage tracking, secure user authentication (Firebase Auth), and hosts the secure execution sandbox.
Firestore: Stores licenses, usage analytics, public stats (early adopter count), and encrypted cloud-synced memory.
Firebase Authentication: Manages user identities and provides secure tokens for CLI-to-backend communication.
Frontend/Storefront (Next.js Application): A public-facing web application.
Marketing Content: Highlights the problem of "AI amnesia" and presents CodeContextPro-MES as the solution.
Pricing & Purchase Flow: Displays pricing tiers, early adopter countdown, and integrates with Stripe for checkout (securely via Firebase Functions).
Documentation: Comprehensive usage guides.
Secure Execution Sandbox (Cloud-based, Containerized): An isolated, ephemeral environment hosted on Google Cloud (e.g., Cloud Run, GKE Sandbox) for executing user-provided code snippets securely. This will be an extension of the validateExecution Firebase Function, but implemented with a strong focus on container security.
Local AI Integration (Future/Phase 5): Direct integration with locally running LLMs (e.g., Gemma, self-hosted Claude) via their local APIs, leveraging CodeContextPro-MES's memory layer.
7. Phased Build Plan (Agile Sprints)
Each sprint is 2 weeks. AI coding agents will work on assigned tasks under the guidance of the Team Lead.
Phase 0: Foundations & Core Security Setup
Goal: Establish the secure architectural baseline and essential tooling before feature development begins.
Duration: 2 Sprints
Sprint 0.1: Project Setup & Core Security Tooling
Sprint Goal: Secure repository, establish secure development environment, and configure core security infrastructure.
Key Features/Tasks:
Initialize Git repository.
Set up secure CI/CD pipeline (e.g., GitHub Actions, Cloud Build) with linting, static analysis, and basic security scanning (SAST).
Configure Firebase Project: Enable Firestore, Functions, Auth, Hosting.
Implement firebase-setup/build.js for secure environment variable injection into public/index.html.
Set up .env.example and ensure .env is gitignored.
Configure Firebase Functions environment variables (Stripe secret keys, master encryption key) via firebase functions:config:set or Secret Manager.
Define initial, default-deny Firebase Firestore Security Rules for all collections.
Implement basic CORS restrictions for Firebase Functions.
Security Integration (MUST_HAVE):
4.1 Access Control: Default deny Firestore rules.
4.2 Sensitive Data: Zero hardcoding; build.js ensures secrets aren't committed. Firebase Functions secrets via secure config.
4.5 Configuration: .env and functions:config for external config.
4.6 Logging: Basic Cloud Logging setup for Firebase Functions.
Acceptance Criteria:
Repo with .github/workflows for CI/CD, running linters and SAST.
firebase-setup/public/index.html builds correctly from index.template.html using .env.
Firebase project configured with minimal services.
Firestore rules block all client writes to non-user collections.
Sprint 0.2: Core CLI Structure & Local Memory Security
Sprint Goal: Develop the foundational CLI structure and implement robust local memory encryption.
Key Features/Tasks:
Implement CLI commands: codecontext init, codecontext status.
Develop MemoryEngine.ts: initProject, getProjectStatus.
CRITICAL: Implement local SQLite database encryption in MemoryEngine.ts (generateEncryptionKey, encryptDatabaseFile, decryptDatabaseFile, calculateIntegrityHash).
Integrate database encryption/decryption on MemoryEngine.connectDatabase and MemoryEngine.close.
CLI output for init/status.
Initial ProjectScanner for basic file tracking (no deep analysis yet).
Security Integration (MUST_HAVE):
4.2 Sensitive Data: Primary focus: Secure local storage of memory.db with machine-specific derived keys and integrity verification. This is a direct implementation of previously identified critical fix.
4.4 Input Validation: Basic input sanitization for CLI arguments.
Acceptance Criteria:
codecontext init successfully initializes a project with an encrypted memory.db.enc file.
codecontext status reads the decrypted status correctly.
Encrypted memory.db.enc cannot be easily read or modified externally without the correct machine-derived key.
Phase 1: Core Memory CLI & Basic Storefront
Goal: Deliver the foundational persistent memory features and a functional marketing/purchase frontend.
Duration: 2 Sprints
Sprint 1.1: Core Memory CLI Functions
Sprint Goal: Enable core "remember" and "recall" functionality with initial usage tracking.
Key Features/Tasks:
Implement CLI commands: codecontext remember, codecontext recall.
MemoryEngine.ts: storeMemory, searchMemories.
Develop FirebaseService.ts: Implement reportUsage (fire-and-forget).
Integrate firebaseService.reportUsage calls into init, status, remember, recall.
Implement basic LicenseService.ts stubs for purchaseLicense, activateLicense, getCurrentLicense (initially mock/dev-only).
Security Integration (MUST_HAVE):
4.4 Input Validation: Validate content and context arguments for remember command.
4.6 Logging: Ensure reportUsage sends basic analytics data securely (even if fire-and-forget).
4.2 Sensitive Data: No sensitive user data (actual code) is sent via reportUsage.
Acceptance Criteria:
Users can store and retrieve memories via CLI.
Basic usage events are reported to Firebase (visible in Cloud Logging).
CLI commands handle basic invalid input gracefully.
Sprint 1.2: Storefront UI & Basic Pricing Backend
Sprint Goal: Launch a basic public-facing storefront with pricing and a secure checkout initiation.
Key Features/Tasks:
Develop Next.js frontend application (/storefront or separate repo that deploys to Firebase Hosting).
Storefront: Problem/Solution for AI amnesia, "HN Founders Special" pricing details ($59/month, 10k limit), Free Tier limits (20/20/20).
Integrate firebase-setup/public/index.html (generated by build.js) as the main landing page.
Firebase Function: getPricingHttp to serve pricing and early adopter stats from Firestore public/stats.
Firebase Function: createCheckout to create Stripe Checkout Sessions.
Update public/index.template.html and public/index.html to integrate with getPricingHttp and createCheckout via JS.
Replace prompt() for email with secure HTML modal.
Security Integration (MUST_HAVE):
4.1 Access Control: getPricingHttp and public/stats Firestore rules set to allow read: if true;, but allow write: if false;.
4.2 Sensitive Data: Stripe keys from Firebase Functions environment (securely).
4.4 Input Validation: createCheckout validates email and tier on the backend.
4.7 Secure Defaults: Default to minimal access. Replace prompt() with secure modal.
4.5 Configuration: Stripe price IDs loaded from Firebase Functions config (or .env).
General: Implement all addSecurityHeaders to all HTTP Firebase Functions.
New: CORS origin restriction on all HTTP Firebase Functions.
Acceptance Criteria:
Publicly accessible storefront displaying pricing and early adopter count.
Clicking purchase button opens a secure email modal, then redirects to Stripe checkout.
getPricingHttp and createCheckout Firebase Functions log successful calls and correct data.
All Firebase Functions responses include security headers.
CORS prevents unauthorized origins.
Phase 2: Secure Licensing & Advanced Memory Features
Goal: Implement robust licensing, enforce usage limits, and enable advanced memory capabilities.
Duration: 2 Sprints
Sprint 2.1: Robust Licensing & Activation
Sprint Goal: Securely activate user licenses and provide a transparent license status.
Key Features/Tasks:
Firebase Function: stripeWebhook to handle checkout.session.completed events.
Upon successful payment: Create Firebase Auth user (if new), create license document in Firestore with unique ID as licenseKey.
CRITICAL: Generate a unique userEncryptionKey derived from license.id, license.email, and ENCRYPTION_MASTER_KEY (server-side secret). Store this userEncryptionKey as license.apiKey in the license document for later client-side retrieval.
Update public/stats/earlyAdoptersSold count securely.
Firebase Function: validateLicense verifies license and returns license data, including license.apiKey.
Firebase Function: getAuthToken to generate custom Firebase Auth token for the user post-payment.
CLI commands: codecontext purchase, codecontext activate, codecontext license.
licenseService.purchaseLicense calls createCheckout.
licenseService.activateLicense calls validateLicense and then stores the License object (including apiKey) securely locally using encrypted storage.
licenseService.getCurrentLicense decrypts local license.
licenseService.showLicenseStatus displays detailed license info.
Update success.html to retrieve license key and auto-authenticate using Firebase Auth custom token.
Security Integration (MUST_HAVE):
4.1 Access Control: licenses Firestore rules are now strictly read-only for owners, no client writes. stripeWebhook is server-side only. getAuthToken for Firebase Auth token.
4.2 Sensitive Data: Primary focus: userEncryptionKey generation and secure transmission. Client-side LicenseService encrypts/decrypts local license file. No Stripe secrets on client.
4.6 Logging: Comprehensive logging for license-related events (creation, activation, validation).
4.7 Secure Defaults: Auto-authentication after Stripe payment.
General: Continue applying all security headers and CORS.
Acceptance Criteria:
A full purchase flow (storefront → Stripe → webhook → license creation) is functional.
Users can activate their CLI with a generated license key.
codecontext license shows correct status.
Local license file is encrypted and cannot be tampered with.
User-specific userEncryptionKey is generated and correctly stored/retrieved.
Sprint 2.2: Usage Enforcement & Advanced Memory
Sprint Goal: Enforce free tier limits and enable deeper project analysis features.
Key Features/Tasks:
Firebase Function: validateUsage (CRITICAL):
Receives licenseKey, operation, email.
CRITICAL: Verifies Firebase ID Token (verifyAuthToken) from Authorization header. Ensures authenticated user matches email in request.
Checks license.active status.
Performs monthly usage reset if applicable.
Checks currentOperations against operationLimit for specific action (recall, remember, scan, export, execute).
CRITICAL: Atomically increments usage.operations before returning success.
CLI commands: codecontext scan --deep, codecontext export, codecontext sync.
ProjectScanner.ts: Implement deep analysis for patterns.
MemoryEngine.ts: exportMemory (json/markdown).
Integrate firebaseService.validateUsage calls into scan, remember, recall, export commands. Throw error on limit exceeded.
codecontext sync: Stub implementation (for cloud sync feature gating, actual sync later).
Update CLI requireLicense and validateFeatureAccess to check for specific features (e.g., cloudSync).
Security Integration (MUST_HAVE):
4.1 Access Control: Primary focus: validateUsage is authenticated and authorized with JWT, ensuring only the owner can increment usage for their license. Firestore rules for licenses allow usage updates only by the owner.
4.2 Sensitive Data: Ensure reportUsage doesn't leak sensitive data.
4.7 Secure Defaults: Fail-closed on usage limit exceedance. Rate limiting on validateUsage.
4.6 Logging: Comprehensive logging of validateUsage attempts and failures.
Acceptance Criteria:
Free tier users are correctly limited to 20/20/20 operations.
Premium users have higher limits (Founders Special: unlimited).
codecontext scan --deep identifies more patterns.
codecontext export generates correct JSON/Markdown.
validateUsage backend function correctly identifies and enforces limits.
Usage attempts are accurately logged in Firestore.
Phase 3: Secure Execution Sandbox
Goal: Deliver a highly secure and isolated code execution environment.
Duration: 2 Sprints
Sprint 3.1: Execution Sandbox Backend (MVP)
Sprint Goal: Design and deploy the secure, containerized execution environment.
Key Features/Tasks:
CRITICAL: Develop a separate microservice/Cloud Function (e.g., in a new project, or dedicated service in existing project) for code execution. This is the re-enablement of validateExecution.
Architecture: Use a highly isolated environment (e.g., Cloud Run with strict IAM, or GKE Sandbox with gVisor/Kata Containers).
Implement initial execution logic for a single language (e.g., Node.js/JavaScript).
CRITICAL: Implement strict resource limits (CPU, memory, timeout).
CRITICAL: Implement network isolation (no outbound calls by default).
CRITICAL: Implement filesystem isolation (read-only, ephemeral scratch space).
CRITICAL: Execute code as a non-privileged user.
Firebase Function: validateExecution will proxy requests to this new secure service, passing encrypted code and context.
FirebaseService.ts: Implement validateExecution client-side, encrypting code and context using this.apiKey.
Security Integration (MUST_HAVE):
4.3 Secure Execution: Primary focus: Implementing all sandboxing measures.
4.1 Access Control: validateExecution requires proper Firebase ID Token authentication.
4.2 Sensitive Data: Code and context are encrypted before sending to the sandbox backend.
4.6 Logging: Detailed execution logs (success, failure, resource usage, security events).
Acceptance Criteria:
validateExecution backend endpoint responds to encrypted requests.
A simple, known-good JavaScript snippet executes and returns correct output.
A malicious JavaScript snippet (e.g., trying to access network or filesystem outside sandbox) is blocked/terminated securely.
Resource limits are enforced (e.g., a looping script times out).
Sprint 3.2: CLI Integration & Hardening
Sprint Goal: Integrate the execution sandbox into the CLI and further harden its security.
Key Features/Tasks:
CLI command: codecontext execute <code-file> --language <lang>.
FirebaseService.ts: validateExecution function fully integrated.
Error handling for execution failures on the client-side.
Logging of execution results in MemoryEngine (as a memory type).
Refine security policies (e.g., Seccomp profiles, AppArmor/SELinux if applicable) for the sandbox environment.
Conduct internal "red team" exercises against the execution sandbox.
Security Integration (MUST_HAVE):
4.3 Secure Execution: Continuous hardening: Implement more fine-grained controls, test edge cases and known sandbox escapes.
4.4 Input Validation: Validate code file format and language.
4.6 Logging: Comprehensive logging of execution attempts, failures, and resource consumption.
Acceptance Criteria:
Users can execute code via codecontext execute and see verified output.
Execution results are stored in persistent memory.
Penetration testing on the sandbox reveals no critical vulnerabilities.
Phase 4: VS Code Integration & Refinements
Goal: Provide a polished user experience with deep VS Code integration.
Duration: 2 Sprints
Sprint 4.1: VS Code Core Integration
Sprint Goal: Enable CodeContextPro-MES commands and features directly within VS Code.
Key Features/Tasks:
Implement CLI command: codecontext vscode (vscode-setup.ts).
Create .vscode/tasks.json for CodeContext commands (Status, Scan, Remember, Recall, Execute).
Create .vscode/settings.json for workspace-specific configurations (e.g., excluding .codecontext from watchers).
Add common keybindings.json entries for quick access (if user's keybindings.json exists).
Add workspace code snippets (.vscode/snippets/codecontext.code-snippets).
Implement VSCodeIntegration.ts: getFileContext to provide contextual information to VS Code (e.g., relevant memories, patterns for current file/line). This will be called by internal VS Code tasks.
Integrate CLI output into VS Code terminal.
Security Integration (MUST_HAVE):
4.4 Input Validation: Ensure VS Code context values (${file}, ${lineNumber}, ${input}) are safely handled by the CLI, preventing command injection.
4.1 Access Control: _vscode-context command (internal) is not publicly exposed and relies on authenticated CLI interactions.
Acceptance Criteria:
codecontext vscode successfully sets up VS Code integration.
VS Code tasks for CodeContext commands are runnable.
Code snippets are available.
VS Code is aware of codecontext project paths.
Sprint 4.2: User Experience & Polish
Sprint Goal: Refine user onboarding, error messaging, and overall application polish.
Key Features/Tasks:
Improve CLI error messages and user guidance for all commands.
Enhance storefront UI/UX, responsiveness, and marketing copy.
Implement comprehensive documentation (docs/codecontext-memory.markdown converted to web docs).
Add a "Contact Support" or "Join Discord" call to action.
Final round of end-to-end testing and user acceptance testing (UAT).
Final security audit and penetration testing.
Security Integration (MUST_HAVE):
4.4 Input Validation: Review all user-facing inputs for robust validation messages.
4.6 Logging: Ensure all user flows (purchase, activate, init, key commands) have proper logging for auditability.
General: Final review of all components against the complete security specification.
Acceptance Criteria:
Application feels robust, professional, and user-friendly.
All features work as expected.
No critical or high-severity security vulnerabilities remain.
Comprehensive documentation is available.
Phase 5: Local AI Integration (Future / Stretch Goal)
Goal: Integrate with local, on-device AI models for enhanced privacy and performance.
Duration: 2+ Sprints
Sprint 5.1: Local AI Model Runner Integration (MVP)
Sprint Goal: Establish a secure communication channel with a local LLM runner and demonstrate basic inference.
Key Features/Tasks:
Research and select a target local LLM runner (e.g., Ollama, LM Studio) and a compatible open-source model (e.g., Gemma).
Develop a new LocalAIService.ts module.
CLI command: codecontext local-ai setup to assist users in downloading and configuring the local runner/model.
Implement basic communication with the local LLM runner's API from LocalAIService.ts.
Demonstrate basic text generation from the local AI.
Security Integration (MUST_HAVE):
4.8 Local AI: Primary focus: Model integrity verification (checksums).
4.8 Local AI: Secure local storage of models with appropriate permissions.
4.8 Local AI: Process isolation for the local LLM runner.
4.1 Access Control: Ensure LocalAIService has no direct filesystem access to .codecontext DB; all interactions must go through MemoryEngine.
4.4 Input Validation: Sanitize all prompts sent to the local AI.
Sprint 5.2: Local AI + Persistent Memory Integration
Sprint Goal: Enable the local AI model to leverage CodeContextPro-MES's persistent memory.
Key Features/Tasks:
Enhance LocalAIService.ts to:
Retrieve context from MemoryEngine.searchMemories.
Augment local AI prompts with relevant persistent memory.
Store new insights generated by local AI back into MemoryEngine.storeMemory.
CLI command: codecontext chat-local "[query]" (or interactive session).
Integrate output from local AI into CLI or VS Code.
Security Integration (MUST_HAVE):
4.8 Local AI: Primary focus: Secure data flow between local AI and MemoryEngine API.
4.8 Local AI: Implement AI-specific data redaction/sanitization for outputs.
4.8 Local AI: Continual vigilance against prompt injection attempts, even locally.
Acceptance Criteria:
Local AI can answer questions based on previously stored memories.
Local AI-generated content can be stored in memory.
Performance metrics for local AI inference are acceptable.
This detailed specification provides a robust roadmap for building CodeContextPro-MES securely and effectively. By empowering our AI coding agents with these guidelines, we ensure that every line of code contributes to a product that is not just powerful and user-friendly, but also inherently trustworthy.
