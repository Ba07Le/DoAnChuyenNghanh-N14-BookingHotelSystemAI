import { Banknote, Landmark, Wallet } from "lucide-react";

const OPTIONS = [
  {
    value: "SEPAY",
    title: "SePay",
    description: "Chuyển khoản ngân hàng qua cổng SePay.",
    icon: Landmark,
  },
  {
    value: "ZALOPAY",
    title: "ZaloPay",
    description: "Thanh toán qua ví/cổng ZaloPay.",
    icon: Wallet,
  },
  {
    value: "CASH",
    title: "Thanh toán tại khách sạn",
    description: "Đặt phòng trước, thanh toán trực tiếp khi nhận phòng.",
    icon: Banknote,
  },
];

function PaymentMethodSelect({ value, onChange }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">Phương thức thanh toán</h2>

      <div role="radiogroup" aria-label="Phương thức thanh toán" className="mt-4 grid gap-3">
        {OPTIONS.map(({ value: optionValue, title, description, icon: Icon }) => {
          const selected = value === optionValue;

          return (
            <label
              key={optionValue}
              className={`sy-co-method ${selected ? "is-selected" : ""} flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition-colors focus-within:ring-2 focus-within:ring-blue-500/30 ${
                selected
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="paymentMethod"
                value={optionValue}
                checked={selected}
                onChange={() => onChange(optionValue)}
                className="sr-only"
              />

              <Icon
                size={21}
                className={`mt-0.5 shrink-0 ${selected ? "text-blue-600" : "text-slate-400"}`}
              />

              <span className="min-w-0">
                <span className="block text-sm font-semibold text-slate-900">{title}</span>
                <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
              </span>
              <span aria-hidden="true" className="sy-co-radio"/>
            </label>
          );
        })}
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Bạn có thể đặt phòng và thanh toán mà không cần đăng nhập. Vui lòng nhập chính xác họ tên,
        số điện thoại và email để nhận thông tin đặt phòng.
      </p>
    </section>
  );
}

export default PaymentMethodSelect;
