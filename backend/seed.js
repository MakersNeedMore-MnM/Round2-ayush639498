require('dotenv').config();
const {connectDB,dbIsConnected}=require('./config/db');
const {resetAndSeed}=require('./services/demoDataService');
(async()=>{await connectDB();if(!dbIsConnected()){console.error('MongoDB is not reachable. Start MongoDB or set MONGO_URI.');process.exit(1)}await resetAndSeed();console.log('FloodGuard demo database seeded successfully.');process.exit(0)})().catch(e=>{console.error(e);process.exit(1)});
