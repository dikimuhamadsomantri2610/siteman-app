import prisma from '../src/config/db';

async function listUsers() {
    try {
        console.log('Querying users...');
        const users = await prisma.user.findMany();
        console.log('Users found:', users.map(u => ({ id: u.id, username: u.username, role: u.role, inisialDc: u.inisialDc, namaLengkap: u.namaLengkap })));
    } catch (err) {
        console.error('Error querying users:', err);
    } finally {
        await prisma.$disconnect();
    }
}

listUsers();
