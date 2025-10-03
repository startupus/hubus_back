"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GrpcModule = void 0;
const common_1 = require("@nestjs/common");
const grpc_controller_1 = require("./grpc.controller");
const auth_module_1 = require("../modules/auth/auth.module");
const api_key_module_1 = require("../modules/api-key/api-key.module");
const user_module_1 = require("../modules/user/user.module");
let GrpcModule = class GrpcModule {
};
exports.GrpcModule = GrpcModule;
exports.GrpcModule = GrpcModule = __decorate([
    (0, common_1.Module)({
        imports: [auth_module_1.AuthModule, api_key_module_1.ApiKeyModule, user_module_1.UserModule],
        providers: [grpc_controller_1.GrpcController],
    })
], GrpcModule);
//# sourceMappingURL=grpc.module.js.map