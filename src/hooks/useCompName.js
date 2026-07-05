import { getCurrentInstance } from '@vue/composition-api';

export function useCompName() {
  const instance = getCurrentInstance();
  return instance?.type?.name || instance?.type?.__file;
}
