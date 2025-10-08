"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingCycle = exports.PricingType = exports.PaymentMethodType = exports.SubscriptionStatus = exports.InvoiceStatus = exports.TransactionStatus = exports.TransactionType = void 0;
var TransactionType;
(function (TransactionType) {
    TransactionType["CREDIT"] = "CREDIT";
    TransactionType["DEBIT"] = "DEBIT";
    TransactionType["REFUND"] = "REFUND";
    TransactionType["CHARGEBACK"] = "CHARGEBACK";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
var TransactionStatus;
(function (TransactionStatus) {
    TransactionStatus["PENDING"] = "PENDING";
    TransactionStatus["PROCESSING"] = "PROCESSING";
    TransactionStatus["COMPLETED"] = "COMPLETED";
    TransactionStatus["FAILED"] = "FAILED";
    TransactionStatus["CANCELLED"] = "CANCELLED";
    TransactionStatus["REFUNDED"] = "REFUNDED";
})(TransactionStatus || (exports.TransactionStatus = TransactionStatus = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["SENT"] = "SENT";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["OVERDUE"] = "OVERDUE";
    InvoiceStatus["CANCELLED"] = "CANCELLED";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["INACTIVE"] = "INACTIVE";
    SubscriptionStatus["CANCELLED"] = "CANCELLED";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var PaymentMethodType;
(function (PaymentMethodType) {
    PaymentMethodType["CARD"] = "CARD";
    PaymentMethodType["BANK_ACCOUNT"] = "BANK_ACCOUNT";
    PaymentMethodType["WALLET"] = "WALLET";
    PaymentMethodType["CRYPTOCURRENCY"] = "CRYPTOCURRENCY";
})(PaymentMethodType || (exports.PaymentMethodType = PaymentMethodType = {}));
var PricingType;
(function (PricingType) {
    PricingType["SUBSCRIPTION"] = "SUBSCRIPTION";
    PricingType["USAGE_BASED"] = "USAGE_BASED";
    PricingType["ONE_TIME"] = "ONE_TIME";
    PricingType["FREEMIUM"] = "FREEMIUM";
})(PricingType || (exports.PricingType = PricingType = {}));
var BillingCycle;
(function (BillingCycle) {
    BillingCycle["DAILY"] = "DAILY";
    BillingCycle["WEEKLY"] = "WEEKLY";
    BillingCycle["MONTHLY"] = "MONTHLY";
    BillingCycle["QUARTERLY"] = "QUARTERLY";
    BillingCycle["YEARLY"] = "YEARLY";
})(BillingCycle || (exports.BillingCycle = BillingCycle = {}));
//# sourceMappingURL=billing.types.js.map