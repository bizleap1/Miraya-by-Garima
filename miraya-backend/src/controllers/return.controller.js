/**
 * =========================================================================
 * MIRAYA BY GARIMA — RETURNS & EXCHANGES CONTROLLER
 * Online & POS return processing, atomic size exchange engine, restock condition
 * =========================================================================
 */

import prisma from '../prisma/client.js';
import { emitExchangeUpdated, emitInventoryUpdated } from '../services/realtime.service.js';

import { processReturnAtomic, processExchangeAtomic } from '../services/inventory.service.js';
import { logAdminAction } from '../services/audit.service.js';

/**
 * Submit a Return or Exchange request (Customer or Staff)
 */
export const createReturnRequest = async (req, res) => {
  try {
    const {
      order_id,
      sale_id,
      product_id,
      variant_id,
      quantity = 1,
      reason,
      exchange_variant_id,
      exchange_quantity = 1,
      customer_name,
      customer_phone,
      customer_email,
    } = req.body;

    // 0. STORE SETTINGS CHECK
    const settings = await prisma.storeSettings.findFirst({ orderBy: { id: 'asc' } });
    const exchangeEnabled = settings && settings.exchange_enabled !== null && settings.exchange_enabled !== undefined ? Boolean(settings.exchange_enabled) : true;
    const windowDays = settings && settings.exchange_window_days ? parseInt(settings.exchange_window_days, 10) : 7;

    if (!exchangeEnabled) {
      return res.status(403).json({
        success: false,
        code: 'EXCHANGE_DISABLED',
        message: 'Exchange requests are currently unavailable.',
      });
    }


    if (!reason || !String(reason).trim()) {
      return res.status(400).json({ success: false, code: 'MISSING_REASON', message: 'Reason for exchange is required.' });
    }

    if (!product_id) {
      return res.status(400).json({ success: false, code: 'MISSING_PRODUCT', message: 'Product ID is required.' });
    }

    const returnQty = parseInt(quantity, 10);
    if (isNaN(returnQty) || returnQty <= 0) {
      return res.status(400).json({ success: false, code: 'INVALID_QUANTITY', message: 'Quantity must be at least 1.' });
    }

    const userRole = (req.user?.role || 'customer').toLowerCase();
    const isStaff = ['admin', 'super_admin', 'store_manager', 'cashier', 'inventory_staff'].includes(userRole);

    const parsedOrderId = order_id ? parseInt(order_id, 10) : null;
    const parsedSaleId = sale_id ? parseInt(sale_id, 10) : null;
    const parsedProductId = parseInt(product_id, 10);
    const parsedVariantId = variant_id ? parseInt(variant_id, 10) : null;
    const parsedExchangeVariantId = exchange_variant_id ? parseInt(exchange_variant_id, 10) : null;
    const exchangeQty = Math.max(1, parseInt(exchange_quantity || quantity || 1, 10));

    if (!parsedOrderId && !parsedSaleId) {
      return res.status(400).json({ success: false, code: 'MISSING_REFERENCE', message: 'Exchange must reference a valid Order ID or POS Sale ID.' });
    }

    // Execute atomic transaction for validation & creation
    const created = await prisma.$transaction(async (tx) => {
      let order = null;
      if (parsedOrderId) {
        order = await tx.order.findUnique({
          where: { id: parsedOrderId },
          include: { items: true },
        });

        // 1. OWNERSHIP CHECK: Customer can ONLY request exchange for own order
        if (!isStaff) {
          if (!order || order.user_id !== req.user.id) {
            throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found for your account.' };
          }
        } else if (!order && !parsedSaleId) {
          throw { statusCode: 404, code: 'ORDER_NOT_FOUND', message: 'Order not found.' };
        }

        if (order) {
          // 2. DELIVERED STATUS CHECK
          const statusLower = (order.status || '').toLowerCase();
          const isDelivered = ['delivered', 'shipped', 'completed', 'processing'].includes(statusLower);
          if (!isDelivered) {
            throw { statusCode: 400, code: 'ORDER_NOT_DELIVERED', message: 'Exchange requests can only be submitted for delivered orders.' };
          }

          // 3. EXCHANGE WINDOW CHECK
          const deliveryTimestamp = order.updated_at || order.created_at;
          const now = new Date();
          const diffDays = (now.getTime() - new Date(deliveryTimestamp).getTime()) / (1000 * 3600 * 24);
          if (diffDays > windowDays) {
            throw {
              statusCode: 400,
              code: 'EXCHANGE_WINDOW_EXPIRED',
              message: `The exchange window of ${windowDays} days after delivery has expired.`,
            };
          }

          // 4. PRODUCT / VARIANT BELONGS TO ORDER CHECK
          const orderItem = order.items.find(it =>
            it.product_id === parsedProductId &&
            (!parsedVariantId || it.variant_id === parsedVariantId)
          );

          if (!orderItem) {
            throw { statusCode: 400, code: 'PRODUCT_NOT_IN_ORDER', message: 'The requested product or variant is not part of this order.' };
          }

          // 5. ELIGIBLE EXCHANGE QUANTITY CHECK
          const existingExchanges = await tx.returnRequest.findMany({
            where: {
              order_id: order.id,
              product_id: parsedProductId,
              ...(parsedVariantId ? { variant_id: parsedVariantId } : {}),
              status: { not: 'REJECTED' },
            },
          });

          const alreadyExchanged = existingExchanges.reduce((sum, r) => sum + r.quantity, 0);
          const maxEligible = orderItem.quantity - alreadyExchanged;

          if (returnQty > maxEligible) {
            throw {
              statusCode: 400,
              code: 'INVALID_EXCHANGE_QUANTITY',
              message: maxEligible > 0
                ? `Requested exchange quantity (${returnQty}) exceeds remaining eligible quantity (${maxEligible}).`
                : `This item has already been fully requested for exchange.`,
            };
          }
        }
      }

      // 6. REPLACEMENT VARIANT VALIDATION
      if (!parsedExchangeVariantId) {
        throw { statusCode: 400, code: 'MISSING_EXCHANGE_VARIANT', message: 'Replacement size/variant is required for an exchange.' };
      }

      const replacement = await tx.productVariant.findUnique({
        where: { id: parsedExchangeVariantId },
      });

      if (!replacement || !replacement.is_active) {
        throw { statusCode: 404, code: 'VARIANT_NOT_FOUND', message: 'Exchange replacement variant was not found or is inactive.' };
      }

      const available = Math.max(0, replacement.stock - replacement.reserved_stock);
      if (exchangeQty > available) {
        throw {
          statusCode: 409,
          code: 'OUT_OF_STOCK',
          message: `Requested replacement size "${replacement.size || replacement.sku}" is out of stock. Available: ${available}`,
          availableStock: available,
        };
      }

      // 7. CREATE EXCHANGE REQUEST (Status: REQUESTED — NO stock reservation yet)
      const returnRecord = await tx.returnRequest.create({
        data: {
          order_id: parsedOrderId,
          sale_id: parsedSaleId,
          product_id: parsedProductId,
          variant_id: parsedVariantId,
          quantity: returnQty,
          reason: reason.trim(),
          type: 'EXCHANGE',
          exchange_variant_id: parsedExchangeVariantId,
          exchange_quantity: exchangeQty,
          customer_name: customer_name ? customer_name.trim() : (req.user?.name || null),
          customer_phone: customer_phone ? String(customer_phone).trim() : (req.user?.phone || null),
          customer_email: customer_email ? customer_email.trim() : (req.user?.email || null),
          status: 'REQUESTED',
          created_by: req.user?.name || req.user?.email || 'Customer',
        },
        include: {
          product: { select: { id: true, name: true, image_url: true } },
          variant: { select: { id: true, sku: true, size: true, color: true } },
          exchange_variant: { select: { id: true, sku: true, size: true, color: true } },
        },
      });

      return returnRecord;
    });

    // Realtime broadcast after DB commit
    emitExchangeUpdated({
      id: created.id,
      order_id: created.order_id,
      user_id: req.user?.id,
      status: created.status,
      reason: created.reason,
    });

    res.status(201).json({
      success: true,
      message: 'Exchange request submitted successfully.',
      returnRequest: created,
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, code: error.code || 'EXCHANGE_ERROR', message: error.message });
    }
    console.error('Create exchange error:', error);
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: 'Error submitting exchange request', error: error.message });
  }
};



/**
 * Get all Returns & Exchanges with filters
 */
export const getAllReturns = async (req, res) => {
  try {
    const { status, type, search, page = 1, limit = 20 } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (type && type !== 'ALL') {
      where.type = type.toUpperCase();
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { customer_name: { contains: q, mode: 'insensitive' } },
        { customer_phone: { contains: q, mode: 'insensitive' } },
        { customer_email: { contains: q, mode: 'insensitive' } },
        { reason: { contains: q, mode: 'insensitive' } },
        { product: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (Math.max(1, parseInt(page, 10) || 1) - 1) * take;

    const [total, returns] = await Promise.all([
      prisma.returnRequest.count({ where }),
      prisma.returnRequest.findMany({
        where,
        take,
        skip,
        orderBy: { created_at: 'desc' },
        include: {
          product: { select: { id: true, name: true, image_url: true } },
          variant: { select: { id: true, sku: true, size: true, color: true, price: true } },
          exchange_variant: { select: { id: true, sku: true, size: true, color: true, price: true } },
          order: { select: { id: true, total: true, created_at: true } },
          sale: { select: { id: true, invoice_number: true, total: true, created_at: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page, 10) || 1,
      limit: take,
      totalPages: Math.ceil(total / take),
      returns,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching returns', error: error.message });
  }
};

/**
 * Get return details by ID
 */
export const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const returnReq = await prisma.returnRequest.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        product: true,
        variant: true,
        exchange_variant: true,
        order: { include: { items: true, payments: true } },
        sale: { include: { items: true, payments: true } },
      },
    });

    if (!returnReq) {
      return res.status(404).json({ success: false, message: 'Return/Exchange request not found' });
    }

    res.json({ success: true, returnRequest: returnReq });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving return request', error: error.message });
  }
};

/**
 * Update Return or Exchange status lifecycle (APPROVE, REJECT, RECEIVE & COMPLETE)
 */
export const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, staff_notes, courier_name, tracking_number } = req.body;
    const returnId = parseInt(id, 10);

    const existing = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: { variant: true, exchange_variant: true },
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Exchange request not found.' });
    }

    const currentStatus = existing.status.toUpperCase();
    const targetStatus = (status || '').toUpperCase();
    const qty = existing.exchange_quantity || existing.quantity || 1;
    const exVarId = existing.exchange_variant_id;

    if (currentStatus === 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Completed exchange requests cannot be modified.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // 1. APPROVE / AWAITING_ITEM: Reserve replacement stock
      if (targetStatus === 'APPROVED' || targetStatus === 'AWAITING_ITEM') {
        if (currentStatus !== 'APPROVED' && currentStatus !== 'AWAITING_ITEM' && exVarId) {
          const replVar = await tx.productVariant.findUnique({ where: { id: exVarId } });
          if (!replVar) {
            throw { statusCode: 404, message: 'Replacement variant not found.' };
          }
          const available = Math.max(0, replVar.stock - replVar.reserved_stock);
          if (qty > available) {
            throw {
              statusCode: 409,
              code: 'OUT_OF_STOCK',
              message: `Cannot approve exchange. Replacement size "${replVar.size || replVar.sku}" is out of stock. Available: ${available}`,
              availableStock: available,
            };
          }
          // Protect replacement inventory by incrementing reserved_stock
          await tx.productVariant.update({
            where: { id: exVarId },
            data: { reserved_stock: { increment: qty } },
          });
        }
      }

      // 2. REJECTED / CANCELLED: Release replacement reservation if previously reserved
      if (targetStatus === 'REJECTED' || targetStatus === 'CANCELLED') {
        const wasReserved = ['APPROVED', 'AWAITING_ITEM', 'ITEM_RECEIVED', 'PROCESSING', 'SHIPPED'].includes(currentStatus);
        if (wasReserved && exVarId) {
          const replVar = await tx.productVariant.findUnique({ where: { id: exVarId } });
          if (replVar) {
            const newRes = Math.max(0, replVar.reserved_stock - qty);
            await tx.productVariant.update({
              where: { id: exVarId },
              data: { reserved_stock: newRes },
            });
          }
        }
      }

      // 3. COMPLETED: Deduct replacement physical stock & reconcile reservation
      if (targetStatus === 'COMPLETED') {
        if (exVarId) {
          const replVar = await tx.productVariant.findUnique({ where: { id: exVarId } });
          if (replVar) {
            const wasReserved = ['APPROVED', 'AWAITING_ITEM', 'ITEM_RECEIVED', 'PROCESSING', 'SHIPPED'].includes(currentStatus);
            const newStock = Math.max(0, replVar.stock - qty);
            const newRes = wasReserved ? Math.max(0, replVar.reserved_stock - qty) : replVar.reserved_stock;
            await tx.productVariant.update({
              where: { id: exVarId },
              data: {
                stock: newStock,
                reserved_stock: newRes,
              },
            });
          }
        }
      }


      // Update return/exchange record
      const rec = await tx.returnRequest.update({
        where: { id: returnId },
        data: {
          status: targetStatus,
          staff_notes: [
            staff_notes || existing.staff_notes || '',
            courier_name ? `Courier: ${courier_name}` : '',
            tracking_number ? `AWB: ${tracking_number}` : ''
          ].filter(Boolean).join(' | ') || null,

        },
        include: {
          product: true,
          variant: true,
          exchange_variant: true,
          order: true,
        },
      });

      return rec;
    });

    // Realtime broadcast after DB commit
    emitExchangeUpdated({
      id: updated.id,
      order_id: updated.order_id,
      user_id: updated.order?.user_id,
      status: updated.status,
      reason: updated.reason,
    });

    if (updated.exchange_variant) {
      emitInventoryUpdated({
        variantId: updated.exchange_variant.id,
        productId: updated.exchange_variant.product_id,
        stock: updated.exchange_variant.stock,
        reserved_stock: updated.exchange_variant.reserved_stock || 0,
      });
    }

    res.json({
      success: true,
      message: `Exchange request status updated to ${targetStatus}.`,
      returnRequest: updated,
    });

  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, code: error.code || 'STATUS_ERROR', message: error.message });
    }
    console.error('Update exchange status error:', error);
    res.status(500).json({ success: false, message: 'Error updating exchange status', error: error.message });
  }
};


/**
 * Direct POS Boutique Counter Return or Exchange
 */
export const createPosDirectReturnOrExchange = async (req, res) => {
  try {
    const {
      sale_id,
      invoice_number,
      product_id,
      variant_id,
      quantity = 1,
      reason = 'Counter Return / Exchange',
      type = 'RETURN', // 'RETURN' | 'EXCHANGE'
      exchange_variant_id,
      condition = 'RESTOCKABLE',
      customer_name = 'Walk-in Customer',
      customer_phone,
      staff_notes,
    } = req.body;

    let targetSaleId = sale_id ? parseInt(sale_id, 10) : null;
    if (!targetSaleId && invoice_number) {
      const sale = await prisma.sale.findUnique({ where: { invoice_number: invoice_number.trim() } });
      if (sale) targetSaleId = sale.id;
    }

    const actorName = req.user?.name || req.user?.email || 'Boutique Cashier';
    const actorId = req.user?.id || null;
    const actorEmail = req.user?.email || null;

    // Create record in database
    const returnReq = await prisma.returnRequest.create({
      data: {
        sale_id: targetSaleId,
        product_id: parseInt(product_id, 10),
        variant_id: parseInt(variant_id, 10),
        quantity: Math.max(1, parseInt(quantity, 10) || 1),
        reason: reason.trim(),
        type: type.toUpperCase() === 'EXCHANGE' ? 'EXCHANGE' : 'RETURN',
        exchange_variant_id: exchange_variant_id ? parseInt(exchange_variant_id, 10) : null,
        exchange_quantity: exchange_variant_id ? Math.max(1, parseInt(quantity, 10) || 1) : null,
        condition: condition.toUpperCase() === 'DAMAGED' ? 'DAMAGED' : 'RESTOCKABLE',
        customer_name: customer_name ? customer_name.trim() : 'Walk-in Customer',
        customer_phone: customer_phone ? String(customer_phone).trim() : null,
        status: 'REQUESTED',
        created_by: actorName,
      },
    });

    if (returnReq.type === 'EXCHANGE') {
      const result = await processExchangeAtomic({
        return_id: returnReq.id,
        old_variant_id: returnReq.variant_id,
        new_variant_id: returnReq.exchange_variant_id,
        quantity: returnReq.quantity,
        condition,
        staff_actor: actorName,
        actor_id: actorId,
        actor_email: actorEmail,
        staff_notes: staff_notes || 'Direct POS size exchange',
      });

      return res.status(201).json({
        success: true,
        message: 'POS Counter Exchange completed successfully.',
        ...result,
      });
    } else {
      const result = await processReturnAtomic({
        return_id: returnReq.id,
        condition,
        staff_actor: actorName,
        actor_id: actorId,
        actor_email: actorEmail,
        staff_notes: staff_notes || 'Direct POS return',
      });

      return res.status(201).json({
        success: true,
        message: 'POS Counter Return completed successfully.',
        ...result,
      });
    }
  } catch (error) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, code: error.code || 'POS_RETURN_ERROR', message: error.message });
  }
};
