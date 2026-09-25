import re

with open('miraya-backend/src/routes/order.routes.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace global authMiddleware with specific ones
old_import = "import { authMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';"
new_import = "import { authMiddleware, optionalAuthMiddleware, adminMiddleware } from '../middleware/auth.middleware.js';"
text = text.replace(old_import, new_import)

old_router = """router.use(authMiddleware);

router.post('/', createOrder);
router.get('/', getMyOrders);
router.get('/my-orders', getMyOrders);
router.post('/:id/cancel', cancelOrder);
router.get('/:id/invoice', getInvoice);"""

new_router = """// Optional auth for creation to allow Guest Checkout
router.post('/', optionalAuthMiddleware, createOrder);

// Mandatory auth for fetching user's own orders
router.get('/', authMiddleware, getMyOrders);
router.get('/my-orders', authMiddleware, getMyOrders);
router.post('/:id/cancel', authMiddleware, cancelOrder);

// Invoice can be accessed via optional auth (verified by email or if user is owner)
router.get('/:id/invoice', optionalAuthMiddleware, getInvoice);"""
text = text.replace(old_router, new_router)

with open('miraya-backend/src/routes/order.routes.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated order routes")
