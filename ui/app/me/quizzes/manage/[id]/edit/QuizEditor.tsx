/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import styles from "./editor.module.css";
import answerStyles from "./answer-options.module.css";

const TYPES = [
  { key: "single_choice", label: "Один ответ", icon: "●" },
  { key: "multiple_choice", label: "Несколько ответов", icon: "☑" },
  { key: "yes_no", label: "Да или нет", icon: "↔" },
  { key: "text", label: "Свободный ответ", icon: "T" },
  { key: "number", label: "Числовой ответ", icon: "#" },
  { key: "scale", label: "Оценка по шкале", icon: "—" },
  { key: "sorting", label: "Расставить по порядку", icon: "↕" },
  { key: "matching", label: "Составить пары", icon: "≈" },
  { key: "information", label: "Экран с текстом", icon: "i" },
];
const optionTypes = new Set(["single_choice", "multiple_choice", "yes_no"]);
const typeLabel = (value: string) =>
  TYPES.find((type) => type.key === value)?.label || value;
const makeId = () => crypto.randomUUID();
const NODE_WIDTH = 280;
const NODE_HEIGHT = 90;

async function uploadQuizImage(file: File) {
  const descriptorResponse = await fetch("/api/quizzes/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contentType: file.type, size: file.size }),
  });
  const descriptor = await descriptorResponse.json();
  if (!descriptorResponse.ok) {
    throw new Error(descriptor.error || "image_upload_failed");
  }

  const uploadForm = new FormData();
  Object.entries(descriptor.uploadFields || {}).forEach(([key, value]) => {
    uploadForm.append(key, String(value));
  });
  uploadForm.append("file", file);
  const uploadResponse = await fetch(descriptor.uploadUrl, {
    method: "POST",
    body: uploadForm,
  });
  if (!uploadResponse.ok) throw new Error("image_upload_failed");
  return descriptor.url as string;
}

type Point = { x: number; y: number };
type GraphNode = {
  id: string;
  kind: "start" | "question" | "result" | "placeholder";
  point: Point;
  data?: any;
  route?: LinkRoute;
};
type LinkRoute = {
  kind: "start" | "option" | "default" | "complete";
  sourceId?: string;
  optionId?: string;
  previousTarget?: string;
};
type GraphEdge = { id: string; from: string; to: string };

function defaultPosition(
  kind: GraphNode["kind"],
  index: number,
  questionCount: number,
  resultCount: number,
): Point {
  if (kind === "start") return { x: 410, y: 34 };
  if (kind === "question") return { x: 330, y: 150 + index * 130 };
  const gap = Math.min(330, 760 / Math.max(1, resultCount));
  const rowWidth = (resultCount - 1) * gap;
  return {
    x: 470 - rowWidth / 2 + index * gap - NODE_WIDTH / 2,
    y: 180 + questionCount * 130,
  };
}

function buildGraph(version: any) {
  const questions = version?.questions || [];
  const results = version?.results || [];
  const layout = version?.layout?.nodes || {};
  const nodes: GraphNode[] = [
    {
      id: "start",
      kind: "start",
      point:
        layout.start ||
        defaultPosition("start", 0, questions.length, results.length),
    },
    ...questions.map((data: any, index: number) => ({
      id: data.id,
      kind: "question" as const,
      data,
      point:
        layout[data.id] ||
        defaultPosition("question", index, questions.length, results.length),
    })),
    ...results.map((data: any, index: number) => ({
      id: `result:${data.id}`,
      kind: "result" as const,
      data,
      point:
        layout[`result:${data.id}`] ||
        defaultPosition("result", index, questions.length, results.length),
    })),
  ];
  const questionIds = new Set(questions.map((question: any) => question.id));
  const resultIds = new Set(
    results.map((result: any) => `result:${result.id}`),
  );
  const edges: GraphEdge[] = [];
  const addEdge = (from: string, to: string) => {
    if (!to) return;
    edges.push({ id: `${from}:${to}:${edges.length}`, from, to });
  };
  const startId = version?.startQuestionId || questions[0]?.id;
  const addPlaceholder = (
    fromId: string,
    route: LinkRoute,
    index = 0,
    count = 1,
  ) => {
    const from = nodes.find((node) => node.id === fromId);
    if (!from) return;
    const fromWidth = from.kind === "start" ? 120 : NODE_WIDTH;
    const fromHeight = from.kind === "start" ? 48 : NODE_HEIGHT;
    const id = `placeholder:${fromId}:${route.optionId || route.kind}`;
    nodes.push({
      id,
      kind: "placeholder",
      route,
      point: {
        x: Math.max(
          10,
          from.point.x +
            fromWidth / 2 -
            NODE_WIDTH / 2 +
            (index - (count - 1) / 2) * (NODE_WIDTH + 36),
        ),
        y: from.point.y + fromHeight + 116,
      },
    });
    addEdge(fromId, id);
  };
  if (startId) addEdge("start", startId);
  else addPlaceholder("start", { kind: "start" });
  questions.forEach((question: any) => {
    const options = question.options || [];
    let hasComplete = false;
    let directOptionCount = 0;
    options.forEach((option: any, index: number) => {
      const target = option.nextQuestionId;
      if (target === "complete") {
        hasComplete = true;
        return;
      }
      if (questionIds.has(target) || resultIds.has(target)) {
        directOptionCount += 1;
        addEdge(question.id, target);
        return;
      }
      addPlaceholder(
        question.id,
        { kind: "option", sourceId: question.id, optionId: option.id },
        index,
        options.length,
      );
    });
    const fallback = question.defaultNextQuestionId;
    if (!options.length) {
      if (fallback === "complete") hasComplete = true;
      else if (
        fallback &&
        (questionIds.has(fallback) || resultIds.has(fallback))
      )
        addEdge(question.id, fallback);
      else
        addPlaceholder(question.id, { kind: "default", sourceId: question.id });
    } else if (!directOptionCount && !hasComplete && fallback) {
      if (fallback === "complete") hasComplete = true;
      else if (questionIds.has(fallback) || resultIds.has(fallback))
        addEdge(question.id, fallback);
    }
    if (hasComplete)
      results.forEach((result: any) =>
        addEdge(question.id, `result:${result.id}`),
      );
  });
  const sourcesWithEmptyOutputs = [
    ...new Set(
      nodes
        .filter((node) => node.kind === "placeholder")
        .map((node) => edgeSource(edges, node.id))
        .filter(Boolean),
    ),
  ] as string[];
  sourcesWithEmptyOutputs.sort(
    (left, right) =>
      (nodes.find((node) => node.id === left)?.point.y || 0) -
      (nodes.find((node) => node.id === right)?.point.y || 0),
  );
  sourcesWithEmptyOutputs.forEach((sourceId) => {
    const source = nodes.find((node) => node.id === sourceId);
    if (!source) return;
    const childIds = [
      ...new Set(
        edges.filter((edge) => edge.from === sourceId).map((edge) => edge.to),
      ),
    ];
    const children = childIds
      .map((id) => nodes.find((node) => node.id === id))
      .filter(Boolean) as GraphNode[];
    const rowWidth =
      children.length * NODE_WIDTH + Math.max(0, children.length - 1) * 36;
    const rowX = Math.max(
      16,
      source.point.x +
        (source.kind === "start" ? 60 : NODE_WIDTH / 2) -
        rowWidth / 2,
    );
    const rowY =
      source.point.y + (source.kind === "start" ? 48 : NODE_HEIGHT) + 116;
    children.forEach((child, index) => {
      child.point = { x: rowX + index * (NODE_WIDTH + 36), y: rowY };
    });
  });
  const connectedTargets = new Set(edges.map((edge) => edge.to));
  const orphanResults = nodes.filter(
    (node) => node.kind === "result" && !connectedTargets.has(node.id),
  );
  if (orphanResults.length) {
    const connectedBottom = Math.max(
      ...nodes
        .filter((node) => !orphanResults.includes(node))
        .map(
          (node) => node.point.y + (node.kind === "start" ? 48 : NODE_HEIGHT),
        ),
    );
    const rowWidth =
      orphanResults.length * NODE_WIDTH +
      Math.max(0, orphanResults.length - 1) * 36;
    const rowX = Math.max(16, 550 - rowWidth / 2);
    orphanResults.forEach((node, index) => {
      node.point = {
        x: rowX + index * (NODE_WIDTH + 36),
        y: connectedBottom + 116,
      };
    });
  }
  const height = Math.max(
    520,
    ...nodes.map(
      (node) => node.point.y + (node.kind === "start" ? 60 : NODE_HEIGHT) + 90,
    ),
  );
  return { nodes, edges, height };
}

function edgeSource(edges: GraphEdge[], targetId: string) {
  return edges.find((edge) => edge.to === targetId)?.from || null;
}

function connectRoute(version: any, route: LinkRoute | null, targetId: string) {
  if (!route) return version;
  if (route.kind === "start") return { ...version, startQuestionId: targetId };
  return {
    ...version,
    questions: version.questions.map((question: any) => {
      if (question.id !== route.sourceId) return question;
      if (route.kind === "option") {
        return {
          ...question,
          options: (question.options || []).map((option: any) =>
            option.id === route.optionId
              ? { ...option, nextQuestionId: targetId }
              : option,
          ),
        };
      }
      if (route.kind === "default")
        return { ...question, defaultNextQuestionId: targetId };
      return {
        ...question,
        defaultNextQuestionId:
          question.defaultNextQuestionId === "complete"
            ? targetId
            : question.defaultNextQuestionId,
        options: (question.options || []).map((option: any) =>
          option.nextQuestionId === "complete"
            ? { ...option, nextQuestionId: targetId }
            : option,
        ),
      };
    }),
  };
}

export default function QuizEditor() {
  const { id: quizId } = useParams<{ id: string }>();
  const router = useRouter();
  const [quiz, setQuiz] = useState<any>();
  const [selected, setSelected] = useState<string | null>(null);
  const [panel, setPanel] = useState<"add" | "settings" | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pendingLink, setPendingLink] = useState<
    (LinkRoute & { position: Point }) | null
  >(null);
  const drag = useRef<{
    id: string;
    pointerId: number;
    startX: number;
    startY: number;
    origin: Point;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    fetch(`/api/quizzes/${quizId}?manage=1`)
      .then(async (response) => {
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error);
        const loaded = payload.quiz;
        loaded.version = loaded.version?.definition || {
          startQuestionId: null,
          questions: [],
          results: [],
        };
        setQuiz(loaded);
      })
      .catch((reason) => setError(reason.message));
  }, [quizId]);

  useEffect(() => {
    function moveNode(event: PointerEvent) {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      const dx = event.clientX - current.startX;
      const dy = event.clientY - current.startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) current.moved = true;
      if (!current.moved) return;
      const point = {
        x: Math.max(8, Math.min(700, current.origin.x + dx)),
        y: Math.max(8, current.origin.y + dy),
      };
      setQuiz((value: any) => ({
        ...value,
        version: {
          ...value.version,
          layout: {
            ...(value.version.layout || {}),
            nodes: {
              ...(value.version.layout?.nodes || {}),
              [current.id]: point,
            },
          },
        },
      }));
    }
    function finishMove(event: PointerEvent) {
      const current = drag.current;
      if (!current || current.pointerId !== event.pointerId) return;
      if (!current.moved && current.id !== "start") {
        setSelected((value) => (value === current.id ? null : current.id));
        setPanel(null);
      }
      drag.current = null;
    }
    window.addEventListener("pointermove", moveNode);
    window.addEventListener("pointerup", finishMove);
    window.addEventListener("pointercancel", finishMove);
    return () => {
      window.removeEventListener("pointermove", moveNode);
      window.removeEventListener("pointerup", finishMove);
      window.removeEventListener("pointercancel", finishMove);
    };
  }, []);

  const graph = useMemo(() => buildGraph(quiz?.version), [quiz]);
  const nodeMap = useMemo(
    () => new Map(graph.nodes.map((node) => [node.id, node])),
    [graph.nodes],
  );
  const question = quiz?.version?.questions?.find(
    (item: any) => item.id === selected,
  );
  const result = selected?.startsWith("result:")
    ? quiz?.version?.results?.find(
        (item: any) => `result:${item.id}` === selected,
      )
    : null;
  const targets = useMemo(
    () => [
      ...(quiz?.version?.questions || []).map((item: any) => ({
        id: item.id,
        label: item.title,
      })),
      ...(quiz?.version?.results || []).map((item: any) => ({
        id: `result:${item.id}`,
        label: `Финал: ${item.title}`,
      })),
      { id: "complete", label: "Финал по условиям" },
    ],
    [quiz],
  );

  function patchQuiz(patch: any) {
    setQuiz((current: any) => ({ ...current, ...patch }));
  }
  function patchQuestion(patch: any) {
    setQuiz((current: any) => ({
      ...current,
      version: {
        ...current.version,
        questions: current.version.questions.map((item: any) =>
          item.id === selected ? { ...item, ...patch } : item,
        ),
      },
    }));
  }
  function patchResult(patch: any) {
    setQuiz((current: any) => ({
      ...current,
      version: {
        ...current.version,
        results: current.version.results.map((item: any) =>
          `result:${item.id}` === selected ? { ...item, ...patch } : item,
        ),
      },
    }));
  }
  function patchOption(optionId: string, patch: any) {
    patchQuestion({
      options: (question.options || []).map((item: any) =>
        item.id === optionId ? { ...item, ...patch } : item,
      ),
    });
  }
  function pointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
    node: GraphNode,
  ) {
    if (event.button !== 0) return;
    event.preventDefault();
    drag.current = {
      id: node.id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: node.point,
      moved: false,
    };
  }
  function addQuestion(type: string) {
    const questionId = makeId();
    const stableNodes = Object.fromEntries(
      graph.nodes
        .filter((node) => node.kind !== "placeholder" && node.kind !== "start")
        .map((node) => [node.id, node.point]),
    );
    const withOptions = optionTypes.has(type);
    const created = {
      id: questionId,
      type,
      title: type === "information" ? "Новый экран" : "Новый вопрос",
      description: "",
      score: 1,
      isRequired: true,
      defaultNextQuestionId: pendingLink?.previousTarget || null,
      media: [],
      options: withOptions
        ? [
            {
              id: makeId(),
              text: type === "yes_no" ? "Да" : "Вариант 1",
              score: 1,
              isCorrect: true,
              nextQuestionId: null,
            },
            {
              id: makeId(),
              text: type === "yes_no" ? "Нет" : "Вариант 2",
              score: 0,
              isCorrect: false,
              nextQuestionId: null,
            },
          ]
        : [],
    };
    setQuiz((current: any) => {
      let version = {
        ...current.version,
        startQuestionId: current.version.startQuestionId || questionId,
        questions: [...current.version.questions, created],
      };
      version = connectRoute(version, pendingLink, questionId);
      if (pendingLink)
        version = {
          ...version,
          layout: {
            ...(version.layout || {}),
            nodes: {
              ...(version.layout?.nodes || {}),
              ...stableNodes,
              [questionId]: pendingLink.position,
            },
          },
        };
      return { ...current, version };
    });
    setSelected(questionId);
    setPendingLink(null);
    setPanel(null);
  }
  function addResult() {
    const resultId = makeId();
    const stableNodes = Object.fromEntries(
      graph.nodes
        .filter((node) => node.kind !== "placeholder" && node.kind !== "start")
        .map((node) => [node.id, node.point]),
    );
    setQuiz((current: any) => {
      let version = {
        ...current.version,
        results: [
          ...current.version.results,
          {
            id: resultId,
            title: "Новый финал",
            description: "",
            priority: 0,
            isDefault: current.version.results.length === 0,
          },
        ],
      };
      version = connectRoute(version, pendingLink, `result:${resultId}`);
      if (pendingLink)
        version = {
          ...version,
          layout: {
            ...(version.layout || {}),
            nodes: {
              ...(version.layout?.nodes || {}),
              ...stableNodes,
              [`result:${resultId}`]: pendingLink.position,
            },
          },
        };
      return { ...current, version };
    });
    setSelected(`result:${resultId}`);
    setPendingLink(null);
    setPanel(null);
  }
  function removeSelected() {
    setQuiz((current: any) => {
      if (selected?.startsWith("result:"))
        return {
          ...current,
          version: {
            ...current.version,
            results: current.version.results.filter(
              (item: any) => `result:${item.id}` !== selected,
            ),
            questions: current.version.questions.map((question: any) => ({
              ...question,
              defaultNextQuestionId:
                question.defaultNextQuestionId === selected
                  ? null
                  : question.defaultNextQuestionId,
              options: (question.options || []).map((option: any) => ({
                ...option,
                nextQuestionId:
                  option.nextQuestionId === selected
                    ? null
                    : option.nextQuestionId,
              })),
            })),
          },
        };
      const questions = current.version.questions.filter(
        (item: any) => item.id !== selected,
      );
      return {
        ...current,
        version: {
          ...current.version,
          questions: questions.map((question: any) => ({
            ...question,
            defaultNextQuestionId:
              question.defaultNextQuestionId === selected
                ? null
                : question.defaultNextQuestionId,
            options: (question.options || []).map((option: any) => ({
              ...option,
              nextQuestionId:
                option.nextQuestionId === selected
                  ? null
                  : option.nextQuestionId,
            })),
          })),
          startQuestionId:
            current.version.startQuestionId === selected
              ? null
              : current.version.startQuestionId,
        },
      };
    });
    setSelected(null);
  }
  async function request(path: string, method = "POST", body?: any) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json();
      if (!response.ok)
        throw Object.assign(new Error(payload.error), {
          details: payload.details,
        });
      return payload;
    } catch (reason: any) {
      setError(
        reason.details?.errors?.map((item: any) => item.message).join(" · ") ||
          reason.message,
      );
      throw reason;
    } finally {
      setBusy(false);
    }
  }
  async function save(showMessage = true) {
    const payload = await request(`/api/quizzes/${quizId}`, "PATCH", {
      ...quiz,
      version: quiz.version,
    });
    if (payload?.quiz) {
      const next = payload.quiz;
      next.version = next.version.definition;
      setQuiz(next);
    }
    if (showMessage) setMessage("Изменения сохранены");
  }
  async function publish() {
    try {
      await save(false);
      await request(`/api/quizzes/${quizId}/publish`);
      setMessage("Квиз опубликован");
      router.refresh();
    } catch {
      /* rendered */
    }
  }

  if (!quiz)
    return <main className={styles.shell}>{error || "Загрузка…"}</main>;
  return (
    <main className={styles.shell}>
      <header className={styles.topbar}>
        <div>
          <div className={styles.crumbs}>
            <span>Квизы</span>
            <span>›</span>
            <span className={styles.status}>
              {quiz.status === "published" ? "Опубликован" : "Черновик"}
            </span>
          </div>
          <h1 className={styles.title}>{quiz.title}</h1>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.secondary}
            disabled={busy}
            onClick={() => save()}
          >
            Сохранить
          </button>
          <button className={styles.primary} disabled={busy} onClick={publish}>
            Опубликовать
          </button>
        </div>
      </header>
      {message && <div className={styles.toast}>{message}</div>}
      {error && (
        <div className={`${styles.toast} ${styles.error}`}>{error}</div>
      )}
      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${styles.tabActive}`}
            onClick={() => setPanel(null)}
          >
            Сценарий
          </button>
          <button
            className={styles.tab}
            onClick={() => setPanel(panel === "settings" ? null : "settings")}
          >
            Параметры
          </button>
        </div>
        <span className={styles.toolbarHint}>
          Пустой блок означает незаполненный выход
        </span>
      </div>
      {panel === "settings" && (
        <Modal close={() => setPanel(null)}>
          <SettingsPanel
            quiz={quiz}
            patchQuiz={patchQuiz}
            close={() => setPanel(null)}
          />
        </Modal>
      )}
      {panel === "add" && (
        <Modal
          close={() => {
            setPanel(null);
            setPendingLink(null);
          }}
        >
          <AddPanel
            addQuestion={addQuestion}
            addResult={addResult}
            close={() => {
              setPanel(null);
              setPendingLink(null);
            }}
          />
        </Modal>
      )}

      <section className={styles.canvas} style={{ height: graph.height }}>
        <svg
          className={styles.edges}
          width="100%"
          height={graph.height}
          aria-hidden="true"
        >
          <defs>
            <marker
              id="flowArrow"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <path d="M0 0 L7 3.5 L0 7Z" fill="#4d91bd" />
            </marker>
          </defs>
          {graph.edges.map((edge) => {
            const from = nodeMap.get(edge.from);
            const to = nodeMap.get(edge.to);
            if (!from || !to) return null;
            const fromWidth = from.kind === "start" ? 120 : NODE_WIDTH;
            const fromHeight = from.kind === "start" ? 48 : NODE_HEIGHT;
            const siblings = graph.edges.filter(
              (item) => item.from === edge.from,
            );
            const siblingIndex = siblings.findIndex(
              (item) => item.id === edge.id,
            );
            const x1 =
                from.point.x +
                fromWidth / 2 +
                (siblingIndex - (siblings.length - 1) / 2) * 64,
              y1 = from.point.y + fromHeight;
            const toWidth = to.kind === "start" ? 120 : NODE_WIDTH;
            const x2 = to.point.x + toWidth / 2,
              y2 = to.point.y;
            const middle = y1 + (y2 - y1) / 2;
            const path = `M${x1},${y1} C${x1},${middle} ${x2},${middle} ${x2},${y2}`;
            return (
              <path
                key={edge.id}
                className={styles.edge}
                markerEnd="url(#flowArrow)"
                d={path}
              />
            );
          })}
        </svg>
        {graph.nodes.map((node) =>
          node.kind === "placeholder" ? (
            <button
              key={node.id}
              className={styles.placeholderNode}
              style={{ left: node.point.x, top: node.point.y }}
              onClick={() => {
                setPendingLink({ ...node.route!, position: node.point });
                setPanel("add");
              }}
            >
              <span>＋</span>
              <strong>Добавить шаг</strong>
            </button>
          ) : (
            <button
              key={node.id}
              className={`${styles.canvasNode} ${node.kind === "start" ? styles.startNode : ""} ${node.kind === "result" ? styles.resultNode : ""} ${selected === node.id ? styles.nodeSelected : ""}`}
              style={{ left: node.point.x, top: node.point.y }}
              onPointerDown={(event) => pointerDown(event, node)}
            >
              {node.kind === "start" ? (
                <span>▶ Старт</span>
              ) : (
                <>
                  <span className={styles.nodeTop}>
                    <span className={styles.nodeType}>
                      {node.kind === "result"
                        ? "Финал"
                        : typeLabel(node.data.type)}
                    </span>
                    <span className={styles.drag}>⠿</span>
                  </span>
                  <span className={styles.nodeTitle}>{node.data.title}</span>
                  <span className={styles.nodeMeta}>
                    {node.kind === "result"
                      ? node.data.isDefault
                        ? "По умолчанию"
                        : "По условию"
                      : `${node.data.options?.length || 0} ответа`}
                  </span>
                </>
              )}
            </button>
          ),
        )}
      </section>
      <p className={styles.hint}>
        Перетаскивайте ноды за карточку — связи перемещаются вместе с ними.
      </p>
      {question && (
        <Modal close={() => setSelected(null)}>
          <QuestionEditor
            question={question}
            targets={targets.filter((target) => target.id !== question.id)}
            patchQuestion={patchQuestion}
            patchOption={patchOption}
            removeSelected={removeSelected}
            close={() => setSelected(null)}
          />
        </Modal>
      )}
      {result && (
        <Modal close={() => setSelected(null)}>
          <ResultEditor
            result={result}
            patchResult={patchResult}
            setQuiz={setQuiz}
            removeSelected={removeSelected}
            close={() => setSelected(null)}
          />
        </Modal>
      )}
    </main>
  );
}

function Modal({
  children,
  close,
}: {
  children: React.ReactNode;
  close: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);
  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className={styles.modalDialog}>{children}</div>
    </div>
  );
}

function SettingsPanel({ quiz, patchQuiz, close }: any) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Параметры квиза</h2>
        <button className={styles.close} onClick={close}>
          ×
        </button>
      </div>
      <div className={styles.settingsGrid}>
        <label className={styles.field}>
          Название
          <input
            className={styles.input}
            value={quiz.title}
            onChange={(event) => patchQuiz({ title: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          Попытки
          <select
            className={styles.select}
            value={quiz.attemptLimitType}
            onChange={(event) =>
              patchQuiz({ attemptLimitType: event.target.value })
            }
          >
            <option value="unlimited">Без ограничений</option>
            <option value="one">Одна</option>
            <option value="fixed">Задать количество</option>
            <option value="daily">Раз в сутки</option>
          </select>
        </label>
        {quiz.attemptLimitType === "fixed" && (
          <label className={styles.field}>
            Количество
            <input
              className={styles.input}
              type="number"
              min="1"
              value={quiz.attemptLimit || 1}
              onChange={(event) =>
                patchQuiz({ attemptLimit: Number(event.target.value) })
              }
            />
          </label>
        )}
      </div>
    </section>
  );
}
function AddPanel({ addQuestion, addResult, close }: any) {
  return (
    <section className={styles.panel}>
      <div className={styles.panelHead}>
        <h2>Что добавить</h2>
        <button className={styles.close} onClick={close}>
          ×
        </button>
      </div>
      <div className={styles.types}>
        {TYPES.filter(
          (type) =>
            !["yes_no", "number", "scale", "sorting", "matching"].includes(
              type.key,
            ),
        ).map((type) => (
          <button
            className={styles.typeButton}
            key={type.key}
            onClick={() => addQuestion(type.key)}
          >
            <span className={styles.typeIcon}>{type.icon}</span>
            {type.label}
          </button>
        ))}
        <button className={styles.typeButton} onClick={addResult}>
          <span className={styles.typeIcon}>★</span>Финальный результат
        </button>
      </div>
    </section>
  );
}
function QuestionEditor({
  question,
  targets,
  patchQuestion,
  patchOption,
  removeSelected,
  close,
}: any) {
  const [uploading, setUploading] = useState(false);
  async function upload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadQuizImage(file);
      patchQuestion({ media: [{ type: "image", url, alt: question.title }] });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }
  return (
    <section className={styles.editor}>
      <div className={styles.editorHead}>
        <div>
          <span className={styles.nodeType}>{typeLabel(question.type)}</span>
          <h2>{question.title}</h2>
        </div>
        <button className={styles.close} onClick={close}>
          ×
        </button>
      </div>
      <div className={styles.form}>
        <label className={styles.field}>
          Заголовок
          <input
            className={styles.input}
            value={question.title}
            onChange={(event) => patchQuestion({ title: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          Текст
          <textarea
            className={styles.textarea}
            value={question.description || ""}
            onChange={(event) =>
              patchQuestion({ description: event.target.value })
            }
          />
        </label>
        {question.media?.[0]?.url ? (
          <div className={styles.media}>
            <Image
              src={question.media[0].url}
              alt=""
              width={1200}
              height={800}
              unoptimized
            />
            <button
              className={styles.deleteButton}
              onClick={() => patchQuestion({ media: [] })}
            >
              Удалить изображение
            </button>
          </div>
        ) : (
          <label className={styles.mediaButton}>
            {uploading ? "Загрузка…" : "＋ Загрузить изображение"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              hidden
              disabled={uploading}
              onChange={upload}
            />
          </label>
        )}
        {optionTypes.has(question.type) && (
          <>
            <div className={styles.sectionHead}>
              <span>Ответы</span>
              <span>{question.options?.length || 0}</span>
            </div>
            <div className={styles.optionList}>
              {(question.options || []).map((option: any) => (
                <AnswerOption
                  key={option.id}
                  option={option}
                  questionId={question.id}
                  questionType={question.type}
                  targets={targets}
                  patchOption={patchOption}
                  markCorrect={() =>
                    question.type === "multiple_choice"
                      ? patchOption(option.id, { isCorrect: !option.isCorrect })
                      : patchQuestion({
                          options: question.options.map((item: any) => ({
                            ...item,
                            isCorrect: item.id === option.id,
                          })),
                        })
                  }
                  remove={() =>
                    patchQuestion({
                      options: question.options.filter(
                        (item: any) => item.id !== option.id,
                      ),
                    })
                  }
                />
              ))}
            </div>
            <button
              className={styles.addButton}
              onClick={() =>
                patchQuestion({
                  options: [
                    ...(question.options || []),
                    {
                      id: makeId(),
                      text: "Новый ответ",
                      score: 0,
                      isCorrect: false,
                      nextQuestionId: "complete",
                    },
                  ],
                })
              }
            >
              ＋ Добавить ответ
            </button>
          </>
        )}
        <label className={styles.field}>
          Переход по умолчанию
          <select
            className={styles.select}
            value={question.defaultNextQuestionId || ""}
            onChange={(event) =>
              patchQuestion({
                defaultNextQuestionId: event.target.value || null,
              })
            }
          >
            <option value="">Остановиться</option>
            {targets.map((target: any) => (
              <option value={target.id} key={target.id}>
                {target.label}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.deleteZone}>
          <button className={styles.deleteButton} onClick={removeSelected}>
            Удалить вопрос
          </button>
        </div>
      </div>
    </section>
  );
}

function AnswerOption({
  option,
  questionId,
  questionType,
  targets,
  patchOption,
  markCorrect,
  remove,
}: any) {
  const isCorrect = !!option.isCorrect;
  const [uploading, setUploading] = useState(false);
  async function uploadImage(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      patchOption(option.id, { imageUrl: await uploadQuizImage(file) });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }
  return (
    <div
      className={`${answerStyles.card} ${isCorrect ? answerStyles.cardCorrect : ""}`}
    >
      <div className={answerStyles.main}>
        <label
          className={`${answerStyles.correctness} ${isCorrect ? answerStyles.correctnessActive : ""}`}
          title={isCorrect ? "Ответ отмечен верным" : "Отметить ответ верным"}
        >
          <input
            name={`correct-${questionId}`}
            type={questionType === "multiple_choice" ? "checkbox" : "radio"}
            checked={isCorrect}
            onChange={markCorrect}
          />
          <span className={answerStyles.mark}>{isCorrect ? "✓" : ""}</span>
          {isCorrect ? "Верный" : "Отметить"}
        </label>
        <input
          className={answerStyles.answer}
          aria-label="Текст ответа"
          value={option.text || ""}
          onChange={(event) =>
            patchOption(option.id, { text: event.target.value })
          }
        />
        <label className={answerStyles.points} title="Баллы за ответ">
          <input
            aria-label="Баллы за ответ"
            type="number"
            value={option.score ?? 0}
            onChange={(event) =>
              patchOption(option.id, { score: Number(event.target.value) })
            }
          />
          <span>б.</span>
        </label>
        <button
          className={answerStyles.remove}
          type="button"
          aria-label="Удалить ответ"
          title="Удалить ответ"
          onClick={remove}
        >
          −
        </button>
      </div>
      <div className={answerStyles.imageRow}>
        {option.imageUrl && (
          <Image
            className={answerStyles.thumbnail}
            src={option.imageUrl}
            alt=""
            width={160}
            height={120}
            unoptimized
          />
        )}
        <label className={answerStyles.imageButton}>
          {uploading
            ? "Загрузка…"
            : option.imageUrl
              ? "Заменить изображение"
              : "＋ Изображение ответа"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            hidden
            disabled={uploading}
            onChange={uploadImage}
          />
        </label>
        {option.imageUrl && (
          <button
            className={answerStyles.imageRemove}
            type="button"
            onClick={() => patchOption(option.id, { imageUrl: null })}
          >
            Убрать
          </button>
        )}
      </div>
      <label className={answerStyles.destination}>
        <span>Переход</span>
        <select
          aria-label="Следующий шаг"
          value={option.nextQuestionId || ""}
          onChange={(event) =>
            patchOption(option.id, {
              nextQuestionId: event.target.value || null,
            })
          }
        >
          <option value="">Не выбран</option>
          {targets.map((target: any) => (
            <option value={target.id} key={target.id}>
              {target.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

function ResultEditor({
  result,
  patchResult,
  setQuiz,
  removeSelected,
  close,
}: any) {
  return (
    <section className={styles.editor}>
      <div className={styles.editorHead}>
        <h2>Финальный результат</h2>
        <button className={styles.close} onClick={close}>
          ×
        </button>
      </div>
      <div className={styles.form}>
        <label className={styles.field}>
          Название
          <input
            className={styles.input}
            value={result.title}
            onChange={(event) => patchResult({ title: event.target.value })}
          />
        </label>
        <label className={styles.field}>
          Текст
          <textarea
            className={styles.textarea}
            value={result.description || ""}
            onChange={(event) =>
              patchResult({ description: event.target.value })
            }
          />
        </label>
        <label className={styles.field}>
          Показывать
          <select
            className={styles.select}
            value={result.isDefault ? "default" : "condition"}
            onChange={(event) => {
              const makeDefault = event.target.value === "default";
              setQuiz((current: any) => ({
                ...current,
                version: {
                  ...current.version,
                  results: current.version.results.map((item: any) => ({
                    ...item,
                    isDefault: makeDefault
                      ? item.id === result.id
                      : item.id === result.id
                        ? false
                        : item.isDefault,
                  })),
                },
              }));
            }}
          >
            <option value="condition">По условию</option>
            <option value="default">Если другие финалы не подошли</option>
          </select>
        </label>
        <div className={styles.deleteZone}>
          <button className={styles.deleteButton} onClick={removeSelected}>
            Удалить результат
          </button>
        </div>
      </div>
    </section>
  );
}
