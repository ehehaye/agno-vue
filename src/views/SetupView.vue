<template>
  <div class="tw:flex tw:h-full tw:items-center tw:justify-center tw:px-base">
    <div class="tw:w-full tw:max-w-md tw:rounded-xl tw:border tw:border-line tw:bg-surface tw:p-wide">
      <h1 class="tw:text-2xl tw:font-semibold tw:text-ink">
        {{ $t('setup.title') }}
      </h1>
      <p class="tw:mt-compact tw:text-sm tw:text-ink-muted">
        {{ $t('setup.description') }}
      </p>

      <label
        for="server-url"
        class="tw:mt-loose tw:block tw:text-sm tw:font-medium tw:text-ink"
      >
        {{ $t('setup.serverUrl') }}
      </label>
      <input
        id="server-url"
        v-model="draft"
        class="ai-input tw:mt-tight tw:w-full tw:rounded-md tw:border tw:border-line tw:bg-surface tw:px-base tw:py-compact tw:text-ink tw:focus:border-brand tw:focus:outline-none"
        :placeholder="defaultServerUrl"
        :disabled="testing"
        @input="clearError"
        @keydown.enter.prevent="submit"
      >

      <p
        v-if="message"
        class="tw:mt-compact tw:break-words tw:text-sm"
        :class="hasError ? 'tw:text-danger' : 'tw:text-success'"
        role="status"
      >
        {{ message }}
      </p>

      <button
        type="button"
        class="ai-button tw:mt-loose tw:w-full"
        :disabled="testing || !draft.trim()"
        @click="submit"
      >
        {{ testing ? $t('setup.connecting') : $t('setup.connect') }}
      </button>

      <router-link
        v-if="canEnter"
        to="/"
        class="tw:mt-base tw:block tw:text-center tw:text-sm tw:text-brand tw:hover:underline"
      >
        {{ $t('setup.back') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { computed, getCurrentInstance, ref } from '@vue/composition-api'
import { $c } from '@/constants'
import { useConfig } from '@/hooks/agno/useConfig'

const {
  serverUrl,
  defaultServerUrl,
  setServerUrl,
  connect,
  connectionStatus,
  error,
} = useConfig()

const instance = getCurrentInstance()
const router = instance.proxy.$router
const route = instance.proxy.$route

const draft = ref(serverUrl.value || defaultServerUrl)
const testing = ref(false)
const localError = ref('')

const canEnter = computed(
  () => connectionStatus.value === $c.ConnStatus.Connected
)
const hasError = computed(() => Boolean(localError.value || error.value))
const message = computed(() => {
  if (testing.value) {
    return ''
  }
  if (localError.value) {
    return localError.value
  }
  if (error.value) {
    return `${instance.proxy.$t('setup.failed')}: ${error.value}`
  }
  return ''
})

const clearError = () => {
  localError.value = ''
  error.value = null
}

const submit = async () => {
  const next = draft.value.trim()
  if (!next) {
    localError.value = instance.proxy.$t('setup.required')
    return
  }

  testing.value = true
  localError.value = ''
  setServerUrl(next)

  const connected = await connect()
  testing.value = false

  if (connected) {
    const redirect =
      typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.replace(redirect)
    return
  }

  if (!error.value) {
    localError.value = instance.proxy.$t('setup.failed')
  }
}
</script>
