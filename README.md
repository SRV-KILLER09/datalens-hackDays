# 🚀 DataLens AI  
## ⚡ Turn Any Database Into Instant Intelligence
![DataLens AI](public/landingpage.png)

> Stop guessing your schema. Start understanding it.

DataLens AI automatically documents, visualizes, and explains your database in seconds.  
Paste a connection string → get a searchable data dictionary, interactive ER diagrams, graph visualizations, and AI-powered schema exploration.

Built for hackathons. Designed for real-world scale.

---

# 🏆 Problem

Modern teams waste hours trying to:

- Understand legacy schemas
- Manually document databases
- Trace foreign key relationships
- Visualize graph connections
- Onboard new developers
- Explore unfamiliar data structures

Documentation is outdated. Knowledge is tribal.  
Databases become black boxes.

---

# 💡 Solution

DataLens AI connects to your database and instantly generates:

- 📚 A complete Data Dictionary
- 📊 Interactive ER Diagrams
- 🕸 Graph Visualizations (Neo4j)
- 🔍 Deep Table Inspection
- 🤖 AI-Powered Schema Chat
- 📈 Schema Analytics Dashboard
- 🛡️ Data Quality Diagnostics & Health Score
- ⚡ Executive Business Report & Governance Insights
- 📖 Standalone Reference Manual Portal (Widescreen)
- 🖨️ Premium Dark-Themed PDF & Multi-Format Exports

No manual work. No schema guessing. No documentation writing.

---

# 🔥 Live Demo Flow

1. Sign in with Google / Email
2. Paste your database URI
3. Click Connect
4. Watch your schema transform into:
   - Interactive documentation
   - Relationship maps
   - AI query interface
   - Widescreen reference manual

Time to insight: **< 30 seconds**

---

# ✨ Key Features

## 🧠 Intelligent Schema Scanner

Automatically extracts:

- Tables / Node Labels
- Columns / Properties
- Data Types
- Primary & Foreign Keys
- Unique Constraints
- Row Counts
- Sample Data
- Indexes

---

## 📊 Interactive ER Diagrams

Visualize relational structure instantly:

```
customers (1) ──────── (∞) orders
```

- Clickable nodes
- Relationship filtering
- Schema grouping
- Drill-down inspection

---

## 🕸 Graph Database Support (Neo4j)

Explore graph relationships visually:

```
(:Person {name:"John Doe"})
        ── ACTED_IN ──>
(:Movie {title:"The Matrix"})
```

See:

- Node labels
- Edge types
- Property structures
- Relationship distributions

---

## 🛡️ Data Quality Diagnostics & Health Score (New)

Automatically audit your database layout for structural integrity:
- **Estimated Database Grade:** A dynamic radial health SVG tracking overall database design scores.
- **Data Type Profile:** Visual breakdown chart detailing string, numeric, temporal, boolean, and other data field ratios.
- **Quality Audit Issues Log:** Identifies critical issues and warning items (like missing constraints, key inconsistencies, or poor naming structures) with intelligent remediation recommendations.

---

## 📖 Widescreen Reference Manual & Portal (New)

A dedicated fullscreen documentation view accessible at `/dashboard/tables/[id]/document` featuring:
- **Interactive Entity Network Graph:** A dynamic coordinate-mapped circular SVG relationship visualization highlighting schema pathways.
- **Table Navigation Sidebar:** Live sidebar featuring an instant keyword search bar filtering tables and columns.
- **Book-Style Markdown Layout:** Beautifully structured markdown headings, uppercase monospace typography, and clean borders.

---

## 🖨️ Premium Dark-Themed PDF Print Engine (New)

A browser-native print layout tailored for clean corporate document sharing:
- **Opaque Dark Theme:** Custom overrides forcing solid dark backgrounds (`#0d0d0d`, `#141414`) and contrasting white/grey text colors, completely avoiding browser print engine washouts.
- **Page-Break Safeguards:** Keeps table rows (`tr`), headers, metrics grids, and overview cards on single pages cleanly, preventing orphan headings from showing up at the bottom of pages.
- **Multi-Format Exports:** Export options for Raw Dict JSON, Dict MD, Full Report MD, and Full Report JSON files.

---

## 🤖 AI Schema Chat & Business Report Generator

- **Executive Overview:** Formulates target domain labels, business overview descriptions, key findings, data governance scopes, and overall schema health assessments using Gemini 2.5 Flash.
- **AI Schema Chat:** Ask:
  - “Which tables reference customers?”
  - “Explain the orders schema.”
  - “What relationships does Movie have?”
  - “How many foreign keys exist?”
  - The AI operates entirely on schema metadata — ensuring zero raw sensitive data exposure.

---

# 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router + Turbopack) |
| UI | Tailwind CSS + shadcn/ui + Lucide Icons |
| Backend | Next.js Server Actions & API Routes |
| ORM | Drizzle ORM |
| Auth | Better Auth (Google OAuth & Credentials) |
| Databases | PostgreSQL, MySQL, Snowflake, Neo4j |
| Embeddings | Mixedbread AI (High-dimensional Vector embeddings) |
| Vector DB | Qdrant Cloud |
| LLM | Gemini 2.5 Flash (API Key access) |
| Language | TypeScript |
| Deployment | Vercel |

---

# 🔌 VS Code / Cursor MCP Integration

Use DataLens AI directly in **Cursor** or **VS Code** via the MCP server:

```bash
cd vscode-extension/mcp-server
npm install && npm run build
```

Copy `.cursor/mcp.json.example` to `.cursor/mcp.json` and set your `DATALENS_DATABASE_URL`.

See **[vscode/README.md](vscode/README.md)** for Cursor, VS Code, and Antigravity setup (paths + config). MCP tools: schema scan, documentation, queries, data quality, AI chat.

---

# 🤖 AI API Route Generator Agent (CLI & Web Sandbox)

DataLens AI features an interactive, session-based AI Agent that can explore your database schema, check data quality, and **automatically write Next.js Route Handlers** (`src/app/api/custom/[slug]/route.ts`) to expose custom data endpoints on the fly. 

This agent is available via **both** the CLI terminal and the Web Sandbox console.

### ✨ Features
*   **Web Agent Console Tab:** Dedicated **API Agent (Beta)** workspace in the database detail dashboard containing real-time code output and schema context generation.
*   **Interactive Testing Playground:** Execute, query, and test generated custom APIs in real-time with custom parameter inputs directly inside the browser.
*   **Persistent Chat History:** Seamlessly stores agent conversation records in local storage (`localStorage`) keyed by `connectionId`. Switch tabs or reload without losing progress, and clear history instantly with the header Trash control.
*   **Safe Parametrized Queries:** Upgraded backend architecture to support parametrized SQL queries (e.g. `SELECT * FROM table WHERE col = $1` with parameter binding variables) in generated API routes to protect against SQL injection.
*   **Active APIs Management:** Expand to view raw generated TypeScript code, test endpoints with custom request parameters, or delete generated routes with one click.
*   **CLI Agent Tool:** Retro ASCII interactive terminal console with shell command support.

### 💻 CLI Agent Setup & Usage
1. Add your target database connection ID to your `.env` file (you can find these in the `connections` table):
   ```env
   ACTIVE_CONNECTION_ID="your_connection_id"
   ```
2. Start the interactive CLI session:
   ```bash
   npx tsx scripts/agent-cli.ts
   ```
3. Command the agent using natural language prompts:
   *   *“List my tables”*
   *   *“Create an authenticated GET endpoint with slug 'total-customers' that returns the count of rows from olist_customers_dataset”*
   *   *“List all custom API endpoints”*
   *   *“Delete the endpoint with slug 'total-customers'”*

---

# ⚙️ Installation

```bash
git clone https://github.com/your-org/data-lens-ai.git
cd data-lens-ai
npm install
```

Create `.env`:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your_id
GOOGLE_CLIENT_SECRET=your_secret
GEMINI_API_KEY=your_gemini_key
QDRANT_URL=your_qdrant_url
QDRANT_API_KEY=your_qdrant_key
MIXEDBREAD_API_KEY=your_mixedbread_key
```

Run:

```bash
npm run dev
```

Open:

```
http://localhost:3000
```

---

# 🔐 Security

- Server-side metadata scanning
- No raw data permanently stored
- OAuth-based authentication
- Secure session handling
- AI operates on schema, not rows

---

# 🚀 Future Scope

- [x] Documentation export (PDF / Markdown / JSON)  
- [x] Data quality scoring & diagnostics
- Column-level lineage tracking  
- Schema versioning  
- Slack / Notion integration  
- Advanced graph analytics  

---

# 👥 Team Vision

We believe data should explain itself.

DataLens AI transforms any database into a living, visual, searchable knowledge system.

---

# 📜 License

MIT License

---

# ⚡ DataLens AI

Understand your database in seconds — not weeks.