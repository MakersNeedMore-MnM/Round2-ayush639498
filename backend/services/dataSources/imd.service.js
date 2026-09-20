const axios=require('axios');
const ENDPOINT=id=>`https://mausam.imd.gov.in/api/warnings_district_api.php?id=${id}`;
const warning={1:'No Warning',2:'Heavy Rain',3:'Heavy Snow',4:'Thunderstorm & Lightning / Squall',5:'Hailstorm',6:'Dust Storm',7:'Dust Raising Winds',8:'Strong Surface Winds',9:'Heat Wave',10:'Hot Day',11:'Warm Night',12:'Cold Wave',13:'Cold Day',14:'Ground Frost',15:'Fog',16:'Very Heavy Rain',17:'Extremely Heavy Rain'};
const colors={1:'RED',2:'ORANGE',3:'YELLOW',4:'GREEN'};
async function fetchWarning(id,district){const {data}=await axios.get(ENDPOINT(id),{timeout:7000});const x=Array.isArray(data)?data[0]||data:data;return {district,state:'Assam',objId:id,date:x.Date||x.date,days:[1,2,3,4,5].map(n=>({day:n,code:String(x[`Day_${n}`]??'1').split(',').filter(Boolean),color:colors[x[`Day${n}_Color`]]||'GREEN'})).map(d=>({...d,labels:d.code.map(c=>warning[c]||`Warning ${c}`)})),sourceType:'OFFICIAL',sourceName:'IMD District Warning API',sourceUrl:ENDPOINT(id)}}
module.exports={fetchWarning,ENDPOINT,warning};
