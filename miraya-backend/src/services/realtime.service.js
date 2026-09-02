import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';

let io = null;

/**
 * Initialize Socket.IO server with HTTP server instance
 */
export function initRealtimeService(httpServer) {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    try {
      const authHeader = socket.handshake.headers?.authorization;
      const authToken = socket.handshake.auth?.token;
      let token = null;

      if (authToken) {
        token = authToken.replace(/^Bearer\s+/i, '');
      } else if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (socket.handshake.query?.token) {
        token = socket.handshake.query.token;
      }

      if (token) {
        try {
          const decoded = jwt.verify(token, JWT_SECRET);
          socket.user = decoded;
        } catch (err) {
          // Invalid token — socket remains guest (unauthenticated)
          socket.user = null;
        }
      } else {
        socket.user = null;
      }

      next();
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    socket.join('public');

    if (socket.user && socket.user.userId) {
      const userIdStr = String(socket.user.userId);
      socket.join(`user:${userIdStr}`);

      const userRole = (socket.user.role || '').toLowerCase();
      const adminRoles = ['admin', 'super_admin', 'store_manager'];
      if (adminRoles.includes(userRole)) {
        socket.join('admin');
      }
    }

    socket.on('disconnect', () => {});
  });

  return io;
}

/**
 * Get active Socket.IO server instance
 */
export function getIO() {
  return io;
}

// ─── CENTRALIZED EVENT EMISSION HELPERS ───────────────────────────────────────

/**
 * Product Created -> Public & Admin
 */
export function emitProductCreated(productData) {
  if (!io) return;
  const payload = {
    productId: productData.id,
    name: productData.name || productData.title,
    category: productData.category,
    price: productData.price,
    timestamp: new Date().toISOString(),
  };
  io.to('public').to('admin').emit('product.created', payload);
}

/**
 * Product Updated -> Public & Admin
 */
export function emitProductUpdated(productData) {
  if (!io) return;
  const payload = {
    productId: productData.id,
    name: productData.name || productData.title,
    price: productData.price,
    mrp_price: productData.mrp_price,
    is_active: productData.is_active,
    timestamp: new Date().toISOString(),
  };
  io.to('public').to('admin').emit('product.updated', payload);
}

/**
 * Product Deleted -> Public & Admin
 */
export function emitProductDeleted(productId) {
  if (!io) return;
  const payload = {
    productId: Number(productId),
    timestamp: new Date().toISOString(),
  };
  io.to('public').to('admin').emit('product.deleted', payload);
}

/**
 * Inventory Stock Updated -> Public & Admin
 */
export function emitInventoryUpdated(inventoryData) {
  if (!io) return;
  const payload = {
    variantId: inventoryData.variantId,
    productId: inventoryData.productId,
    stock: inventoryData.stock,
    reserved_stock: inventoryData.reserved_stock || 0,
    available_stock: Math.max(0, (inventoryData.stock || 0) - (inventoryData.reserved_stock || 0)),
    timestamp: new Date().toISOString(),
  };
  io.to('public').to('admin').emit('inventory.updated', payload);
}

/**
 * Order Created -> Admin & Specific Customer Room
 */
export function emitOrderCreated(orderData) {
  if (!io) return;
  const payload = {
    orderId: orderData.id,
    userId: orderData.user_id,
    total: orderData.total,
    status: orderData.status,
    customerName: orderData.shipping_name || orderData.user?.name || 'Customer',
    timestamp: new Date().toISOString(),
  };
  io.to('admin').emit('order.created', payload);
  if (orderData.user_id) {
    io.to(`user:${orderData.user_id}`).emit('order.created', payload);
  }
}

/**
 * Order Updated / Status Changed -> Admin & Specific Customer Room
 */
export function emitOrderUpdated(orderData) {
  if (!io) return;
  const payload = {
    orderId: orderData.id,
    userId: orderData.user_id,
    status: orderData.status,
    tracking_number: orderData.tracking_number || null,
    courier_name: orderData.courier_name || null,
    timestamp: new Date().toISOString(),
  };
  io.to('admin').emit('order.updated', payload);
  if (orderData.user_id) {
    io.to(`user:${orderData.user_id}`).emit('order.updated', payload);
  }
}

/**
 * Coupon Created / Updated / Disabled -> Public & Admin
 */
export function emitCouponUpdated(couponData) {
  if (!io) return;
  const payload = {
    couponId: couponData.id,
    code: couponData.code,
    is_active: couponData.is_active,
    discount_percent: couponData.discount_percent,
    timestamp: new Date().toISOString(),
  };
  io.to('public').to('admin').emit('coupon.updated', payload);
}

/**
 * Store Settings Updated -> Public & Admin
 */
export function emitStoreSettingsUpdated(settingsData) {
  if (!io) return;
  const payload = {
    exchange_enabled: settingsData.exchange_enabled,
    exchange_window_days: settingsData.exchange_window_days,
    store_online: settingsData.store_online,
    timestamp: new Date().toISOString(),
  };
  io.to('public').to('admin').emit('store_settings.updated', payload);
}

/**
 * Exchange Request Created / Updated -> Admin & Specific Customer Room
 */
export function emitExchangeUpdated(exchangeData) {
  if (!io) return;
  const payload = {
    exchangeId: exchangeData.id,
    orderId: exchangeData.order_id || exchangeData.orderId,
    userId: exchangeData.user_id || exchangeData.userId,
    status: exchangeData.status,
    reason: exchangeData.reason,
    timestamp: new Date().toISOString(),
  };
  io.to('admin').emit('exchange.updated', payload);
  if (payload.userId) {
    io.to(`user:${payload.userId}`).emit('exchange.updated', payload);
  }
}
