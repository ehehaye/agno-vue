<template>
  <div class="chat-sidebar">
    <SessionList />
    <ModelConfig />
  </div>
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import SessionList from './SessionList.vue';
import ModelConfig from './ModelConfig.vue';

export default defineComponent({
  name: 'Sidebar',
  components: {
    SessionList,
    ModelConfig,
  },
});
</script>

<style lang="less" scoped>
.chat-sidebar {
  height: calc(100vh - @header-height);
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
  border-right: 1px solid @border-color;
}
</style>
