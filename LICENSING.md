# CodeContextPro-MES Hybrid Licensing Model

## Overview

CodeContextPro-MES uses a **hybrid licensing approach** designed to balance developer trust, open innovation, and intellectual property protection.

## 🔓 **MIT Licensed Components** (Open Source)

The following components are licensed under the **MIT License**:

### CLI Tool & Interface
- **Main CLI executable** (`src/cli.ts`, `src/index.ts`)
- **Command handlers** (basic command parsing and user interface)
- **Configuration management** (project setup, basic config handling)
- **Public interfaces and types** (TypeScript definitions)
- **Testing infrastructure** (test files and utilities)
- **Development tooling** (build scripts, linting configuration)

### Why MIT for CLI?
- **Developer Trust**: Developers can inspect how the CLI works locally
- **Security Transparency**: No "black box" executable on your machine
- **Community Contribution**: Bug fixes and improvements from the community
- **Standard Practice**: Most CLI tools developers use daily are open source

## 🔒 **Proprietary Licensed Components** (Trade Secrets)

The following components contain **proprietary intellectual property**:

### Core Memory Engine
- **`src/database/MemoryDatabase.ts`** - Advanced encryption, key derivation algorithms
- **`src/MemoryEngine.ts`** - Memory management, search optimization, AI-context integration
- **Encryption Algorithms** - Machine-specific key derivation, integrity verification
- **Search & Retrieval Logic** - Full-text search optimization, relevance scoring
- **Memory Persistence** - Advanced caching, compression, and synchronization

### Future: Execution Sandbox
- **Secure containerization logic**
- **Code execution safety algorithms** 
- **Resource management and isolation techniques**

### Why Proprietary for Core Engine?
- **Intellectual Property Protection**: These algorithms are our competitive advantage
- **Service-Based Business Model**: Users pay for access to the service, not the code
- **Quality Control**: Ensures consistent, high-quality experience across all users
- **Security**: Prevents potential security vulnerabilities from public code analysis

## 💰 **What You're Paying For**

When you purchase a CodeContextPro-MES license, you're paying for:

1. **Access to the proprietary Memory Engine service**
2. **Encrypted cloud synchronization capabilities** 
3. **Advanced search and context algorithms**
4. **Professional support and updates**
5. **Future execution sandbox features**

You are **NOT** paying for the CLI tool itself, which remains free and open source.

## 🤝 **This Protects Both You and Us**

### For Developers (You):
- ✅ **Trust**: CLI code is inspectable and modifiable
- ✅ **No Lock-in**: Can always switch to different tools
- ✅ **Security**: No hidden functionality on your machine
- ✅ **Community**: Benefit from open source improvements

### For CodeContext Team (Us):
- ✅ **IP Protection**: Core algorithms remain competitive advantage
- ✅ **Quality Control**: Consistent user experience
- ✅ **Business Sustainability**: Revenue protects continued development
- ✅ **Security**: Reduces attack surface from public code

## 📄 **Legal Details**

- **CLI Components**: MIT License (see LICENSE file)
- **Proprietary Components**: Copyright © 2025 CodeContext Team. All rights reserved.
- **Service Access**: Governed by Terms of Service
- **Support**: Subject to Support Agreement terms

## 🔍 **How to Identify What's What**

- **MIT Licensed**: Files without proprietary headers, standard open source
- **Proprietary**: Files marked with "PROPRIETARY SOFTWARE - NOT LICENSED UNDER MIT" headers
- **Service Components**: Anything requiring network calls to CodeContext APIs

## ❓ **Questions?**

This hybrid model is designed to give you the best of both worlds. If you have questions about licensing, usage rights, or our approach, please contact us at support@codecontext.pro.

---

*This licensing model follows industry best practices used by companies like Docker, GitLab, MongoDB, and other developer-focused tools that balance open source CLI interfaces with proprietary core engines.*