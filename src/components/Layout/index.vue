<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <slot name="header" />
    </el-header>

    <el-container class="layout-body">
      <el-aside
        class="layout-aside"
        width="300px"
      >
        <slot name="aside" />
      </el-aside>

      <el-main class="layout-main">
        <slot name="main" />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
export default {
  name: 'Layout',
};
</script>

<style lang="less" scoped>
@import '/src/assets/styles/variables.less';

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
  }

  .layout-body {
    flex: 1;
    display: flex;
    overflow: hidden;

    .layout-aside {
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