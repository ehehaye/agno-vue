<template>
  <Dashboard v-if="initialized" />
</template>

<script>
import { $agno } from '@/agno/store';
import Dashboard from '@/components/Dashboard.vue';

export default {
  name: 'App',
  components: {
    Dashboard,
  },
  data() {
    return {
      initialized: false,
    }
  },
  async created() {
    await $agno.initialize();
    this.initialized = true;
  },
};
</script>

<style lang="scss" scoped></style>
