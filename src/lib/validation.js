// Client-side mirror of the legacy calculator.js validateBillTotals — good UX,
// not authoritative (the calculateBill Cloud Function re-validates everything
// server-side regardless). Extended with an optional, non-negative `tip`.
export function validateBillTotals({ totalOrder, subTotal, discount, tip }, t) {
  const totalOrderStr = (totalOrder ?? '').toString().trim();
  const subTotalStr = (subTotal ?? '').toString().trim();
  const discountStr = (discount ?? '').toString().trim();
  const tipStr = (tip ?? '').toString().trim();

  if (!totalOrderStr || isNaN(Number(totalOrderStr))) {
    return { error: { field: 'totalOrder', message: t.totalOrderError } };
  }
  if (!subTotalStr || isNaN(Number(subTotalStr))) {
    return { error: { field: 'subTotal', message: t.subTotalError } };
  }
  if (discountStr && isNaN(Number(discountStr))) {
    return { error: { field: 'discount', message: t.discountError } };
  }
  if (tipStr && isNaN(Number(tipStr))) {
    return { error: { field: 'tip', message: t.tipError } };
  }

  const totalOrderNum = Number(totalOrderStr);
  const subTotalNum = Number(subTotalStr);
  const discountNum = Number(discountStr) || 0;
  const tipNum = Number(tipStr) || 0;

  if (totalOrderNum < 0) return { error: { field: 'totalOrder', message: t.negativeError } };
  if (subTotalNum < 0) return { error: { field: 'subTotal', message: t.negativeError } };
  if (discountNum < 0) return { error: { field: 'discount', message: t.negativeError } };
  if (tipNum < 0) return { error: { field: 'tip', message: t.negativeError } };
  if (discountNum > totalOrderNum) return { error: { field: 'discount', message: t.discountGreaterError } };
  if (subTotalNum > totalOrderNum) return { error: { field: 'subTotal', message: t.subTotalGreaterError } };

  return { value: { totalOrder: totalOrderNum, subTotal: subTotalNum, discount: discountNum, tip: tipNum } };
}
