const mongoose=require('mongoose');let connected=false;
async function connectDB(){try{await mongoose.connect(process.env.MONGO_URI||'mongodb://127.0.0.1:27017/floodguard',{serverSelectionTimeoutMS:5000});connected=true;console.log('[DB] MongoDB connected')}catch(e){console.warn('[DB] Mongo unavailable; demo fallback active')}}
const dbIsConnected=()=>connected&&mongoose.connection.readyState===1;module.exports={connectDB,dbIsConnected};
