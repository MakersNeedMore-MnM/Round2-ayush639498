const axios=require('axios');
async function overpass(query){const {data}=await axios.post('https://overpass-api.de/api/interpreter',query,{timeout:15000,headers:{'Content-Type':'text/plain'}});return data}
module.exports={overpass};
