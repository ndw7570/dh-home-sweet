import "./Header.css";

// 8탭. 앞의 셋(홈·계획·원칙)이 '세우는 것', 뒤의 다섯이 '보는 것'이다.
const TABS = [
  { key: "home", label: "홈" },
  { key: "plan", label: "계획" },
  { key: "principle", label: "원칙" },
  { key: "security", label: "종목" },
  { key: "execution", label: "이행" },
  { key: "strategy", label: "전략" },
  { key: "market", label: "시장" },
  { key: "performance", label: "성과" },
];

export default function Header({ tab, onTab }) {
  return (
    <header className="hd">
      <div className="hd-inner">
        <button className="hd-brand" onClick={() => onTab("home")}>
          주식 규율 관리
        </button>
        <nav className="hd-nav" aria-label="주 메뉴">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`hd-tab ${tab === t.key ? "is-on" : ""}`}
              aria-current={tab === t.key ? "page" : undefined}
              onClick={() => onTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
