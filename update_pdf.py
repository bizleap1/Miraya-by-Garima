import re

with open('miraya-backend/src/utils/pdfGenerator.js', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace customerName, Email, Phone resolving
old_name = "const customerName = billObj.fullName || order.user?.name || order.shipping_name || 'Valued Client';"
new_name = "const customerName = billObj.fullName || order.shipping_name || 'Valued Client';"
text = text.replace(old_name, new_name)

old_email = "const customerEmail = billObj.email || order.user?.email || shipObj.email || 'N/A';"
new_email = "const customerEmail = billObj.email || order.shipping_email || shipObj.email || 'N/A';"
text = text.replace(old_email, new_email)

old_phone = "const customerPhone = billObj.phone || order.shipping_phone || order.user?.phone || 'N/A';"
new_phone = "const customerPhone = billObj.phone || order.shipping_phone || 'N/A';"
text = text.replace(old_phone, new_phone)

with open('miraya-backend/src/utils/pdfGenerator.js', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated pdfGenerator.js")
