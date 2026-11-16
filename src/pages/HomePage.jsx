import MethodChoiceStep from '../components/calculator/MethodChoiceStep.jsx';
import ScanStep from '../components/calculator/ScanStep.jsx';
import NamesStep from '../components/calculator/NamesStep.jsx';
import ManualEntryStep from '../components/calculator/ManualEntryStep.jsx';
import AssignStep from '../components/calculator/AssignStep.jsx';
import ResultStep from '../components/calculator/ResultStep.jsx';
import InstallAppButton from '../components/ui/InstallAppButton.jsx';
import { useCalculatorFlow } from '../hooks/useCalculatorFlow.js';

export default function HomePage() {
  const {
    state,
    chooseMethod,
    scanContinue,
    setNumPeople,
    setNames,
    namesNext,
    goToStep,
    startAgain,
    calculate,
  } = useCalculatorFlow();

  const { step, flow, numPeople, names, scannedReceipt, results, historyId, calculating, calcError } = state;

  return (
    <main>
      {step === 'method' && <MethodChoiceStep onChoose={chooseMethod} />}

      {/* Stays mounted (hidden) for the rest of the scan flow so "Back" from
          the names step returns to the photo and extracted items instead of
          a blank step that forces a rescan. */}
      {flow === 'scan' && step !== 'method' && (
        <ScanStep hidden={step !== 'scan'} onBack={() => goToStep('method')} onContinue={scanContinue} />
      )}

      {step === 'names' && (
        <NamesStep
          numPeople={numPeople}
          names={names}
          onNumPeopleChange={setNumPeople}
          onNamesChange={setNames}
          onBack={() => goToStep(flow === 'scan' ? 'scan' : 'method')}
          onNext={namesNext}
        />
      )}

      {step === 'manual' && (
        <ManualEntryStep
          names={names}
          onBack={() => goToStep('names')}
          onCalculate={calculate}
          calculating={calculating}
          serverError={calcError}
        />
      )}

      {/* Stays mounted (hidden) behind the results so "Back" returns to the
          same assignments instead of a blank step. */}
      {(step === 'assign' || (step === 'result' && flow === 'scan')) && (
        <AssignStep
          hidden={step !== 'assign'}
          names={names}
          scannedReceipt={scannedReceipt}
          onBack={() => goToStep('names')}
          onCalculate={calculate}
          calculating={calculating}
          serverError={calcError}
        />
      )}

      {step === 'result' && (
        <ResultStep
          // New calculation, new record: start the settle-up box fresh.
          key={historyId || 'guest'}
          results={results}
          historyId={historyId}
          onBack={() => goToStep(flow === 'scan' ? 'assign' : 'manual')}
          onStartAgain={startAgain}
        />
      )}

      {step === 'method' && <InstallAppButton />}
    </main>
  );
}
