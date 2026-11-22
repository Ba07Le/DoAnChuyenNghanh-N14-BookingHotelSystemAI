import api from "./apiClient";

const guestPaymentConfig = (guestPaymentToken) =>
  guestPaymentToken
    ? {
        headers: { "X-Guest-Payment-Token": guestPaymentToken },
        skipAuth: true,
      }
    : {};

export const createSePayPayment = async (bookingId, guestPaymentToken) =>
  (await api.post("/payments/sepay/create", { bookingId }, guestPaymentConfig(guestPaymentToken))).data;

export const createZaloPayPayment = async (bookingId, guestPaymentToken) =>
  (await api.post("/payments/zalopay/create", { bookingId }, guestPaymentConfig(guestPaymentToken))).data;

export const getPaymentStatus = async (bookingId) => {
  const guestPaymentToken = window.sessionStorage.getItem(`guest-payment-token:${bookingId}`);
  return (
    await api.get(`/payments/status/${bookingId}`, guestPaymentConfig(guestPaymentToken))
  ).data;
};

/**
 * SePay nhận form POST gồm các trường đã được SDK ký; ZaloPay trả về paymentUrl để redirect.
 * Redirect chỉ đưa khách quay lại website, không tự xác nhận giao dịch.
 */
export const redirectToPayment = (data) => {
  if (data?.checkoutUrl && data?.checkoutFields) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = data.checkoutUrl;
    form.style.display = "none";

    Object.entries(data.checkoutFields).forEach(([name, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = name;
      input.value = String(value ?? "");
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
    return;
  }

  if (data?.paymentUrl) {
    window.location.assign(data.paymentUrl);
    return;
  }

  throw new Error("Cổng thanh toán không trả về đường dẫn hợp lệ.");
};
