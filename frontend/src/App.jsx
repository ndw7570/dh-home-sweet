import { useState } from "react";

import Header from "./components/Header";
import AssetPage from "./pages/AssetPage";
import HomePage from "./pages/HomePage";
import JournalPage from "./pages/JournalPage";
import PlanPage from "./pages/PlanPage";
import ReviewPage from "./pages/ReviewPage";

/**
 * 라우팅은 참조 프로젝트(namssi-jikjehak)와 동일하게 탭 상태로 처리한다.
 * 화면이 다섯 개뿐이고 딥링크 요구가 아직 없어서 react-router 를 들이지 않는다.
 * (URL 공유가 필요해지는 순간 여기만 교체하면 된다)
 *
 * 밀도 정책: 홈만 좁은 단일 컬럼(토스형), 나머지는 넓은 대시보드형.
 *
 * goTo(tab, filter) — 홈/회고에서 "일지 쓰기"를 누르면 일지 탭이 '이유 미기재'
 * 필터가 걸린 상태로 열린다. 밀어주기와 처리 화면이 끊기지 않게 하는 유일한 연결고리.
 */
export default function App() {
  const [tab, setTab] = useState("home");
  const [filter, setFilter] = useState(null);

  const goTo = (next, nextFilter = null) => {
    setTab(next);
    setFilter(nextFilter);
  };

  return (
    <div className="app-shell">
      <Header tab={tab} onTab={(t) => goTo(t)} />
      <main className={`app-body ${tab === "home" ? "is-narrow" : ""}`}>
        {tab === "home" && <HomePage onGo={goTo} />}
        {tab === "plan" && <PlanPage />}
        {tab === "journal" && <JournalPage key={filter} initialFilter={filter} />}
        {tab === "review" && <ReviewPage onGo={goTo} />}
        {tab === "asset" && <AssetPage onGo={goTo} />}
      </main>
    </div>
  );
}
