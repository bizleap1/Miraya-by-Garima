"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, ShoppingBag } from "lucide-react";
import { useStoreSettings } from "../context/StoreSettingsContext";

export default function WhatsAppOrderModal({ isOpen, onClose, product, selectedSize }) {
  const { whatsapp_number, store_online, new_orders_enabled } = useStoreSettings();

  if (!isOpen) return null;

  const origin = typeof window !== "undefined" ? window.location.origin : "https://mirayabygarima.com";
  const productName = product?.title || product?.name || "this outfit";
  const price = product?.price ? `₹${typeof product.price === "number" ? product.price.toLocaleString("en-IN") : product.price}` : "";
  const size = selectedSize ? selectedSize : "M";
  const categoryName = product?.category?.name || product?.category || "Haute Couture";

  const rawImg = product?.image || product?.image_url || (product?.images && product.images[0]) || "";
  const fullImgUrl = rawImg ? (rawImg.startsWith("http") ? rawImg : `${origin}${rawImg}`) : "";

  const message = encodeURIComponent(
    `👑 *NEW OUTFIT INQUIRY — MIRAYA BY GARIMA ATELIER*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `👗 *Garment:* ${productName}\n` +
    `🏷️ *Category:* ${categoryName}\n` +
    `📏 *Selected Size:* ${size}\n` +
    (price ? `💰 *Price:* ${price}\n` : "") +
    (fullImgUrl ? `🖼️ *Outfit Image:* ${fullImgUrl}\n` : "") +
    `\nPlease share availability and ordering details. 🙏`
  );

  const waUrl = `https://wa.me/${(whatsapp_number || "+919271218156").replace(/[^0-9]/g, "")}?text=${message}`;

  const isStoreDown = !store_online || !new_orders_enabled;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="wp-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(15,5,5,0.7)",
              backdropFilter: "blur(6px)",
              zIndex: 10000,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{
              position: "fixed", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 10001,
              background: "linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 100%)",
              borderRadius: "20px",
              padding: "40px 36px",
              width: "min(440px, 92vw)",
              boxShadow: "0 40px 80px rgba(94,10,11,0.25), 0 0 0 1px rgba(198,164,106,0.3)",
              textAlign: "center",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute", top: "16px", right: "16px",
                background: "none", border: "1px solid rgba(198,164,106,0.3)",
                borderRadius: "50%", width: "32px", height: "32px",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                color: "#5e0a0b",
              }}
            >
              <X size={15} />
            </button>

            {/* WhatsApp Icon */}
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "linear-gradient(135deg, #25D366, #128C7E)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
              boxShadow: "0 8px 24px rgba(37,211,102,0.35)",
            }}>
              <MessageCircle size={34} color="white" fill="white" />
            </div>

            {/* Heading */}
            <h2 style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1.7rem", fontWeight: 700,
              color: "#5e0a0b", marginBottom: "10px",
            }}>
              {isStoreDown ? "Online Orders Paused" : "Order via WhatsApp"}
            </h2>

            <p style={{
              fontFamily: "Outfit, sans-serif", fontSize: "0.9rem",
              color: "#666", lineHeight: 1.6, marginBottom: "20px",
            }}>
              {isStoreDown
                ? "Online automated orders are temporarily paused. Click below to message our atelier directly on WhatsApp — we will assist you immediately! 🙏"
                : "Order directly via WhatsApp. Our design team will confirm your order details promptly!"}
            </p>

            {/* Product preview */}
            {product && (
              <div style={{
                background: "white", borderRadius: "12px",
                padding: "12px 16px", marginBottom: "24px",
                border: "1px solid rgba(198,164,106,0.3)",
                display: "flex", alignItems: "center", gap: "12px", textAlign: "left",
              }}>
                {(product.image || product.image_url) && (
                  <img
                    src={product.image || product.image_url}
                    alt={productName}
                    style={{ width: "52px", height: "68px", objectFit: "cover", borderRadius: "8px" }}
                  />
                )}
                <div>
                  <div style={{ fontFamily: "Cormorant Garamond, serif", fontSize: "1rem", fontWeight: 600, color: "#2c1810" }}>
                    {productName}
                  </div>
                  {selectedSize && (
                    <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "2px" }}>Size: {selectedSize}</div>
                  )}
                  {price && (
                    <div style={{ fontSize: "0.85rem", color: "#c6a46a", fontWeight: 600, marginTop: "2px" }}>{price}</div>
                  )}
                </div>
              </div>
            )}

            {/* WhatsApp Button */}
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
                background: "linear-gradient(135deg, #25D366, #1aab55)",
                color: "white", textDecoration: "none",
                borderRadius: "12px", padding: "14px 28px",
                fontSize: "0.95rem", fontFamily: "Outfit, sans-serif", fontWeight: 600,
                letterSpacing: "0.5px", width: "100%",
                boxShadow: "0 4px 16px rgba(37,211,102,0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(37,211,102,0.5)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 16px rgba(37,211,102,0.4)"; }}
            >
              <MessageCircle size={20} />
              Order on WhatsApp
            </a>

            <button
              onClick={onClose}
              style={{
                marginTop: "12px", background: "none", border: "none",
                color: "#999", fontSize: "0.85rem", cursor: "pointer",
                fontFamily: "Outfit, sans-serif",
              }}
            >
              Cancel
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
