// dynamically show and hide the elements based on each step
import deviceSelectionStep from "./steps/deviceSelection.js";
import loginStep from "./steps/loginStep.js";
let steps = {
  "device-selection": deviceSelectionStep,
  "apple-login": loginStep,
};

const initStep = (stepID, previousStepData) => {
  window.currentStep = stepID;
  let container = document.querySelector("#wizard-container");
  //hide all subelements, then show the one we want
  Array.from(container.children).forEach((child) => {
    child.style.display = "none";
  });
  document.querySelector(steps[stepID].container).style.display = "flex";
  steps[stepID].onstart.forEach((cb) =>
    cb(steps[stepID].container, previousStepData || {})
  );
};

export const nextStep = (stepData) => {
  let step = window.currentStep;
  initStep(steps[step].next, stepData);
};

export const initWizard = () => {
  initStep("device-selection");
};
