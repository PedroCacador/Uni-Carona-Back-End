import { isProductionEnvironment } from '../config/environment';
import { IEmailService } from './IEmailService';
import { MockEmailService } from './MockEmailService';
import { ResendEmailService } from './ResendEmailService';

export function createEmailService(): IEmailService {
  if (isProductionEnvironment()) {
    return new ResendEmailService();
  }

  return new MockEmailService();
}
