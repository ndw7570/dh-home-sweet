import { useState } from "react";

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
 * 라우팅은 탭 상태로 처리한다. 화면이 여덟 개고 딥링크 요구가 아직 없어서
 * react-router 를 들이지 않는다. (URL 공유가 필요해지면 여기만 교체한다)
 *
 * 밀도 정책: 홈만 좁은 단일 컬럼, 나머지는 넓은 대시보드형.
 * 홈은 '지금 무엇을 할 것인가' 하나를 밀어야 해서 좁아야 하고,
 * 나머지는 비교와 대조가 목적이라 넓어야 한다.
 *
 * goTo(tab) — 홈의 '지금 처리할 것' 버튼이 해당 화면으로 넘긴다.
 * 밀어주기와 처리 화면이 끊기면 이 프로그램의 루프가 끊긴다.
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

export default function App() {
  const [tab, setTab] = useState("home");

  const Page = PAGES[tab] || HomePage;

  return (
    <div className="app-shell">
      <Header tab={tab} onTab={setTab} />
      <main className={`app-body ${tab === "home" ? "is-narrow" : ""}`}>
        <Page onGo={setTab} />
      </main>
    </div>
  );
}
