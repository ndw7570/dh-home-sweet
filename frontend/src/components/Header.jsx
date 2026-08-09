import "./Header.css";

const TABS = [
  { key: "home", label: "홈" },
  { key: "plan", label: "계획" },
  { key: "journal", label: "일지" },
  { key: "review", label: "회고" },
  { key: "asset", label: "자산" },
];

export default function Header({ tab, onTab }) {
  return (
    <header className="hd">
      <div className="hd-inner">
        <button className="hd-brand" onClick={() => onTab("home")}>
          자산 플래너
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
