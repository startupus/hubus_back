import { Response } from 'express';
export declare class HealthController {
    checkHealth(res: Response): Response<any, Record<string, any>>;
}
