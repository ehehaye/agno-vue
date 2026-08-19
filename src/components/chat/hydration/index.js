// Configure custom components to be rendered in the LLM output
import Thinking from './Thinking.vue'

export const CUSTOM_COMPONENTS = {
  // key should be kebab-case or single lowercase word
  thinking: Thinking,
}

export const CUSTOM_TAGS = Object.keys(CUSTOM_COMPONENTS)
