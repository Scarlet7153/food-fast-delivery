// MongoDB initialization script
db = db.getSiblingDB('ffdd');

// Create collections and indexes
db.createCollection('users');
db.createCollection('restaurants');
db.createCollection('menuitems');
db.createCollection('orders');
db.createCollection('drones');
db.createCollection('deliverymissions');

// Create indexes for better performance
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ restaurantId: 1 });
db.users.createIndex({ 'address.location': '2dsphere' });

db.restaurants.createIndex({ ownerUserId: 1 }, { unique: true });
db.restaurants.createIndex({ location: '2dsphere' });
db.restaurants.createIndex({ active: 1, approved: 1 });
db.restaurants.createIndex({ name: 'text', description: 'text' });

db.menuitems.createIndex({ restaurantId: 1, available: 1 });
db.menuitems.createIndex({ restaurantId: 1, category: 1 });
db.menuitems.createIndex({ name: 'text', description: 'text', tags: 'text' });
db.menuitems.createIndex({ price: 1 });

db.orders.createIndex({ userId: 1, createdAt: -1 });
db.orders.createIndex({ restaurantId: 1, createdAt: -1 });
db.orders.createIndex({ status: 1, createdAt: -1 });
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ 'deliveryAddress.location': '2dsphere' });

db.drones.createIndex({ restaurantId: 1, status: 1 });
db.drones.createIndex({ serial: 1 }, { unique: true });
db.drones.createIndex({ location: '2dsphere' });

db.deliverymissions.createIndex({ restaurantId: 1, status: 1 });
db.deliverymissions.createIndex({ droneId: 1, status: 1 });
db.deliverymissions.createIndex({ orderId: 1 }, { unique: true });
db.deliverymissions.createIndex({ missionNumber: 1 }, { unique: true });
db.deliverymissions.createIndex({ createdAt: -1 });

print('Database initialized successfully');

