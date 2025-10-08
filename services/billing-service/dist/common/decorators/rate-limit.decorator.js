"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimits = exports.RateLimit = void 0;
const common_1 = require("@nestjs/common");
const RateLimit = (requests, window) => (0, common_1.SetMetadata)('rateLimit', { requests, window });
exports.RateLimit = RateLimit;
exports.RateLimits = {
    UPDATE_BALANCE: (0, exports.RateLimit)(10, 60000),
    PROCESS_PAYMENT: (0, exports.RateLimit)(5, 60000),
    CREATE_TRANSACTION: (0, exports.RateLimit)(20, 60000),
    GET_BALANCE: (0, exports.RateLimit)(100, 60000),
    GET_TRANSACTIONS: (0, exports.RateLimit)(50, 60000),
    GET_REPORT: (0, exports.RateLimit)(10, 60000),
    TRACK_USAGE: (0, exports.RateLimit)(1000, 60000),
    CALCULATE_COST: (0, exports.RateLimit)(200, 60000),
    ADMIN_OPERATIONS: (0, exports.RateLimit)(5, 300000),
};
//# sourceMappingURL=rate-limit.decorator.js.map