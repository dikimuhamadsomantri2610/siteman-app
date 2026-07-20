import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
}));
app.use(express.json());

// Rate Limiting
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Terlalu banyak request dari IP ini, coba lagi nanti' }
});

app.use('/api/auth', authLimiter);
app.use('/api', routes);

app.get('/', (req, res) => {
    res.send('Dashboard DC API is running');
});

app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`✅ Server is running at http://0.0.0.0:${PORT}`);
    console.log(`   Local  : http://localhost:${PORT}`);
    console.log(`   Network: http://<IP-LAN-Anda>:${PORT}`);
});
