/**
 * 获取元素布局左侧距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 相对于左侧的布局像素值
 */
export const getLayoutLeft = (el: HTMLElement): number => {
  let left = 0;
  let current: HTMLElement = el;

  while (current && current !== document.body) {
    left += current.offsetLeft;
    current = current.offsetParent as HTMLElement
  }

  return left;
}

/**
 * 获取元素布局顶部距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 相对于顶部的布局像素值
 */
export const getLayoutTop = (el: HTMLElement): number => {
  let top = 0;
  let current: HTMLElement = el;

  while (current && current !== document.body) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement;
  }

  return top;
};