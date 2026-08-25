'use client';
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, CheckSquare, Square, ChevronRight, CheckCircle2, Loader2, User, KeyRound, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoading } from '../context/LoadingContext';
import API_URL from '../config';
import './AuthPage.css';

const AuthPage = () => {
  const { showLoading, hideLoading } = useLoading();
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  // Login Form State
  const [loginMethod, setLoginMethod] = useState('otp'); // 'otp' | 'password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginOtp, setLoginOtp] = useState('');

  // Registration Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [registerOtpSent, setRegisterOtpSent] = useState(false);
  const [registerOtp, setRegisterOtp] = useState('');

  // Forgot Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.removeItem('rememberedEmail');
    localStorage.removeItem('rememberedPassword');
    localStorage.removeItem('rememberMe');

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const authError = params.get('error');

    if (token && userStr) {
      try {
        const userObj = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('isLoggedIn', 'true');
        window.dispatchEvent(new Event('loginStateChange'));
        navigate('/');
      } catch(e) {
        setError('Failed to parse Google login data.');
      }
    } else if (authError) {
      setError(`Google Authentication Failed: ${authError}`);
    }
  }, [navigate]);

  // --- OTP HELPERS ---
  const handleSendLoginOtp = async () => {
    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    showLoading('Sending 6-Digit OTP to Email...');
    try {
      const res = await fetch(`${API_URL}/api/auth/send-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      setLoginOtpSent(true);
      setSuccessMsg(`🔐 6-Digit OTP code sent to ${email.trim()}! Please check your email inbox/spam.`);
    } catch (err) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setSubmitting(false);
      hideLoading();
    }
  };

  const handleVerifyLoginOtp = async () => {
    if (!loginOtp.trim() || loginOtp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }
    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    showLoading('Verifying OTP & Signing in...');
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-login-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), otp: loginOtp.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid or expired OTP');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      window.dispatchEvent(new Event('loginStateChange'));

      setSuccessMsg('OTP verified successfully! Welcome to Miraya.');
      setTimeout(() => {
        if (data.user && (data.user.role === 'admin' || data.user.role === 'ADMIN' || data.user.role === 'super_admin' || data.user.role === 'store_manager')) {
          navigate('/admin');
        } else if (location.state?.from) {
          navigate(location.state.from, { state: location.state });
        } else {
          navigate('/');
        }
      }, 600);
    } catch (err) {
      setError(err.message || 'Invalid or expired OTP');
    } finally {
      setSubmitting(false);
      hideLoading();
    }
  };

  const handleSendRegisterOtp = async () => {
    if (!firstName.trim() || !regEmail.trim() || !regPassword || !confirmPassword) {
      setError('Please fill in all details before requesting OTP.');
      return;
    }
    if (regPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    showLoading('Sending Account Verification OTP...');
    try {
      const res = await fetch(`${API_URL}/api/auth/send-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: regEmail.trim().toLowerCase()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send registration OTP');

      setRegisterOtpSent(true);
      setSuccessMsg(`✨ Verification OTP code sent to ${regEmail.trim()}! Please check your email.`);
    } catch (err) {
      setError(err.message || 'Failed to send registration OTP');
    } finally {
      setSubmitting(false);
      hideLoading();
    }
  };

  const handleVerifyRegisterOtp = async () => {
    if (!registerOtp.trim() || registerOtp.trim().length !== 6) {
      setError('Please enter the 6-digit OTP code sent to your email.');
      return;
    }

    setError('');
    setSuccessMsg('');
    setSubmitting(true);
    showLoading('Verifying OTP & Creating Account...');
    try {
      const res = await fetch(`${API_URL}/api/auth/verify-register-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: regEmail.trim().toLowerCase(),
          otp: registerOtp.trim(),
          password: regPassword
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration verification failed');

      setSuccessMsg('Account created & verified! Logging you in...');

      // Auto login
      setTimeout(async () => {
        try {
          const loginRes = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: regEmail.trim().toLowerCase(), password: regPassword })
          });
          const loginData = await loginRes.json();
          if (loginData.token && loginData.user) {
            localStorage.setItem('token', loginData.token);
            localStorage.setItem('user', JSON.stringify(loginData.user));
            localStorage.setItem('isLoggedIn', 'true');
            window.dispatchEvent(new Event('loginStateChange'));

            if (loginData.user && (loginData.user.role === 'admin' || loginData.user.role === 'ADMIN' || loginData.user.role === 'super_admin' || loginData.user.role === 'store_manager')) {
              navigate('/admin');
            } else if (location.state?.from) {
              navigate(location.state.from, { state: location.state });
            } else if (location.state?.returnUrl) {
              navigate(location.state.returnUrl, { state: location.state });
            } else {
              navigate('/');
            }
          } else {
            setAuthMode('login');
          }
        } catch {
          setAuthMode('login');
        }
      }, 700);
    } catch (err) {
      setError(err.message || 'Registration verification failed');
    } finally {
      setSubmitting(false);
      hideLoading();
    }
  };

  // Handle Main Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // --- 1. FORGOT PASSWORD FLOW ---
    if (authMode === 'forgot') {
      if (!email.trim()) return setError('Please enter your registered email address.');
      if (!newPassword || !confirmNewPassword) return setError('Please enter and confirm your new password.');
      if (newPassword !== confirmNewPassword) return setError('Passwords do not match.');
      if (newPassword.length < 6) return setError('Password must be at least 6 characters long.');

      setSubmitting(true);
      showLoading('Updating your password...');
      try {
        const res = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Password update failed');

        setSuccessMsg('Password updated successfully! Redirecting to Sign In...');
        setTimeout(() => {
          setAuthMode('login');
          setPassword(newPassword);
          setNewPassword('');
          setConfirmNewPassword('');
          setSuccessMsg('Password updated! You can now sign in.');
        }, 1500);
      } catch (err) {
        setError(err.message || 'Error resetting password');
      } finally {
        setSubmitting(false);
        hideLoading();
      }
      return;
    }

    // --- 2. REGISTER FLOW ---
    if (authMode === 'register') {
      if (registerOtpSent) {
        await handleVerifyRegisterOtp();
      } else {
        await handleSendRegisterOtp();
      }
      return;
    }

    // --- 3. LOGIN FLOW ---
    if (authMode === 'login') {
      if (loginMethod === 'otp') {
        if (loginOtpSent) {
          await handleVerifyLoginOtp();
        } else {
          await handleSendLoginOtp();
        }
      } else {
        // Standard Password Login
        if (!email.trim() || !password) return setError('Email and password are required.');

        setSubmitting(true);
        showLoading('Authenticating & Signing in...');
        try {
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: email.trim().toLowerCase(), password })
          });
          const data = await response.json();
          if (!response.ok) return setError(data.message || data.msg || 'Invalid email or password');

          localStorage.setItem('token', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('isLoggedIn', 'true');
          window.dispatchEvent(new Event('loginStateChange'));
          
          if (data.user && (data.user.role === 'admin' || data.user.role === 'ADMIN' || data.user.role === 'super_admin' || data.user.role === 'store_manager')) {
            navigate('/admin');
          } else if (location.state?.from) {
            navigate(location.state.from, { state: location.state });
          } else if (location.state?.returnUrl) {
            navigate(location.state.returnUrl, { state: location.state });
          } else {
            navigate('/');
          }
        } catch (err) {
          setError('Network error, please check your connection.');
        } finally {
          setSubmitting(false);
          hideLoading();
        }
      }
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-split-container">
        
        {/* Left Side: Image Banner */}
        <div className="auth-image-side">
          <img src="/bridal-trousseau.png" alt="Luxury Ethnic Wear" className="auth-hero-img" />
          <div className="auth-image-overlay">
            <div className="auth-logo-top">
              <img src="/logoR.png" alt="Miraya" className="auth-brand-logo" />
            </div>

            <div className="overlay-text animate-fade-up">
              <h2 className="step-into">Step into</h2>
              <h2 className="elegance">Elegance</h2>
              <div className="auth-ornament">
                <span className="diamond">◈</span>
              </div>
              <p>Discover the finest<br/>handcrafted luxury wear<br/>curated just for you.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="auth-form-side">
          <button className="back-btn" onClick={() => navigate('/')}>
            <ArrowLeft size={20} /> Back to Home
          </button>

          <div className="hanging-ribbon">
            <span className="flower-icon-gold">✿</span>
          </div>

          <div className="auth-form-container animate-fade">
            <div className="auth-header">
              <AnimatePresence mode="wait">
                <motion.div
                  key={authMode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1>
                    {authMode === 'forgot' ? 'Reset Password' : authMode === 'login' ? 'Welcome Back' : 'Create Account'}
                  </h1>
                  <div className="auth-header-ornament">
                    <span className="diamond-gold">◈</span>
                  </div>
                  <p>
                    {authMode === 'forgot'
                      ? 'Enter your registered email and choose a new password.'
                      : authMode === 'login'
                      ? 'Sign in using 1-Click OTP or Password to access your account.' 
                      : 'Create your account with email OTP verification.'}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {authMode !== 'forgot' && (
              <div className="auth-toggle">
                <button 
                  className={`toggle-btn ${authMode === 'login' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('login');
                    setError('');
                    setSuccessMsg('');
                    setLoginOtpSent(false);
                  }}
                >
                  SIGN IN
                </button>
                <button 
                  className={`toggle-btn ${authMode === 'register' ? 'active' : ''}`}
                  onClick={() => {
                    setAuthMode('register');
                    setError('');
                    setSuccessMsg('');
                    setRegisterOtpSent(false);
                  }}
                >
                  REGISTER
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.form 
                key={authMode}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="auth-form" 
                onSubmit={handleSubmit}
              >
                {error && (
                  <div className="auth-error" style={{ color: '#e74c3c', background: 'rgba(231,76,60,0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem' }}>
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="auth-success" style={{ color: '#27ae60', background: 'rgba(39,174,96,0.1)', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', textAlign: 'center', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} /> {successMsg}
                  </div>
                )}

                {/* --- FORGOT PASSWORD FORM --- */}
                {authMode === 'forgot' && (
                  <>
                    <div className="input-group">
                      <label>Registered Email Address</label>
                      <div className="input-wrapper">
                        <Mail size={18} className="input-icon" />
                        <input 
                          type="email" 
                          placeholder="Enter your email" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          required 
                        />
                      </div>
                    </div>

                    <div className="input-group">
                      <label>New Password</label>
                      <div className="input-wrapper">
                        <Lock size={18} className="input-icon" />
                        <input 
                          type={showPassword ? "text" : "password"} 
                          placeholder="Enter new password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)} 
                          required 
                        />
                        <button 
                          type="button" 
                          className="eye-btn"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Confirm New Password</label>
                      <div className="input-wrapper">
                        <Lock size={18} className="input-icon" />
                        <input 
                          type={showConfirmPassword ? "text" : "password"} 
                          placeholder="Confirm new password" 
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)} 
                          required 
                        />
                        <button 
                          type="button" 
                          className="eye-btn"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* --- REGISTER FORM WITH OTP --- */}
                {authMode === 'register' && (
                  <>
                    <div className="form-row">
                      <div className="input-group">
                        <label>First Name</label>
                        <div className="input-wrapper">
                          <User size={18} className="input-icon" />
                          <input 
                            type="text" 
                            placeholder="First name" 
                            value={firstName} 
                            onChange={(e) => setFirstName(e.target.value)} 
                            disabled={registerOtpSent}
                            required 
                          />
                        </div>
                      </div>
                      <div className="input-group">
                        <label>Last Name</label>
                        <div className="input-wrapper">
                          <input 
                            type="text" 
                            placeholder="Last name" 
                            value={lastName} 
                            onChange={(e) => setLastName(e.target.value)} 
                            disabled={registerOtpSent}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="input-group">
                      <label>Email Address</label>
                      <div className="input-wrapper">
                        <Mail size={18} className="input-icon" />
                        <input 
                          type="email" 
                          placeholder="Enter your email" 
                          value={regEmail} 
                          onChange={(e) => setRegEmail(e.target.value)} 
                          disabled={registerOtpSent}
                          required 
                        />
                      </div>
                    </div>

                    {!registerOtpSent ? (
                      <>
                        <div className="input-group">
                          <label>Create Password</label>
                          <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input 
                              type={showPassword ? "text" : "password"} 
                              placeholder="Create password (min 6 characters)" 
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)} 
                              required 
                            />
                            <button 
                              type="button" 
                              className="eye-btn"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div className="input-group">
                          <label>Confirm Password</label>
                          <div className="input-wrapper">
                            <Lock size={18} className="input-icon" />
                            <input 
                              type={showConfirmPassword ? "text" : "password"} 
                              placeholder="Confirm your password" 
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)} 
                              required 
                            />
                            <button 
                              type="button" 
                              className="eye-btn"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="otp-info-banner">
                          <ShieldCheck size={18} />
                          <span>Enter the 6-digit OTP code sent to <strong>{regEmail}</strong></span>
                        </div>

                        <div className="input-group">
                          <label>6-Digit Email OTP</label>
                          <div className="input-wrapper">
                            <KeyRound size={18} className="input-icon" />
                            <input 
                              type="text" 
                              className="otp-code-input"
                              placeholder="000000" 
                              maxLength={6}
                              value={registerOtp} 
                              onChange={(e) => setRegisterOtp(e.target.value.replace(/\D/g, ''))} 
                              required 
                            />
                          </div>
                        </div>

                        <button 
                          type="button" 
                          onClick={() => { setRegisterOtpSent(false); setRegisterOtp(''); setError(''); }}
                          style={{ background: 'none', border: 'none', color: '#c6a46a', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1rem', textDecoration: 'underline' }}
                        >
                          Change Email or Details
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* --- LOGIN FORM WITH OTP / PASSWORD TOGGLE --- */}
                {authMode === 'login' && (
                  <>
                    <div className="otp-method-toggle">
                      <button 
                        type="button" 
                        className={`otp-tab ${loginMethod === 'otp' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('otp'); setError(''); setSuccessMsg(''); }}
                      >
                        🔑 SIGN IN WITH EMAIL OTP
                      </button>
                      <button 
                        type="button" 
                        className={`otp-tab ${loginMethod === 'password' ? 'active' : ''}`}
                        onClick={() => { setLoginMethod('password'); setError(''); setSuccessMsg(''); }}
                      >
                        🔒 PASSWORD SIGN IN
                      </button>
                    </div>

                    <div className="input-group">
                      <label>Email Address</label>
                      <div className="input-wrapper">
                        <Mail size={18} className="input-icon" />
                        <input 
                          type="email" 
                          placeholder="Enter your email" 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)} 
                          disabled={loginOtpSent && loginMethod === 'otp'}
                          required 
                        />
                      </div>
                    </div>

                    {loginMethod === 'password' && (
                      <div className="input-group">
                        <div className="label-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <label>Password</label>
                          <button 
                            type="button" 
                            onClick={() => { setAuthMode('forgot'); setError(''); setSuccessMsg(''); }} 
                            className="forgot-link" 
                            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#c6a46a', fontSize: '0.8rem', fontWeight: '600' }}
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="input-wrapper">
                          <Lock size={18} className="input-icon" />
                          <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Enter your password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)} 
                            required 
                          />
                          <button 
                            type="button" 
                            className="eye-btn"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                      </div>
                    )}

                    {loginMethod === 'otp' && loginOtpSent && (
                      <>
                        <div className="otp-info-banner">
                          <ShieldCheck size={18} />
                          <span>OTP sent to <strong>{email}</strong>. Valid for 10 minutes.</span>
                        </div>

                        <div className="input-group">
                          <label>6-Digit OTP Code</label>
                          <div className="input-wrapper">
                            <KeyRound size={18} className="input-icon" />
                            <input 
                              type="text" 
                              className="otp-code-input"
                              placeholder="000000" 
                              maxLength={6}
                              value={loginOtp} 
                              onChange={(e) => setLoginOtp(e.target.value.replace(/\D/g, ''))} 
                              required 
                            />
                          </div>
                        </div>

                        <button 
                          type="button" 
                          onClick={() => { setLoginOtpSent(false); setLoginOtp(''); setError(''); }}
                          style={{ background: 'none', border: 'none', color: '#c6a46a', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1rem', textDecoration: 'underline' }}
                        >
                          Change Email or Resend OTP
                        </button>
                      </>
                    )}
                  </>
                )}

                <button type="submit" className="auth-submit-btn" disabled={submitting}>
                  {submitting ? (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Loader2 size={18} className="animate-spin" /> Processing...
                    </span>
                  ) : authMode === 'forgot' ? (
                    'UPDATE PASSWORD'
                  ) : authMode === 'register' ? (
                    registerOtpSent ? 'VERIFY OTP & COMPLETE REGISTRATION' : 'SEND OTP TO REGISTER'
                  ) : loginMethod === 'otp' ? (
                    loginOtpSent ? 'VERIFY OTP & SIGN IN' : 'SEND OTP TO EMAIL'
                  ) : (
                    'SIGN IN'
                  )} <ChevronRight size={16} />
                </button>

                {authMode === 'forgot' && (
                  <button 
                    type="button" 
                    onClick={() => { setAuthMode('login'); setError(''); setSuccessMsg(''); }} 
                    style={{ background: 'none', border: 'none', color: '#888', fontSize: '0.85rem', marginTop: '0.8rem', cursor: 'pointer', textAlign: 'center', display: 'block', width: '100%' }}
                  >
                    ← Back to Sign In
                  </button>
                )}

                {authMode !== 'forgot' && (
                  <div className="auth-footer">
                    <p>
                      {authMode === 'register' ? "Already have an account? " : "Need an account? "}
                      <button 
                        type="button" 
                        className="switch-link"
                        onClick={() => {
                          setAuthMode(authMode === 'register' ? 'login' : 'register');
                          setError('');
                          setSuccessMsg('');
                          setRegisterOtpSent(false);
                          setLoginOtpSent(false);
                        }}
                      >
                        {authMode === 'register' ? 'Sign In' : 'Create Account'}
                      </button>
                    </p>
                  </div>
                )}
              </motion.form>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
