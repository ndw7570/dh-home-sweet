import { useEffect, useState } from "react";

import SummaryCard from "../components/SummaryCard";
import TimelineChart from "../components/TimelineChart";
import { fetchHomeSummary, fetchTimeline } from "../api/planner";
import { manwon, monthLabel, percent, won } from "../lib/format";
import "./HomePage.css";

/**
 * 홈 — 토스형 단일 컬럼 카드 스택.
 *
 * 이 화면의 일은 데이터를 보여주는 게 아니라 다음 행동 하나를 고르게 만드는 것이다.
 * 그래서 카드마다 한 문장 + 버튼 하나만 둔다. 밀도가 필요한 화면은 계획/자산 탭이다.
 */
export default function HomePage({ onGo }) {
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    let alive = true;
    Promise.all([fetchHomeSummary(), fetchTimeline({ months_back: 12 })])
      .then(([s, t]) => {
        if (!alive) return;
        setSummary(s);
        setTimeline(t);
        setStatus("ready");
      })
      .catch(() => alive && setStatus("error"));
    return () => {
      alive = false;
    };
  }, []);

  if (status === "loading") {
    return <div className="placeholder">불러오는 중입니다…</div>;
  }
  if (status === "error") {
    return (
      <div className="placeholder">
        데이터를 불러오지 못했습니다. 백엔드가 떠 있는지 확인해 주세요.
      </div>
    );
  }

  const gap = summary?.plan_gap_amount;
  const projection = summary?.projection;
  const unjournaled = summary?.unjournaled;
  const review = summary?.pending_review;

  return (
    <div className="home">
      <SummaryCard
        eyebrow="내 순자산"
        value={won(summary?.net_worth)}
        caption={
          gap == null
            ? "아직 비교할 계획이 없습니다."
            : gap >= 0
              ? `계획보다 ${manwon(gap)}원 앞서 있어요`
              : `계획보다 ${manwon(-gap)}원 뒤처져 있어요`
        }
        tone={gap == null ? "default" : gap >= 0 ? "success" : "warning"}
      />

      {projection && (
        <SummaryCard
          eyebrow={`이대로 가면 ${monthLabel(projection.target_date)}엔`}
          value={won(projection.value)}
          caption={
            projection.vs_last_projection_rate == null
              ? null
              : `지난번에 예상했던 것보다 ${percent(
                  Math.abs(projection.vs_last_projection_rate),
                )} ${projection.vs_last_projection_rate >= 0 ? "위" : "아래"}에 있어요`
          }
        >
          <div className="home-chart">
            <TimelineChart data={timeline} height={150} />
          </div>
        </SummaryCard>
      )}

      {unjournaled?.missing > 0 && (
        <SummaryCard
          headline={`이번 주 매매 ${unjournaled.total}건 중 ${unjournaled.missing}건`}
          caption="아직 왜 샀는지 안 적으셨어요"
          action="일지 쓰기"
          onAction={() => onGo?.("journal", "missing")}
        />
      )}

      {review?.status === "READY" && (
        <SummaryCard
          accent
          badge={`${review.period_label} 마감`}
          headline={`${review.period_label} 회고가 준비됐어요`}
          caption="계획과 실제의 차이, 원인 후보까지 미리 정리해 뒀어요"
          action="회고 열기"
          onAction={() => onGo?.("review")}
        />
      )}

      {summary?.hit_rate != null && (
        <p className="home-footnote">
          지금까지 세운 예상 중 {percent(summary.hit_rate)}가 실제와 맞았습니다. 예상선은
          지우지 않고 그대로 쌓입니다.
        </p>
      )}
    </div>
  );
}
