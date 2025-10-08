declare const _default: () => {
    serviceName: string;
    port: number;
    environment: string;
    cors: {
        origin: string;
    };
    database: {
        url: string;
    };
    redis: {
        url: string;
    };
    rabbitmq: {
        url: string;
    };
};
export default _default;
