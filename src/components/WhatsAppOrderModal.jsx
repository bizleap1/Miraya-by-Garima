"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
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

  const prodCategorySlug = product?.category?.slug || product?.category || "all";
  const productLink = origin && product?.id ? `${origin}/product/${prodCategorySlug}/${product.id}` : "";

  const message = encodeURIComponent(
    `👑 *PRODUCT INQUIRY — MIRAYA BY GARIMA*\n` +
    `━━━━━━━━━━━━━━━━━━━━━━━\n\n` +
    `Hello! I am interested in this outfit and would like to get more details:\n\n` +
    `👗 *Garment Name:* ${productName}\n` +
    `🏷️ *Category:* ${categoryName}\n` +
    (price ? `💰 *Price:* ${price}\n` : "") +
    (size ? `📏 *Size:* ${size}\n` : "") +
    (product?.fabric ? `🧵 *Fabric:* ${product.fabric}\n` : "") +
    (product?.color ? `🎨 *Color:* ${product.color}\n` : "") +
    (fullImgUrl ? `🖼️ *Product Image:* ${fullImgUrl}\n` : "") +
    (productLink ? `🔗 *Product Link:* ${productLink}\n\n` : "\n") +
    `Please share details regarding availability, custom tailoring, and delivery timeline. Thank you! 🙏`
  );

  const waUrl = `https://wa.me/${(whatsapp_number || "+919271218156").replace(/[^0-9]/g, "")}?text=${message}`;

  const isStoreDown = !store_online || !new_orders_enabled;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="wp-modal-backdrop-wrapper"
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 5, 5, 0.75)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            zIndex: 10000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              background: "linear-gradient(135deg, #FAF8F5 0%, #F5EFE6 100%)",
              borderRadius: "20px",
              padding: "36px 32px",
              width: "min(440px, 92vw)",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 40px 80px rgba(94, 10, 11, 0.35), 0 0 0 1px rgba(198, 164, 106, 0.3)",
              textAlign: "center",
              margin: "auto",
            }}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              style={{
                position: "absolute",
                top: "16px",
                right: "16px",
                background: "none",
                border: "1px solid rgba(198, 164, 106, 0.3)",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#5e0a0b",
                transition: "background 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(198, 164, 106, 0.2)";
                e.currentTarget.style.transform = "scale(1.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "none";
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <X size={16} />
            </button>

            {/* WhatsApp Icon */}
            <div
              style={{
                width: "68px",
                height: "68px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #25D366, #128C7E)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 18px",
                boxShadow: "0 8px 24px rgba(37, 211, 102, 0.35)",
              }}
            >
              <MessageCircle size={32} color="white" fill="white" />
            </div>

            {/* Heading */}
            <h2
              style={{
                fontFamily: "Playfair Display, Cormorant Garamond, serif",
                fontSize: "1.6rem",
                fontWeight: 700,
                color: "#5e0a0b",
                marginBottom: "8px",
              }}
            >
              {isStoreDown ? "Online Orders Paused" : "Order via WhatsApp"}
            </h2>

            <p
              style={{
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontSize: "0.88rem",
                color: "#666",
                lineHeight: 1.6,
                marginBottom: "18px",
              }}
            >
              {isStoreDown
                ? "Online automated orders are temporarily paused. Click below to message our atelier directly on WhatsApp — we will assist you immediately! 🙏"
                : "Order directly via WhatsApp. Our design team will confirm your order details promptly!"}
            </p>

            {/* Product preview */}
            {product && (
              <div
                style={{
                  background: "white",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  marginBottom: "20px",
                  border: "1px solid rgba(198, 164, 106, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  textAlign: "left",
                }}
              >
                {(product.image || product.image_url) && (
                  <img
                    src={product.image || product.image_url}
                    alt={productName}
                    style={{
                      width: "52px",
                      height: "68px",
                      objectFit: "cover",
                      borderRadius: "8px",
                    }}
                  />
                )}
                <div>
                  <div
                    style={{
                      fontFamily: "Playfair Display, serif",
                      fontSize: "0.98rem",
                      fontWeight: 600,
                      color: "#2c1810",
                    }}
                  >
                    {productName}
                  </div>
                  {selectedSize && (
                    <div style={{ fontSize: "0.8rem", color: "#888", marginTop: "2px" }}>
                      Size: {selectedSize}
                    </div>
                  )}
                  {price && (
                    <div
                      style={{
                        fontSize: "0.85rem",
                        color: "#c6a46a",
                        fontWeight: 600,
                        marginTop: "2px",
                      }}
                    >
                      {price}
                    </div>
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
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                background: "linear-gradient(135deg, #25D366, #1aab55)",
                color: "white",
                textDecoration: "none",
                borderRadius: "12px",
                padding: "13px 24px",
                fontSize: "0.95rem",
                fontFamily: "Plus Jakarta Sans, sans-serif",
                fontWeight: 600,
                letterSpacing: "0.5px",
                width: "100%",
                boxShadow: "0 4px 16px rgba(37, 211, 102, 0.4)",
                transition: "transform 0.2s, box-shadow 0.2s",
                boxSizing: "border-box",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(37, 211, 102, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(37, 211, 102, 0.4)";
              }}
            >
              <MessageCircle size={19} />
              Order on WhatsApp
            </a>

            <button
              type="button"
              onClick={onClose}
              style={{
                marginTop: "12px",
                background: "none",
                border: "none",
                color: "#999",
                fontSize: "0.85rem",
                cursor: "pointer",
                fontFamily: "Plus Jakarta Sans, sans-serif",
              }}
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
