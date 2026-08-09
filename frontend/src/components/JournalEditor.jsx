import { useState } from "react";

import { createJournalEntry, updateJournalEntry } from "../api/planner";
import { DECISION_LABEL, shortDate } from "../lib/format";
import "./JournalEditor.css";

/**
 * 일지 작성 폼.
 *
 * 자유서술만 받으면 회고를 만들 수 없다. 그래서 저장 조건을 두 개 건다.
 *   - 근거 태그 1개 이상
 *   - 확신도 1~5
 * 이 두 개가 있어야 ReviewPage 의 태그별 성과 집계와 확신도 대비 결과 비교가 성립한다.
 * 본문(content)은 오히려 선택으로 뒀다 — 길게 못 쓰는 날에도 기록은 남아야 하니까.
 */

const DECISIONS = ["BUY", "SELL", "HOLD", "REBALANCE", "CASH"];
const NEEDS_SYMBOL = new Set(["BUY", "SELL", "HOLD"]);

const emptyDraft = () => ({
  entry_date: new Date().toISOString().slice(0, 10),
  decision_type: "BUY",
  symbol: "",
  title: "",
  content: "",
  expected_outcome: "",
  conviction_level: null,
  tag_ids: [],
  transaction_id: null,
});

export default function JournalEditor({
  entry,
  tags = [],
  linkableTransactions = [],
  onClose,
  onSaved,
}) {
  const [draft, setDraft] = useState(() => ({ ...emptyDraft(), ...(entry || {}) }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const set = (field, value) => setDraft((d) => ({ ...d, [field]: value }));

  const toggleTag = (tagId) =>
    setDraft((d) => ({
      ...d,
      tag_ids: d.tag_ids.includes(tagId)
        ? d.tag_ids.filter((t) => t !== tagId)
        : [...d.tag_ids, tagId],
    }));

  const missing = [];
  if (!draft.title.trim()) missing.push("한 줄 요약");
  if (!draft.tag_ids.length) missing.push("근거 태그");
  if (!draft.conviction_level) missing.push("확신도");
  const canSave = missing.length === 0;

  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const saved = entry?.entry_id
        ? await updateJournalEntry(entry.entry_id, draft)
        : await createJournalEntry(draft);
      onSaved?.(saved || draft);
      onClose?.();
    } catch (e) {
      setError("저장하지 못했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="jed-backdrop" onClick={onClose}>
      <div
        className="jed"
        role="dialog"
        aria-label={entry ? "일지 수정" : "일지 쓰기"}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="jed-head">
          <h2>{entry ? "일지 수정" : "일지 쓰기"}</h2>
          <button className="jed-close" aria-label="닫기" onClick={onClose}>
            ✕
          </button>
        </header>

        <div className="jed-body">
          <div className="jed-row">
            <label className="jed-field">
              <span>날짜</span>
              <input
                type="date"
                value={draft.entry_date}
                onChange={(e) => set("entry_date", e.target.value)}
              />
            </label>

            <label className="jed-field">
              <span>판단</span>
              <select
                value={draft.decision_type}
                onChange={(e) => set("decision_type", e.target.value)}
              >
                {DECISIONS.map((d) => (
                  <option key={d} value={d}>
                    {DECISION_LABEL[d]}
                  </option>
                ))}
              </select>
            </label>

            {NEEDS_SYMBOL.has(draft.decision_type) && (
              <label className="jed-field">
                <span>종목코드</span>
                <input
                  value={draft.symbol}
                  placeholder="005930"
                  onChange={(e) => set("symbol", e.target.value)}
                />
              </label>
            )}
          </div>

          <label className="jed-field">
            <span>
              한 줄 요약 <b className="req">필수</b>
            </span>
            <input
              value={draft.title}
              placeholder="삼성전자 추가 매수"
              onChange={(e) => set("title", e.target.value)}
            />
          </label>

          <fieldset className="jed-field">
            <legend>
              근거 태그 <b className="req">필수</b>
            </legend>
            <p className="jed-hint">
              나중에 태그별로 묶어서 "어떤 근거로 산 게 실제로 맞았는지"를 봅니다.
            </p>
            <div className="jed-tags">
              {tags.map((t) => (
                <button
                  key={t.tag_id}
                  type="button"
                  className={`chip ${draft.tag_ids.includes(t.tag_id) ? "is-on" : ""}`}
                  aria-pressed={draft.tag_ids.includes(t.tag_id)}
                  onClick={() => toggleTag(t.tag_id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset className="jed-field">
            <legend>
              확신도 <b className="req">필수</b>
            </legend>
            <div className="jed-conv" role="radiogroup" aria-label="확신도">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={draft.conviction_level === n}
                  className={`conv-dot ${draft.conviction_level === n ? "is-on" : ""}`}
                  onClick={() => set("conviction_level", n)}
                >
                  {n}
                </button>
              ))}
              <span className="jed-hint inline">1 = 반신반의 · 5 = 확신</span>
            </div>
          </fieldset>

          <label className="jed-field">
            <span>판단 근거</span>
            <textarea
              rows={4}
              value={draft.content}
              placeholder="왜 그렇게 판단했는지"
              onChange={(e) => set("content", e.target.value)}
            />
          </label>

          <label className="jed-field">
            <span>기대한 결과</span>
            <p className="jed-hint">
              회고 때 이 칸과 실제를 나란히 놓습니다. 비워 두면 비교할 대상이 없습니다.
            </p>
            <textarea
              rows={2}
              value={draft.expected_outcome}
              placeholder="6개월 내 밸류에이션 정상화, 목표가 8만원대"
              onChange={(e) => set("expected_outcome", e.target.value)}
            />
          </label>

          {linkableTransactions.length > 0 && (
            <label className="jed-field">
              <span>연결할 거래</span>
              <select
                value={draft.transaction_id ?? ""}
                onChange={(e) =>
                  set("transaction_id", e.target.value ? Number(e.target.value) : null)
                }
              >
                <option value="">연결 안 함</option>
                {linkableTransactions.map((t) => (
                  <option key={t.transaction_id} value={t.transaction_id}>
                    {shortDate(t.traded_at)} · {DECISION_LABEL[t.trade_type] || t.trade_type}
                    {t.symbol ? ` · ${t.symbol}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        <footer className="jed-foot">
          {!canSave && <p className="jed-missing">{missing.join(" · ")}을(를) 채워 주세요</p>}
          {error && <p className="jed-error">{error}</p>}
          <div className="jed-actions">
            <button className="btn" onClick={onClose}>
              취소
            </button>
            <button className="btn is-primary" disabled={!canSave || saving} onClick={save}>
              {saving ? "저장 중…" : "저장"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
