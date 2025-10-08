import { OrchestratorService } from './orchestrator.service';
export declare class OrchestratorController {
    private readonly orchestratorService;
    constructor(orchestratorService: OrchestratorService);
    getModels(): Promise<any>;
    routeRequest(requestData: any): Promise<any>;
}
