import { Express, Request, Response } from 'express'
import { MedicalTools } from '../tools/medicalTools'

interface ToolParam {
  type: string
  description?: string
  enum?: string[]
  pattern?: string
  format?: string
  minimum?: number
  maximum?: number
  nullable?: boolean
  items?: any
  default?: any
}

interface ToolDef {
  type: string
  title: string
  description: string
  function: {
    name: string
    description: string
    parameters: {
      type: string
      properties: Record<string, ToolParam>
      required?: string[]
    }
  }
}

/**
 * GET /mcp/tools.json - Returns all MCP tool schemas as JSON
 */
function getToolsJson(_req: Request, res: Response): void {
  const tools = (MedicalTools as unknown as ToolDef[]).map((tool) => ({
    name: tool.function.name,
    category: tool.title,
    description: tool.function.description,
    parameters: tool.function.parameters,
  }))
  res.json({ tools, count: tools.length })
}

/**
 * GET /mcp/docs - Serves interactive HTML documentation page
 */
function getDocsHtml(_req: Request, res: Response): void {
  const tools = MedicalTools as unknown as ToolDef[]

  // Group tools by category
  const grouped: Record<string, ToolDef[]> = {}
  for (const tool of tools) {
    const cat = tool.title || 'other'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(tool)
  }

  const categoryColors: Record<string, string> = {
    patient: '#3b82f6',
    doctor: '#8b5cf6',
    appointment: '#10b981',
    lead: '#f59e0b',
    task: '#ef4444',
    other: '#6b7280',
  }

  function renderParam(name: string, param: ToolParam, isRequired: boolean): string {
    let badges = ''
    if (isRequired) badges += `<span class="badge required">required</span>`
    if (param.nullable) badges += `<span class="badge nullable">nullable</span>`
    if (param.format) badges += `<span class="badge format">${param.format}</span>`

    let constraints = ''
    if (param.enum) constraints += `<div class="constraint">Enum: <code>${param.enum.join(' | ')}</code></div>`
    if (param.pattern) constraints += `<div class="constraint">Pattern: <code>${param.pattern}</code></div>`
    if (param.minimum !== undefined) constraints += `<div class="constraint">Min: <code>${param.minimum}</code></div>`
    if (param.maximum !== undefined) constraints += `<div class="constraint">Max: <code>${param.maximum}</code></div>`
    if (param.default !== undefined) constraints += `<div class="constraint">Default: <code>${param.default}</code></div>`
    if (param.items) {
      const itemType = typeof param.items === 'object' ? param.items.type || 'any' : param.items
      constraints += `<div class="constraint">Items: <code>${itemType}</code></div>`
    }

    return `
      <div class="param">
        <div class="param-header">
          <code class="param-name">${name}</code>
          <span class="param-type">${param.type}${param.items ? '[]' : ''}</span>
          ${badges}
        </div>
        <div class="param-desc">${param.description || ''}</div>
        ${constraints}
      </div>`
  }

  function renderTool(tool: ToolDef): string {
    const params = tool.function.parameters.properties || {}
    const required = tool.function.parameters.required || []
    const color = categoryColors[tool.title] || categoryColors.other

    const paramHtml = Object.entries(params)
      .sort(([a], [b]) => {
        const aReq = required.includes(a) ? 0 : 1
        const bReq = required.includes(b) ? 0 : 1
        return aReq - bReq || a.localeCompare(b)
      })
      .map(([name, param]) => renderParam(name, param, required.includes(name)))
      .join('')

    return `
      <div class="tool-card" id="tool-${tool.function.name}">
        <div class="tool-header">
          <div class="tool-title-row">
            <span class="category-badge" style="background:${color}">${tool.title}</span>
            <h3 class="tool-name">${tool.function.name}</h3>
          </div>
          <button class="copy-btn" onclick="copyToolName('${tool.function.name}')" title="Copy tool name">Copy</button>
        </div>
        <p class="tool-desc">${tool.function.description}</p>
        ${Object.keys(params).length > 0 ? `
          <div class="params-section">
            <h4>Parameters</h4>
            ${paramHtml}
          </div>
        ` : '<p class="no-params">No parameters</p>'}
      </div>`
  }

  const categorySections = Object.entries(grouped)
    .map(([cat, catTools]) => {
      const color = categoryColors[cat] || categoryColors.other
      return `
        <div class="category-section" id="cat-${cat}">
          <h2 class="category-title" style="border-left: 4px solid ${color}; padding-left: 12px;">
            ${cat.charAt(0).toUpperCase() + cat.slice(1)} Tools
            <span class="tool-count">${catTools.length}</span>
          </h2>
          ${catTools.map(renderTool).join('')}
        </div>`
    })
    .join('')

  const navLinks = Object.entries(grouped)
    .map(([cat, catTools]) => {
      const color = categoryColors[cat] || categoryColors.other
      return `<a href="#cat-${cat}" class="nav-link" style="border-left: 3px solid ${color}">
        ${cat.charAt(0).toUpperCase() + cat.slice(1)} <span class="nav-count">${catTools.length}</span>
      </a>`
    })
    .join('')

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anantai MCP Tools - API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; color: #1e293b; }
    .layout { display: flex; min-height: 100vh; }

    /* Sidebar */
    .sidebar { width: 260px; background: #1e293b; color: #cbd5e1; padding: 24px 0; position: fixed; top: 0; left: 0; bottom: 0; overflow-y: auto; }
    .sidebar-header { padding: 0 20px 20px; border-bottom: 1px solid #334155; }
    .sidebar-header h1 { font-size: 18px; color: #f1f5f9; margin-bottom: 4px; }
    .sidebar-header p { font-size: 12px; color: #94a3b8; }
    .nav-section { padding: 16px 20px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; }
    .nav-link { display: flex; justify-content: space-between; align-items: center; padding: 8px 20px; font-size: 14px; color: #cbd5e1; text-decoration: none; transition: background 0.15s; }
    .nav-link:hover { background: #334155; color: #f1f5f9; }
    .nav-count { font-size: 11px; background: #334155; padding: 2px 8px; border-radius: 10px; }
    .nav-link-json { display: block; padding: 8px 20px; font-size: 13px; color: #94a3b8; text-decoration: none; margin-top: 8px; }
    .nav-link-json:hover { color: #f1f5f9; }

    /* Main content */
    .main { margin-left: 260px; padding: 32px 40px; flex: 1; max-width: 900px; }

    /* Header */
    .page-header { margin-bottom: 32px; }
    .page-header h1 { font-size: 28px; margin-bottom: 8px; }
    .page-header p { color: #64748b; font-size: 15px; }
    .stats { display: flex; gap: 16px; margin-top: 16px; }
    .stat { background: white; padding: 12px 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
    .stat-value { font-size: 24px; font-weight: 700; color: #0f172a; }
    .stat-label { font-size: 12px; color: #64748b; }

    /* Search */
    .search-box { margin-bottom: 24px; }
    .search-box input { width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 14px; background: white; outline: none; }
    .search-box input:focus { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.1); }

    /* Category */
    .category-section { margin-bottom: 40px; }
    .category-title { font-size: 20px; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    .tool-count { font-size: 12px; background: #e2e8f0; padding: 2px 8px; border-radius: 10px; font-weight: 500; }

    /* Tool card */
    .tool-card { background: white; border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 16px; transition: box-shadow 0.15s; }
    .tool-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.06); }
    .tool-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
    .tool-title-row { display: flex; align-items: center; gap: 10px; }
    .tool-name { font-size: 16px; font-weight: 600; color: #0f172a; }
    .tool-desc { color: #475569; font-size: 14px; line-height: 1.5; margin-bottom: 16px; }
    .category-badge { font-size: 11px; padding: 3px 10px; border-radius: 12px; color: white; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
    .copy-btn { background: #f1f5f9; border: 1px solid #e2e8f0; padding: 4px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; color: #64748b; }
    .copy-btn:hover { background: #e2e8f0; }

    /* Parameters */
    .params-section h4 { font-size: 13px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
    .param { padding: 10px 0; border-bottom: 1px solid #f1f5f9; }
    .param:last-child { border-bottom: none; }
    .param-header { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .param-name { font-size: 14px; font-weight: 600; color: #0f172a; background: #f1f5f9; padding: 2px 8px; border-radius: 4px; }
    .param-type { font-size: 12px; color: #3b82f6; font-weight: 500; }
    .param-desc { font-size: 13px; color: #64748b; margin-top: 4px; }
    .badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; }
    .badge.required { background: #fef2f2; color: #dc2626; }
    .badge.nullable { background: #fefce8; color: #ca8a04; }
    .badge.format { background: #eff6ff; color: #2563eb; }
    .constraint { font-size: 12px; color: #94a3b8; margin-top: 2px; }
    .constraint code { background: #f1f5f9; padding: 1px 6px; border-radius: 3px; font-size: 11px; }
    .no-params { color: #94a3b8; font-size: 13px; font-style: italic; }

    /* Toast */
    .toast { position: fixed; bottom: 24px; right: 24px; background: #0f172a; color: white; padding: 10px 20px; border-radius: 8px; font-size: 13px; display: none; z-index: 1000; }
    .toast.show { display: block; animation: fadeIn 0.2s; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    /* MCP endpoint info */
    .endpoint-info { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .endpoint-info h4 { font-size: 14px; color: #166534; margin-bottom: 8px; }
    .endpoint-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 13px; }
    .method-badge { font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 700; color: white; }
    .method-post { background: #3b82f6; }
    .method-get { background: #10b981; }
    .endpoint-path { font-family: monospace; color: #166534; }

    @media (max-width: 768px) {
      .sidebar { display: none; }
      .main { margin-left: 0; padding: 16px; }
    }
  </style>
</head>
<body>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>Anantai MCP</h1>
        <p>Tool Documentation</p>
      </div>
      <div class="nav-section">Categories</div>
      ${navLinks}
      <a href="/mcp/tools.json" class="nav-link-json" target="_blank">View Raw JSON &rarr;</a>
    </aside>
    <main class="main">
      <div class="page-header">
        <h1>MCP Tools Documentation</h1>
        <p>All available Model Context Protocol tools for Anantai agents, copilot, and external integrations.</p>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${tools.length}</div>
            <div class="stat-label">Total Tools</div>
          </div>
          <div class="stat">
            <div class="stat-value">${Object.keys(grouped).length}</div>
            <div class="stat-label">Categories</div>
          </div>
        </div>
      </div>

      <div class="endpoint-info">
        <h4>MCP Server Endpoints</h4>
        <div class="endpoint-row"><span class="method-badge method-post">POST</span> <span class="endpoint-path">/mcp/all</span> — All tools (single server)</div>
        <div class="endpoint-row"><span class="method-badge method-post">POST</span> <span class="endpoint-path">/mcp/patient</span> — Patient tools only</div>
        <div class="endpoint-row"><span class="method-badge method-post">POST</span> <span class="endpoint-path">/mcp/doctor</span> — Doctor tools only</div>
        <div class="endpoint-row"><span class="method-badge method-post">POST</span> <span class="endpoint-path">/mcp/lead</span> — Lead tools only</div>
        <div class="endpoint-row"><span class="method-badge method-post">POST</span> <span class="endpoint-path">/mcp/appointment</span> — Appointment tools only</div>
        <div class="endpoint-row"><span class="method-badge method-get">GET</span> <span class="endpoint-path">/mcp/tools.json</span> — Tool schemas (JSON)</div>
        <div class="endpoint-row"><span class="method-badge method-get">GET</span> <span class="endpoint-path">/mcp/agents</span> — List agents</div>
      </div>

      <div class="search-box">
        <input type="text" id="search" placeholder="Search tools by name, category, or description..." oninput="filterTools(this.value)">
      </div>

      <div id="tools-container">
        ${categorySections}
      </div>
    </main>
  </div>

  <div class="toast" id="toast">Copied!</div>

  <script>
    function copyToolName(name) {
      navigator.clipboard.writeText(name);
      const toast = document.getElementById('toast');
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 1500);
    }

    function filterTools(query) {
      const q = query.toLowerCase();
      document.querySelectorAll('.tool-card').forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? '' : 'none';
      });
      document.querySelectorAll('.category-section').forEach(section => {
        const visible = section.querySelectorAll('.tool-card[style=""], .tool-card:not([style])');
        section.style.display = visible.length > 0 ? '' : 'none';
      });
    }
  </script>
</body>
</html>`

  res.setHeader('Content-Type', 'text/html')
  res.send(html)
}

/**
 * Register MCP documentation routes
 */
export function addMcpDocs(app: Express): void {
  app.get('/mcp/docs', getDocsHtml)
  app.get('/mcp/tools.json', getToolsJson)
}
