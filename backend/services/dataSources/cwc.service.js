const axios=require('axios');const cheerio=require('cheerio');
const PUBLIC_URL='https://ffs.india-water.gov.in/#/';
async function fetchSituation(){try{const {data}=await axios.get(PUBLIC_URL,{timeout:8000,headers:{'User-Agent':'FloodGuard/2.0 public-data-monitor'}});const $=cheerio.load(data);return {sourceType:'OFFICIAL',sourceName:'Central Water Commission Flood Forecasting',sourceUrl:PUBLIC_URL,pageText:$('body').text().replace(/\s+/g,' ').trim().slice(0,5000),fetchedAt:new Date()}}catch(e){return null}}
module.exports={fetchSituation,PUBLIC_URL};
