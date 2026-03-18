import { computed, inject } from 'vue';

import { HistoryStack } from './createAppRouter';

/**
 * 检测右滑返回手势
 * @param threshold 阈值(px)，只有手指右滑超过这个距离才开始触发回调
 * @param callback 回调函数，传入实时的连续滑动距离（超过阈值后的距离）、瞬时速度(px/ms)和是否正在滑动
 * @returns 清理函数，调用可移除事件监听
 */
export default function checkSrcoll(
  threshold: number,
  callback: (distance: number | undefined, speed: number, isScrolling: boolean) => void
): () => void {
  const router = inject('router') as HistoryStack

  // 使用计算属性实时判断是否在根路径
  const isRootPath = computed(() =>
    router.currentPath === router.currentStack[0].path
  );

  let startX = 0;
  let startY = 0;
  let isTracking = false;
  let isThresholdPassed = false;
  let accumulatedDistance = 0;
  let isIgnored = false;  // 是否已标记为忽略（垂直分量过大）
  let lastX = 0;  // 记录上一次触摸点的X坐标
  let lastTime = 0;  // 记录上一次触摸的时间戳
  let lastSpeed = 0;  // 记录最后一次计算的速度值
  let scrollableElement: Element | null = null; // 新增：找到的可滚动元素
  let startScrollLeft = 0; // 新增：开始触摸时的滚动位置

  // 检测元素是否可以横向滚动
  function isHorizontallyScrollable(element: Element): boolean {
    const style = window.getComputedStyle(element);
    const overflowX = style.overflowX;

    // 检查是否有横向滚动条
    const hasHorizontalScrollbar = element.scrollWidth > element.clientWidth;

    // 检查是否允许横向滚动
    const canScrollHorizontally = overflowX === 'auto' || overflowX === 'scroll';

    return hasHorizontalScrollbar && canScrollHorizontally;
  }

  // 向上查找可横向滚动的父元素
  function findHorizontallyScrollableParent(element: Element | null): Element | null {
    while (element && element !== document.documentElement) {
      if (isHorizontallyScrollable(element)) {
        return element;
      }
      element = element.parentElement;
    }
    return null;
  }

  const handleTouchStart = (e: TouchEvent) => {
    // 如果在根路径，直接返回
    if (isRootPath.value) return;

    // 只在第一个触摸点开始跟踪
    if (e.touches.length !== 1) return;

    const target = e.target as Element;

    // 检查当前元素或父元素是否可横向滚动
    scrollableElement = findHorizontallyScrollableParent(target);

    if (scrollableElement) {
      // 记录开始时的滚动位置
      startScrollLeft = scrollableElement.scrollLeft;
      // 正常初始化，我们要跟踪它
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isTracking = true;
      isThresholdPassed = false;
      accumulatedDistance = 0;
      isIgnored = false;
      lastX = 0;
      lastTime = 0;
    } else {
      // 没有可滚动元素，正常初始化
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      isTracking = true;
      isThresholdPassed = false;
      accumulatedDistance = 0;
      isIgnored = false;
      lastX = 0;
      lastTime = 0;
      scrollableElement = null;
      startScrollLeft = 0;
    }
  };

  const handleTouchMove = (e: TouchEvent) => {
    // 如果在根路径，直接返回
    if (isRootPath.value) return;

    if (!isTracking || e.touches.length !== 1) return;

    const currentX = e.touches[0].clientX;
    const currentY = e.touches[0].clientY;
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;

    // 如果已标记为忽略，直接返回
    if (isIgnored) return;

    // 如果有可滚动元素，检查是否已经滚动到最左边
    if (scrollableElement) {
      // 如果还没到最左边，让浏览器处理滚动
      if (scrollableElement.scrollLeft > 0) {
        // 还在可滚动范围内，不触发手势
        return;
      }

      // 已经滚动到最左边，但如果是左滑，让浏览器处理（回弹效果）
      if (deltaX < 0) {
        return;
      }

      // 到最左边且右滑，开始手势检测
      // 这里继续执行下面的手势逻辑
    }

    // 在阈值范围内，检测垂直分量
    if (!isThresholdPassed) {
      // 垂直分量过大，标记为忽略（约30度）
      if (Math.abs(deltaY) > Math.abs(deltaX) * Math.tan(30 * Math.PI / 180)) {
        isIgnored = true;
        return;
      }

      // 左滑则忽略（已经在上面处理了可滚动元素的左滑）
      if (!scrollableElement && deltaX < 0) return;

      // 超过阈值，开始跟踪
      if (deltaX > threshold) {
        isThresholdPassed = true;
        accumulatedDistance = deltaX - threshold;

        e.preventDefault(); // 阻止默认滚动

        callback(accumulatedDistance, 0, true);
      }
    } else {
      // 已超过阈值，计算连续距离
      accumulatedDistance = deltaX - threshold;

      // 阻止默认行为
      e.preventDefault();

      const currentTime = Date.now();
      // 如果是第一次超过阈值，使用当前值初始化lastX和lastTime
      if (lastX === 0 && lastTime === 0) {
        lastX = currentX;
        lastTime = currentTime;
        callback(accumulatedDistance, 0, true);
        return;
      }
      const timeDiff = currentTime - lastTime;
      const speed = timeDiff > 0 ? (currentX - lastX) / timeDiff : 0;
      lastSpeed = speed;
      lastX = currentX;
      lastTime = currentTime;
      callback(accumulatedDistance, speed, true);
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    // 如果在根路径，直接返回
    if (isRootPath.value) return;

    // 如果已经超过阈值，阻止默认行为（如可能的点击事件）
    if (isThresholdPassed) {
      e.preventDefault();
    }

    if (!isThresholdPassed) {
      // 没有超过阈值，直接重置状态，不触发回调
      isTracking = false;
      isThresholdPassed = false;
      accumulatedDistance = 0;
      scrollableElement = null;
      startScrollLeft = 0;
      return;
    }

    const finalDistance = accumulatedDistance;
    isTracking = false;
    isThresholdPassed = false;
    accumulatedDistance = 0;
    scrollableElement = null;
    startScrollLeft = 0;

    // 使用最后一次计算的速度值
    callback(finalDistance, lastSpeed, false);
    callback(undefined, lastSpeed, false);
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: false });
  document.addEventListener('touchend', handleTouchEnd, { passive: false });

  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
}