import re

with open('miraya-backend/src/controllers/payment.controller.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Add shipping_email to the tx.order.create payload
order_create_pattern = r"user_id: req\.user\?\.id \|\| null,\n\s*total: calculatedTotal,"
order_create_replacement = "user_id: req.user?.id || null,\n                shipping_email: shippingDetails?.email?.trim() || req.user?.email || req.body?.email || '',\n                total: calculatedTotal,"
text = re.sub(order_create_pattern, order_create_replacement, text)

# Just in case there are multiple tx.order.create
if "shipping_email" not in text:
    print("WARNING: Replacement might have failed")

with open('miraya-backend/src/controllers/payment.controller.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated payment.controller.js")
