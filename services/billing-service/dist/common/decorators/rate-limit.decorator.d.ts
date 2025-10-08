export declare const RateLimit: (requests: number, window: number) => import("@nestjs/common").CustomDecorator<string>;
export declare const RateLimits: {
    UPDATE_BALANCE: import("@nestjs/common").CustomDecorator<string>;
    PROCESS_PAYMENT: import("@nestjs/common").CustomDecorator<string>;
    CREATE_TRANSACTION: import("@nestjs/common").CustomDecorator<string>;
    GET_BALANCE: import("@nestjs/common").CustomDecorator<string>;
    GET_TRANSACTIONS: import("@nestjs/common").CustomDecorator<string>;
    GET_REPORT: import("@nestjs/common").CustomDecorator<string>;
    TRACK_USAGE: import("@nestjs/common").CustomDecorator<string>;
    CALCULATE_COST: import("@nestjs/common").CustomDecorator<string>;
    ADMIN_OPERATIONS: import("@nestjs/common").CustomDecorator<string>;
};
