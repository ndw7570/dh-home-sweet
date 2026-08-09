import { useEffect, useState } from "react";

import MetricCard from "../components/MetricCard";
import { fetchReviewDigest, listReviews, updateReview } from "../api/planner";
import { DECISION_LABEL, manwon, percent, shortDate, signed } from "../lib/format";
import "./ReviewPage.css";

/**
 * 회고 — 사용자가 빈 화면을 만나지 않도록, 차이와 원인 후보를 먼저 채워서 보여준다.
 * 사용자가 직접 쓰는 건 두 칸(원인 / 다음 주기 조정)뿐이다.
 */
export default function ReviewPage({ onGo }) {
  const [review, setReview] = useState(null);
  const [digest, setDigest] = useState(null);
  const [status, setStatus] = useState("loading");
  const [notes, setNotes] = useState({ cause_note: "", adjustment_note: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    listReviews({ status: "READY" })
      .then(async (list) => {
        const r = Array.isArray(list) ? list[0] : list;
        if (!alive) return;
        setReview(r || null);
        if (r) {
          setNotes({
            cause_note: r.cause_note || "",
            adjustment_note: r.adjustment_note || "",
          });
          setDigest(await fetchReviewDigest(r.review_id));
        }
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  if (status === "loading") return <div className="placeholder">불러오는 중입니다…</div>;
  if (status === "error") return <div className="placeholder">회고를 불러오지 못했습니다.</div>;
  if (!review)
    return (
      <div className="placeholder">
        <p>지금 열려 있는 회고가 없습니다.</p>
        <p className="placeholder-sub">
          이번 주기가 끝나면 계획 대비 차이를 정리해서 여기에 올려 둡니다.
        </p>
      </div>
    );

  const save = async (nextStatus) => {
    setSaving(true);
    try {
      await updateReview(review.review_id, { ...notes, status: nextStatus });
      setReview((r) => ({ ...r, ...notes, status: nextStatus }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="review">
      <div className="section-head">
        <h2>
          {shortDate(review.period_start)} ~ {shortDate(review.period_end)} 회고
        </h2>
        <span className="meta">{review.status === "DONE" ? "작성 완료" : "작성 대기"}</span>
      </div>

      <div className="review-metrics">
        <MetricCard label="계획" value={manwon(review.planned_value)} />
        <MetricCard label="실적" value={manwon(review.actual_value)} />
        <MetricCard
          label="차이"
          value={signed(review.gap_amount)}
          tone={Number(review.gap_amount) >= 0 ? "success" : "warning"}
          sub={digest?.gap?.rate != null ? percent(digest.gap.rate, 1) : undefined}
        />
      </div>

      {digest?.tag_performance?.length > 0 && (
        <div className="card review-block">
          <h3>이번 주기에 많이 쓴 근거</h3>
          <ul className="tag-perf">
            {digest.tag_performance.map((t) => (
              <li key={t.tag_id}>
                <span className="pill is-accent">{t.name}</span>
                <span className="num">{t.entry_count}건</span>
                <span className="num muted">평균 확신 {t.avg_conviction}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {digest?.unjournaled_transactions?.length > 0 && (
        <div className="card review-block">
          <h3>이유가 비어 있는 거래</h3>
          <p className="review-hint">
            이 거래들은 다음 회고에서 원인을 따질 근거가 없습니다. 지금 채워 두면 다음
            주기에 쓸 수 있습니다.
          </p>
          <ul className="untagged">
            {digest.unjournaled_transactions.map((t) => (
              <li key={t.transaction_id}>
                <span className="num">{shortDate(t.traded_at)}</span>
                <span>{DECISION_LABEL[t.trade_type] || t.trade_type}</span>
                <span className="num muted">{t.symbol}</span>
                <button className="btn" onClick={() => onGo?.("journal", "missing")}>
                  일지 붙이기
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card review-block">
        <h3>차이의 원인</h3>
        <textarea
          rows={4}
          placeholder="계획과 실제가 벌어진 이유를 한 문단으로"
          value={notes.cause_note}
          onChange={(e) => setNotes((n) => ({ ...n, cause_note: e.target.value }))}
        />
        <h3>다음 주기 조정</h3>
        <textarea
          rows={4}
          placeholder="다음 주기에 무엇을 다르게 할지"
          value={notes.adjustment_note}
          onChange={(e) => setNotes((n) => ({ ...n, adjustment_note: e.target.value }))}
        />
        <div className="review-actions">
          <button className="btn" disabled={saving} onClick={() => save("READY")}>
            임시 저장
          </button>
          <button className="btn is-primary" disabled={saving} onClick={() => save("DONE")}>
            회고 마치기
          </button>
        </div>
      </div>
    </div>
  );
}
