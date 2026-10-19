<template>
  <div class="app">
    <div
      v-if="isBootstrapping"
      class="tw:flex tw:h-full tw:items-center tw:justify-center"
    >
      <div class="tw:flex tw:flex-col tw:items-center tw:gap-base tw:rounded-xl tw:border tw:border-line tw:bg-surface tw:px-wide tw:py-wide tw:text-center">
        <StreamingIndicator />
        <p class="tw:text-sm tw:text-ink-muted">{{ $t('app.initializing') }}</p>
      </div>
    </div>
    <router-view v-else />
  </div>
</template>

<script setup>
import { computed, getCurrentInstance } from '@vue/composition-api'
import { StreamingIndicator } from '@/components/ui'
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
