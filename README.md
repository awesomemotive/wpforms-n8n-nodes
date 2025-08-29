## n8n WPForms Trigger node

NPM package name: `n8n-nodes-wpforms`

This repository contains custom n8n nodes for WPForms integration, providing triggers and actions to automate workflows with WPForms data.

## Prerequisites

You need the following installed on your development machine:

* [git](https://git-scm.com/downloads)
* Node.js and npm. Minimum version Node 20. You can find instructions on how to install both using nvm (Node Version Manager) for Linux, Mac, and WSL [here](https://github.com/nvm-sh/nvm). For Windows users, refer to Microsoft's guide to [Install NodeJS on Windows](https://docs.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-windows).
* Install n8n with:
  ```
  npm install n8n -g
  ```
* Recommended: follow n8n's guide to [set up your development environment](https://docs.n8n.io/integrations/creating-nodes/build/node-development-environment/).

## Build and Install the Node Package 📦

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```
This command will:
- Clean the `dist` directory
- Compile TypeScript files
- Build icons using gulp
- Generate the distributable files

### 3. Link the Package Locally
```bash
npm link
```

### 4. Set Up Custom Nodes Directory
```bash
# Create custom directory in n8n home
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom

# Initialize npm in the custom directory
npm init -y
```

### 5. Link Node to n8n Instance
```bash
# Link your custom node to n8n (run from ~/.n8n/custom)
npm link n8n-nodes-wpforms
```

### 6. Configure n8n Environment
Set the environment variable to tell n8n where to find custom nodes:

**For Linux/Mac:**
```bash
export N8N_CUSTOM_EXTENSIONS="$HOME/.n8n/custom"
```

**For Windows (PowerShell):**
```powershell
$env:N8N_CUSTOM_EXTENSIONS="$HOME\.n8n\custom"
```

### 7. Start n8n
```bash
n8n start
```

### 8. Verify Installation
1. Open n8n in your browser (usually `http://localhost:5678`)
2. Look for your custom nodes in the node palette
3. You should see "WPForms" nodes available

## Development Workflow 🔧

For ongoing development:

```bash
# Watch for changes during development
npm run dev

# Build and link after changes
npm run build
npm link
```

## Testing Your Node 🧪

```bash
# Check for linting errors
npm run lint

# Auto-fix linting errors when possible
npm run lintfix
```

## More information

Refer to our [documentation on creating nodes](https://docs.n8n.io/integrations/creating-nodes/) for detailed information on building your own nodes.

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
