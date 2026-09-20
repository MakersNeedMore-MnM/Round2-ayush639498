const axios=require('axios');
const ENDPOINT='https://sachet.ndma.gov.in/cap_public_website/FetchAllAlertDetails';
function parseDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?new Date():d}
function normalize(a){let centroid=String(a.centroid||'').split(',').map(Number);return {externalId:String(a.identifier||''),title:`${a.disaster_type||'Disaster'} alert`,description:a.warning_message||a.area_description||'Government disaster alert',severity:a.severity||'WATCH',affectedArea:a.area_description||'',issuedAt:parseDate(a.effective_start_time),expiresAt:parseDate(a.effective_end_time),officialUrl:a.identifier?`https://sachet.ndma.gov.in/cap_public_website/FetchPolygonXMLFile?identifier=${a.identifier}`:'https://sachet.ndma.gov.in/',sourceType:'OFFICIAL',source:'SACHET / NDMA',sourceUrl:'https://sachet.ndma.gov.in/',centroid:Number.isFinite(centroid[0])&&Number.isFinite(centroid[1])?{lng:centroid[0],lat:centroid[1]}:null,disasterType:a.disaster_type,raw:a}}
async function fetchAlerts(){const {data}=await axios.get(ENDPOINT,{timeout:8000});return Array.isArray(data)?data.map(normalize):[]}
module.exports={fetchAlerts,ENDPOINT};
