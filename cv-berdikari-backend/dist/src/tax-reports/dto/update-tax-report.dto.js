"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTaxReportDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_tax_report_dto_1 = require("./create-tax-report.dto");
class UpdateTaxReportDto extends (0, mapped_types_1.PartialType)(create_tax_report_dto_1.CreateTaxReportDto) {
}
exports.UpdateTaxReportDto = UpdateTaxReportDto;
//# sourceMappingURL=update-tax-report.dto.js.map