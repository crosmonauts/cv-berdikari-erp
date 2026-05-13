"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItemsController = void 0;
const common_1 = require("@nestjs/common");
const order_items_service_1 = require("./order-items.service");
let OrderItemsController = class OrderItemsController {
    orderItemsService;
    constructor(orderItemsService) {
        this.orderItemsService = orderItemsService;
    }
    create(createOrderItemDto) {
        return this.orderItemsService.create(createOrderItemDto);
    }
    findByOrderId(orderId) {
        return this.orderItemsService.findByOrderId(orderId);
    }
    remove(id) {
        return this.orderItemsService.remove(id);
    }
    async scanBarcode(body) {
        try {
            const qtyToProcess = body.qty ? Number(body.qty) : 1;
            const result = await this.orderItemsService.scanBarcode(body.orderId, body.barcode, qtyToProcess);
            return { success: true, data: result };
        }
        catch (error) {
            return { success: false, message: error.message };
        }
    }
};
exports.OrderItemsController = OrderItemsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrderItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('order/:orderId'),
    __param(0, (0, common_1.Param)('orderId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrderItemsController.prototype, "findByOrderId", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], OrderItemsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('scan'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrderItemsController.prototype, "scanBarcode", null);
exports.OrderItemsController = OrderItemsController = __decorate([
    (0, common_1.Controller)('order-items'),
    __metadata("design:paramtypes", [order_items_service_1.OrderItemsService])
], OrderItemsController);
//# sourceMappingURL=order-items.controller.js.map