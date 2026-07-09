export const businessConfig = {
  name: "Prevedello",
  whatsappPhone: import.meta.env.VITE_PREVEDELLO_WHATSAPP ?? "",
  addressLabel: "Catamarca",
};

export const getWhatsAppUrl = (message: string) => {
  const phone = businessConfig.whatsappPhone.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);

  return phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
};
