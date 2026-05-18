<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <slot name="header" />
      <div class="header-right">
        <el-select
          v-model="$i18n.locale"
          class="lang-select"
          :size="'small'"
        >
          <el-option
            label="中文"
            value="zh"
          />
          <el-option
            label="English"
            value="en"
          />
        </el-select>
      </div>
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
      }
    }
  }

  .layout-body {
    flex: 1;
    display: flex;
    overflow: hidden;

    .layout-aside {
      border-right: 1px solid @border-color;
      overflow: hidden;
      background-color: #f5f7fa;

      ::v-deep .el-menu {
        border-right: none;
        padding: @spacing-md 0;

        .el-menu-item {
          height: 40px;
          line-height: 40px;

          &:hover {
            background-color: #e6f7ff !important;
          }
        }

        .el-sub-menu__title {
          height: 40px;
          line-height: 40px;

          &:hover {
            background-color: #e6f7ff !important;
          }
        }
      }
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