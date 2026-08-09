import { useEffect, useMemo, useState } from "react";

import JournalEditor from "../components/JournalEditor";
import JournalRow from "../components/JournalRow";
import { listJournalEntries, listJournalTags, listTransactions } from "../api/planner";
import "./JournalPage.css";

/**
 * 일지 — 대시보드형 목록 + 태그 필터 + 작성 폼.
 *
 * '이유 미기재' 필터를 기본 필터 옆에 붙여 둔 게 이 화면의 핵심이다.
 * 홈에서 밀어주고, 여기서 한 번에 밀린 것들을 처리하는 흐름.
 */
export default function JournalPage({ initialFilter = null }) {
  const [entries, setEntries] = useState([]);
  const [tags, setTags] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [activeTag, setActiveTag] = useState(null);
  const [onlyMissing, setOnlyMissing] = useState(initialFilter === "missing");
  const [editing, setEditing] = useState(null); // null | {} | entry
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    Promise.all([listJournalEntries(), listJournalTags(), listTransactions()])
      .then(([e, t, tx]) => {
        if (!alive) return;
        setEntries(e || []);
        setTags(t || []);
        setTransactions(tx || []);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  const visible = useMemo(() => {
    let list = entries;
    if (activeTag) list = list.filter((e) => (e.tag_ids || []).includes(activeTag));
    if (onlyMissing) list = list.filter((e) => !(e.tag_ids || []).length);
    return list;
  }, [entries, activeTag, onlyMissing]);

  const missingCount = entries.filter((e) => !(e.tag_ids || []).length).length;
  const linkable = transactions.filter((t) => !t.entry_id);

  const onSaved = (saved) => {
    setEntries((list) => {
      const exists = list.some((e) => e.entry_id === saved.entry_id);
      return exists
        ? list.map((e) => (e.entry_id === saved.entry_id ? { ...e, ...saved } : e))
        : [{ ...saved, entry_id: saved.entry_id ?? Date.now() }, ...list];
    });
  };

  if (status === "loading") return <div className="placeholder">불러오는 중입니다…</div>;
  if (status === "error") return <div className="placeholder">일지를 불러오지 못했습니다.</div>;

  return (
    <div className="journal">
      <div className="section-head">
        <h2>일지</h2>
        <button className="btn is-primary" onClick={() => setEditing({})}>
          일지 쓰기
        </button>
      </div>

      <div className="journal-filters">
        <button
          className={`chip ${!activeTag && !onlyMissing ? "is-on" : ""}`}
          onClick={() => {
            setActiveTag(null);
            setOnlyMissing(false);
          }}
        >
          전체 {entries.length}
        </button>
        {missingCount > 0 && (
          <button
            className={`chip is-warning ${onlyMissing ? "is-on" : ""}`}
            onClick={() => {
              setOnlyMissing((v) => !v);
              setActiveTag(null);
            }}
          >
            이유 미기재 {missingCount}
          </button>
        )}
        {tags.map((t) => (
          <button
            key={t.tag_id}
            className={`chip ${activeTag === t.tag_id ? "is-on" : ""}`}
            onClick={() => {
              setActiveTag((v) => (v === t.tag_id ? null : t.tag_id));
              setOnlyMissing(false);
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {linkable.length > 0 && !onlyMissing && (
        <p className="journal-nudge">
          이유가 안 적힌 거래가 {linkable.length}건 있습니다. 지금 채워 두면 다음 회고에서
          쓸 수 있습니다.
        </p>
      )}

      <div className="card journal-list">
        {visible.length === 0 ? (
          <p className="journal-empty">
            해당하는 일지가 없습니다.
            <button className="btn journal-empty-cta" onClick={() => setEditing({})}>
              지금 하나 쓰기
            </button>
          </p>
        ) : (
          visible.map((e) => (
            <JournalRow key={e.entry_id} entry={e} tags={tags} onOpen={setEditing} />
          ))
        )}
      </div>

      {editing && (
        <JournalEditor
          entry={editing.entry_id ? editing : null}
          tags={tags}
          linkableTransactions={linkable}
          onClose={() => setEditing(null)}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
