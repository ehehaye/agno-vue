import { logger } from '@/utils/logger'
import { onUpdated } from '@vue/composition-api'
import { useCompName } from '@/hooks/useCompName'

/**
 * Track component updates caused by unnecessary re-rendering
 */
export function usePerfTrack() {
  const name = useCompName()
  onUpdated(() => {
    logger.log(`[PerfTrack]: ${name} updated`)
  })
}
