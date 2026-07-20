const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const plainPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const updatedUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            password: hashedPassword,
            namaLengkap: 'Administrator'
        },
        create: {
            username: 'admin',
            password: hashedPassword,
            namaLengkap: 'Administrator',
            role: 'Admin',
            inisialDc: 'System',
        }
    });

    console.log("User 'admin' berhasil dibuat/diperbarui!");
    console.log("  Username   :", updatedUser.username);
    console.log("  Password   :", plainPassword);
    console.log("  Nama Lengkap:", updatedUser.namaLengkap);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
