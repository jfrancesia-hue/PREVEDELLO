export const businessConfig = {
  name: "Prevedello",
  whatsappPhone: import.meta.env.VITE_PREVEDELLO_WHATSAPP ?? "",
  addressLabel: "Catamarca",
  enableAdmin: import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === "true",
};

export const getWhatsAppUrl = (message: string) => {
  const phone = businessConfig.whatsappPhone.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);

  return phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
};
