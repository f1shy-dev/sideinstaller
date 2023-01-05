// dynamically show and hide the elements based on each step
import deviceSelectionStep from "./steps/deviceSelection.js";
let steps = {
    "device-selection": deviceSelectionStep
}

const initStep = (stepID) => {
    window.currentStep = stepID;
    let container = document.querySelector("#wizard-container")
    //hide all subelements, then show the one we want
    Array.from(container.children).forEach((child) => {
        child.style.display = "none";
    });
    document.querySelector(steps[stepID].container).style.display = "flex";
    steps[stepID].onstart.forEach((cb) => cb(steps[stepID].container));
}

export const nextStep = () => {
    let step = window.currentStep;
    initStep(steps[step].next);
}

export const initWizard = () => {
    initStep("device-selection");
};


