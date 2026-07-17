import { watch } from 'vue'

type StyleObject = Record<string, Record<string, string | number>>

const useCssVar = <T extends StyleObject>(el: HTMLElement, styles: T) => {
  const applyStyles = () => {
    if (!el) return
    Object.entries(styles).forEach(([key, value]) => {
      Object.entries(value).forEach(([prop, val]) => {
        const varName = `--${key}-${prop}`
        const cssValue = String(val)
        el.style.setProperty(varName, cssValue)
      })
    })
  }

  watch(() => styles, applyStyles, { deep: true, immediate: true })
}

export default useCssVar