"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestStatus = exports.RequestType = void 0;
var RequestType;
(function (RequestType) {
    RequestType["CHAT_COMPLETION"] = "chat_completion";
    RequestType["IMAGE_GENERATION"] = "image_generation";
    RequestType["EMBEDDING"] = "embedding";
    RequestType["MODERATION"] = "moderation";
    RequestType["TRANSCRIPTION"] = "transcription";
    RequestType["TRANSLATION"] = "translation";
})(RequestType || (exports.RequestType = RequestType = {}));
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["SUCCESS"] = "success";
    RequestStatus["ERROR"] = "error";
    RequestStatus["TIMEOUT"] = "timeout";
    RequestStatus["CANCELLED"] = "cancelled";
    RequestStatus["RATE_LIMITED"] = "rate_limited";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
//# sourceMappingURL=request-history.js.map