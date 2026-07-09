export const businessConfig = {
  name: "Prevedello",
  whatsappPhone: import.meta.env.VITE_PREVEDELLO_WHATSAPP ?? "",
  addressLabel: "Catamarca",
  allowedAdminEmails: (import.meta.env.VITE_CRM_ALLOWED_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
};

export const getWhatsAppUrl = (message: string) => {
  const phone = businessConfig.whatsappPhone.replace(/[^\d]/g, "");
  const encodedMessage = encodeURIComponent(message);

  return phone ? `https://wa.me/${phone}?text=${encodedMessage}` : `https://wa.me/?text=${encodedMessage}`;
};
