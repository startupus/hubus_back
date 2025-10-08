declare const _default: () => {
    serviceName: string;
    port: number;
    grpcPort: number;
    host: string;
    nodeEnv: string;
    redis: {
        url: string;
    };
    rabbitmq: {
        url: string;
    };
    providers: {
        openai: {
            apiKey: string;
        };
        openrouter: {
            apiKey: string;
        };
    };
};
export default _default;
