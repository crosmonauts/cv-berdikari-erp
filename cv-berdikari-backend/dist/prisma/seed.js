"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const dotenv_1 = require("dotenv");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
(0, dotenv_1.config)();
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    console.log('Memulai proses seeding database...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const clientPassword = await bcrypt.hash('Berdikari123!', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@berdikari.com' },
        update: {},
        create: {
            email: 'admin@berdikari.com',
            password: adminPassword,
            name: 'Super Admin',
            role: 'SUPERADMIN',
        },
    });
    const client = await prisma.user.upsert({
        where: { email: 'cv.berdikari.berkah.bersama@gmail.com' },
        update: {},
        create: {
            email: 'cv.berdikari.berkah.bersama@gmail.com',
            password: clientPassword,
            name: 'Client Berdikari',
            role: 'ADMIN',
        },
    });
    console.log('✅ SEEDING SUKSES!');
    console.log('-------------------------------------------');
    console.log('Akun 1 (Super Admin):');
    console.log(`Email    : ${admin.email}`);
    console.log('Password : admin123');
    console.log('-------------------------------------------');
    console.log('Akun 2 (Client):');
    console.log(`Email    : ${client.email}`);
    console.log('Password : Berdikari123!');
    console.log('-------------------------------------------');
}
main()
    .catch((e) => {
    console.error('❌ Gagal melakukan seeding:');
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map