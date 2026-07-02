<template>
  <div
    ref="containerRef"
    class="virtual-scroll-list"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <div
      v-if="items.length"
      class="virtual-scroll-list__spacer"
      :style="spacerStyle"
    >
      <div
        v-for="entry in visibleItems"
        :key="getItemKey(entry.item, entry.index)"
        class="virtual-scroll-list__item"
        :style="getItemStyle(entry.index)"
      >
        <slot
          :item="entry.item"
          :index="entry.index"
        />
      </div>
    </div>
    <div
      v-else
      class="virtual-scroll-list__empty"
    >
      <slot name="empty" />
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  name: 'VirtualScrollList',
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    itemHeight: {
      type: Number,
      required: true,
      validator: (value) => value > 0,
    },
    buffer: {
      type: Number,
      default: 5,
      validator: (value) => value >= 0,
    },
    height: {
      type: [Number, String],
      default: '100%',
    },
    itemKey: {
      type: [String, Function],
      default: '',
    },
  },
  data() {
    return {
      scrollTop: 0,
      viewportHeight: 0,
      scrollRafId: null,
      resizeObserver: null,
    };
  },
  computed: {
    containerStyle() {
      const height = typeof this.height === 'number' ? `${this.height}px` : this.height;

      return {
        height,
      };
    },
    totalHeight() {
      return this.items.length * this.itemHeight;
    },
    spacerStyle() {
      return {
        height: `${this.totalHeight}px`,
      };
    },
    visibleRange() {
      if (!this.items.length || !this.viewportHeight) {
        return {
          start: 0,
          end: 0,
        };
      }

      const visibleStart = Math.floor(this.scrollTop / this.itemHeight);
      const visibleEnd = Math.ceil((this.scrollTop + this.viewportHeight) / this.itemHeight);
      const start = Math.max(0, visibleStart - this.buffer);
      const end = Math.min(this.items.length, visibleEnd + this.buffer);

      return {
        start,
        end,
      };
    },
    visibleItems() {
      const { start, end } = this.visibleRange;

      return this.items.slice(start, end).map((item, offset) => ({
        item,
        index: start + offset,
      }));
    },
  },
  watch: {
    items() {
      this.$nextTick(() => {
        this.refresh();
      });
    },
    'items.length'() {
      this.$nextTick(() => {
        this.refresh();
      });
    },
    itemHeight() {
      this.$nextTick(() => {
        this.refresh();
      });
    },
  },
  mounted() {
    this.refresh();

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        this.refresh();
      });
      this.resizeObserver.observe(this.$refs.containerRef);
    } else {
      window.addEventListener('resize', this.refresh);
    }
  },
  beforeDestroy() {
    if (this.scrollRafId) {
      cancelAnimationFrame(this.scrollRafId);
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    } else {
      window.removeEventListener('resize', this.refresh);
    }
  },
  methods: {
    refresh() {
      const container = this.$refs.containerRef;
      if (!container) return;

      this.viewportHeight = container.clientHeight;
      this.scrollTop = Math.min(container.scrollTop, Math.max(0, this.totalHeight - this.viewportHeight));

      if (container.scrollTop !== this.scrollTop) {
        container.scrollTop = this.scrollTop;
      }
    },
    handleScroll(event) {
      const nextScrollTop = event.target.scrollTop;

      if (this.scrollRafId) {
        cancelAnimationFrame(this.scrollRafId);
      }

      this.scrollRafId = requestAnimationFrame(() => {
        this.scrollRafId = null;
        this.scrollTop = nextScrollTop;
        this.$emit('scroll', {
          scrollTop: nextScrollTop,
          startIndex: this.visibleRange.start,
          endIndex: this.visibleRange.end,
        });

        if (nextScrollTop <= 0) {
          this.$emit('reach-start');
        }

        if (nextScrollTop + this.viewportHeight >= this.totalHeight) {
          this.$emit('reach-end');
        }
      });
    },
    getItemStyle(index) {
      return {
        height: `${this.itemHeight}px`,
        transform: `translateY(${index * this.itemHeight}px)`,
      };
    },
    getItemKey(item, index) {
      if (typeof this.itemKey === 'function') {
        return this.itemKey(item, index);
      }

      if (this.itemKey && item && Object.prototype.hasOwnProperty.call(item, this.itemKey)) {
        return item[this.itemKey];
      }

      return index;
    },
    scrollToOffset(offset) {
      const container = this.$refs.containerRef;
      if (!container) return;

      const maxScrollTop = Math.max(0, this.totalHeight - this.viewportHeight);
      const nextScrollTop = Math.min(Math.max(0, offset), maxScrollTop);

      container.scrollTop = nextScrollTop;
      this.scrollTop = nextScrollTop;
    },
    scrollToIndex(index, align = 'start') {
      if (!this.items.length) return;

      const targetIndex = Math.min(Math.max(0, index), this.items.length - 1);
      const itemTop = targetIndex * this.itemHeight;
      const itemBottom = itemTop + this.itemHeight;
      let nextScrollTop = itemTop;

      if (align === 'end') {
        nextScrollTop = itemBottom - this.viewportHeight;
      } else if (align === 'center') {
        nextScrollTop = itemTop - (this.viewportHeight - this.itemHeight) / 2;
      } else if (align === 'auto') {
        const currentBottom = this.scrollTop + this.viewportHeight;
        if (itemTop >= this.scrollTop && itemBottom <= currentBottom) {
          return;
        }
        nextScrollTop = itemTop < this.scrollTop ? itemTop : itemBottom - this.viewportHeight;
      }

      this.scrollToOffset(nextScrollTop);
    },
  },
});
</script>

<style lang="less" scoped>
.virtual-scroll-list {
  position: relative;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  &__spacer {
    position: relative;
    width: 100%;
    min-height: 100%;
  }

  &__item {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    overflow: visible;
    will-change: transform;
  }

  &__empty {
    min-height: 100%;
  }
}
</style>
