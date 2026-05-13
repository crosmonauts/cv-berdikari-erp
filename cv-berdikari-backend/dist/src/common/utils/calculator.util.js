"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hitungKeuangan = void 0;
const hitungKeuangan = (hargaJual, hargaKulak) => {
    const jual = hargaJual || 0;
    const kulak = hargaKulak || 0;
    const dpp = jual / 1.11;
    const ppn = jual - dpp;
    const laba = dpp - kulak;
    return {
        dpp: parseFloat(dpp.toFixed(2)),
        ppn: parseFloat(ppn.toFixed(2)),
        laba: parseFloat(laba.toFixed(2))
    };
};
exports.hitungKeuangan = hitungKeuangan;
//# sourceMappingURL=calculator.util.js.map