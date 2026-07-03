import { onMounted, onUnmounted, ref } from '@vue/composition-api';
import {
  createManualScrollDetector,
  getDistanceToBottom,
} from '@/utils/scroll.js';

export function useManualScrollDetector(elRef, { threshold = 100 } = {}) {
  const detector = createManualScrollDetector();
  const isManualScrolling = ref(false);
  const isManuallyMovedToSafeArea = ref(false);
  const thresholdValue = Number(threshold);
  const safeAreaThreshold = Number.isFinite(thresholdValue)
    ? thresholdValue
    : 100;
  let scrollEl = null;

  const getSafeState = () =>
    scrollEl ? getDistanceToBottom(scrollEl) >= safeAreaThreshold : false;

  const restart = () => {
    isManuallyMovedToSafeArea.value = false;
  };

  const updateManualScrollState = (manualScrolling, keepSafeState = manualScrolling) => {
    isManualScrolling.value = manualScrolling;
    isManuallyMovedToSafeArea.value = keepSafeState ? getSafeState() : false;
  };

  const onScroll = () => {
    updateManualScrollState(detector.isManualScroll());
  };

  const onScrollend = () => {
    updateManualScrollState(false, isManualScrolling.value);
  };

  onMounted(() => {
    scrollEl = elRef.value;

    if (!scrollEl) return;

    detector.bind(scrollEl);
    scrollEl.addEventListener('scroll', onScroll);
    scrollEl.addEventListener('scrollend', onScrollend);
  });

  onUnmounted(() => {
    detector.unbind();

    if (!scrollEl) return;

    scrollEl.removeEventListener('scroll', onScroll);
    scrollEl.removeEventListener('scrollend', onScrollend);
    scrollEl = null;
  });

  return {
    isManualScrolling,
    isManuallyMovedToSafeArea,
    restart,
  };
}
