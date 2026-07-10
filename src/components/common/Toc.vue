<template>
  <div class="toc">
    <div class="toc__main">
      <ul
        ref="listContainer"
        class="toc__list"
      >
        <li
          v-for="item in contents"
          :key="item[itemKey]"
          :ref="`${item[itemKey]}`"
          class="toc__item"
          :class="{ 'toc__item--active': activeKey === item[itemKey] }"
        >
          <a
            class="toc__item-link"
            :title="item[labelKey]"
            :href="item[hashKey]"
            @click="onNavClick($event, item)"
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

const debounceDelay = 100

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
    updateHashOnUrl: {
      type: Boolean,
      default: false,
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
    this.updateActiveKey = debounce(this.updateActiveKey, debounceDelay)
  },
  mounted() {
    const container = document.querySelector(this.containerSelector)
    if (!container) {
      console.error(`Container not found: ${this.containerSelector}`)
      return
    }
    this.setContainer(container)
    this.updateActiveKey()
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
    async updateActiveKey() {
      await this.$nextTick()

      const { scrollTop, scrollHeight, clientHeight } = this.$container
      const { length } = this.contents

      // Calculate scroll progress percentage (0-100)
      const scrollProgress = scrollTop / (scrollHeight - clientHeight)
      const scrollRatio = ~~(scrollProgress * 100).toFixed(0)
      // Map scroll ratio to content index and clamp to valid range
      const ratioToIndex = Math.ceil(length * scrollRatio / 100)
      const index = Math.min(ratioToIndex, length - 1)
      // Update active key based on calculated index
      this.activeKey = this.contents[index][this.itemKey]

      // Scroll the active TOC item into visible area
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
    onNavClick(e, item) {
      if (this.updateHashOnUrl) return
      e.preventDefault()
      this.activeKey = item[this.itemKey]
      const element = document.querySelector(item[this.hashKey])
      if (element) {
        this.pendingUpdate = true
        setTimeout(() => {
          this.pendingUpdate = false
        }, debounceDelay + 20)
        element.scrollIntoView({
          block: 'start',
          behavior: 'instant',
        })
      }
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