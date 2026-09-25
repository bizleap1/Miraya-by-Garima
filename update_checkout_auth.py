import re

with open('src/views/CheckoutPage.jsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Update the Initial Data Load & Mandatory Authentication Gate
auth_gate_pattern = r"// Initial Data Load & Mandatory Authentication Gate\n\s*useEffect\(\(\) => \{\n\s*const token = localStorage\.getItem\('token'\);\n\s*const isLogged = localStorage\.getItem\('isLoggedIn'\) === 'true';\n\s*const userStr = localStorage\.getItem\('user'\);\n\n\s*if \(\!token \|\| \!isLogged\) \{\n\s*toast\.warning\('Please sign in or create an account to proceed with your bespoke checkout.', 'SIGN IN REQUIRED'\);\n\s*navigate\('/auth', \{ state: \{ from: '/checkout', directProduct: directItem \} \}\);\n\s*return;\n\s*\}"
auth_gate_replacement = """// Initial Data Load & Optional Authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    const isLogged = localStorage.getItem('isLoggedIn') === 'true';
    const userStr = localStorage.getItem('user');

    if (!token || !isLogged) {
      setIsLoggedIn(false);
      return; // Guest checkout allowed
    }"""
text = re.sub(auth_gate_pattern, auth_gate_replacement, text)


# 2. Remove token requirement from handlePlaceOrderClick
place_order_pattern = r"const handlePlaceOrderClick = \(\) => \{\n\s*const token = localStorage\.getItem\('token'\);\n\s*if \(\!token\) \{\n\s*toast\.warning\('Please sign in or create an account to complete your luxury purchase.', 'AUTHENTICATION REQUIRED'\);\n\s*navigate\('/auth', \{ state: \{ from: '/checkout', directProduct: directItem \} \}\);\n\s*return;\n\s*\}"
place_order_replacement = """const handlePlaceOrderClick = () => {
    const token = localStorage.getItem('token');
    // Auth is optional now. No redirect."""
text = re.sub(place_order_pattern, place_order_replacement, text)


# 3. Add Guest Login prompt UI
guest_login_ui_pattern = r"\{isLoggedIn && user && \(\n\s*<div className=\"checkout-user-auth-status\">"
guest_login_ui_replacement = """{!isLoggedIn && (
              <div className="checkout-guest-auth-prompt" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(198, 164, 106, 0.05)', border: '1px solid rgba(198, 164, 106, 0.2)', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <User size={18} color="var(--gold-accent)" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-dark)', marginBottom: '0.2rem' }}>Checking out as a Guest</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Already have an account? Sign in for faster checkout.</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-switch-user"
                  onClick={() => navigate('/auth', { state: { from: '/checkout', directProduct: directItem } })}
                  style={{ border: '1px solid var(--gold-accent)', padding: '0.5rem 1rem', background: 'transparent', color: 'var(--primary-burgundy)', fontSize: '0.8rem', letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', transition: 'all 0.3s ease' }}
                >
                  Log In
                </button>
              </div>
            )}
            {isLoggedIn && user && (
              <div className="checkout-user-auth-status">"""
text = re.sub(guest_login_ui_pattern, guest_login_ui_replacement, text)


with open('src/views/CheckoutPage.jsx', 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated CheckoutPage.jsx auth flows")
