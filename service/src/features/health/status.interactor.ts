import { AppConfig } from '../../appConfig';
import { AbstractInteractor } from '../abstractInteractor';

export interface StatusInteractorOutput {
  status: string;
  environment: string;
  uptime: number;
  timestamp: string;
}

export class StatusInteractor extends AbstractInteractor<void, StatusInteractorOutput> {
  constructor(public config: AppConfig) {
    super();
  }

  with(): StatusInteractorOutput {
    return {
      status: 'ok',
      environment: this.config.nodeEnv,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  validateInput(_input: unknown): void {
    return;
  }
}
