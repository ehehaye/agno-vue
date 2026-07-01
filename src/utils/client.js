import { AgnoClient } from '@rodrigocoliveira/agno-client';

export const client = new AgnoClient({
  endpoint: `${window.location.protocol}//${window.location.host}/agno`,
  headers: {},
});
