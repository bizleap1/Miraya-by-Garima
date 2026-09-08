import prisma from '../prisma/client.js';
import { emitCouponUpdated } from '../services/realtime.service.js';


/**
 * Server-side authoritative coupon validation helper.
 * Returns { valid: true, coupon, discountAmount } or { valid: false, message, code }.
 */
export const validateCouponServerSide = async (code, cartTotal) => {
  if (!code || typeof code !== 'string' || !code.trim()) {
    return { valid: false, message: 'Coupon code is required', code: 'INVALID_COUPON' };
  }

  const cleanCode = code.trim().toUpperCase();
  const coupon = await prisma.coupon.findUnique({
    where: { code: cleanCode },
  });

  if (!coupon || !coupon.is_active) {
    return { valid: false, message: 'Invalid or inactive coupon code', code: 'COUPON_INACTIVE' };
  }

  // Check expiration date
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return { valid: false, message: 'This privilege coupon code has expired', code: 'COUPON_EXPIRED' };
  }

  // Check usage limit
  if (coupon.usage_limit !== null && coupon.usage_limit !== undefined) {
    if (coupon.used_count >= coupon.usage_limit) {
      return { valid: false, message: 'This coupon code has reached its maximum usage limit', code: 'COUPON_LIMIT_REACHED' };
    }
  }

  // Check minimum order value
  const total = parseFloat(cartTotal || 0);
  if (coupon.min_order_value && total < Number(coupon.min_order_value)) {
    return {
      valid: false,
      message: `Minimum order value of Rs. ${coupon.min_order_value} required for this coupon`,
      code: 'COUPON_MIN_ORDER_NOT_MET',
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discount_percent) {
    discountAmount = (total * coupon.discount_percent) / 100;
  } else if (coupon.discount_flat) {
    discountAmount = Number(coupon.discount_flat);
  }

  discountAmount = Math.min(discountAmount, total);

  return {
    valid: true,
    coupon,
    discountAmount,
    finalTotal: Math.max(0, total - discountAmount),
  };
};

export const applyCoupon = async (req, res) => {
  try {
    const { code, cartTotal } = req.body;
    const result = await validateCouponServerSide(code, cartTotal);

    if (!result.valid) {
      return res.status(400).json({ message: result.message, code: result.code });
    }

    res.json({
      message: 'Coupon applied successfully',
      couponCode: result.coupon.code,
      discountAmount: result.discountAmount,
      finalTotal: result.finalTotal,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error applying coupon', error: error.message });
  }
};

export const getCoupons = async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { created_at: 'desc' } });
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error: error.message });
  }
};

export const createCoupon = async (req, res) => {
  try {
    const {
      code,
      discount_percent,
      discount_flat,
      discount_value,
      discount_type,
      min_order_value,
      expires_at,
      expiry_date,
      usage_limit,
      is_active,
    } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const val = discount_value ? parseFloat(discount_value) : 0;
    const isPercent = discount_type === 'PERCENTAGE' || discount_percent !== undefined;
    const percent = discount_percent ? parseInt(discount_percent, 10) : (isPercent ? Math.round(val) : null);
    const flat = discount_flat ? parseFloat(discount_flat) : (!isPercent ? val : null);
    const expiry = expires_at || expiry_date;

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase().trim(),
        discount_percent: percent,
        discount_flat: flat,
        min_order_value: min_order_value ? parseFloat(min_order_value) : 0,
        expires_at: expiry ? new Date(expiry) : null,
        usage_limit: usage_limit ? parseInt(usage_limit, 10) : null,
        is_active: is_active !== undefined ? Boolean(is_active) : true,
      },
    });

    // Realtime broadcast after DB commit
    emitCouponUpdated(coupon);

    res.status(201).json({ success: true, message: 'Coupon created successfully', coupon });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating coupon', error: error.message });
  }
};

export const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const couponId = parseInt(id, 10);
    if (isNaN(couponId)) {
      return res.status(400).json({ success: false, message: 'Invalid coupon ID' });
    }

    const {
      code,
      discount_percent,
      discount_flat,
      discount_value,
      discount_type,
      min_order_value,
      expires_at,
      expiry_date,
      usage_limit,
      is_active,
    } = req.body;

    const val = discount_value !== undefined ? parseFloat(discount_value) : null;
    const isPercent = discount_type === 'PERCENTAGE' || discount_percent !== undefined;
    const percent = discount_percent !== undefined
      ? parseInt(discount_percent, 10)
      : (val !== null && isPercent ? Math.round(val) : (discount_type && !isPercent ? null : undefined));
    const flat = discount_flat !== undefined
      ? parseFloat(discount_flat)
      : (val !== null && !isPercent ? val : (discount_type && isPercent ? null : undefined));
    const expiry = expires_at !== undefined ? expires_at : expiry_date;

    const data = {};
    if (code) data.code = code.toUpperCase().trim();
    if (percent !== undefined) data.discount_percent = percent;
    if (flat !== undefined) data.discount_flat = flat;
    if (min_order_value !== undefined) data.min_order_value = parseFloat(min_order_value) || 0;
    if (expiry !== undefined) data.expires_at = expiry ? new Date(expiry) : null;
    if (usage_limit !== undefined) data.usage_limit = usage_limit ? parseInt(usage_limit, 10) : null;
    if (is_active !== undefined) data.is_active = Boolean(is_active);

    const updated = await prisma.coupon.update({
      where: { id: couponId },
      data,
    });

    emitCouponUpdated(updated);
    res.json({ success: true, message: 'Coupon updated successfully', coupon: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating coupon', error: error.message });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const cId = parseInt(id, 10);
    const existing = await prisma.coupon.findUnique({ where: { id: cId } });
    await prisma.coupon.delete({ where: { id: cId } });

    // Realtime broadcast after DB commit
    emitCouponUpdated({ id: cId, code: existing?.code || '', is_active: false });

    res.json({ message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting coupon', error: error.message });
  }
};

