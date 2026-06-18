# DataLens AI

Turn Any Database Into Instant Intelligence

![DataLens AI](public/landingpage.png)

DataLens AI automatically documents, visualizes, analyzes, and explains your database in seconds.

Paste a connection string and instantly generate:

* Data Dictionaries
* Interactive ER Diagrams
* Graph Visualizations
* AI-Powered Schema Exploration
* Data Quality Reports
* Executive Business Reports
* Documentation Portals
* PDF, Markdown, and JSON Exports

Supported databases:

* PostgreSQL
* MySQL
* Snowflake
* Neo4j

---

## Overview

Modern teams waste hours trying to understand databases.

Whether you're working with a legacy application, onboarding new developers, or exploring an unfamiliar schema, database documentation is often incomplete, outdated, or nonexistent.

DataLens AI automatically scans your schema and transforms it into a searchable knowledge system with visualizations, reports, and AI-powered insights.

---

## The Problem

Teams regularly struggle with:

* Understanding legacy schemas
* Tracing foreign key relationships
* Maintaining documentation
* Exploring unfamiliar databases
* Onboarding engineers
* Reverse-engineering business logic

As systems scale, databases become black boxes.

---

## The Solution

DataLens AI automatically extracts schema metadata and generates documentation, diagrams, reports, and AI-assisted exploration tools.

### Workflow

```text
Database Connection
        |
        ▼
Schema Scanner
        |
        ▼
AI Documentation Engine
        |
        ├── Data Dictionary
        ├── ER Diagram
        ├── Graph Visualization
        ├── Quality Report
        ├── Business Report
        └── AI Schema Assistant
```

**Time to insight: Less than 30 seconds**

---

## Features

### Automated Data Dictionary

Generate complete documentation for every table and entity.

Automatically extracts:

* Tables
* Columns
* Data Types
* Constraints
* Primary Keys
* Foreign Keys
* Indexes
* Row Counts
* Sample Metadata

### Interactive ER Diagrams

Visualize relational database structures instantly.

```text
customers (1)
      |
      ▼
orders (∞)
```

Capabilities:

* Interactive navigation
* Relationship exploration
* Dependency tracing
* Schema grouping
* Drill-down inspection

### Graph Visualization

Explore graph databases visually.

Example:

```cypher
(:Person)-[:ACTED_IN]->(:Movie)
```

Visualize:

* Node Labels
* Relationship Types
* Property Structures
* Connectivity Maps
* Distribution Metrics

### AI Schema Assistant

Ask questions about your schema using natural language.

Examples:

```text
Which tables reference customers?

Explain the orders schema.

How many foreign keys exist?

What relationships does Movie have?
```

The AI operates entirely on schema metadata, ensuring sensitive row-level data is never exposed.

### Data Quality Diagnostics

Automatically evaluate database design quality.

Generated insights include:

* Database Health Score
* Structural Grade
* Naming Consistency
* Constraint Coverage
* Relationship Integrity
* Quality Warnings

Detect issues such as:

* Missing primary keys
* Missing foreign keys
* Inconsistent naming
* Orphaned relationships
* Structural anti-patterns

### Executive Business Reports

Generate executive-level summaries of your database.

Includes:

* Business Domain Detection
* Schema Overview
* Governance Analysis
* Risk Assessment
* Key Findings
* Documentation Quality Review

Powered by Gemini 2.5 Flash.

### Documentation Portal

Dedicated widescreen documentation experience.

Features:

* Fullscreen reference manuals
* Live search
* Interactive relationship maps
* Cross-table navigation
* Markdown rendering

Route:

```text
/dashboard/tables/[id]/document
```

### Export Engine

Export documentation in multiple formats.

Supported exports:

* PDF
* Markdown
* JSON
* Data Dictionary Reports
* Executive Reports

### Text-to-SQL Studio

Convert natural language into executable SQL.

Features:

* AI-assisted SQL generation
* Interactive query execution
* Aggregate chart generation
* Query visualizations
* Workspace synchronization

### Vector Search

Schema metadata is automatically indexed into Qdrant.

Benefits:

* Semantic search
* Context-aware retrieval
* Faster schema discovery
* Improved SQL generation

### API Agent

Generate custom API endpoints directly from database schemas.

The agent can:

* Explore schemas
* Generate route handlers
* Create parameterized queries
* Test endpoints
* Manage custom APIs

Generated routes:

```text
src/app/api/custom/[slug]/route.ts
```

Example prompt:

```text
Create an authenticated endpoint that returns total customers.
```

---

## VS Code and Cursor Integration

Use DataLens AI directly inside Cursor or VS Code through MCP.

### Setup

```bash
cd vscode-extension/mcp-server

npm install

npm run build
```

Configure:

```json
{
  "DATALENS_DATABASE_URL": "your_database_url"
}
```

Available MCP tools:

* Schema Scan
* Documentation Generation
* AI Chat
* Data Quality Analysis
* Query Execution

---

## Architecture

```text
                 +----------------+
                 |   Database     |
                 +-------+--------+
                         |
                         ▼
                Schema Extraction
                         |
                         ▼
             AI Documentation Engine
                         |
      +------------------+------------------+
      |                  |                  |
      ▼                  ▼                  ▼
Data Dictionary    ER Diagram       Graph View
      |                  |                  |
      +---------+--------+---------+--------+
                |                  |
                ▼                  ▼
         Qdrant Vector DB      Gemini AI
                |                  |
                +--------+---------+
                         |
                         ▼
                   Dashboard
```

---

## Technology Stack

| Layer           | Technology                          |
| --------------- | ----------------------------------- |
| Frontend        | Next.js 16                          |
| UI              | Tailwind CSS + shadcn/ui            |
| Backend         | Next.js API Routes                  |
| ORM             | Drizzle ORM                         |
| Authentication  | Better Auth                         |
| Databases       | PostgreSQL, MySQL, Snowflake, Neo4j |
| LLM             | Gemini 2.5 Flash                    |
| Embeddings      | Mixedbread AI                       |
| Vector Database | Qdrant Cloud                        |
| Language        | TypeScript                          |
| Deployment      | Vercel                              |

---

## Installation

### Clone Repository

```bash
git clone https://github.com/your-org/datalens-ai.git

cd datalens-ai
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GEMINI_API_KEY=

QDRANT_URL=
QDRANT_API_KEY=

MIXEDBREAD_API_KEY=
```

### Run Development Server

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

---

## Security

DataLens AI follows a metadata-first architecture.

### Security Principles

* Server-side schema scanning
* OAuth authentication
* Secure session handling
* No permanent row storage
* Metadata-only AI analysis
* Parameterized query generation

---

## Roadmap

### Completed

* Automated Data Dictionary
* Interactive ER Diagrams
* Graph Visualization
* AI Schema Assistant
* PDF Export
* Data Quality Diagnostics
* Executive Reports
* Vector Search
* API Agent

### Planned

* Schema Versioning
* Column-Level Lineage
* Slack Integration
* Notion Integration
* Advanced Graph Analytics
* Team Collaboration

---

## Team Vision

We believe data should explain itself.

DataLens AI transforms databases into living, searchable, and visual knowledge systems that help teams understand data faster and make better decisions.

---

## License

MIT License

---
