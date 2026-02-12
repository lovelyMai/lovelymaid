function watchRef(
  elementRef: { value: HTMLElement | null },
  callback: (size: { width: number; height: number }) => void,
  immediate: boolean
): () => void {
  if (!elementRef.value) {
    return () => { }
  }
  
  if (immediate) callback({
    width: elementRef.value.offsetWidth,
    height: elementRef.value.offsetHeight
  })

  const observer = new ResizeObserver(() => {
    if (elementRef.value) {
      callback({
        width: elementRef.value.offsetWidth,
        height: elementRef.value.offsetHeight
      })
    }
  })

  observer.observe(elementRef.value)

  return () => observer.disconnect()
}

export default watchRef