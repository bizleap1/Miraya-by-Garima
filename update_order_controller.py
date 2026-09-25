import re

with open('miraya-backend/src/controllers/order.controller.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Update createOrder user_id and shipping_email
user_id_pattern = r"user_id: req\.user\.id,"
user_id_replacement = "user_id: req.user?.id || null,\n          shipping_email: shippingDetails?.email?.trim() || req.user?.email?.trim() || req.body?.email?.trim() || '',"
text = re.sub(user_id_pattern, user_id_replacement, text)

# Update cart clear logic
cart_clear_pattern = r"await tx\.cartItem\.deleteMany\(\{ where: \{ user_id: req\.user\.id \} \}\);"
cart_clear_replacement = "if (req.user?.id) { await tx.cartItem.deleteMany({ where: { user_id: req.user.id } }); }"
text = re.sub(cart_clear_pattern, cart_clear_replacement, text)

with open('miraya-backend/src/controllers/order.controller.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated order.controller.js")
