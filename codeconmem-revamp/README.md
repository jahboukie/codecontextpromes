# 🧠 CodeConMem

**Simple, reliable AI memory for developers**

CodeConMem is a lightweight, SQLite3-based memory system that helps AI coding assistants remember important information across sessions. No complex setup, no cloud dependencies - just reliable local memory that works everywhere.

## ✨ Features

- 🗄️ **SQLite3 Database** - Works in Claude, VS Code, and any environment
- 🔒 **Local-First** - Your memories stay on your machine
- 🚀 **Zero Configuration** - No environment variables or setup required
- 🎯 **Simple Commands** - Just 4 commands to master
- 🔍 **Smart Search** - Find memories by content, tags, or context
- 📊 **Memory Statistics** - Track your memory usage

## 🚀 Quick Start

### Installation

```bash
npm install -g codeconmem
```

### Basic Usage

```bash
# Initialize memory in your project
codeconmem init

# Store a memory
codeconmem remember "This project uses React with TypeScript"

# Add tags and context
codeconmem remember "API endpoint is /api/users" --tag "api" --context "backend"

# Search your memories
codeconmem recall "React"
codeconmem recall "api"

# Check memory status
codeconmem status
```

## 📋 Commands

### `codeconmem init`
Initialize memory database for the current project.

### `codeconmem remember <content>`
Store a new memory.

**Options:**
- `-t, --tag <tag>` - Add a tag to categorize the memory
- `-c, --context <context>` - Add contextual information

**Examples:**
```bash
codeconmem remember "Database connection uses PostgreSQL"
codeconmem remember "Login endpoint" --tag "auth" --context "API documentation"
```

### `codeconmem recall <query>`
Search and retrieve memories.

**Options:**
- `-l, --limit <number>` - Maximum number of results (default: 5)

**Examples:**
```bash
codeconmem recall "database"
codeconmem recall "auth" --limit 10
```

### `codeconmem status`
Show memory statistics and recent memories.

## 🗂️ How It Works

CodeConMem creates a `.codeconmem/` directory in your project root containing:
- `memory.db` - SQLite3 database with your memories
- Automatic indexing for fast search
- Simple schema: content, tags, context, timestamps

## 🔧 Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup
```bash
git clone https://github.com/jahboukie/codeconmem.git
cd codeconmem
npm install
npm run build
```

### Testing
```bash
npm test
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Run the test suite
6. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 🐛 [Report bugs](https://github.com/jahboukie/codeconmem/issues)
- 💡 [Request features](https://github.com/jahboukie/codeconmem/issues)
- 📖 [Documentation](https://github.com/jahboukie/codeconmem/wiki)

---

**Made with ❤️ for developers who want their AI assistants to remember**
