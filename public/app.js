import { parseParticipantNames, secureRandomIndex } from "./selector.js";

const elements = {
  form: document.querySelector("#participants-form"),
  input: document.querySelector("#participants-input"),
  formMessage: document.querySelector("#form-message"),
  participantsList: document.querySelector("#participants-list"),
  participantCount: document.querySelector("#participant-count"),
  sampleButton: document.querySelector("#sample-button"),
  drawButton: document.querySelector("#draw-button"),
  resetButton: document.querySelector("#reset-button"),
  selectedName: document.querySelector("#selected-name"),
  selectionCount: document.querySelector("#selection-count"),
  drawMessage: document.querySelector("#draw-message"),
  historyList: document.querySelector("#history-list"),
  historyCount: document.querySelector("#history-count"),
};

let participants = [];
let remainingIndexes = [];
let selectionHistory = [];

function showMessage(element, message, type) {
  element.textContent = message;
  element.className = "message" + (type ? " message-" + type : "");
}

function renderParticipants() {
  elements.participantsList.replaceChildren();
  elements.participantCount.textContent = String(participants.length);

  if (participants.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "ዝርዝሩን ከላይ ያስገቡ።";
    elements.participantsList.append(empty);
    return;
  }

  participants.forEach((name, index) => {
    const item = document.createElement("li");
    item.className = "participant-item";

    const label = document.createElement("span");
    label.className = "participant-name";
    label.textContent = name;

    const state = document.createElement("span");
    const selected = selectionHistory.includes(index);
    state.className = selected ? "state-pill state-selected" : "state-pill";
    state.textContent = selected ? "ተመርጧል" : "ይጠብቃል";

    item.append(label, state);
    elements.participantsList.append(item);
  });
}

function renderHistory() {
  elements.historyList.replaceChildren();
  elements.historyCount.textContent = String(selectionHistory.length);

  if (selectionHistory.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty-state";
    empty.textContent = "ምርጫው ሲጀምር ውጤቱ እዚህ ይታያል።";
    elements.historyList.append(empty);
    return;
  }

  selectionHistory.forEach((participantIndex, order) => {
    const item = document.createElement("li");
    item.className = "history-item";

    const orderLabel = document.createElement("span");
    orderLabel.className = "history-order";
    orderLabel.textContent = String(order + 1);

    const name = document.createElement("span");
    name.className = "participant-name";
    name.textContent = participants[participantIndex];

    item.append(orderLabel, name);
    elements.historyList.append(item);
  });
}

function updateControls() {
  const hasParticipants = participants.length > 0;
  elements.drawButton.disabled = !hasParticipants || remainingIndexes.length === 0;
  elements.resetButton.disabled = !hasParticipants || selectionHistory.length === 0;
}

function startNewList(rawInput) {
  const names = parseParticipantNames(rawInput);
  participants = names;
  remainingIndexes = names.map((_, index) => index);
  selectionHistory = [];

  elements.selectedName.textContent = "ምርጫውን ይጀምሩ";
  elements.selectionCount.textContent = "ገና ምርጫ አልተደረገም";
  showMessage(elements.drawMessage, "ዝርዝሩ ተዘጋጅቷል። ቀጣዩን ተሳታፊ መምረጥ ይችላሉ።");
  showMessage(elements.formMessage, names.length + " ተሳታፊዎች ተዘጋጅተዋል።", "success");
  renderParticipants();
  renderHistory();
  updateControls();
}

elements.form.addEventListener("submit", (event) => {
  event.preventDefault();

  try {
    startNewList(elements.input.value);
  } catch (error) {
    showMessage(elements.formMessage, error.message || "ዝርዝሩን ማዘጋጀት አልተቻለም።", "error");
  }
});

elements.sampleButton.addEventListener("click", () => {
  elements.input.value = ["ተሳታፊ 1", "ተሳታፊ 2", "ተሳታፊ 3", "ተሳታፊ 4", "ተሳታፊ 5"].join("\n");
  elements.input.focus();
});

elements.drawButton.addEventListener("click", () => {
  if (remainingIndexes.length === 0) {
    showMessage(elements.drawMessage, "ሁሉም ተሳታፊዎች ተመርጠዋል። ቅደም ተከተሉን ዳግም ይጀምሩ።", "error");
    updateControls();
    return;
  }

  try {
    const position = secureRandomIndex(remainingIndexes.length);
    const chosen = remainingIndexes.splice(position, 1)[0];
    selectionHistory.push(chosen);

    elements.selectedName.textContent = participants[chosen];
    elements.selectionCount.textContent = "ተራ " + selectionHistory.length + " / " + participants.length;
    showMessage(
      elements.drawMessage,
      remainingIndexes.length === 0
        ? "ሁሉም ተሳታፊዎች ተመርጠዋል።"
        : "ቀጣይ ምርጫ ዝግጁ ነው፤ " + remainingIndexes.length + " ተሳታፊዎች ይቀራሉ።",
      "success",
    );

    renderParticipants();
    renderHistory();
    updateControls();
  } catch (error) {
    showMessage(elements.drawMessage, error.message || "ምርጫ ማድረግ አልተቻለም።", "error");
  }
});

elements.resetButton.addEventListener("click", () => {
  remainingIndexes = participants.map((_, index) => index);
  selectionHistory = [];
  elements.selectedName.textContent = "ምርጫውን ይጀምሩ";
  elements.selectionCount.textContent = "ገና ምርጫ አልተደረገም";
  showMessage(elements.drawMessage, "የምርጫ ቅደም ተከተሉ ዳግም ተጀምሯል።");
  renderParticipants();
  renderHistory();
  updateControls();
});

renderParticipants();
renderHistory();
updateControls();
