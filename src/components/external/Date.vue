<script setup lang="ts">
import { onUnmounted, ref, watch, nextTick, reactive, onMounted, computed } from 'vue'
import Card from '../external/Card.vue'

import { formatDate } from '@/utils/common.js'
import useCssVar from '@/utils/useCssVar.js'
import { DateItem } from '../type.js'

interface Props {
  /** 是否显示 */
  visible: boolean
  /** 位置 */
  position: [number, number]
  /** 日期点击事件 */
  onDateClick?: (date: DateItem, index: number) => void
}
const props = defineProps<Props>()
const date = defineModel<DateItem>('date', { default: () => formatDate(Date.now()) })

// 初始化
const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

// 月份加减
const decreaseMonth = () => {
  const [year, month, day] = date.value
  let newYear = year
  let newMonth = month - 1
  if (newMonth < 1) {
    newYear -= 1
    newMonth = 12
  }
  date.value = [newYear, newMonth, day]
}
const increaseMonth = () => {
  const [year, month, day] = date.value
  let newYear = year
  let newMonth = month + 1
  if (newMonth > 12) {
    newYear += 1
    newMonth = 1
  }
  date.value = [newYear, newMonth, day]
}

// 生成日历网格
const calendarDays = computed<string[]>(() => {
  const [year, month] = date.value
  const firstDay = (new Date(year, month - 1, 1).getDay() + 6) % 7
  const totalDays = new Date(year, month, 0).getDate()
  const totalCells = Math.ceil((firstDay + totalDays) / 7) * 7
  const days: string[] = new Array(totalCells).fill('')
  for (let d = 1; d <= totalDays; d++) {
    days[firstDay + d - 1] = String(d)
  }
  return days
})

// 年月切换
const switchIsOpen = ref<boolean>(false)
</script>

<template>
  <teleport to="body">
    <transition name="lovelymai-fade-leave">
      <Card :class="$style.Date" ref="DateRef" v-if="props.visible" type="glass"
        :style="{ left: `${props.position[0]}px`, top: `${props.position[1]}px` }">
        <div :class="$style.header">
          <h5 :class="$style.date" @click.stop="() => switchIsOpen = !switchIsOpen">
            <span :style="{ color: switchIsOpen ? '#0067EC' : '' }">{{ `${date[0]} 年 ${date[1]} 月` }}</span>
            <span :class="['lovelymai', 'lovely-right-arrow', $style.arrow]"
              :style="{ transform: switchIsOpen ? 'translateY(1px) rotate(90deg)' : 'translateY(1px) rotate(0deg)' }"></span>
          </h5>
          <div :class="$style.button">
            <span :class="['lovelymai', 'lovely-left-arrow', $style.arrow]" @click.stop="() => decreaseMonth()"></span>
            <span :class="['lovelymai', 'lovely-right-arrow', $style.arrow]" @click.stop="() => increaseMonth()"></span>
          </div>
        </div>
        <div :class="$style.switch" v-if="switchIsOpen">

        </div>
        <div :class="$style.days" v-else>
          <ul :class="$style.weekdays">
            <li v-for="(weekday) in weekDays">{{ weekday }}</li>
          </ul>
          <ul :class="$style.monthDays">
            <li v-for="(day, index) in calendarDays" :key="index" :class="$style.dayCell">
              <span v-if="day" :class="[$style.day, Number(day) === date[2] ? $style.today : '']">{{
                day }}</span>
            </li>
          </ul>
        </div>
      </Card>
    </transition>
  </teleport>
</template>

<style module>
.Date {
  position: fixed;
  z-index: 999;
  width: 250px;
  padding: 14px;
  border-radius: 16px;
  user-select: none;
  -webkit-user-select: none;
}

.header {
  display: flex;
  justify-content: space-between;
  height: 24px;
  margin-bottom: 14px;
}

.header .date {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.header .date .arrow {
  font-size: 14px;
  transition: transform .5s;
}

.header .button {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header .button .arrow {
  font-size: 20px;
}

.days .weekdays {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #767676;
}

.days .monthDays {
  display: flex;
  flex-wrap: wrap;
  margin-top: 10px;
}

.days .dayCell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% / 7);
  height: 32px;
}

.days .day {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  font-size: 14px;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color .2s;
}

.days .day.today {
  color: #3b86f7;
}

.days .day:hover {
  background-color: #3b86f7;
  color: #fff;
}

.switch {
  padding: 30px;
}
</style>
<style scoped>
.lovelymai {
  font-weight: 600;
  color: #0067EC;
  transform: translateY(1px);
  cursor: pointer;
}
</style>