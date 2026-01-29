export const getSlideCount = <T extends { id: number }>(
  newList: T[],
  oldList: T[]
): number[] => {
  const result: number[] = new Array(newList.length);

  // 创建映射
  const oldIdSet = new Set<number>();
  const oldIndexMap = new Map<number, number>();
  for (let i = 0; i < oldList.length; i++) {
    const id = oldList[i].id;
    oldIdSet.add(id);
    oldIndexMap.set(id, i);
  }

  // 跟踪oldList中哪些位置已处理
  const processedOld = new Array(oldList.length).fill(false);
  let addedCount = 0;

  for (let i = 0; i < newList.length; i++) {
    const id = newList[i].id;

    if (!oldIdSet.has(id)) {
      // 新增项
      addedCount++;
      result[i] = -addedCount;
    } else {
      // 已存在项
      const oldIdx = oldIndexMap.get(id)!;
      processedOld[oldIdx] = true;

      // 计算删除数量：统计oldIdx之前未处理的项
      let deletedCount = 0;
      for (let j = 0; j < oldIdx; j++) {
        if (!processedOld[j]) {
          deletedCount++;
        }
      }

      result[i] = deletedCount - addedCount;
    }
  }

  return result;
};