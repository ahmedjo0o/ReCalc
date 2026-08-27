import { useLanguage } from '../../context/LanguageContext.jsx';

// Replaces the old single line of colored text ("Items total: 45.00 / Sub-total
// 50.00") with a plain-language banner: what state we're in, and — when items
// don't add up yet — exactly how far off and in which direction.
export default function ItemsSumStatus({ itemsSum, subTotal }) {
  const { t } = useLanguage();
  const subTotalNum = parseFloat(subTotal);
  const hasSubTotal = subTotal !== '' && subTotal != null && !isNaN(subTotalNum);

  if (!hasSubTotal) {
    return (
      <div className="sum-status sum-status--neutral">
        <span className="sum-status__icon">Σ</span>
        <div>
          <div className="sum-status__title">{t.itemsSumNeutralTitle.replace('{sum}', itemsSum.toFixed(2))}</div>
        </div>
      </div>
    );
  }

  const diff = itemsSum - subTotalNum;
  const isMismatch = Math.abs(diff) > 2;

  if (!isMismatch) {
    return (
      <div className="sum-status sum-status--ok">
        <span className="sum-status__icon">✓</span>
        <div>
          <div className="sum-status__title">{t.itemsMatchTitle}</div>
          <div className="sum-status__detail">{itemsSum.toFixed(2)}</div>
        </div>
      </div>
    );
  }

  const amount = Math.abs(diff).toFixed(2);
  const message = diff > 0 ? t.itemsRemainingOver.replace('{amount}', amount) : t.itemsRemainingUnder.replace('{amount}', amount);

  return (
    <div className="sum-status sum-status--warn">
      <span className="sum-status__icon">⚠</span>
      <div>
        <div className="sum-status__title">{t.itemsMismatchTitle}</div>
        <div className="sum-status__detail">{message}</div>
      </div>
    </div>
  );
}
