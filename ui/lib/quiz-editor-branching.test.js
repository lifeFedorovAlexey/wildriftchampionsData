import test from "node:test";
import assert from "node:assert/strict";

import {
  collapseRedundantAnswerBranches,
  disableAnswerBranching,
  enableAnswerBranching,
  hasAnswerBranching,
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

test("enabling branching seeds answer routes from the common transition", () => {
  const branched = enableAnswerBranching(question);
  assert.equal(hasAnswerBranching(branched), true);
  assert.deepEqual(
    branched.options.map((option) => option.nextQuestionId),
    ["q2", "q2"],
  );
});

test("disabling branching clears answer routes and keeps one common transition", () => {
  const branched = {
    ...question,
    options: [
      { id: "a", nextQuestionId: "q3" },
      { id: "b", nextQuestionId: "result:r1" },
    ],
  };
  const ordinary = disableAnswerBranching(branched);
  assert.equal(ordinary.defaultNextQuestionId, "q2");
  assert.equal(hasAnswerBranching(ordinary), false);
  assert.deepEqual(
    ordinary.options.map((option) => option.nextQuestionId),
    [null, null],
  );
});
