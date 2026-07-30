/**
 * 获取元素布局左侧距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 相对于左侧的布局像素值
 */
export const getOffsetLeft = (el: HTMLElement): number => {
  let left = 0;
  let current: HTMLElement | null = el;
  let hasFixed = false;

  while (current && current !== document.body) {
    if (getComputedStyle(current).position === 'fixed') {
      hasFixed = true;
    }
    left += current.offsetLeft;
    current = current.offsetParent as HTMLElement | null;
  }

  if (hasFixed) {
    left += document.documentElement.scrollLeft;
  }

  return left;
}

/**
 * 获取元素布局顶部距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 相对于顶部的布局像素值
 */
export const getOffsetTop = (el: HTMLElement): number => {
  let top = 0;
  let current: HTMLElement | null = el;
  let hasFixed = false;

  while (current && current !== document.body) {
    if (getComputedStyle(current).position === 'fixed') {
      hasFixed = true;
    }
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }

  if (hasFixed) {
    top += document.documentElement.scrollTop;
  }

  return top;
};

/**
 * 获取元素布局右侧距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 相对于右侧的布局像素值
 */
export const getOffsetRight = (el: HTMLElement): number => {
  return document.documentElement.scrollWidth - (getOffsetLeft(el) + el.offsetWidth)
}

/**
 * 获取元素布局底部距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 相对于底部的布局像素值
 */
export const getOffsetBottom = (el: HTMLElement): number => {
  return document.documentElement.scrollHeight - (getOffsetTop(el) + el.offsetHeight)
}