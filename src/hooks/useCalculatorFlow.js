import { useCallback, useReducer } from 'react';
import { callCalculateBill } from '../lib/api.js';
import { mapServerErrorMessage } from '../lib/errors.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useLanguage } from '../context/LanguageContext.jsx';

const initialState = {
  step: 'method',
  flow: null, // 'manual' | 'scan'
  numPeople: '',
  names: [],
  scannedReceipt: null,
  results: [],
  calculating: false,
  calcError: '',
};

function reducer(state, action) {
  switch (action.type) {
    case 'CHOOSE_METHOD':
      return { ...state, flow: action.method, step: action.method === 'scan' ? 'scan' : 'names' };
    case 'SCAN_CONTINUE':
      return { ...state, scannedReceipt: action.receipt, step: 'names' };
    case 'SET_NUM_PEOPLE':
      return { ...state, numPeople: action.value };
    case 'SET_NAMES':
      return { ...state, names: action.names };
    case 'NAMES_NEXT':
      return { ...state, step: state.flow === 'scan' ? 'assign' : 'manual' };
    case 'GO_TO_STEP':
      return { ...state, step: action.step, calcError: '' };
    case 'CALCULATE_START':
      return { ...state, calculating: true, calcError: '' };
    case 'CALCULATE_SUCCESS':
      return { ...state, calculating: false, results: action.results, step: 'result' };
    case 'CALCULATE_ERROR':
      return { ...state, calculating: false, calcError: action.message };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

// Drives the whole calculator wizard (method choice -> scan/names -> manual
// or assign -> result) and is the single place that calls the calculateBill
// Cloud Function. calculateBill is authoritative for every share of
// VAT/discount; the tip is split equally client-side on top of that (see
// STEP 3 plan decision — tip has no representation in the Cloud Function, so
// the saved history amount for signed-in users won't include it).
export function useCalculatorFlow() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const chooseMethod = useCallback((method) => dispatch({ type: 'CHOOSE_METHOD', method }), []);
  const scanContinue = useCallback((receipt) => dispatch({ type: 'SCAN_CONTINUE', receipt }), []);
  const setNumPeople = useCallback((value) => dispatch({ type: 'SET_NUM_PEOPLE', value }), []);
  const setNames = useCallback((names) => dispatch({ type: 'SET_NAMES', names }), []);
  const namesNext = useCallback(() => dispatch({ type: 'NAMES_NEXT' }), []);
  const goToStep = useCallback((step) => dispatch({ type: 'GO_TO_STEP', step }), []);
  const startAgain = useCallback(() => dispatch({ type: 'RESET' }), []);

  const calculate = useCallback(
    async ({ totalOrder, subTotal, discount, tip, totals }) => {
      dispatch({ type: 'CALCULATE_START' });
      try {
        const response = await callCalculateBill({
          totalOrder,
          subTotal,
          discount,
          // Never send a client-computed "sum" — the server recomputes it
          // from raw items, since a tampered client could otherwise shift
          // cost onto someone else.
          totals: totals.map(({ name, items }) => ({ name, items: items || [] })),
          localeLang: language,
          source: state.flow === 'scan' ? 'scan' : 'manual',
        });
        const { results } = response.data;

        // The Cloud Function persists history itself for signed-in callers
        // (via context.auth, never a client-supplied uid). Guests get
        // nothing saved anywhere — no localStorage fallback — by design:
        // a guest's results exist only in memory for this session.
        const perPersonTip = totals.length ? tip / totals.length : 0;
        const merged = results.map((r) => ({
          ...r,
          tipShare: perPersonTip,
          totalPay: Number((r.totalPay + perPersonTip).toFixed(2)),
        }));

        dispatch({ type: 'CALCULATE_SUCCESS', results: merged });
      } catch (err) {
        console.error('calculateBill failed:', err);
        dispatch({ type: 'CALCULATE_ERROR', message: mapServerErrorMessage(err, t) });
      }
    },
    [language, state.flow, t],
  );

  return {
    state,
    user,
    chooseMethod,
    scanContinue,
    setNumPeople,
    setNames,
    namesNext,
    goToStep,
    startAgain,
    calculate,
  };
}
