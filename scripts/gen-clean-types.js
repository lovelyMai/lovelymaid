/**
 * 清理 vue-tsc 生成的 .d.ts 文件，移除 __VLS_* 内部类型噪音
 *
 * 工作方式：
 *   1. 递归扫描 dist/components/ 下所有 .vue.d.ts
 *   2. 保留：imports、Props 接口、export type/interface、v-model、expose、slot props
 *   3. 丢弃：__VLS_* 中间类型
 *   4. 同时清理 index.d.ts 中的 CSS import
 *
 * 用法：在 vue-tsc --declaration --emitDeclarationOnly 完成后运行
 *   node scripts/gen-clean-types.js
 */
import { readdir, readFile, writeFile, stat } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')

// ─── 工具：在大括号/尖括号平衡后查找结束位置 ───

/** 从 content 的 start 位置往后找，返回第一个匹配的块 */
function extractBraced(content, start, open, close) {
  let depth = 0
  let begun = false
  for (let i = start; i < content.length; i++) {
    if (content[i] === open) { depth++; begun = true }
    else if (content[i] === close) { depth--; if (begun && depth === 0) return i + 1 }
  }
  return null
}

// ─── 信息提取函数 ───

/** 提取所有非 __VLS、非 vue 自身的 import */
function parseImports(content) {
  const result = []
  const re = /^(?:import|import type) \{[\s\S]*?\} from ['"]\.\.[^'"]+['"];?/gm
  let m
  while ((m = re.exec(content)) !== null) {
    if (!m[0].includes('__VLS')) result.push(m[0])
  }
  return [...new Set(result)]
}

/** 提取 Props 接口 */
function parseProps(content) {
  const m = content.match(/(interface Props \{[\s\S]*?^\})/m)
  return m ? m[1] : null
}

/** 提取 export type / export interface（排除 __VLS 和 Props） */
function parseExportTypes(content) {
  const types = []
  const re = /^export (?:type|interface) \w+/gm
  let m
  while ((m = re.exec(content)) !== null) {
    const label = m[0]
    if (label.includes('__VLS') || label === 'export interface Props') continue

    const lineStart = content.lastIndexOf('\n', m.index) + 1
    const isType = label.startsWith('export type')
    const end = isType
      ? extractBraced(content, m.index, '{', '}') ?? extractBraced(content, m.index, '<', '>')
      : extractBraced(content, m.index, '{', '}')
    if (end) {
      types.push(content.slice(lineStart, end).trim())
    }
  }
  return types
}

/** 从 __VLS_ModelProps 提取 v-model 字段 */
function parseModelProps(content) {
  const m = content.match(/type __VLS_ModelProps = \{\s*([\s\S]*?)\s*\};/)
  if (!m) return []
  return m[1].split('\n').map(l => l.trim()).filter(Boolean)
}

/** 从 __VLS_base 的第二个泛型参数提取 expose 方法 */
function parseExposeMethods(content) {
  // DefineComponent<Props, { focus: () => void; blur: () => void; ... }, {}, ...>
  const m = content.match(
    /declare const __VLS_base:.*?DefineComponent<[\s\S]*?,\s*\{\s*([\s\S]*?)\s*\},/
  )
  if (!m) return []
  return m[1]
    .split(/;\s*\n/)
    .map(l => l.trim().replace(/^import\("vue"\)\.\w+\./, ''))
    .filter(l => l && !l.includes('__VLS') && !l.includes('import('))
}

/** 从 __VLS_Slots 提取 slot props（如 Menu 的 v-slot="{ item, index }"） */
function parseSlotProps(content) {
  // 收集所有 __VLS_XX 变量（slot prop 的类型定义）
  const varMap = new Map()
  const varRe = /declare var (__VLS_\d+):\s*(\{[^}]+\})/g
  let m
  while ((m = varRe.exec(content)) !== null) varMap.set(m[1], m[2])

  // 找到 __VLS_Slots 中引用了哪个 __VLS_XX
  const slotsM = content.match(
    /type __VLS_Slots\s*=\s*\{\}\s*&?\s*\{\s*default\?:\s*\(props:\s*(typeof __VLS_\d+)\)\s*=>\s*any;?\s*\}/
  )
  if (!slotsM) return null
  return varMap.get(slotsM[1]) ?? null
}

// ─── 主清理函数 ───

function cleanVueDTS(content) {
  // 已经清理过（没有 __VLS_ 特征）则跳过
  if (!content.includes('__VLS_')) return content

  const imports = parseImports(content)
  const propsBlock = parseProps(content)
  const exportTypes = parseExportTypes(content)
  const modelFields = parseModelProps(content)
  const exposeMethods = parseExposeMethods(content)
  const slotProps = parseSlotProps(content)

  // 构建 Props 类型（含 v-model 合并）
  let propsType = 'Props'
  if (modelFields.length > 0) {
    propsType = 'Props & {\n' + modelFields.map(f => '  ' + f).join('\n') + '\n}'
  }

  // 构建组件类型签名
  const hasExpose = exposeMethods.length > 0
  let componentType
  if (hasExpose) {
    componentType = `DefineComponent<${propsType}, {}, {}, {}, {}, {}, {}, {}> & {\n  new(): {\n` +
      exposeMethods.map(l => `    ${l};`).join('\n') + '\n  }\n}'
  } else {
    componentType = `DefineComponent<${propsType}>`
  }

  // 组装最终内容
  const result = []
  if (imports.length > 0) result.push(imports.join('\n'))
  result.push(`import type { DefineComponent } from 'vue'`)
  result.push('')
  if (exportTypes.length > 0) {
    result.push(exportTypes.join('\n'))
    result.push('')
  }
  if (propsBlock) {
    result.push(propsBlock)
  } else {
    // 容错：没有 Props 接口时报错提示，但保留原始内容中的 interface
    const fallback = content.match(/(interface \w+ \{[\s\S]*?^\})/m)
    if (fallback) result.push(fallback[0])
  }
  if (slotProps) {
    result.push('')
    result.push(`declare var __VLS_slotProps: ${slotProps}`)
  }
  result.push('')
  result.push(`declare const _default: ${componentType}`)
  result.push(`export default _default`)
  result.push('')

  return result.join('\n')
}

// ─── 递归扫描所有子目录 ───

async function findVueDtsFiles(dir) {
  const result = []
  const entries = await readdir(dir, { withFileTypes: true })
  for (const entry of entries) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...await findVueDtsFiles(full))
    } else if (entry.name.endsWith('.vue.d.ts') && !entry.name.startsWith('_')) {
      result.push(full)
    }
  }
  return result
}

// ─── 入口 ───

async function main() {
  const dtsFiles = await findVueDtsFiles(join(distDir, 'components'))
  console.log(`找到 ${dtsFiles.length} 个 .vue.d.ts 文件`)

  let cleaned = 0
  for (const filePath of dtsFiles) {
    const content = await readFile(filePath, 'utf-8')
    const clean = cleanVueDTS(content)
    if (clean !== content) {
      await writeFile(filePath, clean, 'utf-8')
      cleaned++
      const rel = join('dist', filePath.slice(distDir.length + 1))
      console.log(`  ✅ ${rel}`)
    } else if (content.includes('__VLS_')) {
      const rel = join('dist', filePath.slice(distDir.length + 1))
      console.log(`  ⚠️  ${rel} — 有 __VLS_ 但清理失败，保留原样`)
    }
  }

  // 清理 index.d.ts: 移除 CSS import
  const indexPath = join(distDir, 'index.d.ts')
  if (await stat(indexPath).then(() => true).catch(() => false)) {
    const idxContent = await readFile(indexPath, 'utf-8')
    const cleanedIndex = idxContent
      .split('\n')
      .filter(l => !l.includes("import '@/assets/styles/") && !l.includes("import '@/assets/icons/"))
      .join('\n')
    if (cleanedIndex !== idxContent) {
      await writeFile(indexPath, cleanedIndex, 'utf-8')
      console.log('  ✅ dist/index.d.ts (移除 CSS 导入)')
    }
  }

  console.log(`\n✨ 清理完成: ${cleaned} 个文件`)
}

main().catch(console.error)
