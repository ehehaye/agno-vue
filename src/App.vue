<template>
  <div class="app">
    <div
      v-if="isBootstrapping"
      class="flex h-full items-center justify-center"
    >
      <div class="flex flex-col items-center gap-md rounded-xl border border-line bg-surface px-xl py-xl text-center">
        <StreamingIndicator />
        <p class="text-sm text-ink-muted">{{ $t('app.initializing') }}</p>
      </div>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from '@vue/composition-api'
import { StreamingIndicator } from '@/components/common'
import { $c } from '@/constants'
import { useConfig } from '@/hooks/agno/useConfig'

const { connectionStatus } = useConfig()
const instance = getCurrentInstance()
const isBootstrapping = computed(
  () =>
    connectionStatus.value === $c.ConnStatus.Connecting &&
    instance.proxy.$route?.name !== 'setup'
)
</script>

<style lang="less" scoped>
.app {
  height: 100%;
}
</style>
