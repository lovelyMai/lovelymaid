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
 * 获取元素在视口中的布局右侧距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 元素右侧相对于视口右侧的布局像素值
 */
export function getLayoutRightInViewport(el: HTMLElement | null | undefined): number {
  if (!el) return 0;

  let right = 0;
  let current: HTMLElement | null = el;

  while (current && current !== document.body) {
    right += current.offsetLeft + current.offsetWidth;
    current = current.offsetParent as HTMLElement | null;
  }

  const viewportRight = window.scrollX + window.innerWidth;
  return viewportRight - right;
}

/**
 * 获取元素在视口中的布局底部距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 元素底部相对于视口底部的布局像素值
 */
export function getLayoutBottomInViewport(el: HTMLElement | null | undefined): number {
  if (!el) return 0;

  let bottom = 0;
  let current: HTMLElement | null = el;

  while (current && current !== document.body) {
    bottom += current.offsetTop + current.offsetHeight;
    current = current.offsetParent as HTMLElement | null;
  }

  const viewportBottom = window.scrollY + window.innerHeight;
  return viewportBottom - bottom;
}