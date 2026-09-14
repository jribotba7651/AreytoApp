import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PenLine, Plus, BookOpen } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';

const STEP_ICONS = [PenLine, Plus, BookOpen] as const;

function OnboardingTour() {
  const { t } = useTranslation();
  const setOnboardingCompleted = useSettingsStore((s) => s.setOnboardingCompleted);
  const [step, setStep] = useState(0);

  const steps = [
    { title: t('onboarding.step1Title'), body: t('onboarding.step1Body') },
    { title: t('onboarding.step2Title'), body: t('onboarding.step2Body') },
    { title: t('onboarding.step3Title'), body: t('onboarding.step3Body') },
  ];

  const current = steps[step];
  if (!current) return null;
  const Icon = STEP_ICONS[step];

  function handleNext() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      void setOnboardingCompleted();
    }
  }

  function handleDismiss() {
    void setOnboardingCompleted();
  }

  return (
    <div className="mx-3 my-2 rounded-lg border border-border-default bg-bg-tertiary p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-7 h-7 rounded-md bg-accent-muted/30">
          {Icon && <Icon size={16} className="text-accent" />}
        </div>
        <h3 className="text-sm font-medium text-text-primary">{current.title}</h3>
      </div>

      <p className="text-xs text-text-secondary leading-relaxed mb-3">
        {current.body}
      </p>

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-text-tertiary">
          {t('onboarding.stepOf', { current: step + 1, total: steps.length })}
        </span>
        <div className="flex items-center gap-2">
          {step < steps.length - 1 && (
            <button
              onClick={handleDismiss}
              className="text-[11px] text-text-tertiary hover:text-text-secondary transition-colors duration-150"
            >
              {t('onboarding.done')}
            </button>
          )}
          <button
            onClick={handleNext}
            className="text-xs px-3 py-1 rounded bg-accent-muted text-text-primary hover:bg-accent hover:text-white transition-colors duration-150"
          >
            {step < steps.length - 1 ? t('onboarding.next') : t('onboarding.done')}
          </button>
        </div>
      </div>

      <div className="flex gap-1 mt-3 justify-center">
        {steps.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-150 ${
              i === step ? 'w-4 bg-accent' : 'w-1.5 bg-border-default'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default OnboardingTour;
