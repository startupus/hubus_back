"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportType = exports.AlertType = exports.MetricType = exports.EventType = void 0;
var EventType;
(function (EventType) {
    EventType["USER_ACTION"] = "user_action";
    EventType["SYSTEM_EVENT"] = "system_event";
    EventType["AI_INTERACTION"] = "ai_interaction";
    EventType["SECURITY_EVENT"] = "security_event";
    EventType["BILLING_EVENT"] = "billing_event";
    EventType["PERFORMANCE_EVENT"] = "performance_event";
    EventType["ERROR_EVENT"] = "error_event";
})(EventType || (exports.EventType = EventType = {}));
var MetricType;
(function (MetricType) {
    MetricType["PERFORMANCE"] = "performance";
    MetricType["USAGE"] = "usage";
    MetricType["ERROR"] = "error";
    MetricType["RESOURCE"] = "resource";
    MetricType["BUSINESS"] = "business";
    MetricType["SECURITY"] = "security";
})(MetricType || (exports.MetricType = MetricType = {}));
var AlertType;
(function (AlertType) {
    AlertType["CRITICAL"] = "critical";
    AlertType["WARNING"] = "warning";
    AlertType["INFO"] = "info";
})(AlertType || (exports.AlertType = AlertType = {}));
var ExportType;
(function (ExportType) {
    ExportType["CSV"] = "csv";
    ExportType["JSON"] = "json";
    ExportType["EXCEL"] = "excel";
    ExportType["PDF"] = "pdf";
})(ExportType || (exports.ExportType = ExportType = {}));
//# sourceMappingURL=analytics.types.js.map