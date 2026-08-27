import MethodChoiceStep from '../components/calculator/MethodChoiceStep.jsx';
import ScanStep from '../components/calculator/ScanStep.jsx';
import NamesStep from '../components/calculator/NamesStep.jsx';
import ManualEntryStep from '../components/calculator/ManualEntryStep.jsx';
import AssignStep from '../components/calculator/AssignStep.jsx';
import ResultStep from '../components/calculator/ResultStep.jsx';
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

  const { step, flow, numPeople, names, scannedReceipt, results, calculating, calcError } = state;

  return (
    <main>
      {step === 'method' && <MethodChoiceStep onChoose={chooseMethod} />}

      {step === 'scan' && (
        <ScanStep onBack={() => goToStep('method')} onContinue={scanContinue} />
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

      {step === 'assign' && (
        <AssignStep
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
          results={results}
          onBack={() => goToStep(flow === 'scan' ? 'assign' : 'manual')}
          onStartAgain={startAgain}
        />
      )}
    </main>
  );
}
