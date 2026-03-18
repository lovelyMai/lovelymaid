import { ref, computed, watch, markRaw, reactive, App } from 'vue'

import RouterView from './RouterView.vue'

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
        if (segments.length > 0) {
          segments.pop()
        }
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

/* =============================
   组件缓存
============================= */

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

/* =============================
   路径匹配器
============================= */

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

  function walk(route: RouteConfig, parentPath = '', parent: RouteConfig | null = null, tab?: string) {
    const full = (parentPath + '/' + route.path).replace(/\/+/g, '/')
    const { regex, keys } = compilePath(full)
      ; (route as any)._parent = parent

    const currentTab = tab || full.split('/')[1]
    list.push({ fullPath: full, config: route, regex, keys, tab: currentTab })

    route.children?.forEach(child => walk(child, full, route, currentTab))
  }

  Object.entries(routes).forEach(([tab, r]) => walk(r, '', null, tab))
  return list
}

/* =============================
   核心函数
============================= */

export default function createMultiHistory(options: MultiHistoryOptions): HistoryStack {
  const { tabs, routes, defaultTab = tabs[0] } = options
  const flatRoutes = flattenRoutes(routes)

  // 回调函数
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

  // 状态定义
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

  // 所有标签页栈中的所有组件
  const allComponents = ref<CachedComponent[]>([])

  // 当前标签页的历史栈组件（按顺序排列）
  const currentStack = computed(() => {
    const stack = stacks.value[activeTab.value]
    const stackPaths = new Set(stack.map(entry => parseFullPath(entry.fullPath).path))
    return allComponents.value.filter(c => stackPaths.has(c.path))
  })

  // 同步更新 allComponents（从缓存中取）
  function updateAllComponents() {
    const result: CachedComponent[] = []
    for (const [tab, stack] of Object.entries(stacks.value)) {
      for (const entry of stack) {
        const { path: routePath, query: entryQuery } = parseFullPath(entry.fullPath)
        const m = match(routePath)
        if (!m) continue

        const key = m.route.component.toString()
        const comp = componentCache.get(key)

        // 如果组件还没加载完，先跳过
        if (!comp) continue

        const props = m.route.props
          ? typeof m.route.props === 'function'
            ? m.route.props({ params: m.params, query: entryQuery })
            : m.route.props
          : {}

        result.push({
          value: comp,
          path: routePath,
          props
        })
      }
    }
    allComponents.value = result
  }

  // 辅助函数
  function syncUrl(fullPath: string) {
    window.history.replaceState(null, '', fullPath)
  }

  // 初始化
  const rawFullPath = window.location.pathname + window.location.search
  const initialFullPath = rawFullPath.replace(/\s+/g, '-')
  const { path: initialPathWithoutQuery } = parseFullPath(initialFullPath)

  const hitRecord = flatRoutes.find(r => r.regex.test(initialPathWithoutQuery))

  if (!hitRecord) {
    const rootPath = '/' + defaultTab
    stacks.value[defaultTab] = [
      { fullPath: rootPath, params: {} }
    ]
    activeTab.value = defaultTab
    syncUrl(rootPath)
  } else {
    const rootPath = '/' + hitRecord.tab

    const chain: HistoryEntry[] = []

    chain.push({
      fullPath: rootPath,
      params: {}
    })

    const normalizedInitial = parseFullPath(initialFullPath).path === rootPath
      ? rootPath
      : initialFullPath

    if (normalizedInitial !== rootPath) {
      chain.push({
        fullPath: initialFullPath,
        params: {}
      })
    }

    stacks.value[hitRecord.tab] = chain
    activeTab.value = hitRecord.tab
    syncUrl(initialFullPath)
  }

  // ========== 初始化时异步加载所有组件 ==========
  ; (async () => {
    // 收集所有需要加载的组件（去重）
    const componentSet = new Set<any>()
    flatRoutes.forEach(route => {
      componentSet.add(route.config.component)
    })

    // 并行加载所有组件
    await Promise.all([...componentSet].map(comp => resolveComponent(comp)))

    // 加载完成后更新 allComponents
    updateAllComponents()
  })()

  // 监听路径变化，只更新组件列表（不加载）
  watch(currentPath, () => {
    updateAllComponents()
  }, { immediate: true })

  // 导航方法 - 全部同步
  function switchTab(tab: string) {
    if (!tabs.includes(tab)) return
    activeTab.value = tab

    const stack = stacks.value[tab]
    if (!stack.length) {
      const rootPath = '/' + tab
      stack.push({ fullPath: rootPath, params: {} })
    }

    syncUrl(stack[stack.length - 1].fullPath)
    updateAllComponents()
  }

  function push(location: string | RouteLocation): void {
    const path = typeof location === 'string' ? location : location.path
    const query = typeof location === 'string' ? undefined : location.query

    const normalizedPath = normalizePath(parseFullPath(path).path, activeTab.value, currentPath.value)
    const pathWithoutQuery = normalizedPath
    const entryParams = {}

    const stack = stacks.value[activeTab.value]
    const exists = stack.some(e => {
      const { path } = parseFullPath(e.fullPath)
      return path === pathWithoutQuery
    })
    if (exists) {
      console.warn('[router.push] 当前栈中已存在该路由，push 已忽略:', pathWithoutQuery)
      return
    }

    const rootPath = '/' + activeTab.value
    if (pathWithoutQuery === rootPath) {
      stacks.value[activeTab.value].push({ fullPath: rootPath, params: entryParams })
      syncUrl(rootPath)
      updateAllComponents()
      triggerPushCallbacks()  // 触发回调
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
    triggerPushCallbacks()  // 触发回调
  }

  function pop(): void {
    const stack = stacks.value[activeTab.value]
    if (stack.length <= 1) return

    // 立即执行所有 onPop 回调
    triggerPopCallbacks()

    // 延迟 300ms 真正 pop，确保动画结束
    setTimeout(() => {
      stack.pop()
      syncUrl(stack[stack.length - 1].fullPath)
      updateAllComponents()
    }, 300)
  }

  function nav(location: string | RouteLocation): boolean {
    const path = typeof location === 'string' ? location : location.path
    const query = typeof location === 'string' ? undefined : location.query

    const targetPathWithoutQuery = normalizePath(parseFullPath(path).path, activeTab.value, currentPath.value)
    const stack = stacks.value[activeTab.value]

    const index = stack.findIndex(e => {
      const { path } = parseFullPath(e.fullPath)
      return path === targetPathWithoutQuery
    })
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

  const router = {
    activeTab: activeTab,
    currentPath: currentPath,
    allComponents: allComponents,
    currentStack: currentStack,
    params: params,
    query: query,
    switchTab,
    push,
    pop,
    nav,
    setQuery,
    pathIn,
    onPush,
    onPop,
    install(app: any) {
      app.provide('router', reactive(this))
      app.component('RouterView', RouterView)
    }
  }

  return reactive(router)
}