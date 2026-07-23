export function hasAnswerBranching(question) {
  return (question?.options || []).some((option) => option?.nextQuestionId);
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

export function enableAnswerBranching(question) {
  const fallback = question?.defaultNextQuestionId || null;
  return {
    ...question,
    options: (question?.options || []).map((option) => ({
      ...option,
      nextQuestionId: option.nextQuestionId || fallback,
    })),
  };
}

export function disableAnswerBranching(question) {
  const firstBranch = (question?.options || []).find(
    (option) => option?.nextQuestionId,
  )?.nextQuestionId;
  return {
    ...question,
    defaultNextQuestionId:
      question?.defaultNextQuestionId || firstBranch || null,
    options: (question?.options || []).map((option) => ({
      ...option,
      nextQuestionId: null,
    })),
  };
}
