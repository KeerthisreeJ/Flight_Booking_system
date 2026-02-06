// Script to add sample flights to the database
const mongoose = require('mongoose');
const Flight = require('./models/Flight');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/flight-booking';

mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB connection error:', err));

// Sample flights data - 20 flights across major Indian cities
const sampleFlights = [
    // Delhi Routes
    {
        flightNumber: 'AI-101',
        airline: 'Air India',
        from: { city: 'Delhi', code: 'DEL' },
        to: { city: 'Mumbai', code: 'BOM' },
        departureTime: '06:00',
        arrivalTime: '08:30',
        duration: '2h 30m',
        aircraft: 'Boeing 737',
        capacity: { economy: 150, business: 20, firstClass: 10 },
        price: { economy: 5500, business: 12000, firstClass: 25000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'SG-202',
        airline: 'SpiceJet',
        from: { city: 'Delhi', code: 'DEL' },
        to: { city: 'Bengaluru', code: 'BLR' },
        departureTime: '09:30',
        arrivalTime: '12:15',
        duration: '2h 45m',
        aircraft: 'Airbus A320',
        capacity: { economy: 140, business: 18, firstClass: 8 },
        price: { economy: 6200, business: 13500, firstClass: 27000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'UK-303',
        airline: 'Vistara',
        from: { city: 'Delhi', code: 'DEL' },
        to: { city: 'Kolkata', code: 'CCU' },
        departureTime: '14:00',
        arrivalTime: '16:30',
        duration: '2h 30m',
        aircraft: 'Boeing 787',
        capacity: { economy: 200, business: 30, firstClass: 12 },
        price: { economy: 5800, business: 14000, firstClass: 28000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'AI-404',
        airline: 'Air India',
        from: { city: 'Delhi', code: 'DEL' },
        to: { city: 'Chennai', code: 'MAA' },
        departureTime: '17:30',
        arrivalTime: '20:15',
        duration: '2h 45m',
        aircraft: 'Airbus A321',
        capacity: { economy: 160, business: 22, firstClass: 10 },
        price: { economy: 6500, business: 15000, firstClass: 30000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    // Mumbai Routes
    {
        flightNumber: 'IG-505',
        airline: 'IndiGo',
        from: { city: 'Mumbai', code: 'BOM' },
        to: { city: 'Delhi', code: 'DEL' },
        departureTime: '10:00',
        arrivalTime: '12:30',
        duration: '2h 30m',
        aircraft: 'Airbus A320',
        capacity: { economy: 150, business: 20, firstClass: 8 },
        price: { economy: 5400, business: 11500, firstClass: 24000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'SG-606',
        airline: 'SpiceJet',
        from: { city: 'Mumbai', code: 'BOM' },
        to: { city: 'Goa', code: 'GOI' },
        departureTime: '08:00',
        arrivalTime: '09:15',
        duration: '1h 15m',
        aircraft: 'Boeing 737',
        capacity: { economy: 130, business: 16, firstClass: 6 },
        price: { economy: 3500, business: 8000, firstClass: 15000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'AI-707',
        airline: 'Air India',
        from: { city: 'Mumbai', code: 'BOM' },
        to: { city: 'Hyderabad', code: 'HYD' },
        departureTime: '15:30',
        arrivalTime: '17:00',
        duration: '1h 30m',
        aircraft: 'Airbus A320',
        capacity: { economy: 145, business: 18, firstClass: 8 },
        price: { economy: 4200, business: 9500, firstClass: 18000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    // Bengaluru Routes
    {
        flightNumber: 'UK-808',
        airline: 'Vistara',
        from: { city: 'Bengaluru', code: 'BLR' },
        to: { city: 'Delhi', code: 'DEL' },
        departureTime: '07:00',
        arrivalTime: '09:45',
        duration: '2h 45m',
        aircraft: 'Boeing 787',
        capacity: { economy: 180, business: 25, firstClass: 10 },
        price: { economy: 6000, business: 13000, firstClass: 26000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'IG-909',
        airline: 'IndiGo',
        from: { city: 'Bengaluru', code: 'BLR' },
        to: { city: 'Mumbai', code: 'BOM' },
        departureTime: '11:30',
        arrivalTime: '13:15',
        duration: '1h 45m',
        aircraft: 'Airbus A320',
        capacity: { economy: 150, business: 20, firstClass: 8 },
        price: { economy: 4800, business: 10500, firstClass: 20000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'SG-1010',
        airline: 'SpiceJet',
        from: { city: 'Bengaluru', code: 'BLR' },
        to: { city: 'Kolkata', code: 'CCU' },
        departureTime: '16:00',
        arrivalTime: '18:45',
        duration: '2h 45m',
        aircraft: 'Boeing 737',
        capacity: { economy: 140, business: 18, firstClass: 8 },
        price: { economy: 6800, business: 14500, firstClass: 28000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    // Chennai Routes
    {
        flightNumber: 'AI-1111',
        airline: 'Air India',
        from: { city: 'Chennai', code: 'MAA' },
        to: { city: 'Delhi', code: 'DEL' },
        departureTime: '05:30',
        arrivalTime: '08:15',
        duration: '2h 45m',
        aircraft: 'Airbus A321',
        capacity: { economy: 160, business: 22, firstClass: 10 },
        price: { economy: 6300, business: 14000, firstClass: 29000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'UK-1212',
        airline: 'Vistara',
        from: { city: 'Chennai', code: 'MAA' },
        to: { city: 'Bengaluru', code: 'BLR' },
        departureTime: '12:00',
        arrivalTime: '13:15',
        duration: '1h 15m',
        aircraft: 'Airbus A320',
        capacity: { economy: 145, business: 18, firstClass: 8 },
        price: { economy: 3800, business: 8500, firstClass: 16000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    // Kolkata Routes
    {
        flightNumber: 'IG-1313',
        airline: 'IndiGo',
        from: { city: 'Kolkata', code: 'CCU' },
        to: { city: 'Delhi', code: 'DEL' },
        departureTime: '09:00',
        arrivalTime: '11:30',
        duration: '2h 30m',
        aircraft: 'Boeing 737',
        capacity: { economy: 150, business: 20, firstClass: 8 },
        price: { economy: 5700, business: 12500, firstClass: 25000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'SG-1414',
        airline: 'SpiceJet',
        from: { city: 'Kolkata', code: 'CCU' },
        to: { city: 'Mumbai', code: 'BOM' },
        departureTime: '13:30',
        arrivalTime: '16:15',
        duration: '2h 45m',
        aircraft: 'Airbus A320',
        capacity: { economy: 140, business: 18, firstClass: 8 },
        price: { economy: 6400, business: 13800, firstClass: 27000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    // Hyderabad Routes
    {
        flightNumber: 'AI-1515',
        airline: 'Air India',
        from: { city: 'Hyderabad', code: 'HYD' },
        to: { city: 'Delhi', code: 'DEL' },
        departureTime: '06:30',
        arrivalTime: '08:45',
        duration: '2h 15m',
        aircraft: 'Boeing 787',
        capacity: { economy: 180, business: 25, firstClass: 10 },
        price: { economy: 5900, business: 13200, firstClass: 26500 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'UK-1616',
        airline: 'Vistara',
        from: { city: 'Hyderabad', code: 'HYD' },
        to: { city: 'Bengaluru', code: 'BLR' },
        departureTime: '14:30',
        arrivalTime: '15:45',
        duration: '1h 15m',
        aircraft: 'Airbus A320',
        capacity: { economy: 145, business: 18, firstClass: 8 },
        price: { economy: 3600, business: 8200, firstClass: 15500 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    // Goa Routes
    {
        flightNumber: 'IG-1717',
        airline: 'IndiGo',
        from: { city: 'Goa', code: 'GOI' },
        to: { city: 'Mumbai', code: 'BOM' },
        departureTime: '10:30',
        arrivalTime: '11:45',
        duration: '1h 15m',
        aircraft: 'Boeing 737',
        capacity: { economy: 130, business: 16, firstClass: 6 },
        price: { economy: 3400, business: 7800, firstClass: 14500 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'SG-1818',
        airline: 'SpiceJet',
        from: { city: 'Goa', code: 'GOI' },
        to: { city: 'Delhi', code: 'DEL' },
        departureTime: '18:00',
        arrivalTime: '20:30',
        duration: '2h 30m',
        aircraft: 'Airbus A320',
        capacity: { economy: 140, business: 18, firstClass: 8 },
        price: { economy: 5600, business: 12200, firstClass: 24500 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    // Additional Routes
    {
        flightNumber: 'AI-1919',
        airline: 'Air India',
        from: { city: 'Ahmedabad', code: 'AMD' },
        to: { city: 'Delhi', code: 'DEL' },
        departureTime: '07:30',
        arrivalTime: '09:15',
        duration: '1h 45m',
        aircraft: 'Airbus A320',
        capacity: { economy: 150, business: 20, firstClass: 8 },
        price: { economy: 4500, business: 10000, firstClass: 19000 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    },
    {
        flightNumber: 'UK-2020',
        airline: 'Vistara',
        from: { city: 'Pune', code: 'PNQ' },
        to: { city: 'Bengaluru', code: 'BLR' },
        departureTime: '15:00',
        arrivalTime: '16:30',
        duration: '1h 30m',
        aircraft: 'Boeing 737',
        capacity: { economy: 140, business: 18, firstClass: 8 },
        price: { economy: 4100, business: 9200, firstClass: 17500 },
        frequency: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        status: 'active'
    }
];

// Add flights to database
async function addFlights() {
    try {
        // Insert sample flights
        const result = await Flight.insertMany(sampleFlights);
        console.log(`✅ Successfully added ${result.length} flights to the database!`);

        // Display summary
        console.log('\n📊 Flight Summary:');
        console.log(`   Total Flights: ${result.length}`);
        console.log(`   Airlines: Air India, SpiceJet, Vistara, IndiGo`);
        console.log(`   Routes: Delhi, Mumbai, Bengaluru, Chennai, Kolkata, Hyderabad, Goa, Ahmedabad, Pune`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error adding flights:', error);
        process.exit(1);
    }
}

// Run the script
addFlights();
