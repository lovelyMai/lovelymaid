/**
 * 获取元素布局左侧距离（不受 transform/scale 影响）
 * @param el - 目标元素
 * @returns 相对于左侧的布局像素值
 */
const getLayoutLeft = (el: HTMLElement): number => {
  let left = 0;
  let current: HTMLElement = el;

  while (current && current !== document.body) {
    left += current.offsetLeft;
    current = current.offsetParent as HTMLElement
  }

  return left;
}

export default getLayoutLeft