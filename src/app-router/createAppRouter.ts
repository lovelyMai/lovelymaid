import { ref, computed, watch, markRaw, reactive, App } from 'vue'
import RouterView from './RouterView.vue'
import { throttle } from '@/utils/common'

/* =============================
   类型定义
============================= */

export interface RouteConfig {
  path: string
  component: any | (() => Promise<any>)
  props?: ((route: { params: Record<string, string>, query: Record<string, string> }) => Record<string, any>) | Record<string, any>
  children?: RouteConfig[]
}

export interface RouteLocation {
  path: string
  query?: Record<string, any>
}

export interface MultiHistoryOptions {
  tabs: string[]
  defaultTab?: string
  routes: Record<string, RouteConfig>
}

export interface CachedComponent {
  value: any
  path: string
  props: Record<string, any>
}

export interface HistoryStack {
  readonly activeTab: string
  readonly currentPath: string
  readonly allComponents: CachedComponent[]
  readonly currentStack: CachedComponent[]
  readonly params: Record<string, string>
  readonly query: Record<string, string>

  switchTab(tab: string): void
  push(path: string | RouteLocation): void
  pop(): void
  nav(path: string | RouteLocation): boolean
  setQuery(query: Record<string, any>): void
  pathIn(path: string): boolean
  onPush(callback: () => void): void
  onPop(callback: () => void): void
  install(app: App): void
}

/* =============================
   工具函数
============================= */

// 解析完整路径为 path 和 query
function parseFullPath(fullPath: string): { path: string, query: Record<string, string>, search: string } {
  const [path, search] = fullPath.split('?')
  const params = new URLSearchParams(search || '')
  const query: Record<string, string> = {}
  params.forEach((value, key) => { query[key] = value })
  return { path: path || '/', query, search: search ? `?${search}` : '' }
}

// 将 path 和 query 组合成完整路径
function buildFullPath(path: string, query?: Record<string, any>): string {
  if (!query || Object.keys(query).length === 0) return path
  const params = new URLSearchParams()
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  })
  const queryString = params.toString()
  return queryString ? `${path}?${queryString}` : path
}

// 标准化路径（处理空格、自动补全标签页前缀）
function normalizePath(input: string, activeTab: string, currentPath: string): string {
  let path: string
  if (input.startsWith('/')) {
    path = input
  } else {
    const basePath = currentPath || '/' + activeTab
    const segments = basePath.split('/').filter(s => s)
    const inputSegments = input.split('/').filter(s => s)

    for (const seg of inputSegments) {
      if (seg === '..') {
        if (segments.length > 0) segments.pop()
      } else if (seg === '.') {
        continue
      } else {
        segments.push(seg)
      }
    }
    path = '/' + segments.join('/')
  }
  return path.replace(/\s+/g, '-')
}

// 组件缓存
const componentCache = new Map<string, any>()

async function resolveComponent(component: any | (() => Promise<any>)) {
  if (typeof component === 'function') {
    const key = component.toString()
    if (componentCache.has(key)) return componentCache.get(key)
    const mod = await component()
    const resolved = markRaw(mod.default || mod)
    componentCache.set(key, resolved)
    return resolved
  }
  return markRaw(component)
}

// 路径匹配器
function compilePath(path: string) {
  const keys: string[] = []
  const pattern = path.replace(/\/$/, '').replace(/:([^/]+)/g, (_, key) => {
    keys.push(key)
    return '([^/]+)'
  })
  const regex = new RegExp(`^${pattern}$`)
  return { regex, keys }
}

type FlatRouteRecord = {
  fullPath: string
  config: RouteConfig
  regex: RegExp
  keys: string[]
  tab: string
}

function flattenRoutes(routes: Record<string, RouteConfig>) {
  const list: FlatRouteRecord[] = []
  function walk(route: RouteConfig, parentPath = '', tab?: string) {
    const full = (parentPath + '/' + route.path).replace(/\/+/g, '/')
    const { regex, keys } = compilePath(full)
    const currentTab = tab || full.split('/')[1]
    list.push({ fullPath: full, config: route, regex, keys, tab: currentTab })
    route.children?.forEach(child => walk(child, full, currentTab))
  }
  Object.entries(routes).forEach(([tab, r]) => walk(r, '', tab))
  return list
}

// 全局引用，供外部 popNow 使用
let globalPopNow: (() => void) | undefined

/* =============================
   核心工厂函数
============================= */

export default function createAppRouter(options: MultiHistoryOptions): HistoryStack {
  const { tabs, routes, defaultTab = tabs[0] } = options
  const flatRoutes = flattenRoutes(routes)

  // ========== 锁状态管理 ==========
  let popLock = false
  let pushLock = false
  let popTimer: ReturnType<typeof setTimeout> | null = null
  let pushTimer: ReturnType<typeof setTimeout> | null = null

  function clearPopLock() {
    popLock = false
    if (popTimer) {
      clearTimeout(popTimer)
      popTimer = null
    }
  }

  function clearPushLock() {
    pushLock = false
    if (pushTimer) {
      clearTimeout(pushTimer)
      pushTimer = null
    }
  }

  function setPopLock() {
    popLock = true
    if (popTimer) clearTimeout(popTimer)
    popTimer = setTimeout(() => {
      popLock = false
      popTimer = null
    }, 300)
  }

  function setPushLock() {
    pushLock = true
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      pushLock = false
      pushTimer = null
    }, 300)
  }

  // ========== 回调管理 ==========
  const pushCallbacks: (() => void)[] = []
  const popCallbacks: (() => void)[] = []

  function onPush(callback: () => void) {
    pushCallbacks.push(callback)
  }

  function onPop(callback: () => void) {
    popCallbacks.push(callback)
  }

  function triggerPushCallbacks() {
    pushCallbacks.forEach(cb => cb())
  }

  function triggerPopCallbacks() {
    popCallbacks.forEach(cb => cb())
  }

  // ========== 路由匹配 ==========
  function match(pathWithoutQuery: string) {
    for (const r of flatRoutes) {
      const m = r.regex.exec(pathWithoutQuery)
      if (!m) continue
      const params: Record<string, string> = {}
      r.keys.forEach((k, i) => (params[k] = m[i + 1]))
      return { route: r.config, params, tab: r.tab }
    }
    return null
  }

  // ========== 状态定义 ==========
  type HistoryEntry = { fullPath: string, params: Record<string, string> }
  const stacks = ref<Record<string, HistoryEntry[]>>(
    Object.fromEntries(tabs.map(t => [t, []]))
  )
  const activeTab = ref(defaultTab)
  const historyStack = computed(() => stacks.value[activeTab.value])

  // 当前完整路径
  const currentFullPath = computed(() => {
    const stack = historyStack.value
    return stack.length ? stack[stack.length - 1].fullPath : ''
  })

  const currentPath = computed(() => {
    if (!currentFullPath.value) return ''
    return parseFullPath(currentFullPath.value).path
  })

  // 当前 query 参数
  const query = computed(() => parseFullPath(currentFullPath.value).query)

  // 当前 params 参数
  const params = computed(() => {
    const m = match(currentPath.value)
    if (!m) return {}
    const result: Record<string, string> = {}
    Object.entries(m.params).forEach(([k, v]) => { result[k] = v.replace(/-/g, ' ') })
    return result
  })

  // 所有标签页栈中的所有组件（栈顶 → 栈底）
  const allComponents = ref<CachedComponent[]>([])

  // 当前标签页的历史栈组件（栈底 → 栈顶）
  const currentStack = computed(() => {
    const stack = stacks.value[activeTab.value]
    const result: CachedComponent[] = []

    for (const entry of stack) {
      const { path: routePath, query: entryQuery } = parseFullPath(entry.fullPath)
      const m = match(routePath)
      if (!m) continue

      const key = m.route.component.toString()
      const comp = componentCache.get(key)
      if (!comp) continue

      const props = m.route.props
        ? typeof m.route.props === 'function'
          ? m.route.props({ params: m.params, query: entryQuery })
          : m.route.props
        : {}

      result.push({ value: comp, path: routePath, props })
    }

    return result
  })

  // ========== 组件管理 ==========
  function updateAllComponents() {
    const result: CachedComponent[] = []
    for (const stack of Object.values(stacks.value)) {
      // 从栈顶到栈底遍历
      for (let i = stack.length - 1; i >= 0; i--) {
        const entry = stack[i]
        const { path: routePath, query: entryQuery } = parseFullPath(entry.fullPath)
        const m = match(routePath)
        if (!m) continue

        const key = m.route.component.toString()
        const comp = componentCache.get(key)
        if (!comp) continue

        const props = m.route.props
          ? typeof m.route.props === 'function'
            ? m.route.props({ params: m.params, query: entryQuery })
            : m.route.props
          : {}

        result.push({ value: comp, path: routePath, props })
      }
    }
    allComponents.value = result
  }

  function syncUrl(fullPath: string) {
    window.history.replaceState(null, '', fullPath)
  }

  // ========== 初始化 ==========
  const rawFullPath = window.location.pathname + window.location.search
  const initialFullPath = rawFullPath.replace(/\s+/g, '-')
  const { path: initialPathWithoutQuery } = parseFullPath(initialFullPath)

  const hitRecord = flatRoutes.find(r => r.regex.test(initialPathWithoutQuery))

  if (!hitRecord) {
    const rootPath = '/' + defaultTab
    stacks.value[defaultTab] = [{ fullPath: rootPath, params: {} }]
    activeTab.value = defaultTab
    syncUrl(rootPath)
  } else {
    const rootPath = '/' + hitRecord.tab
    const chain: HistoryEntry[] = [{ fullPath: rootPath, params: {} }]

    const normalizedInitial = parseFullPath(initialFullPath).path === rootPath
      ? rootPath
      : initialFullPath

    if (normalizedInitial !== rootPath) {
      chain.push({ fullPath: initialFullPath, params: {} })
    }

    stacks.value[hitRecord.tab] = chain
    activeTab.value = hitRecord.tab
    syncUrl(initialFullPath)
  }

  // 异步加载所有组件
  ; (async () => {
    const componentSet = new Set<any>()
    flatRoutes.forEach(route => componentSet.add(route.config.component))
    await Promise.all([...componentSet].map(comp => resolveComponent(comp)))
    updateAllComponents()
  })()

  // 监听路径变化
  watch(currentPath, () => {
    updateAllComponents()
  }, { immediate: true })

  // ========== 导航方法 ==========
  function switchTab(tab: string) {
    if (!tabs.includes(tab)) return
    activeTab.value = tab

    const stack = stacks.value[tab]
    if (!stack.length) {
      stack.push({ fullPath: '/' + tab, params: {} })
    }

    syncUrl(stack[stack.length - 1].fullPath)
    updateAllComponents()
  }

  function push(location: string | RouteLocation): void {
    // 检查是否处于 pop 锁定状态
    if (popLock) {
      console.warn('[router.push] pop 操作后 300ms 内不能执行 push')
      return
    }

    setPushLock()

    const path = typeof location === 'string' ? location : location.path
    const query = typeof location === 'string' ? undefined : location.query

    const normalizedPath = normalizePath(parseFullPath(path).path, activeTab.value, currentPath.value)
    const pathWithoutQuery = normalizedPath
    const entryParams = {}

    const stack = stacks.value[activeTab.value]
    const exists = stack.some(e => parseFullPath(e.fullPath).path === pathWithoutQuery)

    if (exists) {
      console.warn('[router.push] 当前栈中已存在该路由，push 已忽略:', pathWithoutQuery)
      return
    }

    const rootPath = '/' + activeTab.value
    if (pathWithoutQuery === rootPath) {
      stacks.value[activeTab.value].push({ fullPath: rootPath, params: entryParams })
      syncUrl(rootPath)
      updateAllComponents()
      triggerPushCallbacks()
      return
    }

    if (!match(pathWithoutQuery)) {
      console.warn('[router.push] 未匹配到路由:', pathWithoutQuery)
      return
    }

    const fullPath = buildFullPath(normalizedPath, query)
    stacks.value[activeTab.value].push({ fullPath, params: entryParams })
    syncUrl(fullPath)
    updateAllComponents()
    triggerPushCallbacks()
  }

  const savePop = throttle(() => {
    if (pushLock) {
      console.warn('[router.pop] push 操作后 300ms 内不能执行 pop')
      return
    }

    const stack = stacks.value[activeTab.value]
    if (stack.length <= 1) return

    setPopLock()
    triggerPopCallbacks()

    setTimeout(() => {
      stack.pop()
      syncUrl(stack[stack.length - 1].fullPath)
      updateAllComponents()
    }, 300)
  }, 300)

  function pop(): void {
    savePop()
  }

  // 立即执行 pop（供外部使用）
  function popNow(): void {
    const stack = stacks.value[activeTab.value]
    if (stack.length <= 1) return
    stack.pop()
    syncUrl(stack[stack.length - 1].fullPath)
    updateAllComponents()
  }

  // 设置全局引用
  globalPopNow = popNow

  function nav(location: string | RouteLocation): boolean {
    const path = typeof location === 'string' ? location : location.path
    const query = typeof location === 'string' ? undefined : location.query

    const targetPathWithoutQuery = normalizePath(parseFullPath(path).path, activeTab.value, currentPath.value)
    const stack = stacks.value[activeTab.value]

    const index = stack.findIndex(e => parseFullPath(e.fullPath).path === targetPathWithoutQuery)
    if (index === -1) {
      console.warn('[router.nav] 路径不在当前标签页历史中:', targetPathWithoutQuery)
      return false
    }

    stacks.value[activeTab.value] = stack.slice(0, index + 1)

    if (query) {
      const targetEntry = stacks.value[activeTab.value][stacks.value[activeTab.value].length - 1]
      const { path: targetPath } = parseFullPath(targetEntry.fullPath)
      targetEntry.fullPath = buildFullPath(targetPath, query)
    }

    const targetEntry = stacks.value[activeTab.value][stacks.value[activeTab.value].length - 1]
    syncUrl(targetEntry.fullPath)
    updateAllComponents()

    return true
  }

  function setQuery(newQuery: Record<string, any>): void {
    const stack = stacks.value[activeTab.value]
    if (!stack.length) return

    const current = stack[stack.length - 1]
    const { path } = parseFullPath(current.fullPath)
    const fullPath = buildFullPath(path, newQuery)

    current.fullPath = fullPath
    syncUrl(fullPath)
    updateAllComponents()
  }

  function pathIn(path: string): boolean {
    const normalized = normalizePath(path, activeTab.value, currentPath.value)
    return Object.values(stacks.value).some(stack =>
      stack.some(e => parseFullPath(e.fullPath).path === normalized)
    )
  }

  // ========== 返回路由器对象 ==========
  const router = {
    // 响应式属性
    activeTab: activeTab,
    currentPath: currentPath,
    allComponents: allComponents,
    currentStack: currentStack,
    params: params,
    query: query,

    // 方法
    switchTab,
    push,
    pop,
    nav,
    setQuery,
    pathIn,
    onPush,
    onPop,

    // 安装函数
    install(app: any) {
      app.provide('router', reactive(this))
      app.component('RouterView', RouterView)
    }
  }

  return reactive(router)
}

// 导出立即执行 pop 的函数（供外部使用）
export function popNow() {
  if (!globalPopNow) {
    console.warn('Router not initialized yet')
    return
  }
  globalPopNow()
}