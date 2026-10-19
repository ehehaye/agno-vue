<template>
  <div class="toc">
    <div class="toc__main">
      <ul
        ref="listRef"
        class="toc__list"
      >
        <li
          v-for="item in items"
          :key="item.id"
          :ref="(el) => setItemRef(item.id, el)"
          class="toc__item"
          :class="{ 'toc__item--active': activeId === item.id }"
        >
          <a
            class="toc__item-link"
            :title="item.label"
            href="#"
            @click.prevent="$emit('navigate', item.id)"
          >
            <span class="toc__item-text">{{ item.label }}</span>
            <span class="toc__item-bar" />
          </a>
        </li>
      </ul>
    </div>
    <div class="toc__override-scroll" />
  </div>
</template>

<script setup>
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from '@vue/composition-api'

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  activeId: {
    type: String,
    default: '',
  },
})
defineEmits(['navigate'])

const listRef = ref(null)
const itemRefs = new Map()

const setItemRef = (id, el) => {
  if (el) {
    itemRefs.set(id, el)
  } else {
    itemRefs.delete(id)
  }
}

const ensureActiveVisible = async () => {
  await nextTick()

  const list = listRef.value
  const item = itemRefs.get(props.activeId)
  if (!list || !item) {
    return
  }

  const listRect = list.getBoundingClientRect()
  const itemRect = item.getBoundingClientRect()
  if (itemRect.top < listRect.top) {
    list.scrollTop -= listRect.top - itemRect.top
  } else if (itemRect.bottom > listRect.bottom) {
    list.scrollTop += itemRect.bottom - listRect.bottom
  }
}

onMounted(ensureActiveVisible)
watch(() => props.activeId, ensureActiveVisible)
watch(() => props.items.length, ensureActiveVisible)

onBeforeUnmount(() => {
  itemRefs.clear()
})
</script>

<style lang="less" scoped>
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
    transition: background-color 0.2s, color 0.2s;
  }
}
</style>
