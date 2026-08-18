import { useMemo, useState } from "react";

import AsyncState from "../components/AsyncState";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import EntityForm from "../components/EntityForm";
import { EditButton } from "../components/EntityModal";
import { marketValueOf, MarketStatusBanner, PriceCell } from "../components/MarketStatus";
import MetricCard, { MetricRow } from "../components/MetricCard";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
import PurgeDialog from "../components/PurgeDialog";
import SecurityMarketPanel from "../components/SecurityMarketPanel";
import SoftDeleteToggle, {
  aliveOnly,
  DeletedMark,
  DeletedRowActions,
  isDeleted,
  SoftDeleteBanner,
} from "../components/SoftDeleteToggle";
import {
  brokerAccount,
  listBrokerAccounts,
  listSecurities,
  listSecuritiesLoans,
  securitiesLoan,
  security,
} from "../api/trading";
import {
  BROKER_ACCOUNT_FIELDS,
  SECURITIES_LOAN_FIELDS,
  SECURITY_FIELDS,
} from "../forms/specs";
import { isoDate, price, qty, won } from "../lib/format";
import { useAsyncAll } from "../lib/useAsync";
import { useMultiForm } from "../lib/useMultiForm";
import { useSoftDelete } from "../lib/useSoftDelete";
import "./SecurityPage.css";

/**
 * 종목 — 계좌 · 보유종목 · 담보대출.
 *
 * 담보대출을 같은 화면 위쪽에 둔 이유가 있다. 담보비율이 무너지면 계획이고 원칙이고
 * 없이 반대매매가 먼저 온다. 보유 현황만 보고 대출을 다른 탭에 두면,
 * 가장 먼저 봐야 할 숫자를 가장 늦게 보게 된다.
 */

const WARN_RATIO = 140;

/** 물리 삭제 확인 창의 요약 한 줄. 무엇을 지우는지 값으로 보여 준다. */
const SUMMARY = {
  SECURITY: (r) => `${r.name || "이름 없음"} (${r.symbol || "코드 없음"})`,
  ACCOUNT: (r) => `${r.broker_name || "증권사"} ${r.masked_account_number || ""}`.trim(),
  LOAN: (r) =>
    [
      r.security_detail ? `${r.security_detail.name} (${r.security_detail.symbol})` : "종목 없음",
      `대출원금 ${won(r.principal_amount)}`,
    ].join(" · "),
};

export default function SecurityPage() {
  const [mode, setMode] = useState("alive");
  // 차트를 열어 둔 종목. 행 객체가 아니라 **id 만** 들고 아래에서 다시 찾는다 —
  // 객체를 쥐고 있으면 저장·복구로 목록이 갱신된 뒤에도 옛 행을 그리게 되고,
  // 필터가 바뀌어 그 행이 목록에서 사라져도 차트만 남는다.
  const [chartForId, setChartForId] = useState(null);

  const { data, error, loading, reload } = useAsyncAll(
    {
      accounts: () => listBrokerAccounts({ soft_delete_mode: mode }),
      securities: () => listSecurities({ soft_delete_mode: mode }),
      loans: () => listSecuritiesLoans({ soft_delete_mode: mode }),
    },
    [mode]
  );

  const kinds = useMemo(
    () => ({
      ACCOUNT: { title: "증권사계좌", fields: BROKER_ACCOUNT_FIELDS, api: brokerAccount },
      SECURITY: { title: "종목", fields: SECURITY_FIELDS, api: security },
      LOAN: { title: "종목담보대출", fields: SECURITIES_LOAN_FIELDS, api: securitiesLoan },
    }),
    []
  );
  const form = useMultiForm(kinds, reload);
  const life = useSoftDelete(reload);

  const securities = data?.securities || [];
  const loans = data?.loans || [];
  const accounts = data?.accounts || [];

  // 삭제된 행에는 차트를 열지 않는다 — 지운 종목의 시세를 그리면 살아 있는 것처럼 읽힌다.
  const chartFor = securities.find((s) => s.id === chartForId && !isDeleted(s)) || null;

  const optionsMap = useMemo(
    () => ({
      // FK 셀렉트에는 살아 있는 것만 올린다. 삭제 표시된 계좌·종목을 고를 수 있게 두면
      // 지운 것에 새 데이터를 매다는 길이 열린다.
      accounts: aliveOnly(accounts).map((a) => ({
        value: a.id,
        label: `${a.broker_name || "증권사"} ${a.masked_account_number || ""}`.trim(),
      })),
      securities: aliveOnly(securities).map((s) => ({
        value: s.id,
        label: `${s.name} (${s.symbol})`,
      })),
    }),
    [accounts, securities]
  );

  /**
   * 합계·지표는 **반드시 살아 있는 행만** 센다.
   * 삭제분을 켜 둔 채 평가금액 합계를 읽으면 지운 종목이 자산에 다시 끼어드는데,
   * 그건 이번에 보유수량 464,026 을 만든 것과 같은 종류의 오해다.
   */
  const aliveSecurities = aliveOnly(securities);
  const aliveLoans = aliveOnly(loans);
  const aliveAccounts = aliveOnly(accounts);

  // 합계는 서버가 현재주가 × 보유수량으로 계산해 준 값을 쓴다. 수집기가 현재주가를
  // 직접 갱신하므로 이 합계가 곧 실제 자산이다.
  const totalValue = aliveSecurities.reduce((sum, s) => sum + marketValueOf(s), 0);
  const totalLoan = aliveLoans.reduce((sum, l) => sum + Number(l.principal_amount || 0), 0);
  const riskyLoans = aliveLoans.filter(
    (l) => l.collateral_ratio != null && Number(l.collateral_ratio) <= WARN_RATIO
  );

  // 배너는 이 화면 전체(계좌·종목·대출)를 두고 말한다 — 한 표만 세면 다른 표의 삭제분을 놓친다.
  const totalRows = securities.length + loans.length + accounts.length;
  const aliveRows = aliveSecurities.length + aliveLoans.length + aliveAccounts.length;
  const deletedCount = totalRows - aliveRows;

  /** 삭제된 행이면 복구·영구삭제, 아니면 기존 수정 버튼. */
  const rowActions = (kind, api) => (r) =>
    isDeleted(r) ? (
      <DeletedRowActions
        busy={life.busyId === r.id}
        onRestore={() => life.restore(api, r)}
        onPurge={() => life.askPurge(api, r, SUMMARY[kind](r), `${kind.toLowerCase()}.id=${r.id}`)}
      />
    ) : (
      <EditButton onClick={() => form.openEdit(kind, r.id)} />
    );

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && (
        <div className="sp">
          {form.loadError && (
            <p className="sp-loaderr">원본을 불러오지 못했다 — {String(form.loadError.message)}</p>
          )}
          {life.error && (
            <p className="sp-loaderr" role="alert">
              {life.error}
            </p>
          )}

          <div className="sp-controls">
            <SoftDeleteToggle value={mode} onChange={setMode} id="sp-sdm" />
          </div>

          <MarketStatusBanner securities={aliveSecurities} />

          <SoftDeleteBanner
            mode={mode}
            deletedCount={deletedCount}
            aliveCount={aliveRows}
            onReset={() => setMode("alive")}
          />

          <MetricRow>
            <MetricCard
              label="평가금액 합계"
              value={won(totalValue)}
              hint={`관리대상 ${aliveSecurities.filter((s) => s.is_active).length}종목${
                mode === "alive" ? "" : " · 삭제분은 안 센다"
              }`}
            />
            <MetricCard
              label="담보대출 원금"
              value={won(totalLoan)}
              hint={totalLoan ? "순자산은 이만큼 빼고 봐야 한다" : "대출 없음"}
              tone={totalLoan > 0 ? "warning" : undefined}
            />
            <MetricCard
              label="담보비율 경고"
              value={riskyLoans.length}
              unit="건"
              hint={`${WARN_RATIO}% 이하`}
              tone={riskyLoans.length > 0 ? "danger" : "success"}
            />
          </MetricRow>

          <Panel
            title="담보대출"
            tone={riskyLoans.length > 0 ? "danger" : undefined}
            note="담보가 무너지면 규율을 지킬 기회 자체가 사라진다. 그래서 보유 현황보다 위에 둔다."
            actions={
              <button
                className="btn is-sm"
                onClick={() => form.openCreate("LOAN")}
                disabled={!aliveSecurities.length}
                title={aliveSecurities.length ? undefined : "종목을 먼저 등록한다"}
              >
                + 대출
              </button>
            }
          >
            <DataTable
              rows={loans}
              empty="담보대출이 없다."
              rowClass={(r) => (isDeleted(r) ? "is-deleted-row" : "")}
              columns={[
                {
                  key: "security",
                  label: "종목",
                  render: (r) => {
                    // 값이 없으면 null 을 돌려 DataTable 이 `—` 를 찍게 둔다.
                    const name = r.security_detail ? (
                      <span className="num">
                        {r.security_detail.name} {r.security_detail.symbol}
                      </span>
                    ) : null;
                    if (!isDeleted(r)) return name;
                    return (
                      <span className="sp-name">
                        <DeletedMark />
                        {name}
                      </span>
                    );
                  },
                },
                {
                  key: "principal_amount",
                  label: "대출원금",
                  align: "right",
                  render: (r) => won(r.principal_amount),
                },
                {
                  key: "interest_rate",
                  label: "이자율",
                  align: "right",
                  render: (r) => (r.interest_rate == null ? null : `${r.interest_rate}%`),
                },
                {
                  key: "collateral_ratio",
                  label: "담보비율",
                  align: "right",
                  render: (r) =>
                    r.collateral_ratio == null ? null : (
                      <span
                        className={Number(r.collateral_ratio) <= WARN_RATIO ? "neg" : undefined}
                      >
                        {r.collateral_ratio}%
                      </span>
                    ),
                },
                {
                  key: "maturity_at",
                  label: "만기",
                  render: (r) =>
                    r.maturity_at ? (
                      <span className="num">
                        {isoDate(r.maturity_at)}
                        {r.days_to_maturity != null && (
                          <span className={`sp-dday ${r.days_to_maturity <= 30 ? "is-near" : ""}`}>
                            {r.days_to_maturity < 0 ? " 경과" : ` D-${r.days_to_maturity}`}
                          </span>
                        )}
                      </span>
                    ) : null,
                },
                {
                  key: "_edit",
                  label: "",
                  align: "right",
                  width: 140,
                  render: rowActions("LOAN", securitiesLoan),
                },
              ]}
            />
          </Panel>

          <Panel
            title="보유 종목"
            meta={
              mode === "alive"
                ? `${securities.length}종목`
                : `${aliveSecurities.length}종목 + 삭제분 ${securities.length - aliveSecurities.length}건`
            }
            actions={
              <button
                className="btn is-sm"
                onClick={() => form.openCreate("SECURITY")}
                disabled={!aliveAccounts.length}
                title={aliveAccounts.length ? undefined : "증권사계좌를 먼저 등록한다"}
              >
                + 종목
              </button>
            }
          >
            <DataTable
              rows={securities}
              empty="등록된 종목이 없다. 계획 계층의 허리라서, 이게 없으면 주계획도 이행도 만들 수 없다."
              rowClass={(r) => (isDeleted(r) ? "is-deleted-row" : "")}
              columns={[
                {
                  key: "name",
                  label: "종목",
                  render: (r) => (
                    <span className="sp-name">
                      {isDeleted(r) && <DeletedMark />}
                      <strong>{r.name}</strong>
                      <span className="num sp-symbol">{r.symbol}</span>
                      {!r.is_active && <Badge tone="muted">관리 제외</Badge>}
                    </span>
                  ),
                },
                { key: "market", label: "시장", render: (r) => <Badge row={r} field="market" /> },
                {
                  key: "asset_type",
                  label: "유형",
                  render: (r) => <Badge row={r} field="asset_type" />,
                },
                { key: "sector", label: "업종" },
                {
                  key: "computed_holding_quantity",
                  label: "보유",
                  align: "right",
                  render: (r) => qty(r.computed_holding_quantity),
                },
                {
                  // 값 하나에 "언제·어디서 온 것인지" 를 붙여 둔다. 수집기가 이 컬럼을 직접
                  // 갱신하므로 수기값과 수집값이 따로 있지 않다.
                  key: "current_price",
                  label: "현재가",
                  align: "right",
                  render: (r) => <PriceCell security={r} />,
                },
                {
                  key: "market_value",
                  label: "평가금액",
                  align: "right",
                  render: (r) => won(marketValueOf(r)),
                },
                {
                  key: "_chart",
                  label: "",
                  align: "right",
                  width: 64,
                  render: (r) =>
                    isDeleted(r) ? null : (
                      <button
                        type="button"
                        className="row-edit"
                        onClick={() => setChartForId((id) => (id === r.id ? null : r.id))}
                        aria-expanded={chartForId === r.id}
                      >
                        {chartForId === r.id ? "차트 닫기" : "차트"}
                      </button>
                    ),
                },
                {
                  key: "_edit",
                  label: "",
                  align: "right",
                  width: 140,
                  render: rowActions("SECURITY", security),
                },
              ]}
            />
          </Panel>

          {/* 고른 종목이 있을 때만 마운트한다 — 봉 API 는 종목 없는 조회를 400 으로 막는다. */}
          {chartFor && (
            <SecurityMarketPanel
              key={chartFor.id}
              security={chartFor}
              onClose={() => setChartForId(null)}
            />
          )}

          <Panel
            title="증권사계좌"
            meta={
              mode === "alive"
                ? `${accounts.length}개`
                : `${aliveAccounts.length}개 + 삭제분 ${accounts.length - aliveAccounts.length}건`
            }
            actions={
              <button className="btn is-sm" onClick={() => form.openCreate("ACCOUNT")}>
                + 계좌
              </button>
            }
          >
            <DataTable
              rows={accounts}
              empty="등록된 계좌가 없다. 연투자계획과 종목이 둘 다 계좌에 매달리므로 여기서 시작한다."
              rowClass={(r) => (isDeleted(r) ? "is-deleted-row" : "")}
              columns={[
                {
                  key: "broker_name",
                  label: "증권사",
                  render: (r) =>
                    isDeleted(r) ? (
                      <span className="sp-name">
                        <DeletedMark />
                        {r.broker_name}
                      </span>
                    ) : (
                      r.broker_name
                    ),
                },
                {
                  key: "masked_account_number",
                  label: "계좌번호",
                  render: (r) => <span className="num">{r.masked_account_number}</span>,
                },
                {
                  key: "security_count",
                  label: "관리 종목",
                  align: "right",
                  render: (r) => `${r.security_count}종목`,
                },
                {
                  key: "_edit",
                  label: "",
                  align: "right",
                  width: 140,
                  render: rowActions("ACCOUNT", brokerAccount),
                },
              ]}
            />
            <p className="sp-note">
              목록 응답에는 계좌번호 원문이 실리지 않는다(뒤 4자리만). 수정 버튼을 누르면
              그때 단건 조회로 원문을 받아 폼을 채운다.
            </p>
          </Panel>

          {life.purgeTarget && <PurgeDialog {...life.purgeProps} />}

          {form.isOpen && (
            <Modal
              title={`${form.spec.title} ${form.isEdit ? "수정" : "추가"}`}
              onClose={form.close}
            >
              <EntityForm
                fields={form.spec.fields}
                instance={form.instance}
                optionsMap={optionsMap}
                onSubmit={form.submit}
                onCancel={form.close}
                onDelete={form.isEdit ? form.remove : undefined}
              />
            </Modal>
          )}
        </div>
      )}
    </AsyncState>
  );
}
