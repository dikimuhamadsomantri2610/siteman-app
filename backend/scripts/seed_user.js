const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const plainPassword = 'diki123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const updatedUser = await prisma.user.upsert({
        where: { username: 'diki' },
        update: {
            password: hashedPassword,
            namaLengkap: 'Diki Muhamad Somantri',
            inisialDc: 'System',
        },
        create: {
            username: 'diki',
            password: hashedPassword,
            namaLengkap: 'Diki Muhamad Somantri',
            inisialDc: 'System',
        }
    });

    console.log("Database user 'diki' sudah disinkronkan. Password-nya sekarang adalah:", plainPassword);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
