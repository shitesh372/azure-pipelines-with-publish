# Azure Pipelines demo: Express products API

This repository is a small **hands-on example** for learning **Azure DevOps Pipelines** with a real Node.js app: an Express REST API for products, automated tests, and an optional **npm publish** stage.

---

## What you will learn

| Topic | How this repo demonstrates it |
|--------|-------------------------------|
| **CI (continuous integration)** | Every push or PR runs install + tests on a clean agent. |
| **Pipeline stages** | **Build** (install + test) runs first; **Publish** runs only when you opt in. |
| **Triggers** | Commits to `main` / `master` run the pipeline; PRs run validation too. |
| **Quality gate** | Tests must pass before the Publish stage is allowed to run. |
| **Secrets** | No npm password in git: the **`npm authenticate`** task adds short-lived credentials for your Azure Artifacts feed during the run. |
| **npm publish** | Optional stage runs **`npm publish`** to your **Azure Artifacts** feed (see `publishConfig` in `package.json`). |

This aligns with classroom themes such as pipeline stages (build, test, release), triggers (CI vs PR), approvals and gates (tests as a gate; optional manual approvals in Azure DevOps UI), and shipping artifacts (npm package).

---

## Concepts (short reference)

### CI/CD in one minute

- **Continuous Integration (CI):** Merge code often; each change is built and tested automatically so breaks are caught early.
- **Continuous Delivery / Deployment (CD):** After CI passes, you automate delivery to an environment (here: publishing to npm; in other labs: App Service, containers, etc.).

### Azure Pipelines building blocks

1. **Pipeline** — YAML file (`azure-pipelines.yml`) that defines what runs and when.
2. **Trigger** — What starts a run (e.g. push to `main`, or a pull request).
3. **Stage** — A major phase (e.g. Build, then Publish). Stages run in order unless you parallelize.
4. **Job** — A group of steps that run on one agent (e.g. Ubuntu VM).
5. **Step** — A single action: install Node, run `npm ci`, run tests, etc.
6. **Condition** — Logic such as “only run Publish if Build succeeded **and** I chose to publish.”

### Why `npm ci` in the pipeline?

`npm ci` installs exactly what `package-lock.json` specifies. It is **deterministic** and preferred in CI so every run uses the same dependency tree.

### npm publish to Azure Artifacts

The repo includes a **committed** `.npmrc` with only the **feed URL** and `always-auth=true` (no secrets). In the pipeline, the **`npmAuthenticate@0`** task runs before `npm ci` and before `npm publish`, and injects credentials for the same Azure DevOps organization.

**Feed setup:** Enable **npmjs.org** as an **upstream source** on the feed so `npm ci` can install public packages (`express`, `jest`, etc.) through the feed.

**Permissions:** In **Artifacts** → your feed → **Feed settings** → **Permissions**, allow **Project Collection Build Service** (and/or your project’s **Build Service**) to **Contributor** or **Feed Publisher** as required so the pipeline can read and publish packages.

### Azure Artifacts on your Mac (why `vsts-npm-auth` fails)

If you see `zsh: command not found: vsts-npm-auth`, the tool is simply **not installed**. Installing it is **not** the recommended path on macOS:

- **`vsts-npm-auth`** is aimed at **Windows** in Microsoft’s “Connect to feed” flow. On **macOS and Linux**, Azure DevOps expects you to use a **Personal Access Token (PAT)** in your **user-level** `~/.npmrc`, not a separate login executable.
- Keep **only the feed URL** (and `always-auth=true`) in the **project** `.npmrc` so it can be committed. Put **credentials** in **`~/.npmrc`** so they are never committed.

**Steps:**

1. In Azure DevOps: **User settings** → **Personal access tokens** → create a token with **Packaging** read/write (and scope it to your organization).
2. Base64-encode the PAT (macOS):

   ```bash
   echo -n "YOUR_PASTE_TOKEN_HERE" | base64
   ```

   Copy the single line of output (no newlines in the token when encoding).

3. In **`~/.npmrc`**, add the **auth token block** from **Artifacts** → your feed → **Connect to feed** → **npm** → **Other** (non-Windows). Use your organization and feed names in the URLs. For an **organization-scoped** feed whose registry looks like  
   `https://pkgs.dev.azure.com/<ORG>/_packaging/<FEED>/npm/registry/`,  
   the block includes lines for both `.../npm/registry/` and `.../npm/` (see [Connect to an Azure Artifacts feed – npm](https://learn.microsoft.com/en-us/azure/devops/artifacts/npm/npmrc?view=azure-devops&tabs=other)).
4. Replace `[BASE64_ENCODED_PERSONAL_ACCESS_TOKEN]` with the value from step 2.

After that, `npm install` and `npm publish` against that feed work without `vsts-npm-auth`.

---

## Prerequisites

- **Node.js** 18 or newer (pipeline uses 20.x).
- **npm** (comes with Node).
- For **Azure DevOps**: an organization, a project, and permission to create pipelines and secrets.

---

## Run the code locally

### 1. Install dependencies

```bash
npm install
```

### 2. Start the server

```bash
npm start
```

Default URL: `http://localhost:3000`  
Override the port:

```bash
PORT=4000 npm start
```

### 3. Try the API (examples with `curl`)

**Health check**

```bash
curl -s http://localhost:3000/health
```

**List products** (empty at first)

```bash
curl -s http://localhost:3000/api/products
```

**Create a product**

```bash
curl -s -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Notebook","price":12.5,"description":"Lined A5"}'
```

**Get one product** (use the `id` from the create response)

```bash
curl -s http://localhost:3000/api/products/1
```

**Update**

```bash
curl -s -X PUT http://localhost:3000/api/products/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Notebook Pro","price":15}'
```

**Delete**

```bash
curl -s -X DELETE http://localhost:3000/api/products/1 -w "\nHTTP %{http_code}\n"
```

### API summary

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/health` | Liveness: `{ "status": "ok" }` |
| `GET` | `/api/products` | List all products |
| `GET` | `/api/products/:id` | Get one; `404` if missing |
| `POST` | `/api/products` | Create; body needs `name`, numeric `price`; optional `description` |
| `PUT` | `/api/products/:id` | Update; partial updates allowed |
| `DELETE` | `/api/products/:id` | Delete; `204` on success |

Data is **in memory** only (for teaching simplicity); restarting the server clears products.

---

## Tests

```bash
npm test
```

With coverage:

```bash
npm run test:coverage
```

Tests use **Jest** and **Supertest** (HTTP assertions against the Express app without a manual browser).

---

## Wire up Azure Pipelines

1. Push this repository to **Azure Repos**, **GitHub**, or another supported host connected to Azure DevOps.
2. In Azure DevOps: **Pipelines** → **New pipeline** → select the repo → **Existing Azure Pipelines YAML file** → choose `/azure-pipelines.yml`.
3. Run the pipeline. The **Build** stage should pass (install + test).
4. Ensure the **Azure Artifacts** feed has **npmjs.org** upstream and the **build identities** can use the feed (see *npm publish to Azure Artifacts* above).
5. To publish: **Run pipeline** and set **Publish package to Azure Artifacts** to **true**. Bump **`version`** in `package.json` before each publish (duplicate versions are rejected).

**Runtime parameter `publishPackage`:** Default is **`false`**, so a normal CI run only executes **Build** (install + test). If a **parent pipeline** passes `publishPackage: false` (or leaves the default), the **Publish** stage is skipped on purpose. To publish from a parent, pass **`publishPackage: true`** in that pipeline’s parameters (for `extends` / template) or run this pipeline manually and set the parameter to **true**.

For **local** `npm install` against this feed, add your Personal Access Token to **`~/.npmrc`** (auth block); keep secrets out of the committed project `.npmrc`.

---

## Project layout

```
azure-pipelines.yml   # CI + optional Azure Artifacts npm publish
package.json
src/
  app.js              # Express app factory (used by tests and server)
  server.js           # Binds to PORT and listens
  productStore.js     # In-memory CRUD store
  index.js            # Package entry for npm consumers
tests/
  products.test.js    # API tests
  productStore.test.js
```

---

## Where to go next (outside this repo)

- **Deploy a web app:** Add a stage that deploys to **Azure App Service** (or slots for **blue-green** / swap).
- **Approvals:** Add **environments** with required approvers before production.
- **More gates:** Linters, security scans (`npm audit`), or policy checks as extra steps or stages.

This README is enough to **teach the ideas**, **run the server**, **exercise the API**, and **connect Azure Pipelines** with optional npm publishing.
