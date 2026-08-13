import { useMemo } from "react";

import AsyncState from "../components/AsyncState";
import Badge from "../components/Badge";
import DataTable from "../components/DataTable";
import EntityForm from "../components/EntityForm";
import { EditButton } from "../components/EntityModal";
import MetricCard, { MetricRow } from "../components/MetricCard";
import Modal from "../components/Modal";
import Panel from "../components/Panel";
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
import "./SecurityPage.css";

/**
 * 종목 — 계좌 · 보유종목 · 담보대출.
 *
 * 담보대출을 같은 화면 위쪽에 둔 이유가 있다. 담보비율이 무너지면 계획이고 원칙이고
 * 없이 반대매매가 먼저 온다. 보유 현황만 보고 대출을 다른 탭에 두면,
 * 가장 먼저 봐야 할 숫자를 가장 늦게 보게 된다.
 */

const WARN_RATIO = 140;

export default function SecurityPage() {
  const { data, error, loading, reload } = useAsyncAll(
    {
      accounts: () => listBrokerAccounts(),
      securities: () => listSecurities(),
      loans: () => listSecuritiesLoans(),
    },
    []
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

  const securities = data?.securities || [];
  const loans = data?.loans || [];
  const accounts = data?.accounts || [];

  const optionsMap = useMemo(
    () => ({
      accounts: accounts.map((a) => ({
        value: a.id,
        label: `${a.broker_name || "증권사"} ${a.masked_account_number || ""}`.trim(),
      })),
      securities: securities.map((s) => ({ value: s.id, label: `${s.name} (${s.symbol})` })),
    }),
    [accounts, securities]
  );

  const totalValue = securities.reduce((sum, s) => sum + (s.market_value || 0), 0);
  const totalLoan = loans.reduce((sum, l) => sum + Number(l.principal_amount || 0), 0);
  const riskyLoans = loans.filter(
    (l) => l.collateral_ratio != null && Number(l.collateral_ratio) <= WARN_RATIO
  );

  return (
    <AsyncState loading={loading} error={error} onRetry={reload}>
      {data && (
        <div className="sp">
          {form.loadError && (
            <p className="sp-loaderr">원본을 불러오지 못했다 — {String(form.loadError.message)}</p>
          )}

          <MetricRow>
            <MetricCard
              label="평가금액 합계"
              value={won(totalValue)}
              hint={`관리대상 ${securities.filter((s) => s.is_active).length}종목`}
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
                disabled={!securities.length}
                title={securities.length ? undefined : "종목을 먼저 등록한다"}
              >
                + 대출
              </button>
            }
          >
            <DataTable
              rows={loans}
              empty="담보대출이 없다."
              columns={[
                {
                  key: "security",
                  label: "종목",
                  render: (r) =>
                    r.security_detail ? (
                      <span className="num">
                        {r.security_detail.name} {r.security_detail.symbol}
                      </span>
                    ) : null,
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
                  width: 60,
                  render: (r) => <EditButton onClick={() => form.openEdit("LOAN", r.id)} />,
                },
              ]}
            />
          </Panel>

          <Panel
            title="보유 종목"
            meta={`${securities.length}종목`}
            actions={
              <button
                className="btn is-sm"
                onClick={() => form.openCreate("SECURITY")}
                disabled={!accounts.length}
                title={accounts.length ? undefined : "증권사계좌를 먼저 등록한다"}
              >
                + 종목
              </button>
            }
          >
            <DataTable
              rows={securities}
              empty="등록된 종목이 없다. 계획 계층의 허리라서, 이게 없으면 주계획도 이행도 만들 수 없다."
              columns={[
                {
                  key: "name",
                  label: "종목",
                  render: (r) => (
                    <span className="sp-name">
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
                  key: "current_price",
                  label: "현재가",
                  align: "right",
                  render: (r) => price(r.current_price),
                },
                {
                  key: "market_value",
                  label: "평가금액",
                  align: "right",
                  render: (r) => won(r.market_value),
                },
                {
                  key: "_edit",
                  label: "",
                  align: "right",
                  width: 60,
                  render: (r) => <EditButton onClick={() => form.openEdit("SECURITY", r.id)} />,
                },
              ]}
            />
          </Panel>

          <Panel
            title="증권사계좌"
            meta={`${accounts.length}개`}
            actions={
              <button className="btn is-sm" onClick={() => form.openCreate("ACCOUNT")}>
                + 계좌
              </button>
            }
          >
            <DataTable
              rows={accounts}
              empty="등록된 계좌가 없다. 연투자계획과 종목이 둘 다 계좌에 매달리므로 여기서 시작한다."
              columns={[
                { key: "broker_name", label: "증권사" },
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
                  width: 60,
                  render: (r) => <EditButton onClick={() => form.openEdit("ACCOUNT", r.id)} />,
                },
              ]}
            />
            <p className="sp-note">
              목록 응답에는 계좌번호 원문이 실리지 않는다(뒤 4자리만). 수정 버튼을 누르면
              그때 단건 조회로 원문을 받아 폼을 채운다.
            </p>
          </Panel>

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
