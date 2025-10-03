import { User } from '@ai-aggregator/shared';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

