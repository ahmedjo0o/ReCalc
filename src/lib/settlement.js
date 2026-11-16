// Settling up: who paid the restaurant, and who has to pay whom back.
//
// A settlement is stored as:
//   { paidBy, paid, payers, settled }
//
// One person paid (the simple case):
//   paidBy  - position in the results list of the person who paid the bill
//   paid    - positions of the people who have paid that person back
//
// Several people paid ("Custom"):
//   paidBy  - CUSTOM (-1)
//   payers  - amount each person paid the restaurant, in results order
//             (0 for someone who paid nothing)
//   settled - the repayments already made, as "from>to" position pairs
//
// People are identified by position, not name, so two people called "Ali"
// stay separate.

export const CUSTOM = -1;
const EPSILON = 0.005;      // below half a piastre/cent: treat as zero
const MATCH_TOLERANCE = 0.05; // entered amounts vs bill total

const round2 = (n) => Math.round(n * 100) / 100;
const share = (person) => Number(person.totalPay || 0);

// Saved history totals never include the tip (see attachTipToHistory); merge
// it in the same way the live result screen does.
export function withTipMerged(item) {
  const totals = item.totals || [];
  if (!item.tip || !totals.length) return totals;
  const perPersonTip = item.tip / totals.length;
  return totals.map((p) => ({
    ...p,
    tipShare: perPersonTip,
    totalPay: Number((p.totalPay + perPersonTip).toFixed(2)),
  }));
}

export function billTotal(results) {
  return round2((results || []).reduce((sum, p) => sum + share(p), 0));
}

// How the amounts typed in for "several people paid" compare with the bill.
export function checkPayers(results, payers) {
  const total = billTotal(results);
  const entered = round2((payers || []).reduce((sum, v) => sum + (Number(v) || 0), 0));
  const diff = round2(entered - total);
  return { total, entered, diff, ok: entered > 0 && Math.abs(diff) <= MATCH_TOLERANCE };
}

// Works out the fewest sensible repayments. Each person's balance is what
// they paid the restaurant minus their own share: positive means they are
// owed money, negative means they owe. The largest debt is then matched
// against the largest credit, repeatedly, until everyone is at zero.
export function computeTransfers(results, payers) {
  const balances = (results || []).map((p, i) => ({ index: i, amount: round2((Number(payers?.[i]) || 0) - share(p)) }));
  const creditors = balances.filter((b) => b.amount > EPSILON).sort((a, b) => b.amount - a.amount);
  const debtors = balances.filter((b) => b.amount < -EPSILON).map((b) => ({ ...b, amount: -b.amount })).sort((a, b) => b.amount - a.amount);

  const transfers = [];
  let c = 0;
  let d = 0;
  while (c < creditors.length && d < debtors.length) {
    const amount = round2(Math.min(creditors[c].amount, debtors[d].amount));
    if (amount > EPSILON) transfers.push({ from: debtors[d].index, to: creditors[c].index, amount });
    creditors[c].amount = round2(creditors[c].amount - amount);
    debtors[d].amount = round2(debtors[d].amount - amount);
    if (creditors[c].amount <= EPSILON) c++;
    if (debtors[d].amount <= EPSILON) d++;
  }
  return transfers;
}

// The list of repayments for a settlement in either mode, each marked done or
// not: [{ key, from, to, amount, done }]. Returns null when nothing can be
// worked out yet (nobody chosen, or the entered amounts don't match the bill).
export function getTransfers(results, settlement) {
  const people = results || [];
  if (!settlement) return null;

  if (settlement.paidBy === CUSTOM) {
    if (!checkPayers(people, settlement.payers).ok) return null;
    const settled = Array.isArray(settlement.settled) ? settlement.settled : [];
    return computeTransfers(people, settlement.payers).map((t) => {
      const key = `${t.from}>${t.to}`;
      return { ...t, key, done: settled.includes(key) };
    });
  }

  const payer = settlement.paidBy;
  if (!Number.isInteger(payer) || !people[payer]) return null;
  const paid = Array.isArray(settlement.paid) ? settlement.paid : [];
  return people
    .map((p, i) => ({ key: `${i}>${payer}`, from: i, to: payer, amount: round2(share(p)), done: paid.includes(i) }))
    .filter((t) => t.from !== payer && t.amount > EPSILON);
}

// "2 of 3 paid back" for lists. null when there is nothing to show.
export function settlementSummary(settlement, results) {
  const transfers = getTransfers(results, settlement);
  if (!transfers || transfers.length === 0) return null;
  const paid = transfers.filter((t) => t.done).length;
  return { paid, owing: transfers.length, done: paid === transfers.length };
}
