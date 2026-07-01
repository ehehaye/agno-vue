<template>
  <div class="layout-container">
    <header class="layout-header">
      <slot name="header" />
      <div class="header-right">
        <select
          v-model="$i18n.locale"
          class="lang-select"
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
        </select>
      </div>
    </header>

    <div class="layout-body">
      <aside class="layout-aside">
        <slot name="aside" />
      </aside>

      <main class="layout-main">
        <slot name="main" />
      </main>
    </div>
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
export default defineComponent({
  name: 'AppLayout',
});
</script>

<style lang="less" scoped>
.layout-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;

  .layout-header {
    height: @header-height;
    background-color: @primary-color;
    color: white;
    padding: 0 20px;
    display: flex;
    align-items: center;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    justify-content: space-between;

    .header-right {
      display: flex;
      align-items: center;
      gap: @spacing-md;

      .lang-select {
        width: 100px;
        color: @text-color;
      }
    }
  }

  .layout-body {
    flex: 1;
    display: flex;
    overflow: hidden;

    .layout-aside {
      width: 300px;
      border-right: 1px solid @border-color;
      overflow: hidden;
      background-color: #f5f7fa;
    }

    .layout-main {
      flex: 1;
      overflow: hidden;
      padding: 0;
      background-color: #ffffff;
    }
  }
}
</style>