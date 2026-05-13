"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateShipmentDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_shipment_dto_1 = require("./create-shipment.dto");
class UpdateShipmentDto extends (0, mapped_types_1.PartialType)(create_shipment_dto_1.CreateShipmentDto) {
}
exports.UpdateShipmentDto = UpdateShipmentDto;
//# sourceMappingURL=update-shipment.dto.js.map