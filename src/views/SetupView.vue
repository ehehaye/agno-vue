<template>
  <div class="flex h-full items-center justify-center px-md">
    <div class="w-full max-w-md rounded-xl border border-line bg-surface p-xl">
      <h1 class="text-2xl font-semibold text-ink">
        {{ $t('setup.title') }}
      </h1>
      <p class="mt-sm text-sm text-ink-muted">
        {{ $t('setup.description') }}
      </p>

      <label
        for="server-url"
        class="mt-lg block text-sm font-medium text-ink"
      >
        {{ $t('setup.serverUrl') }}
      </label>
      <input
        id="server-url"
        v-model="draft"
        class="ai-input mt-xs w-full rounded-md border border-line bg-surface px-md py-sm text-ink focus:border-brand focus:outline-none"
        :placeholder="defaultServerUrl"
        :disabled="testing"
        @input="clearError"
        @keydown.enter.prevent="submit"
      >

      <p
        v-if="message"
        class="mt-sm break-words text-sm"
        :class="hasError ? 'text-danger' : 'text-success'"
        role="status"
      >
        {{ message }}
      </p>

      <button
        type="button"
        class="ai-button mt-lg w-full"
        :disabled="testing || !draft.trim()"
        @click="submit"
      >
        {{ testing ? $t('setup.connecting') : $t('setup.connect') }}
      </button>

      <router-link
        v-if="canEnter"
        to="/"
        class="mt-md block text-center text-sm text-brand hover:underline"
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
