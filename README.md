
# 🧠 CodeContextPro - Stop AI Amnesia

**Give your AI assistant true, persistent memory. Local-first, private, and always learning.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://badge.fury.io/js/codecontext-ai.svg)](https://www.npmjs.com/package/codecontext-ai)
[![Tests](https://github.com/jahboukie/codecontextpromes/actions/workflows/security-ci.yml/badge.svg)](https://github.com/jahboukie/codecontextpromes/actions)

---

## 🎯 **The Problem: AI Amnesia**

Current AI coding assistants suffer from "AI amnesia" – they forget everything between conversations:
*   ❌ **No memory** of your project's architecture or patterns.
*   ❌ **No learning** from what worked (or failed) in your codebase.
*   ❌ **Every conversation starts from zero context.**

This leads to endless re-explanation, wasted time, and frustratingly generic AI suggestions.

## 🚀 **The Solution: CodeContextPro**

CodeContextPro gives your AI assistant **perfect, persistent memory** about your projects. It's the first AI tool that truly understands and remembers your codebase's unique context, evolving with every interaction.

**With CodeContextPro, your AI assistant will:**
*   ✅ **Remember everything** about your project, across all sessions.
*   ✅ **Understand your architecture**, patterns, and decisions.
*   ✅ **Learn** from your successes and failures over time.
*   ✅ **Provide highly relevant suggestions** without constant re-explaining.

---

## 🔥 **Key Features (MVP)**

### 🧠 **Persistent Memory Engine (Local-First)**
*   **Remembers All Context:** Conversations, architectural decisions, code patterns, and notes are stored permanently.
*   **Project-Aware:** Learns the unique structure, frameworks, and conventions of *your* codebase.
*   **Intelligent Search:** Instantly recall any piece of memory with context-aware search.
*   **AES-256 Encryption:** All local memory data is encrypted at rest on your machine.
*   **Unlimited Projects:** Track as many projects as you need.

### 🔒 **Privacy & Security Built-In**
*   **Local-First by Default:** Your code and memory content *never* leave your machine unless explicitly synced (cloud sync not in MVP).
*   **No Content to Cloud (MVP):** No project code or memory text is sent to our servers for analysis or storage in this MVP phase.
*   **Secure Usage Tracking:** Only anonymous counts of operations are sent for billing, never sensitive data.
*   **Open Source CLI:** Inspect every line of code that runs on your machine for complete transparency and trust.

---

## ⚡ **Quick Start**

### 1. Installation
```bash
npm install -g codecontextpro-mes
```

### 2. Activate Your License (Includes a 7-day Free Trial!)
```bash
# This command will guide you through setting up your email and activating.
# A 7-day free trial is automatically enabled if you don't have a license.
codecontextpro activate
```
*   *(After activation, your Firebase configuration will be securely distributed to your CLI.)*

### 3. Initialize Your Project
```bash
cd your-project-directory
codecontextpro init
```

### 4. Start Building with Memory!
```bash
# Store an architectural decision
codecontextpro remember "We chose React hooks for state management for simplicity." --type decision

# Later, recall it instantly
codecontextpro recall "React state management"

# Get a snapshot of your project's memory status
codecontextpro status
```

---

## 💰 **Pricing: Get Your AI Superpowers**

We offer tiered pricing designed to scale with your usage, ensuring fair costs and sustainable development of this revolutionary tool.

| Tier                    | Price          | Memory Operations/Month* | Projects       | Support       | Features                                         |
|-------------------------|----------------|--------------------------|----------------|---------------|--------------------------------------------------|
| **Free Trial**          | $0             | 100                      | 1              | Community     | Local Memory, AES-256 Encryption                 |
| **Early Adopter**       | **$29/month**  | 5,000                    | Unlimited      | Priority      | All Free Trial + Unlimited Projects, **Price Locked Forever** |
| **Standard Memory Pro** | $49/month      | 10,000                   | Unlimited      | Priority      | All Founders Special (without price lock)        |

**\*What is a "Memory Operation"?** Each `remember`, `recall`, `scan`, or `export` command counts as one operation.

[**Get Started & Claim Your Founders Special →**](https://codecontextpro.com)



---

## 🏗 **Architecture: Open Source CLI + Proprietary Intelligence**

CodeContextPro employs a hybrid licensing model to foster trust and enable rapid innovation:

*   **🔓 Open Source CLI (MIT License):**
    *   The command-line interface and client-side logic are fully open source. You can inspect every line of code that runs on your machine, ensuring transparency and control. Contributions to the CLI are welcome!
*   **🔒 Proprietary Memory Engine (Service):**
    *   The core algorithms for intelligent memory management, search optimization, and future AI-learning capabilities are proprietary. Your subscription directly funds the continuous research and development of these advanced services.

This model allows us to build a sustainable business while maintaining developer trust and providing the highest quality AI experience.

---

## 🛡 **Security & Privacy**

Security is our top priority, designed with enterprise-grade standards:

*   **AES-256 Encryption:** All your local project memory data is encrypted using a strong, machine-specific AES-256 key.
*   **Local-First Data:** In this MVP, your project code and memory content stay on your machine. No sensitive data is sent to the cloud.
*   **Zero-Trust Principle:** Our backend verifies every interaction with robust authentication and granular access controls.
*   **Secure Usage Tracking:** We only log anonymous counts of operations for billing. Your code and memory content are *never* transmitted during usage reporting.
*   **Transparent CLI:** The open-source nature of our CLI allows for full inspection and auditing by the community.

---

## 📈 **Roadmap (Beyond MVP)**

We're just getting started! Future phases of CodeContextPro will include:

*   **☁️ Cloud Sync:** Securely sync your memory across multiple devices.
*   **🚀 Execution Engine:** Safely execute and verify AI-generated code snippets.
*   **🔗 VS Code & IDE Extensions:** Seamless, context-aware integration directly within your editor.
*   **👥 Team Collaboration:** Share project knowledge graphs and collaborate on memory.
*   **🤖 Advanced AI Integrations:** Direct, context-rich prompting for your favorite AI models (Claude, GPT, etc.).

---

## 🤝 **Contributing**

We welcome contributions to the **MIT-licensed CLI components**! Your ideas and code can help shape the future of CodeContextPro.

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes (`git commit -m 'Feat: Add amazing feature'`).
4.  Push to the branch (`git push origin feature/amazing-feature`).
5.  Open a Pull Request.

*(Note: Contributions are currently limited to the CLI interface. Core memory engine components remain proprietary.)*

---

## 📄 **License**

This project uses a hybrid licensing model. Please refer to [`LICENSE.md`](LICENSE.md) for full details.

---

**CodeContextPro: Stop AI amnesia. Start building smarter.**


