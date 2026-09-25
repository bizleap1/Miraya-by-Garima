import re

with open('miraya-backend/prisma/schema.prisma', 'r', encoding='utf-8') as f:
    text = f.read()

# Make user_id optional
text = text.replace("user_id           Int\n", "user_id           Int?\n")
# The relation also needs to be optional
text = text.replace("user              User            @relation(fields: [user_id], references: [id])", "user              User?           @relation(fields: [user_id], references: [id])")

# Add shipping_email and shipping_country if not exist
if 'shipping_email' not in text:
    text = text.replace("shipping_phone    String?\n", "shipping_phone    String?\n    shipping_email    String?\n    shipping_country  String?\n")

with open('miraya-backend/prisma/schema.prisma', 'w', encoding='utf-8') as f:
    f.write(text)
print("Schema updated")
