import fs from 'fs'
import path from 'path'

export function loadClassesFrom(dir: string): any[] {
  const result: any[] = []
  const entries = fs.readdirSync(dir, { withFileTypes: true })

  entries.forEach(entry => {
    const fullPath = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      result.push(...loadClassesFrom(fullPath))
      return
    }

    if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.js'))) {
      const imported = require(fullPath)

      if (imported.default) {
        result.push(imported.default)
      }

      Object.values(imported).forEach(v => {
        if (typeof v === 'function') {
          result.push(v)
        }
      })
    }
  })

  return result
}
