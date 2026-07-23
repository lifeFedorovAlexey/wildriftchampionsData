import test from "node:test";
import assert from "node:assert/strict";

import {
  buildQuestionTransitions,
  collapseRedundantAnswerBranches,
  hasAnswerBranching,
  setAnswerBranch,
} from "./quiz-editor-branching.js";

const question = {
  defaultNextQuestionId: "q2",
  options: [
    { id: "a", nextQuestionId: null },
    { id: "b", nextQuestionId: null },
  ],
};

test("ordinary question uses one common transition", () => {
  assert.equal(hasAnswerBranching(question), false);
});

test("identical legacy answer routes collapse into one common transition", () => {
  const legacy = {
    defaultNextQuestionId: null,
    options: [
      { id: "a", nextQuestionId: "q2" },
      { id: "b", nextQuestionId: "q2" },
    ],
  };
  const normalized = collapseRedundantAnswerBranches(legacy);
  assert.equal(normalized.defaultNextQuestionId, "q2");
  assert.equal(hasAnswerBranching(normalized), false);
});

test("different legacy answer routes remain explicit branches", () => {
  const legacy = {
    defaultNextQuestionId: "q2",
    options: [
      { id: "a", nextQuestionId: "q3" },
      { id: "b", nextQuestionId: "q2" },
    ],
  };
  const normalized = collapseRedundantAnswerBranches(legacy);
  assert.equal(hasAnswerBranching(normalized), true);
});


test("question transitions identify the common path and source answer", () => {
  const transitions = buildQuestionTransitions({
    id: "q1",
    defaultNextQuestionId: "q2",
    options: [
      { id: "a", text: "Обычный ответ", nextQuestionId: null },
      { id: "b", text: "Очень длинный отдельный ответ", nextQuestionId: "q3" },
    ],
  });
  assert.deepEqual(transitions, [
    {
      kind: "default",
      sourceQuestionId: "q1",
      targetId: "q2",
      label: "По умолчанию",
    },
    {
      kind: "option",
      sourceQuestionId: "q1",
      optionId: "b",
      targetId: "q3",
      label: "Если: Очень длинный отдел…",
      answerText: "Очень длинный отдельный ответ",
    },
  ]);
});

test("removing one answer branch preserves the common path and sibling branches", () => {
  const branched = {
    ...question,
    options: [
      { id: "a", nextQuestionId: "q3" },
      { id: "b", nextQuestionId: "result:r1" },
    ],
  };
  const updated = setAnswerBranch(branched, "a", null);
  assert.equal(updated.defaultNextQuestionId, "q2");
  assert.deepEqual(updated.options, [
    { id: "a", nextQuestionId: null },
    { id: "b", nextQuestionId: "result:r1" },
  ]);
});
