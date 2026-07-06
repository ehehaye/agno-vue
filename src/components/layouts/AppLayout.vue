<template>
  <div
    class="layout-container"
    :class="{ 'is-aside-collapsed': isAsideCollapsed }"
  >
    <aside class="layout-aside">
      <div class="layout-aside-inner">
        <slot name="aside" />
      </div>
    </aside>

    <div class="layout-content">
      <header class="layout-header">
        <div class="header-left">
          <button
            class="aside-toggle ai-button"
            type="button"
            @click="toggleAside"
          >
            <span class="toggle-icon" />
          </button>
          <h1 class="header-title">{{ title }}</h1>
        </div>
        <div class="header-right">
          <select
            v-model="$i18n.locale"
            class="lang-select ai-select"
          >
            <option value="zh">中文</option>
            <option value="en">English</option>
          </select>
        </div>
      </header>

      <main class="layout-main">
        <slot name="main" />
      </main>
    </div>
  </div>
</template>

<script>
import { defineComponent, ref } from '@vue/composition-api'
export default defineComponent({
  name: 'AppLayout',
  props: {
    title: {
      type: String,
      default: 'Agno-Vue',
    },
  },
  setup() {
    const isAsideCollapsed = ref(false)
    const toggleAside = () => {
      isAsideCollapsed.value = !isAsideCollapsed.value
    }

    return {
      isAsideCollapsed,
      toggleAside,
    }
  },
})
</script>

<style lang="less" scoped>
.layout-container {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;

  .layout-aside {
    width: 300px;
    height: 100%;
    flex: 0 0 300px;
    border-right: 1px solid @border-color;
    overflow: hidden;
    background: @surface-color;
    transition:
      width @transition-base,
      flex-basis @transition-base,
      border-color @transition-fast;

    .layout-aside-inner {
      width: 300px;
      height: 100%;
      opacity: 1;
      transform: translateX(0);
      transition:
        opacity @transition-fast,
        transform @transition-base;
    }
  }

  .layout-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .layout-header {
    height: @header-height;
    flex: 0 0 @header-height;
    position: relative;
    z-index: 2;
    background: @surface-color;
    color: @text-color;
    padding: 0 18px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .header-title {
      height: 32px;
      line-height: 32px;
    }

    .header-left {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      min-width: 0;
      gap: @spacing-sm;
    }

    .aside-toggle {
      width: 32px;
      height: 32px;
      flex: 0 0 32px;
      padding: 0;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: @primary-color;
      background: @surface-color;
      border-color: @border-color;
      border-radius: @border-radius-md;

      .toggle-icon {
        position: relative;
        width: 14px;
        height: 12px;
        transition: transform @transition-base;

        &,
        &::before,
        &::after {
          display: block;
          border-radius: 999px;
          background-color: currentColor;
        }

        &::before,
        &::after {
          content: '';
          position: absolute;
          left: 0;
          width: 14px;
          height: 2px;
        }

        & {
          height: 2px;
        }

        &::before {
          top: -5px;
        }

        &::after {
          top: 5px;
        }
      }
    }

    h1 {
      position: relative;
      z-index: 1;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 0.02em;
      color: @text-color;
    }

    .header-right {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      gap: @spacing-md;

      .lang-select {
        width: 108px;
        padding: 6px 10px;
        color: @text-color;
        background-color: @surface-color;
        border-color: @border-color;
      }
    }
  }

  .layout-main {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0;
    background: @surface-muted;
  }

  &.is-aside-collapsed {
    .layout-aside {
      width: 0;
      flex-basis: 0;
      border-right-color: transparent;

      .layout-aside-inner {
        opacity: 0;
        transform: translateX(-16px);
        pointer-events: none;
      }
    }
  }
}
</style>
