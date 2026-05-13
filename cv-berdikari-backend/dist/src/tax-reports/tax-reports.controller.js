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
exports.TaxReportsController = void 0;
const common_1 = require("@nestjs/common");
const tax_reports_service_1 = require("./tax-reports.service");
const create_tax_report_dto_1 = require("./dto/create-tax-report.dto");
const update_tax_report_dto_1 = require("./dto/update-tax-report.dto");
let TaxReportsController = class TaxReportsController {
    taxReportsService;
    constructor(taxReportsService) {
        this.taxReportsService = taxReportsService;
    }
    create(createTaxReportDto) {
        return this.taxReportsService.create(createTaxReportDto);
    }
    findAll() {
        return this.taxReportsService.findAll();
    }
    findOne(id) {
        return this.taxReportsService.findOne(id);
    }
    update(id, updateTaxReportDto) {
        return this.taxReportsService.update(id, updateTaxReportDto);
    }
    remove(id) {
        return this.taxReportsService.remove(id);
    }
};
exports.TaxReportsController = TaxReportsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_tax_report_dto_1.CreateTaxReportDto]),
    __metadata("design:returntype", void 0)
], TaxReportsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TaxReportsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaxReportsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_tax_report_dto_1.UpdateTaxReportDto]),
    __metadata("design:returntype", void 0)
], TaxReportsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TaxReportsController.prototype, "remove", null);
exports.TaxReportsController = TaxReportsController = __decorate([
    (0, common_1.Controller)('tax-reports'),
    __metadata("design:paramtypes", [tax_reports_service_1.TaxReportsService])
], TaxReportsController);
//# sourceMappingURL=tax-reports.controller.js.map