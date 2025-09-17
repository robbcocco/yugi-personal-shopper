import { create } from 'zustand';
import { AppState, CollectionData, DeckList, CollectionCard, WizardStep } from '@/types/card-types';

interface AppStore extends AppState {
  // State setters
  setCurrentStep: (step: number) => void;
  setCollection: (collection: CollectionData | null) => void;
  setDeckList: (deckList: DeckList[]) => void;
  setMissingCards: (cards: CollectionCard[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Complex actions
  nextStep: () => void;
  prevStep: () => void;
  resetApp: () => void;
  
  // Wizard steps configuration
  wizardSteps: WizardStep[];
  updateStepCompletion: (stepId: number, isComplete: boolean) => void;
}

// Define wizard steps
const initialWizardSteps: WizardStep[] = [
  {
    id: 1,
    title: "Import Collection",
    description: "Upload your collection data from YGOPRODeck CSV or enter manually",
    component: "CollectionImport",
    isComplete: false,
    isAccessible: true
  },
  {
    id: 2,
    title: "Add Deck List",
    description: "Upload YDK file or paste your desired deck list",
    component: "DeckInput",
    isComplete: false,
    isAccessible: false
  },
  {
    id: 3,
    title: "Compare Collection",
    description: "Compare your deck with your collection to find missing cards",
    component: "CollectionComparison",
    isComplete: false,
    isAccessible: false
  },
  {
    id: 4,
    title: "Price Comparison",
    description: "View prices for missing cards and find the best deals",
    component: "PriceComparison",
    isComplete: false,
    isAccessible: false
  }
];

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  currentStep: 1,
  collection: null,
  deckList: [],
  missingCards: [],
  isLoading: false,
  error: null,
  wizardSteps: initialWizardSteps,

  // State setters
  setCurrentStep: (step: number) => {
    set({ currentStep: step });
  },

  setCollection: (collection: CollectionData | null) => {
    set({ collection });

    // console.log(collection)
    
    // Update step completion and accessibility
    if (collection) {
      get().updateStepCompletion(1, true);
      // Make next step accessible
      set(state => ({
        wizardSteps: state.wizardSteps.map(step => 
          step.id === 2 ? { ...step, isAccessible: true } : step
        )
      }));
    } else {
      get().updateStepCompletion(1, false);
      // Make subsequent steps inaccessible
      set(state => ({
        wizardSteps: state.wizardSteps.map(step => 
          step.id > 1 ? { ...step, isAccessible: false, isComplete: false } : step
        )
      }));
    }
  },

  setDeckList: (deckList: DeckList[]) => {
    set({ deckList });
    
    // Update step completion and accessibility
    if (deckList) {
      get().updateStepCompletion(2, true);
      // Make next step accessible
      set(state => ({
        wizardSteps: state.wizardSteps.map(step => 
          step.id === 3 ? { ...step, isAccessible: true } : step
        )
      }));
    } else {
      get().updateStepCompletion(2, false);
      // Make subsequent steps inaccessible
      set(state => ({
        wizardSteps: state.wizardSteps.map(step => 
          step.id > 2 ? { ...step, isAccessible: false, isComplete: false } : step
        )
      }));
    }
  },

  setMissingCards: (cards: CollectionCard[]) => {
    set({ missingCards: cards });
    
    // Update step completion and accessibility for price comparison
    if (cards.length > 0) {
      // Make price comparison step accessible since we have missing cards
      set(state => ({
        wizardSteps: state.wizardSteps.map(step => 
          step.id === 4 ? { ...step, isAccessible: true } : step
        )
      }));
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Complex actions
  nextStep: () => {
    const { currentStep, wizardSteps } = get();
    const nextStepId = currentStep + 1;
    const nextStep = wizardSteps.find(step => step.id === nextStepId);
    
    if (nextStep && nextStep.isAccessible) {
      set({ currentStep: nextStepId });
    }
  },

  prevStep: () => {
    const { currentStep } = get();
    if (currentStep > 1) {
      set({ currentStep: currentStep - 1 });
    }
  },

  resetApp: () => {
    set({
      currentStep: 1,
      collection: null,
      deckList: [],
      missingCards: [],
      isLoading: false,
      error: null,
      wizardSteps: initialWizardSteps
    });
  },

  updateStepCompletion: (stepId: number, isComplete: boolean) => {
    set(state => ({
      wizardSteps: state.wizardSteps.map(step => 
        step.id === stepId ? { ...step, isComplete } : step
      )
    }));
  }
}));

// Computed getters (custom hooks)
export const useCurrentWizardStep = () => {
  const { currentStep, wizardSteps } = useAppStore();
  return wizardSteps.find(step => step.id === currentStep);
};

export const useCanProceed = () => {
  const { currentStep, wizardSteps } = useAppStore();
  const currentWizardStep = wizardSteps.find(step => step.id === currentStep);
  return currentWizardStep?.isComplete || false;
};

export const useCanGoBack = () => {
  const { currentStep } = useAppStore();
  return currentStep > 1;
};

export const useCanGoNext = () => {
  const { currentStep, wizardSteps } = useAppStore();
  const nextStep = wizardSteps.find(step => step.id === currentStep + 1);
  return nextStep ? nextStep.isAccessible : false;
};

// Utility function to get progress percentage
export const useProgress = () => {
  const { wizardSteps } = useAppStore();
  const completedSteps = wizardSteps.filter(step => step.isComplete).length;
  return Math.round((completedSteps / wizardSteps.length) * 100);
};
