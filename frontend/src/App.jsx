import { useEffect, useState } from "react";

import Header from "./components/Header";
import ExecutionPage from "./pages/ExecutionPage";
import HomePage from "./pages/HomePage";
import MarketPage from "./pages/MarketPage";
import PerformancePage from "./pages/PerformancePage";
import PlanPage from "./pages/PlanPage";
import PrinciplePage from "./pages/PrinciplePage";
import SecurityPage from "./pages/SecurityPage";
import StrategyPage from "./pages/StrategyPage";

/**
 * 라우팅은 탭 상태 + History API 로 처리한다. 화면이 여덟 개고 딥링크 요구가 얕아
 * react-router 는 들이지 않지만, 브라우저 뒤로/앞으로 는 반드시 앱 내부 탭을 따라가야 한다
 * — 그러지 않으면 홈 → 계획 → 이행 을 눌렀는데 뒤로가기 한 번에 앱이 통째로 이전 URL 로 튕긴다.
 *
 * 밀도 정책: 홈만 좁은 단일 컬럼, 나머지는 넓은 대시보드형.
 *
 * goTo(tab) — 홈의 '지금 처리할 것' 버튼이 해당 화면으로 넘긴다.
 */
const PAGES = {
  home: HomePage,
  plan: PlanPage,
  principle: PrinciplePage,
  security: SecurityPage,
  execution: ExecutionPage,
  strategy: StrategyPage,
  market: MarketPage,
  performance: PerformancePage,
};

const readTabFromURL = () => {
  const t = new URLSearchParams(window.location.search).get("tab");
  return t && PAGES[t] ? t : "home";
};

export default function App() {
  const [tab, setTab] = useState(readTabFromURL);

  // 사용자 탭 클릭 → history 에 push, URL 도 갱신.
  // 같은 탭 재클릭은 pushState 로 히스토리를 오염시키지 않는다.
  const goTab = (next) => {
    if (!PAGES[next] || next === tab) return;
    const params = new URLSearchParams(window.location.search);
    params.set("tab", next);
    window.history.pushState({ tab: next }, "", `?${params.toString()}`);
    setTab(next);
  };

  // 브라우저 뒤로/앞으로 → 현재 URL 을 읽어 탭 복원.
  useEffect(() => {
    const onPop = () => setTab(readTabFromURL());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // 최초 진입 시 URL 에 tab 이 없으면 replaceState 로 심어 둔다.
  // 이걸 안 해 두면 첫 뒤로가기가 앱 밖으로 나가버린다.
  useEffect(() => {
    if (!window.location.search.includes("tab=")) {
      const params = new URLSearchParams(window.location.search);
      params.set("tab", tab);
      window.history.replaceState({ tab }, "", `?${params.toString()}`);
    }
    // 최초 1회만.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const Page = PAGES[tab] || HomePage;

  return (
    <div className="app-shell">
      <Header tab={tab} onTab={goTab} />
      <main className={`app-body ${tab === "home" ? "is-narrow" : ""}`}>
        <Page onGo={goTab} />
      </main>
    </div>
  );
}
