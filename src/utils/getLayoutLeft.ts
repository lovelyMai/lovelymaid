/**
 * 获取元素在视口中的布局左侧距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 相对于视口左侧的布局像素值
 */
export function getLayoutLeftInViewport(el: HTMLElement | null | undefined): number {
  if (!el) return 0;

  let left = 0;
  let current: HTMLElement | null = el;

  while (current && current !== document.body) {
    left += current.offsetLeft;
    current = current.offsetParent as HTMLElement | null;
  }

  return left - window.scrollX;
}

/**
 * 获取元素在视口中的布局顶部距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 相对于视口顶部的布局像素值
 */
export function getLayoutTopInViewport(el: HTMLElement | null | undefined): number {
  if (!el) return 0;

  let top = 0;
  let current: HTMLElement | null = el;

  while (current && current !== document.body) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  return top - window.scrollY;
}

/**
 * 获取元素在文档中的布局左侧距离（不受 transform/scale 和滚动影响）
 * @param el - 目标元素
 * @returns 相对于文档左侧的布局像素值
 */
export function getLayoutLeftInDocument(el: HTMLElement | null | undefined): number {
  if (!el) return 0;

  let left = 0;
  let current: HTMLElement | null = el;

  while (current && current !== document.body) {
    left += current.offsetLeft;
    current = current.offsetParent as HTMLElement | null;
  }

  return left;
}

/**
 * 获取元素在文档中的布局顶部距离（不受 transform/scale 和滚动影响）
 * @param el - 目标元素
 * @returns 相对于文档顶部的布局像素值
 */
export function getLayoutTopInDocument(el: HTMLElement | null | undefined): number {
  if (!el) return 0;

  let top = 0;
  let current: HTMLElement | null = el;

  while (current && current !== document.body) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  return top;
}