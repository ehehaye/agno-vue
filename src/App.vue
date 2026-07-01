<template>
  <Dashboard />
</template>

<script>
import { defineComponent } from '@vue/composition-api';
import Dashboard from '@/components/Dashboard.vue';

export default defineComponent({
  name: 'App',
  components: {
    Dashboard,
  },
});
</script>

<style lang="scss" scoped></style>
