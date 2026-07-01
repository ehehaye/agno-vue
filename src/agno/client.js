import { AgnoClient } from '@rodrigocoliveira/agno-client';
import { Config } from '@/agno/config';

class Client extends AgnoClient {
  setMode(mode) {
    const { agents, teams } = this.state;

    if (mode === 'agent' && agents.length > 0) {
      const firstAgent = agents[0];
      this.configManager.updateConfig({
        mode: 'agent',
        agentId: firstAgent.id,
        dbId: firstAgent.db_id || undefined,
      });
      this.emit('config:change', this.configManager.getConfig());
    } else if (mode === 'team' && teams.length > 0) {
      const firstTeam = teams[0];
      this.configManager.updateConfig({
        mode: 'team',
        teamId: firstTeam.id,
        dbId: firstTeam.db_id || undefined,
      });
      this.emit('config:change', this.configManager.getConfig());
    }
  }
}

export const client = new Client({
  ...Config,
});
