export const createScrollIntoView = () => {
  const rafIdMap = new WeakMap();

  const scrollIntoView = (
    el,
    options = { behavior: 'smooth', container: 'nearest' }
  ) => {
    const rafId = rafIdMap.get(el);

    if (rafId) {
      cancelAnimationFrame(rafId);
    }

    const nextRafId = requestAnimationFrame(() => {
      if (el) {
        rafIdMap.delete(el);
        el.scrollIntoView(options);
      }
    });

    rafIdMap.set(el, nextRafId);
  };

  const cancelNextScroll = (el) => {
    const rafId = rafIdMap.get(el);

    if (rafId) {
      cancelAnimationFrame(rafId);
      rafIdMap.delete(el);
    }
  };

  return {
    scrollIntoView,
    cancelNextScroll,
  };
};

export const createManualScrollDetector = (options = {}) => {
  const { activeDuration = 120 } = options;
  const passiveOptions = { passive: true };
  let el = null;
  let isMouseDown = false;
  let lastMouseEventAt = 0;

  const getNow = () =>
    typeof performance !== 'undefined' ? performance.now() : Date.now();

  const markManualScroll = () => {
    lastMouseEventAt = getNow();
  };

  const handleWheel = () => {
    markManualScroll();
  };

  const handleMouseDown = () => {
    isMouseDown = true;
    markManualScroll();
  };

  const handleMouseMove = () => {
    if (isMouseDown) {
      markManualScroll();
    }
  };

  const handleMouseUp = () => {
    if (isMouseDown) {
      markManualScroll();
    }

    isMouseDown = false;
  };

  const bind = (target) => {
    if (target === el) return;

    unbind();

    if (!target || typeof target.addEventListener !== 'function') return;

    el = target;
    el.addEventListener('wheel', handleWheel, passiveOptions);
    el.addEventListener('mousewheel', handleWheel, passiveOptions);
    el.addEventListener('mousedown', handleMouseDown, passiveOptions);

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleMouseMove, passiveOptions);
      window.addEventListener('mouseup', handleMouseUp, passiveOptions);
    } else {
      el.addEventListener('mousemove', handleMouseMove, passiveOptions);
      el.addEventListener('mouseup', handleMouseUp, passiveOptions);
    }
  };

  const unbind = () => {
    if (!el) return;

    el.removeEventListener('wheel', handleWheel, passiveOptions);
    el.removeEventListener('mousewheel', handleWheel, passiveOptions);
    el.removeEventListener('mousedown', handleMouseDown, passiveOptions);

    if (typeof window !== 'undefined') {
      window.removeEventListener('mousemove', handleMouseMove, passiveOptions);
      window.removeEventListener('mouseup', handleMouseUp, passiveOptions);
    } else {
      el.removeEventListener('mousemove', handleMouseMove, passiveOptions);
      el.removeEventListener('mouseup', handleMouseUp, passiveOptions);
    }

    el = null;
    isMouseDown = false;
    lastMouseEventAt = 0;
  };

  const isManualScroll = () =>
    isMouseDown || getNow() - lastMouseEventAt <= activeDuration;

  return {
    bind,
    unbind,
    isManualScroll,
  };
};

export const getDistanceToBottom = (el) => {
  const { scrollTop, scrollHeight, clientHeight } = el;
  return Math.max(scrollHeight - scrollTop - clientHeight, 0)
}
