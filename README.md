# Azure Pipelines demo: Express products API

A hands-on example for learning **Azure DevOps Pipelines** with a real Node.js app: an Express REST API for products, automated tests, and an optional **npm publish** stage.

---

## Table of contents

1. [What you will learn](#what-you-will-learn)
2. [Prerequisites](#prerequisites)
3. [Clone the repository](#clone-the-repository)
4. [Install dependencies](#install-dependencies)
5. [Run the server locally](#run-the-server-locally)
6. [Try the API](#try-the-api)
7. [Run tests](#run-tests)
8. [Wire up Azure Pipelines](#wire-up-azure-pipelines)
9. [Publish to Azure Artifacts (npm)](#publish-to-azure-artifacts-npm)
10. [Project layout](#project-layout)
11. [Concepts reference](#concepts-reference)

---

## What you will learn

| Topic | How this repo demonstrates it |
|-------|-------------------------------|
| **CI (continuous integration)** | Every push or PR runs install + tests on a clean agent. |
| **Pipeline stages** | **Build** (install + test) runs first; **Publish** runs only when you opt in. |
| **Triggers** | Commits to `main` / `master` run the pipeline; PRs run validation too. |
| **Quality gate** | Tests must pass before the Publish stage is allowed to run. |
| **Secrets** | No npm password in git: `npmAuthenticate@0` injects short-lived credentials at runtime. |
| **npm publish** | Optional stage runs `npm publish` to your **Azure Artifacts** feed. |

---

## Prerequisites

| Tool | Minimum version | Check |
|------|-----------------|-------|
| **Node.js** | 18 (pipeline uses 20) | `node --version` |
| **npm** | comes with Node | `npm --version` |
| **Git** | any recent | `git --version` |

Install Node.js from [nodejs.org](https://nodejs.org) (LTS recommended). npm is bundled.

---

## Clone the repository

**PowerShell / CMD (Windows)**
```powershell
git clone https://github.com/baluragala/azure-pipelines-with-publish.git
cd azure-pipelines-with-publish
```

**Bash (macOS / Linux)**
```bash
git clone https://github.com/baluragala/azure-pipelines-with-publish.git
cd azure-pipelines-with-publish
```

---

## Install dependencies

> Run this once after cloning, and again whenever `package.json` changes.

**PowerShell / CMD (Windows)**
```powershell
npm install
```

**Bash (macOS / Linux)**
```bash
npm install
```

> **Note:** The project `.npmrc` points to an Azure Artifacts feed for publishing. For local development `npm install` uses the public npm registry (no Azure credentials needed) as long as you have internet access and the feed has **npmjs.org** as an upstream source, or you remove / ignore `.npmrc` locally.

If you get a `401 Unauthorized` on install, set up your `~/.npmrc` credentials (see [Publish to Azure Artifacts](#publish-to-azure-artifacts-npm)) or temporarily remove the project `.npmrc` for local installs.

---

## Run the server locally

**PowerShell (Windows)**
```powershell
npm start
```

Override the port:
```powershell
$env:PORT = "4000"; npm start
```

**CMD (Windows)**
```cmd
npm start
```

Override the port:
```cmd
set PORT=4000 && npm start
```

**Bash (macOS / Linux)**
```bash
npm start
```

Override the port:
```bash
PORT=4000 npm start
```

Default URL: `http://localhost:3000`

You should see:
```
Server running on port 3000
```

Stop the server with **Ctrl + C**.

---

## Try the API

The server stores products in memory. Restarting it clears all data.

### Using curl

`curl` is pre-installed on macOS and most Linux distros. On Windows it is included in Git Bash, Windows 10 1803+, and PowerShell 7+.

#### Health check

**PowerShell / CMD / Bash**
```bash
curl -s http://localhost:3000/health
```
Expected: `{"status":"ok"}`

#### List products

```bash
curl -s http://localhost:3000/api/products
```

#### Create a product

**Bash (macOS / Linux)**
```bash
curl -s -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Notebook","price":12.5,"description":"Lined A5"}'
```

**PowerShell (Windows)**
```powershell
curl -s -X POST http://localhost:3000/api/products `
  -H "Content-Type: application/json" `
  -d '{"name":"Notebook","price":12.5,"description":"Lined A5"}'
```

Or using `Invoke-RestMethod` (PowerShell native):
```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:3000/api/products `
  -ContentType "application/json" `
  -Body '{"name":"Notebook","price":12.5,"description":"Lined A5"}'
```

**CMD (Windows) — use double quotes inside the JSON body**
```cmd
curl -s -X POST http://localhost:3000/api/products -H "Content-Type: application/json" -d "{\"name\":\"Notebook\",\"price\":12.5,\"description\":\"Lined A5\"}"
```

#### Get one product

Use the `id` returned by the create call.

```bash
curl -s http://localhost:3000/api/products/1
```

#### Update a product

**Bash (macOS / Linux)**
```bash
curl -s -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Notebook Pro","price":15}'
```

**PowerShell (Windows)**
```powershell
Invoke-RestMethod -Method Put -Uri http://localhost:3000/api/products/1 `
  -ContentType "application/json" `
  -Body '{"name":"Notebook Pro","price":15}'
```

#### Delete a product

**Bash (macOS / Linux)**
```bash
curl -s -X DELETE http://localhost:3000/api/products/1 -w "\nHTTP %{http_code}\n"
```

**PowerShell (Windows)**
```powershell
Invoke-RestMethod -Method Delete -Uri http://localhost:3000/api/products/1
```

### API reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness check: `{ "status": "ok" }` |
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get one; `404` if missing |
| `POST` | `/api/products` | Create; body needs `name`, numeric `price`; optional `description` |
| `PUT` | `/api/products/:id` | Update; partial updates allowed |
| `DELETE` | `/api/products/:id` | Delete; `204` on success |

---

## Run tests

**PowerShell / CMD (Windows)**
```powershell
npm test
```

With coverage report:
```powershell
npm run test:coverage
```

**Bash (macOS / Linux)**
```bash
npm test
```

With coverage report:
```bash
npm run test:coverage
```

Tests use **Jest** and **Supertest** (HTTP assertions against the Express app, no browser needed). Coverage output goes to `coverage/`.

---

## Wire up Azure Pipelines

### 1. Push to a supported host

Push this repo to **Azure Repos**, **GitHub**, or any host connected to Azure DevOps.

### 2. Create the pipeline

1. In Azure DevOps: **Pipelines** → **New pipeline**.
2. Select your repo host and repo.
3. Choose **Existing Azure Pipelines YAML file**.
4. Select `/azure-pipelines.yml` → **Continue** → **Run**.

The **Build** stage (install + test) should pass immediately.

### 3. Pipeline parameters

| Parameter | Type | Default | Effect |
|-----------|------|---------|--------|
| `publishPackage` | string (`true`/`false`) | `false` | Enables the Publish stage for that run. |

The **Publish** stage also runs when the pipeline variable **`PublishToArtifacts`** is set to `true`, even if `publishPackage` is `false` (useful when a parent pipeline always sends `false`).

**To trigger a publish run:**
- **At queue time:** click **Run pipeline** → set `publishPackage` to `true`.
- **Via a variable:** add pipeline variable `PublishToArtifacts = true` (**Edit** → **Variables**).

---

## Publish to Azure Artifacts (npm)

### One-time feed setup

1. **Create an Azure Artifacts feed** (or use an existing one).
2. **Add npmjs.org as an upstream source** on the feed so `npm ci` can download public packages through it.
3. **Grant publish permissions** — In **Artifacts** → your feed → **Feed settings** → **Permissions**, add both identities below and set each to **Feed Publisher (Contributor)**:
   - `<YourProject> Build Service (<YourOrg>)` — e.g. `EduStream-AI Build Service (CloudInnovateAzureOrg)`
   - `Project Collection Build Service (<YourOrg>)`

### Bump the version before each publish

Duplicate versions are rejected. Edit `package.json` and increment `version` before each run that publishes.

### Local npm install / publish against the feed

The project `.npmrc` points to the Azure Artifacts feed. To authenticate locally you need a **Personal Access Token (PAT)**.

#### Windows (PowerShell)

1. In Azure DevOps: **User settings** (top-right) → **Personal access tokens** → **New token**.
   - Scope: **Packaging** → **Read & write**.
   - Copy the token.

2. Base64-encode the PAT:
   ```powershell
   [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(":<YOUR_PAT>"))
   ```
   Note the leading colon before the PAT — it is required.

3. Add to `%USERPROFILE%\.npmrc` (create if missing):
   ```
   ; Azure Artifacts auth — replace <ORG> and <FEED> with your values
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:username=anything
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:_password=<BASE64_PAT>
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:email=anything@example.com
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:always-auth=true
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:username=anything
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:_password=<BASE64_PAT>
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:email=anything@example.com
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:always-auth=true
   ```

> **Why not `vsts-npm-auth`?**  
> `vsts-npm-auth` is a Windows-only interactive login helper. The PAT approach above works on all platforms and is preferred for scripted/CI use.

#### CMD (Windows)

Same PAT steps as PowerShell. For base64-encoding without PowerShell:
```cmd
powershell -Command "[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes(':<YOUR_PAT>'))"
```

Then edit `%USERPROFILE%\.npmrc` with Notepad using the same block as above.

#### macOS / Linux (Bash)

1. Create a PAT (same steps as Windows above).

2. Base64-encode (note the leading colon):
   ```bash
   echo -n ":<YOUR_PAT>" | base64
   ```
   Copy the single-line output (no newlines).

3. Add to `~/.npmrc` (create if missing):
   ```
   # Azure Artifacts auth — replace <ORG> and <FEED> with your values
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:username=anything
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:_password=<BASE64_PAT>
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:email=anything@example.com
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/:always-auth=true
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:username=anything
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:_password=<BASE64_PAT>
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:email=anything@example.com
   //pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/:always-auth=true
   ```

### Troubleshooting 403 / AddPackage errors

If `npm publish` fails with `403 Forbidden` and `You need to have 'AddPackage'`:

1. **Both build identities need Feed Publisher** — By default they get Collaborator (read-only). Add both and set to **Feed Publisher (Contributor)**:
   - `<YourProject> Build Service (<YourOrg>)`
   - `Project Collection Build Service (<YourOrg>)`
2. **Check feed scope** — Confirm the feed URL in `.npmrc` matches the feed you granted permissions on (project-scoped vs org-scoped feeds have different URLs).
3. **Pipeline in a different project** — Add the pipeline project's build identity explicitly to the feed permissions.
4. **Job authorization scope** — In **Project settings** → **Pipelines** → **Settings**, review scope restrictions; a very restrictive scope can block the token used by `npmAuthenticate`.
5. **PAT fallback** — Add pipeline secret variable `ARTIFACTS_NPM_PAT` (PAT with Packaging read/write). The pipeline appends PAT-based auth to `.npmrc` immediately before `npm publish`. This bypasses build-identity issues while `npm ci` still uses `npmAuthenticate`.
6. **Duplicate version** — If `1.0.0` already exists in the feed, bump `version` in `package.json` and commit before re-running.

---

## Project layout

```
azure-pipelines.yml      # CI + optional Azure Artifacts npm publish
package.json
.npmrc                   # Feed URL only (no secrets); committed intentionally
src/
  app.js                 # Express app factory (used by tests and server)
  server.js              # Binds to PORT and listens
  productStore.js        # In-memory CRUD store
  index.js               # Package entry for npm consumers
tests/
  products.test.js       # API integration tests
  productStore.test.js   # Unit tests for the store
```

---

## Concepts reference

### CI/CD in one minute

- **Continuous Integration (CI):** Merge code often; each change is built and tested automatically so breaks are caught early.
- **Continuous Delivery (CD):** After CI passes, automate delivery (here: publish to npm; in other labs: App Service, containers, etc.).

### Azure Pipelines building blocks

| Concept | Description |
|---------|-------------|
| **Pipeline** | YAML file (`azure-pipelines.yml`) that defines what runs and when. |
| **Trigger** | What starts a run (push to `main`, pull request, manual). |
| **Stage** | A major phase (Build → Publish). Stages run in order. |
| **Job** | A group of steps that run on one agent (e.g. Ubuntu VM). |
| **Step** | A single action: install Node, run `npm ci`, run tests, etc. |
| **Condition** | Logic such as "only run Publish if Build succeeded **and** `publishPackage == 'true'`." |

### Why `npm ci` in the pipeline?

`npm ci` installs exactly what `package-lock.json` specifies — deterministic and preferred in CI so every run uses the same dependency tree. `npm install` may update the lock file.

### Where to go next

- **Deploy a web app:** Add a stage that deploys to **Azure App Service** (or slots for blue-green swap).
- **Approvals:** Add **environments** with required approvers before production.
- **More gates:** Linters, security scans (`npm audit`), or policy checks as extra steps.
