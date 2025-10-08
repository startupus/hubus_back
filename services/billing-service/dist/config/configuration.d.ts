declare const _default: () => {
    serviceName: string;
    port: number;
    grpcPort: number;
    host: string;
    nodeEnv: string;
    database: {
        url: string;
    };
    redis: {
        url: string;
    };
    rabbitmq: {
        url: string;
    };
    billing: {
        defaultCurrency: string;
        defaultBalance: number;
    };
};
export default _default;
