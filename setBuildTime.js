import fs from 'fs'
import path from 'path'

const buildTime = Date.now().toString().slice(-3)
const content = `export const buildTime = '${buildTime}';\n`

fs.writeFileSync(path.resolve('src/buildTime.ts'), content)
console.log(`Build time set to ${buildTime}`)
