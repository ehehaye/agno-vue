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
    border-right: 1px solid fade(@border-color, 70%);
    overflow: hidden;
    background: fade(@surface-color, 70%);
    backdrop-filter: blur(18px);
    box-shadow: 12px 0 34px rgba(31, 41, 55, 0.06);
    transition:
      width @transition-base,
      flex-basis @transition-base,
      border-color @transition-fast,
      box-shadow @transition-base;

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
    background:
      linear-gradient(135deg, fade(@surface-color, 92%) 0%, fade(@surface-muted, 86%) 100%),
      radial-gradient(circle at 18% 20%, fade(@primary-hover, 18%), transparent 28%);
    color: @text-color;
    padding: 0 18px;
    display: flex;
    align-items: center;
    border-bottom: 1px solid fade(@border-color, 72%);
    box-shadow: 0 8px 24px rgba(31, 41, 55, 0.06);
    backdrop-filter: blur(18px);
    justify-content: space-between;

    &::after {
      content: '';
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(90deg, fade(@primary-color, 10%), transparent 28%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.58), transparent 72%);
    }

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
      background:
        linear-gradient(135deg, fade(@surface-color, 88%), fade(@surface-muted, 82%));
      border-color: fade(@border-color, 88%);
      border-radius: @border-radius-md;
      box-shadow: 0 4px 14px rgba(31, 41, 55, 0.06);

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
        background-color: fade(@surface-color, 82%);
        border-color: fade(@border-color, 86%);
        box-shadow: 0 4px 14px rgba(31, 41, 55, 0.06);
      }
    }
  }

  .layout-main {
    flex: 1;
    min-height: 0;
    overflow: hidden;
    padding: 0;
    background:
      linear-gradient(180deg, fade(@surface-color, 82%) 0%, fade(@surface-muted, 82%) 100%),
      radial-gradient(circle at 75% 20%, rgba(90, 149, 245, 0.12), transparent 28%);
  }

  &.is-aside-collapsed {
    .layout-aside {
      width: 0;
      flex-basis: 0;
      border-right-color: transparent;
      box-shadow: none;

      .layout-aside-inner {
        opacity: 0;
        transform: translateX(-16px);
        pointer-events: none;
      }
    }
  }
}
</style>
