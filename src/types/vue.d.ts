import { $agno } from '@/agno/store';

declare module 'vue/types/vue' {
  interface Vue {
    $agno: typeof $agno;
  }
}

export {}
