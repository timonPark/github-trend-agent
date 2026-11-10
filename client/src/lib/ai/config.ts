import { Database as DatabaseInstance } from 'better-sqlite3';
import { getClientDb, getSetting, setSetting } from '../db';
import { AiAgentConfig, AiProviderType } from './types';

const DEFAULT_AI_CONFIG: AiAgentConfig = {
  provider: 'none',
  model: 'default',
  apiKey: '',
  cliPath: '',
};

export function getAiConfig(db?: DatabaseInstance): AiAgentConfig {
  const d = db || getClientDb();

  const provider = (getSetting('ai_provider', d) as AiProviderType) || DEFAULT_AI_CONFIG.provider;
  const model = getSetting('ai_model', d) || DEFAULT_AI_CONFIG.model;
  const apiKey = getSetting('ai_api_key', d) || DEFAULT_AI_CONFIG.apiKey;
  const cliPath = getSetting('ai_cli_path', d) || DEFAULT_AI_CONFIG.cliPath;

  return {
    provider,
    model,
    apiKey,
    cliPath,
  };
}

export function saveAiConfig(newConfig: Partial<AiAgentConfig>, db?: DatabaseInstance): AiAgentConfig {
  const d = db || getClientDb();
  const current = getAiConfig(d);

  const updated: AiAgentConfig = {
    provider: newConfig.provider !== undefined ? newConfig.provider : current.provider,
    model: newConfig.model !== undefined ? newConfig.model.trim() : current.model,
    apiKey: newConfig.apiKey !== undefined ? newConfig.apiKey.trim() : current.apiKey,
    cliPath: newConfig.cliPath !== undefined ? newConfig.cliPath.trim() : current.cliPath,
  };

  setSetting('ai_provider', updated.provider, d);
  setSetting('ai_model', updated.model, d);
  setSetting('ai_api_key', updated.apiKey || '', d);
  setSetting('ai_cli_path', updated.cliPath || '', d);

  return updated;
}
