export function hasAnswerBranching(question) {
  return (question?.options || []).some((option) => option?.nextQuestionId);
}

function compactAnswerText(value, maxLength = 20) {
  const text = String(value || "Ответ").trim() || "Ответ";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

export function buildQuestionTransitions(question) {
  const transitions = [];
  if (question?.defaultNextQuestionId) {
    transitions.push({
      kind: "default",
      sourceQuestionId: question.id,
      targetId: question.defaultNextQuestionId,
      label: "По умолчанию",
    });
  }
  for (const option of question?.options || []) {
    if (!option?.nextQuestionId) continue;
    transitions.push({
      kind: "option",
      sourceQuestionId: question.id,
      optionId: option.id,
      targetId: option.nextQuestionId,
      label: `Если: ${compactAnswerText(option.text)}`,
      answerText: String(option.text || "Ответ"),
    });
  }
  return transitions;
}

export function setAnswerBranch(question, optionId, targetId) {
  return {
    ...question,
    options: (question?.options || []).map((option) =>
      option.id === optionId
        ? { ...option, nextQuestionId: targetId || null }
        : option,
    ),
  };
}

export function collapseRedundantAnswerBranches(question) {
  const options = question?.options || [];
  const routes = options.map((option) => option?.nextQuestionId).filter(Boolean);
  const uniqueRoutes = new Set(routes);
  const sharedRoute = routes[0] || null;
  const allAnswersUseSharedRoute =
    options.length > 0 && routes.length === options.length && uniqueRoutes.size === 1;
  const commonRouteMatches =
    !question?.defaultNextQuestionId || question.defaultNextQuestionId === sharedRoute;
  if (!allAnswersUseSharedRoute || !commonRouteMatches) return question;
  return {
    ...question,
    defaultNextQuestionId: question.defaultNextQuestionId || sharedRoute,
    options: options.map((option) => ({ ...option, nextQuestionId: null })),
  };
}
