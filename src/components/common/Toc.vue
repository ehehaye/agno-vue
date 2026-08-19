<template>
  <div class="toc">
    <div class="toc__main">
      <ul
        ref="listContainer"
        class="toc__list"
      >
        <li
          v-for="(item, idx) in contents"
          :key="item[itemKey]"
          :ref="`${item[itemKey]}`"
          class="toc__item"
          :class="{ 'toc__item--active': activeKey === item[itemKey] }"
        >
          <a
            class="toc__item-link"
            :title="item[labelKey]"
            :href="item[hashKey]"
            @click.prevent="onNavClick(item, idx)"
          >
            <span class="toc__item-text">{{ truncateByWidth(item[labelKey], 160) }}</span>
            <span class="toc__item-bar" />
          </a>
        </li>
      </ul>
    </div>
    <div class="toc__override-scroll" />
  </div>
</template>

<script>
import { debounce, truncateByWidth } from '@/utils/index'
import { checkScrollCompletion } from '@/utils/scroll'

export default {
  name: 'Toc',
  props: {
    containerSelector: {
      type: String,
      required: true,
    },
    contents: {
      type: Array,
      default: () => [],
    },
    hashKey: {
      type: String,
      default: 'hash',
    },
    itemKey: {
      type: String,
      default: 'id',
    },
    labelKey: {
      type: String,
      default: 'content',
    },
  },
  data() {
    return {
      activeKey: '',
      $container: null,
      pendingUpdate: false,
    }
  },
  created() {
    this.activeKey = this.contents[0]?.[this.itemKey] || ''
    this.updateActiveKey = debounce(this.updateActiveKey, 60)
  },
  mounted() {
    const container = document.querySelector(this.containerSelector)
    if (!container) {
      console.error(`Container not found: ${this.containerSelector}`)
      return
    }
    this.setContainer(container)
    this.$watch(
      () => this.contents,
      this.updateActiveKey
    )
  },
  beforeDestroy() {
    this.setContainer(null)
  },
  methods: {
    truncateByWidth,
    setContainer(el) {
      if (this.$container) {
        this.$container.removeEventListener('scroll', this.onContainerScroll)
      }
      if (el) {
        (this.$container = el).addEventListener('scroll', this.onContainerScroll)
      }
    },
    buildHeightMeta(list) {
      let total = 0
      const cache = list.map(item => {
        const start = total
        total += item.getHeight()
        return { start, end: total }
      })
      return {
        cache,
        totalHeight: total
      }
    },
    findItemByScrollRatio(
      list,
      cache,
      totalHeight,
      scrollTop,
      clientHeight
    ) {
      const maxScrollTop = Math.max(totalHeight - clientHeight, 0)
      const ratio = maxScrollTop === 0 ? 0 : scrollTop / maxScrollTop

      // 按比例推算目标高度
      const targetOffset = ratio * totalHeight

      // 二分查找
      let low = 0
      let high = list.length - 1

      while (low <= high) {
        const mid = (low + high) >> 1
        const { start, end } = cache[mid]

        if (targetOffset < start) {
          high = mid - 1
        } else if (targetOffset >= end) {
          low = mid + 1
        } else {
          return {
            index: mid,
            item: list[mid],
            offsetInItem: targetOffset - start
          }
        }
      }

      // 滚动到底部，直接返回最后一项
      const lastIndex = list.length - 1
      return {
        index: lastIndex,
        item: list[lastIndex],
        offsetInItem: list[lastIndex].height
      }
    },
    async updateActiveKey() {
      await this.$nextTick()

      const { scrollTop, clientHeight } = this.$container

      const { cache, totalHeight } = this.buildHeightMeta(this.contents)
      const { index } = this.findItemByScrollRatio(
        this.contents,
        cache,
        totalHeight,
        scrollTop,
        clientHeight
      )
      this.activeKey = this.contents[index][this.itemKey]
      const [activeItem] = this.$refs[this.activeKey]
      activeItem.scrollIntoView({
        block: 'center',
        container: 'nearest',
        behavior: 'smooth',
      })
    },
    onContainerScroll() {
      if (!this.pendingUpdate) {
        this.updateActiveKey()
      }
    },
    async onNavClick(item, idx) {
      this.pendingUpdate = true
      this.activeKey = item[this.itemKey]
      const { cache } = this.buildHeightMeta(this.contents)
      const { start } = cache[idx]
      // Elements may not be rendered under virtual scrolling.
      const element = document.querySelector(item[this.hashKey])
      if (element) {
        element.scrollIntoView({
          behavior: 'instant',
        })
        await checkScrollCompletion(element)
      } else {
        this.$container.scrollTo({
          top: start,
          behavior: 'instant',
        })
        await checkScrollCompletion(this.$container)
      }
      this.pendingUpdate = false
    },
  },
}
</script>

<style lang="less">
@item-height: 16px;
@padding: 16px;

.item-active() {
  .toc__item-text {
    color: @primary-hover;
  }

  .toc__item-bar {
    color: @primary-hover;
    background-color: @primary-hover;
  }
}

.toc {
  position: fixed;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  overflow: hidden;
  padding: @padding 0 @padding @padding;
  background: transparent;
  border-radius: 8px;
  border: 1px solid transparent;
  box-shadow: none;
  z-index: 100;
  transition: background-color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.98);
    border-color: #e8e8e8;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);

    .toc__item-text {
      opacity: 1;
      width: 160px;
    }

    .toc__override-scroll {
      z-index: -1;
    }
  }

  &__main {
    overflow: hidden auto;
    padding-right: @padding;
  }

  &__override-scroll {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
    width: 12px;
    background-color: #fff;
  }

  &__list {
    list-style: none;
    padding: 0;
    margin: 0;
    text-align: right;
    max-height: @item-height * 10;
  }

  &__item {
    height: @item-height;
    margin: 8px 0;

    &--active {
      .item-active();
    }
  }

  &__item-link {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    color: #666;
    text-decoration: none;
    font-size: 14px;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;

    &:hover {
      .item-active();
    }
  }

  &__item-text {
    .ellipsis();
    opacity: 0;
    width: 0;
    overflow: hidden;
    white-space: nowrap;
    transition: opacity 0.3s ease, width 0.3s ease;
  }

  &__item-bar {
    flex-shrink: 0;
    width: 12px;
    height: 2px;
    background-color: #999;
    transition: background-color color 0.2s;
  }
}
</style>