// National state → district map with approximate district-centre coordinates.
// Assam is the default state/district for the RahatSetu demo.
export const STATE_DISTRICTS = {
    'Assam': {
        order: 1,
        river: 'Brahmaputra',
        districts: {
            'Dibrugarh': { lat: 27.4728, lng: 94.9120 },
            'Lakhimpur': { lat: 27.2333, lng: 94.1000 },
            'Barpeta': { lat: 26.3220, lng: 91.0060 },
            'Morigaon': { lat: 26.2520, lng: 92.3400 },
            'Dhemaji': { lat: 27.4833, lng: 94.5667 },
            'Majuli': { lat: 26.9500, lng: 94.1667 },
            'Sonitpur': { lat: 26.6528, lng: 92.7930 },
            'Kamrup (Metro)': { lat: 26.1445, lng: 91.7362 },
            'Nagaon': { lat: 26.3480, lng: 92.6840 },
            'Cachar': { lat: 24.8333, lng: 92.7789 }
        }
    },
    'Uttar Pradesh': { river: 'Ganga', districts: { 'Lucknow': { lat: 26.8467, lng: 80.9462 }, 'Varanasi': { lat: 25.3176, lng: 82.9739 }, 'Prayagraj': { lat: 25.4358, lng: 81.8463 }, 'Gorakhpur': { lat: 26.7606, lng: 83.3732 }, 'Ballia': { lat: 25.7600, lng: 84.1500 } } },
    'Bihar': { river: 'Ganga', districts: { 'Patna': { lat: 25.5941, lng: 85.1376 }, 'Muzaffarpur': { lat: 26.1225, lng: 85.3906 }, 'Darbhanga': { lat: 26.1520, lng: 85.8970 }, 'Bhagalpur': { lat: 25.2425, lng: 86.9842 }, 'Gopalganj': { lat: 26.4700, lng: 84.4360 } } },
    'West Bengal': { river: 'Ganga-Padma', districts: { 'Malda': { lat: 25.0090, lng: 88.1400 }, 'Jalpaiguri': { lat: 26.5417, lng: 88.7217 }, 'Kolkata': { lat: 22.5726, lng: 88.3639 }, 'Murshidabad': { lat: 24.1833, lng: 88.2667 }, 'Cooch Behar': { lat: 26.3252, lng: 89.4482 } } },
    'Kerala': { river: 'Periyar', districts: { 'Alappuzha': { lat: 9.4981, lng: 76.3388 }, 'Ernakulam': { lat: 9.9816, lng: 76.2999 }, 'Wayanad': { lat: 11.6854, lng: 76.1320 }, 'Idukki': { lat: 9.8500, lng: 76.9700 }, 'Thrissur': { lat: 10.5276, lng: 76.2144 } } },
    'Maharashtra': { river: 'Godavari', districts: { 'Nashik': { lat: 19.9975, lng: 73.7898 }, 'Pune': { lat: 18.5204, lng: 73.8567 }, 'Kolhapur': { lat: 16.7050, lng: 74.2433 }, 'Sangli': { lat: 16.8524, lng: 74.5815 }, 'Mumbai Suburban': { lat: 19.0760, lng: 72.8777 } } },
    'Delhi': { river: 'Yamuna', districts: { 'New Delhi': { lat: 28.6139, lng: 77.2090 }, 'North Delhi': { lat: 28.7041, lng: 77.1900 }, 'East Delhi': { lat: 28.6280, lng: 77.2900 } } },
    'Andhra Pradesh': { river: 'Krishna', districts: { 'Vijayawada (NTR)': { lat: 16.5062, lng: 80.6480 }, 'Guntur': { lat: 16.3067, lng: 80.4365 }, 'East Godavari': { lat: 17.0005, lng: 81.8040 }, 'Visakhapatnam': { lat: 17.6868, lng: 83.2185 } } },
    'Arunachal Pradesh': { river: 'Siang', districts: { 'Itanagar (Papum Pare)': { lat: 27.0844, lng: 93.6053 }, 'East Siang': { lat: 28.0667, lng: 95.3333 }, 'Lower Dibang Valley': { lat: 27.9800, lng: 95.6800 } } },
    'Chhattisgarh': { river: 'Mahanadi', districts: { 'Raipur': { lat: 21.2514, lng: 81.6296 }, 'Bilaspur': { lat: 22.0797, lng: 82.1409 }, 'Durg': { lat: 21.1904, lng: 81.2849 } } },
    'Goa': { river: 'Mandovi', districts: { 'North Goa': { lat: 15.5937, lng: 73.8142 }, 'South Goa': { lat: 15.2993, lng: 74.1240 } } },
    'Gujarat': { river: 'Sabarmati', districts: { 'Ahmedabad': { lat: 23.0225, lng: 72.5714 }, 'Surat': { lat: 21.1702, lng: 72.8311 }, 'Vadodara': { lat: 22.3072, lng: 73.1812 }, 'Valsad': { lat: 20.5992, lng: 72.9342 } } },
    'Haryana': { river: 'Yamuna', districts: { 'Faridabad': { lat: 28.4089, lng: 77.3178 }, 'Gurugram': { lat: 28.4595, lng: 77.0266 }, 'Panipat': { lat: 29.3909, lng: 76.9635 } } },
    'Himachal Pradesh': { river: 'Beas', districts: { 'Kullu': { lat: 31.9578, lng: 77.1095 }, 'Mandi': { lat: 31.7080, lng: 76.9318 }, 'Shimla': { lat: 31.1048, lng: 77.1734 } } },
    'Jharkhand': { river: 'Subarnarekha', districts: { 'Ranchi': { lat: 23.3441, lng: 85.3096 }, 'Jamshedpur (East Singhbhum)': { lat: 22.8046, lng: 86.2029 }, 'Sahibganj': { lat: 25.2500, lng: 87.6500 } } },
    'Karnataka': { river: 'Krishna', districts: { 'Bengaluru Urban': { lat: 12.9716, lng: 77.5946 }, 'Belagavi': { lat: 15.8497, lng: 74.4977 }, 'Raichur': { lat: 16.2076, lng: 77.3463 }, 'Dakshina Kannada': { lat: 12.8438, lng: 75.2479 } } },
    'Madhya Pradesh': { river: 'Narmada', districts: { 'Bhopal': { lat: 23.2599, lng: 77.4126 }, 'Indore': { lat: 22.7196, lng: 75.8577 }, 'Jabalpur': { lat: 23.1815, lng: 79.9864 } } },
    'Manipur': { river: 'Imphal', districts: { 'Imphal West': { lat: 24.8170, lng: 93.9368 }, 'Imphal East': { lat: 24.8100, lng: 94.0100 } } },
    'Meghalaya': { river: 'Umiam', districts: { 'East Khasi Hills': { lat: 25.5788, lng: 91.8933 }, 'West Garo Hills': { lat: 25.5140, lng: 90.2170 } } },
    'Mizoram': { river: 'Tlawng', districts: { 'Aizawl': { lat: 23.7271, lng: 92.7176 }, 'Lunglei': { lat: 22.8880, lng: 92.7451 } } },
    'Nagaland': { river: 'Dhansiri', districts: { 'Dimapur': { lat: 25.9063, lng: 93.7276 }, 'Kohima': { lat: 25.6751, lng: 94.1086 } } },
    'Odisha': { river: 'Mahanadi', districts: { 'Cuttack': { lat: 20.4625, lng: 85.8828 }, 'Puri': { lat: 19.8135, lng: 85.8312 }, 'Balasore': { lat: 21.4942, lng: 86.9317 }, 'Kendrapara': { lat: 20.5000, lng: 86.4200 } } },
    'Punjab': { river: 'Sutlej', districts: { 'Ludhiana': { lat: 30.9010, lng: 75.8573 }, 'Amritsar': { lat: 31.6340, lng: 74.8723 }, 'Ferozepur': { lat: 30.9250, lng: 74.6130 } } },
    'Rajasthan': { river: 'Chambal', districts: { 'Kota': { lat: 25.2138, lng: 75.8648 }, 'Jaipur': { lat: 26.9124, lng: 75.7873 }, 'Bharatpur': { lat: 27.2173, lng: 77.4901 } } },
    'Sikkim': { river: 'Teesta', districts: { 'East Sikkim': { lat: 27.3389, lng: 88.6065 }, 'South Sikkim': { lat: 27.1667, lng: 88.3500 } } },
    'Tamil Nadu': { river: 'Kaveri', districts: { 'Chennai': { lat: 13.0827, lng: 80.2707 }, 'Coimbatore': { lat: 11.0168, lng: 76.9558 }, 'Thanjavur': { lat: 10.7870, lng: 79.1378 }, 'Cuddalore': { lat: 11.7480, lng: 79.7714 } } },
    'Telangana': { river: 'Godavari', districts: { 'Hyderabad': { lat: 17.3850, lng: 78.4867 }, 'Warangal': { lat: 17.9689, lng: 79.5941 }, 'Khammam': { lat: 17.2473, lng: 80.1514 } } },
    'Tripura': { river: 'Gomti', districts: { 'West Tripura': { lat: 23.8315, lng: 91.2868 }, 'Gomati': { lat: 23.5200, lng: 91.5300 } } },
    'Uttarakhand': { river: 'Ganga', districts: { 'Haridwar': { lat: 29.9457, lng: 78.1642 }, 'Dehradun': { lat: 30.3165, lng: 78.0322 }, 'Nainital': { lat: 29.3803, lng: 79.4636 } } },
    'Jammu and Kashmir': { river: 'Jhelum', districts: { 'Srinagar': { lat: 34.0837, lng: 74.7973 }, 'Jammu': { lat: 32.7266, lng: 74.8570 }, 'Anantnag': { lat: 33.7311, lng: 75.1487 } } },
    'Ladakh': { river: 'Indus', districts: { 'Leh': { lat: 34.1526, lng: 77.5771 }, 'Kargil': { lat: 34.5539, lng: 76.1349 } } },
    'Puducherry': { river: 'Gingee', districts: { 'Puducherry': { lat: 11.9416, lng: 79.8083 }, 'Karaikal': { lat: 10.9254, lng: 79.8380 } } },
    'Chandigarh': { river: 'Sukhna Choe', districts: { 'Chandigarh': { lat: 30.7333, lng: 76.7794 } } },
    'Andaman and Nicobar Islands': { river: 'Coastal watershed', districts: { 'South Andaman': { lat: 11.6234, lng: 92.7265 } } }
};
export const STATES = Object.fromEntries(Object.entries(STATE_DISTRICTS).map(([state, v]) => [state, Object.keys(v.districts)]));
export const DEFAULT_STATE = 'Assam';
export const DEFAULT_DISTRICT = 'Dibrugarh';
export function districtCenter(state, district) {
    const s = STATE_DISTRICTS[state];
    const d = s?.districts?.[district];
    if (d)
        return d;
    // fall back to first district of the state, then to Assam's default
    const first = s ? Object.values(s.districts)[0] : null;
    return first || STATE_DISTRICTS[DEFAULT_STATE].districts[DEFAULT_DISTRICT];
}
export function stateRiver(state) {
    return STATE_DISTRICTS[state]?.river || 'the local river system';
}
export function stateCenters(state) {
    return Object.values(STATE_DISTRICTS[state]?.districts || {});
}
