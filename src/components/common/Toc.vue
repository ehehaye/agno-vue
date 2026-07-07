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
          :data-toc-item-id="item[itemKey]"
        >
          <a
            class="toc__item-link"
            :title="item[labelKey]"
            :href="item[hashKey]"
            @click="onNavClick($event, item)"
          >
            <span class="toc__item-text">{{ item[labelKey] }}</span>
            <span class="toc__item-bar" />
          </a>
        </li>
      </ul>
    </div>
    <div class="toc__override-scroll" />
  </div>
</template>

<script>
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
  mounted() {
    const container = document.querySelector(this.containerSelector)
    if (!container) {
      console.error(`Container not found: ${this.containerSelector}`)
      return
    }
    this.setContainer(container)
    this.updateActiveId()
    this.$watch(
      () => this.contents,
      this.updateActiveId
    )
  },
  beforeUnmount() {
    this.setContainer(null)
  },
  methods: {
    setContainer(el) {
      if (this.$container) {
        this.$container.removeEventListener('scroll', this.onContainerScroll)
      }
      if (el) {
        (this.$container = el).addEventListener('scroll', this.onContainerScroll)
      }
    },
    getOffsetTopRelativeTo(element, container) {
      let offsetTop = 0
      let current = element
      while (current && current !== container) {
        offsetTop += current.offsetTop
        current = current.offsetParent
      }
      return offsetTop
    },
    async updateActiveId() {
      if (!this.$container) return

      await this.$nextTick()

      const scrollTop = this.$container.scrollTop
      const containerHeight = this.$container.clientHeight
      const threshold = scrollTop + containerHeight * 0.3

      let currentIndex = -1
      for (let i = this.contents.length - 1; i >= 0; i--) {
        const item = this.contents[i]
        const [el] = this.$refs[item[this.itemKey]]
        const offsetTop = this.getOffsetTopRelativeTo(el, this.$container)
        if (offsetTop <= threshold) {
          currentIndex = i
          break
        }
      }

      if (currentIndex !== -1) {
        const newActiveId = this.contents[currentIndex][this.itemKey]
        this.activeKey = newActiveId

        await this.$nextTick()
        const activeItem = this.$refs[newActiveId] ? this.$refs[newActiveId][0] : null
        if (activeItem && this.$refs.listContainer.scrollHeight > this.$refs.listContainer.clientHeight) {
          // FIXME: undefined
          activeItem.scrollIntoView({
            block: 'nearest',
            behavior: 'smooth',
          })
        }
      }
    },
    onContainerScroll() {
      if (!this.pendingUpdate) {
        this.updateActiveId()
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
        }, 100)
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
      width: 80px;
    }

    .toc__override-scroll {
      z-index: -1;
    }
  }

  &__main {
    max-height: 70vh;
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
    height: @item-height * 10;
  }

  &__item {
    height: @item-height;
    margin: 8px 0;

    &--active {
      .toc__item-link {
        color: @primary-hover;
        font-weight: 600;
      }

      .toc__item-bar {
        background-color: @primary-hover;
      }
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
    transition: color 0.2s;

    &:hover {
      color: @primary-hover;

      .toc__item-bar {
        background-color: @primary-hover;
      }
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
    transition: background-color 0.2s;
  }
}
</style>