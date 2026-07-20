import { getDashboardStatsService } from '../src/services/dashboardService';

async function test() {
    try {
        console.log('Calling getDashboardStatsService()...');
        const stats = await getDashboardStatsService();
        console.log('Keys of stats:', Object.keys(stats));
        console.log('Meta:', stats.meta);
        console.log('GBG total:', stats.gbg.cur.total);
    } catch (err) {
        console.error('Error running service:', err);
    }
}

test();
