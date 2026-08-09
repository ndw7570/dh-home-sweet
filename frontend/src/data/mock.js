// 백엔드 없이 화면을 확인하기 위한 목 데이터.
//
// ⚠ 이 파일은 손으로 고치지 않는다.
// 시드가 들어간 백엔드의 실제 응답을 떠서 생성한 것이라, 필드명과 모양이
// API 계약과 정확히 일치한다. 다시 만들려면:
//
//     cd backend
//     python manage.py seed_demo --reset
//     python manage.py dump_mock
//
// VITE_USE_MOCK=1 일 때만 쓰인다.


export const cascade = {
  "as_of": "2026-08-09",
  "account_id": null,
  "only_active": true,
  "tree": [
    {
      "id": 3,
      "level": "YEAR",
      "title": "2026 반도체 사이클 상반기 비중확대",
      "market": "KOSPI",
      "direction": "LONG",
      "status": "ACTIVE",
      "thesis": "메모리 감산 효과가 재고 정상화로 이어지는 구간. 사이클 초입에서 비중을 싣는다.",
      "target_return_ratio": 18.0,
      "stop_loss_ratio": -8.0,
      "valid_from": "2026-01-01",
      "valid_until": "2026-12-31",
      "market_label": "코스피",
      "direction_label": "매수",
      "status_label": "진행중",
      "account": {
        "id": 3,
        "broker_name": "미래에셋증권",
        "account_number": "****8901"
      },
      "children": [
        {
          "id": 3,
          "level": "QUARTER",
          "title": "2026 3분기 반도체 비중 55%",
          "direction": "LONG",
          "thesis": "분기 실적 발표에서 재고 감소가 확인되는지가 분기점.",
          "rebalancing_ratio": {
            "005930": 30,
            "000660": 25,
            "CASH": 45
          },
          "strategy_coverage": {
            "buy": true,
            "sell": true,
            "sideways": true,
            "stop_loss": false
          },
          "strategies": {
            "buy": "20일선 지지 확인 후 3분할. 1차 -3%, 2차 -7%, 3차 -12%.",
            "sell": "목표가 도달 시 절반, 나머지는 추세 이탈까지 보유.",
            "sideways": "2주 이상 횡보하면 신규 매수 중단, 현금 비중 유지.",
            "stop_loss": null
          },
          "target_return_ratio": 6.0,
          "stop_loss_ratio": -5.0,
          "valid_from": "2026-07-01",
          "valid_until": "2026-09-30",
          "direction_label": "매수",
          "children": [
            {
              "id": 5,
              "level": "MONTH",
              "title": "8월 기본 시나리오",
              "scenario_planning": "BASE",
              "predicted_trend": "UP",
              "confidence_score": 4,
              "allocation_ratio": {
                "005930": 30,
                "000660": 25,
                "CASH": 45
              },
              "thesis": "완만한 상승. 조정 시 분할 매수로 비중을 채운다.",
              "valid_from": "2026-08-01",
              "valid_until": "2026-08-31",
              "scenario_planning_label": "기본",
              "predicted_trend_label": "상승",
              "securities": [
                {
                  "id": 7,
                  "symbol": "005930",
                  "name": "삼성전자",
                  "market": "KOSPI",
                  "sector": "반도체",
                  "current_price": 71500.0
                },
                {
                  "id": 8,
                  "symbol": "000660",
                  "name": "SK하이닉스",
                  "market": "KOSPI",
                  "sector": "반도체",
                  "current_price": 183000.0
                }
              ],
              "children": [
                {
                  "id": 9,
                  "level": "WEEK",
                  "title": "삼성전자 이번 주 3분할 1차",
                  "security": {
                    "id": 7,
                    "symbol": "005930",
                    "name": "삼성전자",
                    "market": "KOSPI",
                    "sector": "반도체",
                    "current_price": 71500.0
                  },
                  "scenario_planning": "BASE",
                  "predicted_trend": "UP",
                  "confidence_score": 4,
                  "available_amount": 3000000.0,
                  "predicted_price": 76000.0,
                  "stop_loss_price": 68000.0,
                  "risk_reward": 1.29,
                  "thesis": "70,000 지지 확인. 여기서 1차 진입.",
                  "valid_from": "2026-08-03",
                  "valid_until": "2026-08-09",
                  "scenario_planning_label": "기본",
                  "predicted_trend_label": "상승",
                  "children": [
                    {
                      "id": 5,
                      "level": "DAY",
                      "title": "오늘 1차 매수",
                      "scenario_planning": "BASE",
                      "predicted_trend": "UP",
                      "confidence_score": 4,
                      "predicted_price": 73000.0,
                      "stop_loss_price": 68000.0,
                      "thesis": "시가 대비 -1% 이탈 시 지정가 71,000 으로 1/3 진입.",
                      "valid_from": "2026-08-09",
                      "valid_until": "2026-08-09",
                      "scenario_planning_label": "기본",
                      "predicted_trend_label": "상승"
                    }
                  ]
                },
                {
                  "id": 10,
                  "level": "WEEK",
                  "title": "SK하이닉스 관망",
                  "security": {
                    "id": 8,
                    "symbol": "000660",
                    "name": "SK하이닉스",
                    "market": "KOSPI",
                    "sector": "반도체",
                    "current_price": 183000.0
                  },
                  "scenario_planning": "BASE",
                  "predicted_trend": "SIDEWAYS",
                  "confidence_score": 3,
                  "available_amount": 2000000.0,
                  "predicted_price": 196000.0,
                  "stop_loss_price": 176000.0,
                  "risk_reward": 1.86,
                  "thesis": "180,000 ~ 195,000 박스. 이탈 확인 전까지 신규 진입 없음.",
                  "valid_from": "2026-08-03",
                  "valid_until": "2026-08-09",
                  "scenario_planning_label": "기본",
                  "predicted_trend_label": "횡보",
                  "children": [
                    {
                      "id": 6,
                      "level": "DAY",
                      "title": "오늘 관망",
                      "scenario_planning": "BASE",
                      "predicted_trend": "SIDEWAYS",
                      "confidence_score": 3,
                      "predicted_price": null,
                      "stop_loss_price": 176000.0,
                      "thesis": "박스 상단까지 아무것도 하지 않는다.",
                      "valid_from": "2026-08-09",
                      "valid_until": "2026-08-09",
                      "scenario_planning_label": "기본",
                      "predicted_trend_label": "횡보"
                    }
                  ]
                }
              ]
            },
            {
              "id": 6,
              "level": "MONTH",
              "title": "8월 비관 시나리오",
              "scenario_planning": "BEAR",
              "predicted_trend": "DOWN",
              "confidence_score": 2,
              "allocation_ratio": {
                "005930": 20,
                "CASH": 60
              },
              "thesis": "금리 재상승 시 밸류에이션 압축. 현금 비중을 60%까지 올린다.",
              "valid_from": "2026-08-01",
              "valid_until": "2026-08-31",
              "scenario_planning_label": "비관",
              "predicted_trend_label": "하락",
              "securities": [],
              "children": []
            }
          ]
        }
      ]
    }
  ],
  "orphan_weekly_plans": [
    {
      "id": 11,
      "title": "NAVER 단기 반등 노림",
      "security": {
        "id": 9,
        "symbol": "035420",
        "name": "NAVER",
        "market": "KOSPI",
        "sector": "인터넷",
        "current_price": 162000.0
      },
      "valid_from": "2026-08-03",
      "valid_until": "2026-08-09",
      "reason": "이 종목을 가리키는 월투자원칙이 없거나 기간이 겹치지 않는다"
    }
  ],
  "counts": {
    "annual": 1,
    "weekly_total": 3,
    "weekly_attached": 2,
    "weekly_orphan": 1
  }
};

export const homeBoard = {
  "as_of": "2026-08-09",
  "mandatory_principles": [
    {
      "id": 12,
      "priority": 1,
      "content": "계획에 없는 종목은 사지 않는다."
    },
    {
      "id": 13,
      "priority": 2,
      "content": "손절가는 사기 전에 정하고, 정한 뒤에는 내리지 않는다."
    },
    {
      "id": 14,
      "priority": 3,
      "content": "한 종목에 총자산의 20%를 넘기지 않는다."
    },
    {
      "id": 15,
      "priority": 4,
      "content": "물타기는 미리 적어 둔 n차 분할표 안에서만 한다."
    },
    {
      "id": 16,
      "priority": 5,
      "content": "장중에 계획을 바꾸지 않는다. 바꾸려면 장 끝나고 근거를 적는다."
    }
  ],
  "plans": {
    "daily": [
      {
        "id": 5,
        "title": "오늘 1차 매수",
        "scenario_planning": "BASE",
        "predicted_trend": "UP",
        "confidence_score": 4,
        "predicted_price": 73000.0,
        "stop_loss_price": 68000.0,
        "thesis": "시가 대비 -1% 이탈 시 지정가 71,000 으로 1/3 진입.",
        "scenario_planning_label": "기본",
        "predicted_trend_label": "상승",
        "security": {
          "id": 7,
          "symbol": "005930",
          "name": "삼성전자",
          "current_price": 71500.0
        }
      },
      {
        "id": 6,
        "title": "오늘 관망",
        "scenario_planning": "BASE",
        "predicted_trend": "SIDEWAYS",
        "confidence_score": 3,
        "predicted_price": null,
        "stop_loss_price": 176000.0,
        "thesis": "박스 상단까지 아무것도 하지 않는다.",
        "scenario_planning_label": "기본",
        "predicted_trend_label": "횡보",
        "security": {
          "id": 8,
          "symbol": "000660",
          "name": "SK하이닉스",
          "current_price": 183000.0
        }
      }
    ],
    "weekly": [
      {
        "id": 9,
        "title": "삼성전자 이번 주 3분할 1차",
        "scenario_planning": "BASE",
        "predicted_trend": "UP",
        "confidence_score": 4,
        "predicted_price": 76000.0,
        "stop_loss_price": 68000.0,
        "available_amount": 3000000.0,
        "thesis": "70,000 지지 확인. 여기서 1차 진입.",
        "scenario_planning_label": "기본",
        "predicted_trend_label": "상승",
        "security": {
          "id": 7,
          "symbol": "005930",
          "name": "삼성전자",
          "current_price": 71500.0
        }
      },
      {
        "id": 10,
        "title": "SK하이닉스 관망",
        "scenario_planning": "BASE",
        "predicted_trend": "SIDEWAYS",
        "confidence_score": 3,
        "predicted_price": 196000.0,
        "stop_loss_price": 176000.0,
        "available_amount": 2000000.0,
        "thesis": "180,000 ~ 195,000 박스. 이탈 확인 전까지 신규 진입 없음.",
        "scenario_planning_label": "기본",
        "predicted_trend_label": "횡보",
        "security": {
          "id": 8,
          "symbol": "000660",
          "name": "SK하이닉스",
          "current_price": 183000.0
        }
      },
      {
        "id": 11,
        "title": "NAVER 단기 반등 노림",
        "scenario_planning": "BULL",
        "predicted_trend": "UP",
        "confidence_score": 2,
        "predicted_price": 178000.0,
        "stop_loss_price": 155000.0,
        "available_amount": null,
        "thesis": "낙폭 과대. 다만 월계획에 없는 종목이다.",
        "scenario_planning_label": "낙관",
        "predicted_trend_label": "상승",
        "security": {
          "id": 9,
          "symbol": "035420",
          "name": "NAVER",
          "current_price": 162000.0
        }
      }
    ]
  },
  "warnings": [
    {
      "kind": "LOAN",
      "severity": "HIGH",
      "loan_id": 3,
      "security": {
        "id": 8,
        "symbol": "000660",
        "name": "SK하이닉스"
      },
      "reasons": [
        "담보비율 131.00% (경고선 140%)",
        "만기까지 20일"
      ]
    }
  ],
  "gaps": [
    {
      "kind": "QUARTERLY_STRATEGY_MISSING",
      "target": {
        "table": "quarterly_investment_plan",
        "id": 3,
        "title": "2026 3분기 반도체 비중 55%"
      },
      "message": "손절전략 이 비어 있다."
    },
    {
      "kind": "MONTHLY_PRINCIPLE_MISSING",
      "target": {
        "table": "monthly_investment_plan",
        "id": 6,
        "title": "8월 비관 시나리오"
      },
      "message": "월투자원칙이 없어 이 계획이 종목에 닿지 않는다. 아래 계층이 끊긴다."
    }
  ],
  "ai_feedback": [
    {
      "id": 6,
      "opinion_type": "SUGGESTION",
      "opinion_type_label": "제안",
      "is_expired": false,
      "table_name": "weekly_investment_plan",
      "object_id": 9,
      "ai_decision": "손익비 약 1.29. 3분할 1차 비중을 낮추면 평균 진입가가 개선된다.",
      "score": 71.0,
      "confidence_score": 64.0,
      "risk_summary": "1차에 비중을 실으면 2·3차 여력이 줄어든다.",
      "valid_until": "2026-08-16",
      "model_name": "claude-opus-5"
    },
    {
      "id": 5,
      "opinion_type": "WARNING",
      "opinion_type_label": "경고",
      "is_expired": false,
      "table_name": "quarterly_investment_plan",
      "object_id": 3,
      "ai_decision": "손절전략이 비어 있다. 나머지 세 전략만으로는 하락 국면에서 기준이 없다.",
      "score": 62.0,
      "confidence_score": 81.0,
      "risk_summary": "분기 손절비율 -5% 도달 시 행동 규칙이 정의돼 있지 않다.",
      "valid_until": "2026-08-23",
      "model_name": "claude-opus-5"
    }
  ],
  "counters": {
    "daily_plan_count": 2,
    "weekly_plan_count": 3,
    "warning_count": 1,
    "gap_count": 2,
    "order_count_today": 2
  },
  "next_action": {
    "kind": "LOAN",
    "message": "담보비율 131.00% (경고선 140%)",
    "goto": {
      "tab": "security"
    }
  }
};

export const securityPlans = {
  "as_of": "2026-08-09",
  "security_id": 9,
  "monthly_plans": [],
  "weekly_plans": [
    {
      "id": 11,
      "title": "NAVER 단기 반등 노림",
      "predicted_price": 178000.0,
      "stop_loss_price": 155000.0,
      "valid_from": "2026-08-03",
      "valid_until": "2026-08-09",
      "daily_plans": []
    }
  ]
};

export const executionCompare = {
  "date_from": "2026-07-10",
  "date_to": "2026-08-09",
  "security_id": null,
  "rows": [
    {
      "order": {
        "id": 7,
        "action_type": "FILL",
        "order_type": "MARKET",
        "side": "BUY",
        "quantity": 10,
        "limit_price": 162000.0,
        "notional": 1620000.0,
        "executed_at": "2026-08-09T04:40:00Z",
        "created_at": "2026-08-09",
        "remarks": "장중 급등 보고 들어감. 월계획에 없는 종목.",
        "action_type_label": "체결",
        "order_type_label": "시장가",
        "side_label": "매수"
      },
      "security": {
        "id": 9,
        "symbol": "035420",
        "name": "NAVER"
      },
      "matched_plans": [
        {
          "id": 11,
          "title": "NAVER 단기 반등 노림",
          "scenario_planning": "BULL",
          "predicted_trend": "UP",
          "predicted_price": 178000.0,
          "stop_loss_price": 155000.0,
          "scenario_planning_label": "낙관",
          "predicted_trend_label": "상승"
        }
      ],
      "flags": [
        {
          "code": "UNGROUNDED_PLAN",
          "severity": "HIGH",
          "message": "주계획은 있지만 어느 월계획에도 매달려 있지 않다. 상위 논리 없이 세운 계획이라 사실상 계획 밖의 매매다."
        }
      ]
    },
    {
      "order": {
        "id": 6,
        "action_type": "FILL",
        "order_type": "LIMIT",
        "side": "BUY",
        "quantity": 40,
        "limit_price": 71000.0,
        "notional": 2840000.0,
        "executed_at": "2026-08-09T01:12:00Z",
        "created_at": "2026-08-09",
        "remarks": "주계획 1차 진입. 계획대로.",
        "action_type_label": "체결",
        "order_type_label": "지정가",
        "side_label": "매수"
      },
      "security": {
        "id": 7,
        "symbol": "005930",
        "name": "삼성전자"
      },
      "matched_plans": [
        {
          "id": 9,
          "title": "삼성전자 이번 주 3분할 1차",
          "scenario_planning": "BASE",
          "predicted_trend": "UP",
          "predicted_price": 76000.0,
          "stop_loss_price": 68000.0,
          "scenario_planning_label": "기본",
          "predicted_trend_label": "상승"
        }
      ],
      "flags": []
    }
  ],
  "summary": {
    "order_count": 2,
    "flagged_count": 1,
    "discipline_rate": 50.0
  }
};

export const performanceSummary = {
  "date_from": "2025-08-09",
  "date_to": "2026-08-09",
  "period_type": null,
  "security_id": null,
  "totals": {
    "realized_profit": 210000.0,
    "unrealized_profit": 1085000.0,
    "dividend_income": 43000.0,
    "interest_cost": 31000.0,
    "commission": 12800.0,
    "tax": 64000.0,
    "etc_cost": 0.0,
    "net_profit": 1230200.0,
    "cost_total": 107800.0,
    "income_total": 1338000.0,
    "cost_bite_pct": 8.06,
    "return_rate": 0.8,
    "benchmark_return_rate": 3.1,
    "excess_return": -2.3,
    "max_drawdown": -6.9,
    "record_count": 2
  },
  "cost_breakdown": [
    {
      "field": "interest_cost",
      "label": "이자비용",
      "value": 31000.0
    },
    {
      "field": "commission",
      "label": "수수료",
      "value": 12800.0
    },
    {
      "field": "tax",
      "label": "세금",
      "value": 64000.0
    },
    {
      "field": "etc_cost",
      "label": "기티비용",
      "value": 0.0
    }
  ],
  "by_security": [
    {
      "security_id": 7,
      "symbol": "005930",
      "name": "삼성전자",
      "net_profit": 1570400.0,
      "return_rate": 6.4,
      "benchmark_return_rate": 3.1,
      "excess_return": 3.3,
      "record_count": 1
    },
    {
      "security_id": 9,
      "symbol": "035420",
      "name": "NAVER",
      "net_profit": -340200.0,
      "return_rate": -4.8,
      "benchmark_return_rate": 3.1,
      "excess_return": -7.9,
      "record_count": 1
    }
  ]
};

export const aiDigest = {
  "as_of": "2026-08-09",
  "valid_count": 2,
  "expired_count": 0,
  "by_opinion_type": {
    "WARNING": 1,
    "SUGGESTION": 1
  }
};

export const aiFeedbackFor = {
  "9": [
    {
      "id": 6,
      "opinion_type": "SUGGESTION",
      "opinion_type_label": "제안",
      "table_name": "weekly_investment_plan",
      "object_id": 9,
      "ai_decision": "손익비 약 1.29. 3분할 1차 비중을 낮추면 평균 진입가가 개선된다.",
      "score": 71.0,
      "confidence_score": 64.0,
      "reasoning_summary": "예상가 76,000 / 손절가 68,000 / 현재가 71,500 기준.",
      "risk_summary": "1차에 비중을 실으면 2·3차 여력이 줄어든다.",
      "valid_until": "2026-08-16",
      "is_expired": false,
      "model": {
        "id": 3,
        "model_name": "claude-opus-5",
        "model_version": "2026-05",
        "prompt_version": "discipline-v3"
      }
    }
  ]
};

export const choices = {
  "market": [
    {
      "value": "KOSPI",
      "label": "코스피"
    },
    {
      "value": "KOSDAQ",
      "label": "코스닥"
    },
    {
      "value": "KONEX",
      "label": "코넥스"
    },
    {
      "value": "NASDAQ",
      "label": "나스닥"
    },
    {
      "value": "NYSE",
      "label": "뉴욕증권거래소"
    },
    {
      "value": "AMEX",
      "label": "아멕스"
    },
    {
      "value": "ETC",
      "label": "기타"
    }
  ],
  "investment_direction": [
    {
      "value": "LONG",
      "label": "매수"
    },
    {
      "value": "SHORT",
      "label": "매도"
    },
    {
      "value": "NEUTRAL",
      "label": "관망"
    },
    {
      "value": "HEDGE",
      "label": "헤지"
    }
  ],
  "market_trend": [
    {
      "value": "UP",
      "label": "상승"
    },
    {
      "value": "DOWN",
      "label": "하락"
    },
    {
      "value": "SIDEWAYS",
      "label": "횡보"
    },
    {
      "value": "VOLATILE",
      "label": "변동성확대"
    }
  ],
  "plan_status": [
    {
      "value": "DRAFT",
      "label": "작성중"
    },
    {
      "value": "ACTIVE",
      "label": "진행중"
    },
    {
      "value": "PAUSED",
      "label": "중단"
    },
    {
      "value": "CLOSED",
      "label": "종료"
    },
    {
      "value": "ABANDONED",
      "label": "폐기"
    }
  ],
  "scenario_planning": [
    {
      "value": "BASE",
      "label": "기본"
    },
    {
      "value": "BULL",
      "label": "낙관"
    },
    {
      "value": "BEAR",
      "label": "비관"
    },
    {
      "value": "STRESS",
      "label": "악재"
    }
  ],
  "asset_type": [
    {
      "value": "STOCK",
      "label": "주식"
    },
    {
      "value": "ETF",
      "label": "ETF"
    },
    {
      "value": "ETN",
      "label": "ETN"
    },
    {
      "value": "REIT",
      "label": "리츠"
    },
    {
      "value": "BOND",
      "label": "채권"
    },
    {
      "value": "FUND",
      "label": "펀드"
    },
    {
      "value": "CASH",
      "label": "현금"
    },
    {
      "value": "CRYPTO",
      "label": "가상자산"
    }
  ],
  "currency": [
    {
      "value": "KRW",
      "label": "원"
    },
    {
      "value": "USD",
      "label": "달러"
    },
    {
      "value": "JPY",
      "label": "엔"
    },
    {
      "value": "EUR",
      "label": "유로"
    },
    {
      "value": "HKD",
      "label": "홍콩달러"
    },
    {
      "value": "CNY",
      "label": "위안"
    }
  ],
  "action_type": [
    {
      "value": "PLAN",
      "label": "계획"
    },
    {
      "value": "ORDER",
      "label": "주문"
    },
    {
      "value": "FILL",
      "label": "체결"
    },
    {
      "value": "CANCEL",
      "label": "취소"
    },
    {
      "value": "REJECT",
      "label": "거부"
    }
  ],
  "order_type": [
    {
      "value": "MARKET",
      "label": "시장가"
    },
    {
      "value": "LIMIT",
      "label": "지정가"
    },
    {
      "value": "STOP",
      "label": "역지정가"
    },
    {
      "value": "STOP_LIMIT",
      "label": "역지정지정가"
    },
    {
      "value": "TRAILING",
      "label": "추적손절"
    }
  ],
  "order_side": [
    {
      "value": "BUY",
      "label": "매수"
    },
    {
      "value": "SELL",
      "label": "매도"
    }
  ],
  "period_type": [
    {
      "value": "DAY",
      "label": "일"
    },
    {
      "value": "WEEK",
      "label": "주"
    },
    {
      "value": "MONTH",
      "label": "월"
    },
    {
      "value": "QUARTER",
      "label": "분기"
    },
    {
      "value": "YEAR",
      "label": "연"
    }
  ],
  "principle_type": [
    {
      "value": "BUY",
      "label": "매수원칙"
    },
    {
      "value": "SELL",
      "label": "매도원칙"
    },
    {
      "value": "RISK",
      "label": "위험관리"
    },
    {
      "value": "VALUATION",
      "label": "가치평가"
    },
    {
      "value": "PORTFOLIO",
      "label": "포트폴리오"
    },
    {
      "value": "MINDSET",
      "label": "태도"
    }
  ],
  "source_type": [
    {
      "value": "BOOK",
      "label": "책"
    },
    {
      "value": "VIDEO",
      "label": "영상"
    },
    {
      "value": "ARTICLE",
      "label": "글"
    },
    {
      "value": "LECTURE",
      "label": "강의"
    },
    {
      "value": "INTERVIEW",
      "label": "인터뷰"
    },
    {
      "value": "PAPER",
      "label": "논문/리포트"
    },
    {
      "value": "ETC",
      "label": "기타"
    }
  ],
  "strategy_type": [
    {
      "value": "BUY_SPLIT",
      "label": "분할매수"
    },
    {
      "value": "SELL_SPLIT",
      "label": "분할매도"
    },
    {
      "value": "ADD_ON",
      "label": "추가매수"
    },
    {
      "value": "TAKE_PROFIT",
      "label": "익절"
    },
    {
      "value": "STOP_LOSS",
      "label": "손절"
    }
  ],
  "valuation_type": [
    {
      "value": "UNDERVALUED",
      "label": "저평가"
    },
    {
      "value": "FAIR",
      "label": "적정"
    },
    {
      "value": "OVERVALUED",
      "label": "고평가"
    }
  ],
  "factor_type": [
    {
      "value": "RATE",
      "label": "금리"
    },
    {
      "value": "FX",
      "label": "환율"
    },
    {
      "value": "COMMODITY",
      "label": "원자재"
    },
    {
      "value": "POLICY",
      "label": "정책/규제"
    },
    {
      "value": "EARNINGS",
      "label": "실적"
    },
    {
      "value": "GEOPOLITICS",
      "label": "지정학"
    },
    {
      "value": "LIQUIDITY",
      "label": "유동성"
    },
    {
      "value": "SENTIMENT",
      "label": "투자심리"
    }
  ],
  "opinion_type": [
    {
      "value": "REVIEW",
      "label": "검토"
    },
    {
      "value": "WARNING",
      "label": "경고"
    },
    {
      "value": "SUGGESTION",
      "label": "제안"
    },
    {
      "value": "APPROVAL",
      "label": "동의"
    },
    {
      "value": "REJECTION",
      "label": "반대"
    }
  ],
  "run_status": [
    {
      "value": "PENDING",
      "label": "대기"
    },
    {
      "value": "RUNNING",
      "label": "실행중"
    },
    {
      "value": "SUCCESS",
      "label": "성공"
    },
    {
      "value": "FAILED",
      "label": "실패"
    },
    {
      "value": "CANCELED",
      "label": "취소"
    }
  ]
};

export const brokerAccounts = [
  {
    "id": 3,
    "is_deleted": false,
    "masked_account_number": "****8901",
    "security_count": 3,
    "broker_name": "미래에셋증권"
  }
];

export const securities = [
  {
    "id": 9,
    "is_deleted": false,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "market": "KOSPI",
    "symbol": "035420",
    "name": "NAVER",
    "asset_type": "STOCK",
    "currency": "KRW",
    "holding_quantity": 25,
    "current_price": "162000.00",
    "sector": "인터넷",
    "is_active": true,
    "account": 3,
    "market_label": "코스피",
    "asset_type_label": "주식",
    "currency_label": "원",
    "market_value": 4050000.0
  },
  {
    "id": 8,
    "is_deleted": false,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "market": "KOSPI",
    "symbol": "000660",
    "name": "SK하이닉스",
    "asset_type": "STOCK",
    "currency": "KRW",
    "holding_quantity": 40,
    "current_price": "183000.00",
    "sector": "반도체",
    "is_active": true,
    "account": 3,
    "market_label": "코스피",
    "asset_type_label": "주식",
    "currency_label": "원",
    "market_value": 7320000.0
  },
  {
    "id": 7,
    "is_deleted": false,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "market": "KOSPI",
    "symbol": "005930",
    "name": "삼성전자",
    "asset_type": "STOCK",
    "currency": "KRW",
    "holding_quantity": 120,
    "current_price": "71500.00",
    "sector": "반도체",
    "is_active": true,
    "account": 3,
    "market_label": "코스피",
    "asset_type_label": "주식",
    "currency_label": "원",
    "market_value": 8580000.0
  }
];

export const loans = [
  {
    "id": 3,
    "is_deleted": false,
    "security_detail": {
      "id": 8,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "183000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "days_to_maturity": 20,
    "principal_amount": "5000000.00",
    "interest_rate": "6.20",
    "opened_at": "2026-05-11",
    "maturity_at": "2026-08-29",
    "quantity": 40,
    "reference_price": "183000.00",
    "collateral_value": "7320000.00",
    "collateral_ratio": "131.00",
    "evaluated_at": null,
    "security": 8
  }
];

export const priceData = [
  {
    "id": 3,
    "is_deleted": false,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "price_at": "2026-08-09T09:30:00+09:00",
    "high_price": "72400.00",
    "low_price": "70800.00",
    "quote_price": "71500.00",
    "security": 7
  }
];

export const annualPlans = [
  {
    "id": 3,
    "is_deleted": false,
    "account_detail": {
      "id": 3,
      "broker_name": "미래에셋증권",
      "masked_account_number": "****8901"
    },
    "quarterly_count": 1,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "market": "KOSPI",
    "title": "2026 반도체 사이클 상반기 비중확대",
    "thesis": "메모리 감산 효과가 재고 정상화로 이어지는 구간. 사이클 초입에서 비중을 싣는다.",
    "direction": "LONG",
    "status": "ACTIVE",
    "valid_from": "2026-01-01",
    "valid_until": "2026-12-31",
    "target_return_ratio": "18.00",
    "stop_loss_ratio": "-8.00",
    "account": 3,
    "market_label": "코스피",
    "direction_label": "매수",
    "status_label": "진행중",
    "period_label": "2026.01.01 ~ 2026.12.31",
    "is_current": true
  }
];

export const quarterlyPlans = [
  {
    "id": 3,
    "is_deleted": false,
    "annual_plan_detail": {
      "id": 3,
      "title": "2026 반도체 사이클 상반기 비중확대",
      "market": "KOSPI",
      "direction": "LONG",
      "status": "ACTIVE",
      "valid_from": "2026-01-01",
      "valid_until": "2026-12-31",
      "market_label": "코스피",
      "direction_label": "매수",
      "status_label": "진행중"
    },
    "monthly_count": 2,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "title": "2026 3분기 반도체 비중 55%",
    "rebalancing_ratio": {
      "005930": 30,
      "000660": 25,
      "CASH": 45
    },
    "rebalancing_start_date": "2026-07-01",
    "rebalancing_end_date": "2026-07-15",
    "buy_strategy": "20일선 지지 확인 후 3분할. 1차 -3%, 2차 -7%, 3차 -12%.",
    "sell_strategy": "목표가 도달 시 절반, 나머지는 추세 이탈까지 보유.",
    "sideways_strategy": "2주 이상 횡보하면 신규 매수 중단, 현금 비중 유지.",
    "stop_loss_strategy": null,
    "direction": "LONG",
    "thesis": "분기 실적 발표에서 재고 감소가 확인되는지가 분기점.",
    "valid_from": "2026-07-01",
    "valid_until": "2026-09-30",
    "target_return_ratio": "6.00",
    "stop_loss_ratio": "-5.00",
    "annual_plan": 3,
    "direction_label": "매수",
    "period_label": "2026.07.01 ~ 2026.09.30",
    "is_current": true,
    "strategy_coverage": {
      "buy": true,
      "sell": true,
      "sideways": true,
      "stop_loss": false
    }
  }
];

export const monthlyPlans = [
  {
    "id": 5,
    "is_deleted": false,
    "quarterly_plan_detail": {
      "id": 3,
      "title": "2026 3분기 반도체 비중 55%",
      "direction": "LONG",
      "valid_from": "2026-07-01",
      "valid_until": "2026-09-30",
      "annual_plan": 3,
      "direction_label": "매수"
    },
    "principle_count": 2,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "title": "8월 기본 시나리오",
    "scenario_planning": "BASE",
    "predicted_trend": "UP",
    "thesis": "완만한 상승. 조정 시 분할 매수로 비중을 채운다.",
    "confidence_score": 4,
    "allocation_ratio": {
      "005930": 30,
      "000660": 25,
      "CASH": 45
    },
    "valid_from": "2026-08-01",
    "valid_until": "2026-08-31",
    "quarterly_plan": 3,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "상승",
    "period_label": "2026.08.01 ~ 2026.08.31",
    "is_current": true
  },
  {
    "id": 6,
    "is_deleted": false,
    "quarterly_plan_detail": {
      "id": 3,
      "title": "2026 3분기 반도체 비중 55%",
      "direction": "LONG",
      "valid_from": "2026-07-01",
      "valid_until": "2026-09-30",
      "annual_plan": 3,
      "direction_label": "매수"
    },
    "principle_count": 0,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "title": "8월 비관 시나리오",
    "scenario_planning": "BEAR",
    "predicted_trend": "DOWN",
    "thesis": "금리 재상승 시 밸류에이션 압축. 현금 비중을 60%까지 올린다.",
    "confidence_score": 2,
    "allocation_ratio": {
      "005930": 20,
      "CASH": 60
    },
    "valid_from": "2026-08-01",
    "valid_until": "2026-08-31",
    "quarterly_plan": 3,
    "scenario_planning_label": "비관",
    "predicted_trend_label": "하락",
    "period_label": "2026.08.01 ~ 2026.08.31",
    "is_current": true
  }
];

export const weeklyPlans = [
  {
    "id": 11,
    "is_deleted": false,
    "security_detail": {
      "id": 9,
      "symbol": "035420",
      "name": "NAVER",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "인터넷",
      "current_price": "162000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "daily_count": 0,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "title": "NAVER 단기 반등 노림",
    "scenario_planning": "BULL",
    "available_amount": null,
    "predicted_trend": "UP",
    "thesis": "낙폭 과대. 다만 월계획에 없는 종목이다.",
    "confidence_score": 2,
    "allocation_ratio": null,
    "valid_from": "2026-08-03",
    "valid_until": "2026-08-09",
    "predicted_price": "178000.00",
    "stop_loss_price": "155000.00",
    "security": 9,
    "scenario_planning_label": "낙관",
    "predicted_trend_label": "상승",
    "period_label": "2026.08.03 ~ 2026.08.09",
    "is_current": true,
    "risk_reward": 2.29
  },
  {
    "id": 10,
    "is_deleted": false,
    "security_detail": {
      "id": 8,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "183000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "daily_count": 1,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "title": "SK하이닉스 관망",
    "scenario_planning": "BASE",
    "available_amount": "2000000.00",
    "predicted_trend": "SIDEWAYS",
    "thesis": "180,000 ~ 195,000 박스. 이탈 확인 전까지 신규 진입 없음.",
    "confidence_score": 3,
    "allocation_ratio": {
      "000660": 100
    },
    "valid_from": "2026-08-03",
    "valid_until": "2026-08-09",
    "predicted_price": "196000.00",
    "stop_loss_price": "176000.00",
    "security": 8,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "횡보",
    "period_label": "2026.08.03 ~ 2026.08.09",
    "is_current": true,
    "risk_reward": 1.86
  },
  {
    "id": 9,
    "is_deleted": false,
    "security_detail": {
      "id": 7,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "71500.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "daily_count": 1,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "title": "삼성전자 이번 주 3분할 1차",
    "scenario_planning": "BASE",
    "available_amount": "3000000.00",
    "predicted_trend": "UP",
    "thesis": "70,000 지지 확인. 여기서 1차 진입.",
    "confidence_score": 4,
    "allocation_ratio": {
      "005930": 100
    },
    "valid_from": "2026-08-03",
    "valid_until": "2026-08-09",
    "predicted_price": "76000.00",
    "stop_loss_price": "68000.00",
    "security": 7,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "상승",
    "period_label": "2026.08.03 ~ 2026.08.09",
    "is_current": true,
    "risk_reward": 1.29
  }
];

export const dailyPlans = [
  {
    "id": 6,
    "is_deleted": false,
    "weekly_plan_detail": {
      "id": 10,
      "title": "SK하이닉스 관망",
      "security": 8,
      "scenario_planning": "BASE",
      "predicted_trend": "SIDEWAYS",
      "confidence_score": 3,
      "predicted_price": "196000.00",
      "stop_loss_price": "176000.00",
      "valid_from": "2026-08-03",
      "valid_until": "2026-08-09",
      "scenario_planning_label": "기본",
      "predicted_trend_label": "횡보"
    },
    "security_detail": {
      "id": 8,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "183000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "title": "오늘 관망",
    "scenario_planning": "BASE",
    "predicted_trend": "SIDEWAYS",
    "thesis": "박스 상단까지 아무것도 하지 않는다.",
    "confidence_score": 3,
    "allocation_ratio": null,
    "valid_from": "2026-08-09",
    "valid_until": "2026-08-09",
    "predicted_price": null,
    "stop_loss_price": "176000.00",
    "weekly_plan": 10,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "횡보",
    "period_label": "2026.08.09 ~ 2026.08.09",
    "is_current": true
  },
  {
    "id": 5,
    "is_deleted": false,
    "weekly_plan_detail": {
      "id": 9,
      "title": "삼성전자 이번 주 3분할 1차",
      "security": 7,
      "scenario_planning": "BASE",
      "predicted_trend": "UP",
      "confidence_score": 4,
      "predicted_price": "76000.00",
      "stop_loss_price": "68000.00",
      "valid_from": "2026-08-03",
      "valid_until": "2026-08-09",
      "scenario_planning_label": "기본",
      "predicted_trend_label": "상승"
    },
    "security_detail": {
      "id": 7,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "71500.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "title": "오늘 1차 매수",
    "scenario_planning": "BASE",
    "predicted_trend": "UP",
    "thesis": "시가 대비 -1% 이탈 시 지정가 71,000 으로 1/3 진입.",
    "confidence_score": 4,
    "allocation_ratio": null,
    "valid_from": "2026-08-09",
    "valid_until": "2026-08-09",
    "predicted_price": "73000.00",
    "stop_loss_price": "68000.00",
    "weekly_plan": 9,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "상승",
    "period_label": "2026.08.09 ~ 2026.08.09",
    "is_current": true
  }
];

export const mandatoryPrinciples = [
  {
    "id": 12,
    "is_deleted": false,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "priority": 1,
    "content": "계획에 없는 종목은 사지 않는다."
  },
  {
    "id": 13,
    "is_deleted": false,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "priority": 2,
    "content": "손절가는 사기 전에 정하고, 정한 뒤에는 내리지 않는다."
  },
  {
    "id": 14,
    "is_deleted": false,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "priority": 3,
    "content": "한 종목에 총자산의 20%를 넘기지 않는다."
  },
  {
    "id": 15,
    "is_deleted": false,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "priority": 4,
    "content": "물타기는 미리 적어 둔 n차 분할표 안에서만 한다."
  },
  {
    "id": 16,
    "is_deleted": false,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "priority": 5,
    "content": "장중에 계획을 바꾸지 않는다. 바꾸려면 장 끝나고 근거를 적는다."
  }
];

export const principleSources = [
  {
    "id": 3,
    "is_deleted": false,
    "principle_count": 2,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "name": "현명한 투자자",
    "source_type": "BOOK",
    "url": null,
    "content": "벤저민 그레이엄. 안전마진과 미스터 마켓.",
    "source_type_label": "책"
  }
];

export const investmentPrinciples = [
  {
    "id": 6,
    "is_deleted": false,
    "source_detail": {
      "id": 3,
      "name": "현명한 투자자",
      "source_type": "BOOK",
      "url": null,
      "source_type_label": "책"
    },
    "has_cautions": true,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "teacher_name": "벤저민 그레이엄",
    "principle_type": "MINDSET",
    "content": "시장은 하인이지 주인이 아니다.",
    "rationale": "가격은 매일 제시될 뿐, 받아들일 의무는 없다.",
    "cautions": "유동성이 마르는 국면에서는 '무시'가 곧 탈출 기회 상실이 된다.",
    "source": 3,
    "principle_type_label": "태도"
  },
  {
    "id": 5,
    "is_deleted": false,
    "source_detail": {
      "id": 3,
      "name": "현명한 투자자",
      "source_type": "BOOK",
      "url": null,
      "source_type_label": "책"
    },
    "has_cautions": true,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "teacher_name": "벤저민 그레이엄",
    "principle_type": "VALUATION",
    "content": "내재가치보다 충분히 싸게 살 것 — 안전마진.",
    "rationale": "추정이 틀려도 손실을 흡수할 여유가 가격에 이미 들어 있어야 한다.",
    "cautions": "성장주에는 내재가치 추정 자체가 흔들려서 안전마진 계산이 무의미해질 수 있다.",
    "source": 3,
    "principle_type_label": "가치평가"
  }
];

export const quarterlyPrinciples = [
  {
    "id": 3,
    "is_deleted": false,
    "security_detail": {
      "id": 7,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "71500.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "metric_groups": {
      "성장성": [
        {
          "field": "revenue",
          "label": "매출액",
          "value": 74000000.0
        },
        {
          "field": "revenue_growth_rate",
          "label": "매출증가율",
          "value": 12.4
        },
        {
          "field": "new_orders_amount",
          "label": "신규 수주액",
          "value": 8200000.0
        },
        {
          "field": "order_backlog",
          "label": "수주잔고",
          "value": 15300000.0
        }
      ],
      "수익성": [
        {
          "field": "operating_margin",
          "label": "영업이익률",
          "value": 14.8
        },
        {
          "field": "net_income",
          "label": "순이익",
          "value": 9600000.0
        },
        {
          "field": "roe",
          "label": "ROE",
          "value": 9.1
        },
        {
          "field": "roic",
          "label": "ROIC",
          "value": 8.4
        }
      ],
      "현금·안정성": [
        {
          "field": "free_cash_flow",
          "label": "잉여현금흐름",
          "value": 5100000.0
        },
        {
          "field": "cash_conversion_rate",
          "label": "현금전환율",
          "value": 68.0
        },
        {
          "field": "interest_coverage_ratio",
          "label": "이자보상배율",
          "value": 22.3
        }
      ],
      "가격": [
        {
          "field": "per",
          "label": "PER",
          "value": 14.2
        },
        {
          "field": "pbr",
          "label": "PBR",
          "value": 1.31
        },
        {
          "field": "ev_ebitda",
          "label": "EV/EBITDA",
          "value": 5.8
        },
        {
          "field": "psr",
          "label": "PSR",
          "value": 1.42
        },
        {
          "field": "fcf_yield",
          "label": "FCF수익률",
          "value": 4.1
        }
      ]
    },
    "predicted_price": "84000.00",
    "stop_loss_price": "66000.00",
    "revenue": "74000000.00",
    "revenue_growth_rate": "12.40",
    "new_orders_amount": "8200000.00",
    "order_backlog": "15300000.00",
    "operating_margin": "14.80",
    "net_income": "9600000.00",
    "roe": "9.10",
    "roic": "8.40",
    "free_cash_flow": "5100000.00",
    "cash_conversion_rate": "68.00",
    "interest_coverage_ratio": "22.30",
    "per": "14.20",
    "pbr": "1.31",
    "ev_ebitda": "5.80",
    "psr": "1.42",
    "fcf_yield": "4.10",
    "valuation_type": "UNDERVALUED",
    "performance_summary": "메모리 재고 정상화 진행. 파운드리 적자폭 축소.",
    "quarterly_plan": 3,
    "security": 7,
    "valuation_type_label": "저평가",
    "filled_ratio": 1.0
  }
];

export const monthlyPrinciples = [
  {
    "id": 7,
    "is_deleted": false,
    "security_detail": {
      "id": 8,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "183000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "upside_ratio": 17.49,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "direction": "LONG",
    "rationale": "HBM3E 공급 계약 물량이 내년 상반기까지 확보돼 있다.",
    "predicted_price": "215000.00",
    "stop_loss_price": "168000.00",
    "monthly_plan": 5,
    "security": 8,
    "direction_label": "매수"
  },
  {
    "id": 6,
    "is_deleted": false,
    "security_detail": {
      "id": 7,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "71500.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "upside_ratio": 17.48,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "direction": "LONG",
    "rationale": "HBM 비중 확대와 파운드리 가동률 회복이 동시에 잡히는 구간.",
    "predicted_price": "84000.00",
    "stop_loss_price": "66000.00",
    "monthly_plan": 5,
    "security": 7,
    "direction_label": "매수"
  }
];

export const marketDirections = [
  {
    "id": 3,
    "is_deleted": false,
    "affected_count": 2,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "direction": "UP",
    "factor_type": "RATE",
    "content": "연준 금리 인하 기대가 반도체 밸류에이션에 우호적으로 작용.",
    "rationale": "10년물이 3개월간 60bp 하락. 성장주 할인율 부담 완화.",
    "factor_value": "3.85",
    "affected_targets": {
      "sectors": [
        "반도체"
      ],
      "indices": [
        "KOSPI"
      ]
    },
    "direction_label": "상승",
    "factor_type_label": "금리"
  }
];

export const strategies = [
  {
    "id": 3,
    "is_deleted": false,
    "price_data_detail": {
      "id": 3,
      "security": 7,
      "price_at": "2026-08-09T09:30:00+09:00",
      "high_price": "72400.00",
      "low_price": "70800.00",
      "quote_price": "71500.00"
    },
    "method_count": 5,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "policy_name": "삼성전자 3분할 매수",
    "sector": "반도체",
    "reference_at": "2026-08-09T09:30:00+09:00",
    "price_data": 3
  }
];

export const strategyDetail = {
  "id": 3,
  "is_deleted": false,
  "price_data_detail": {
    "id": 3,
    "security": 7,
    "price_at": "2026-08-09T09:30:00+09:00",
    "high_price": "72400.00",
    "low_price": "70800.00",
    "quote_price": "71500.00"
  },
  "method_count": 5,
  "methods": {
    "BUY_SPLIT": [
      {
        "id": 11,
        "is_deleted": false,
        "created_at": "2026-08-09",
        "updated_at": "2026-08-09",
        "remarks": null,
        "strategy_type": "BUY_SPLIT",
        "step_no": 1,
        "price_ratio": "-3.00",
        "quantity_ratio": "30.00",
        "sector": "반도체",
        "strategy": 3,
        "strategy_type_label": "분할매수"
      },
      {
        "id": 12,
        "is_deleted": false,
        "created_at": "2026-08-09",
        "updated_at": "2026-08-09",
        "remarks": null,
        "strategy_type": "BUY_SPLIT",
        "step_no": 2,
        "price_ratio": "-7.00",
        "quantity_ratio": "30.00",
        "sector": "반도체",
        "strategy": 3,
        "strategy_type_label": "분할매수"
      },
      {
        "id": 13,
        "is_deleted": false,
        "created_at": "2026-08-09",
        "updated_at": "2026-08-09",
        "remarks": null,
        "strategy_type": "BUY_SPLIT",
        "step_no": 3,
        "price_ratio": "-12.00",
        "quantity_ratio": "40.00",
        "sector": "반도체",
        "strategy": 3,
        "strategy_type_label": "분할매수"
      }
    ],
    "SELL_SPLIT": [
      {
        "id": 14,
        "is_deleted": false,
        "created_at": "2026-08-09",
        "updated_at": "2026-08-09",
        "remarks": null,
        "strategy_type": "SELL_SPLIT",
        "step_no": 1,
        "price_ratio": "8.00",
        "quantity_ratio": "50.00",
        "sector": "반도체",
        "strategy": 3,
        "strategy_type_label": "분할매도"
      },
      {
        "id": 15,
        "is_deleted": false,
        "created_at": "2026-08-09",
        "updated_at": "2026-08-09",
        "remarks": null,
        "strategy_type": "SELL_SPLIT",
        "step_no": 2,
        "price_ratio": "15.00",
        "quantity_ratio": "50.00",
        "sector": "반도체",
        "strategy": 3,
        "strategy_type_label": "분할매도"
      }
    ]
  },
  "created_at": "2026-08-09",
  "updated_at": "2026-08-09",
  "remarks": null,
  "policy_name": "삼성전자 3분할 매수",
  "sector": "반도체",
  "reference_at": "2026-08-09T09:30:00+09:00",
  "price_data": 3
};

export const orders = [
  {
    "id": 7,
    "is_deleted": false,
    "security_detail": {
      "id": 9,
      "symbol": "035420",
      "name": "NAVER",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "인터넷",
      "current_price": "162000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "action_type": "FILL",
    "order_type": "MARKET",
    "side": "BUY",
    "quantity": 10,
    "limit_price": "162000.00",
    "executed_at": "2026-08-09T13:40:00+09:00",
    "created_at": "2026-08-09",
    "remarks": "장중 급등 보고 들어감. 월계획에 없는 종목.",
    "security": 9,
    "action_type_label": "체결",
    "order_type_label": "시장가",
    "side_label": "매수",
    "notional": 1620000.0
  },
  {
    "id": 6,
    "is_deleted": false,
    "security_detail": {
      "id": 7,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "71500.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "action_type": "FILL",
    "order_type": "LIMIT",
    "side": "BUY",
    "quantity": 40,
    "limit_price": "71000.00",
    "executed_at": "2026-08-09T10:12:00+09:00",
    "created_at": "2026-08-09",
    "remarks": "주계획 1차 진입. 계획대로.",
    "security": 7,
    "action_type_label": "체결",
    "order_type_label": "지정가",
    "side_label": "매수",
    "notional": 2840000.0
  }
];

export const performanceRecords = [
  {
    "id": 6,
    "is_deleted": false,
    "security_detail": {
      "id": 9,
      "symbol": "035420",
      "name": "NAVER",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "인터넷",
      "current_price": "162000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "cost_breakdown": [
      {
        "field": "interest_cost",
        "label": "이자비용",
        "value": 31000.0
      },
      {
        "field": "commission",
        "label": "수수료",
        "value": 4200.0
      },
      {
        "field": "tax",
        "label": "세금",
        "value": 0.0
      },
      {
        "field": "etc_cost",
        "label": "기티비용",
        "value": 0.0
      }
    ],
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "period_type": "MONTH",
    "period_start": "2026-08-01",
    "period_end": "2026-08-31",
    "realized_profit": "-210000.00",
    "unrealized_profit": "-95000.00",
    "dividend_income": "0.00",
    "interest_cost": "31000.00",
    "commission": "4200.00",
    "tax": "0.00",
    "etc_cost": "0.00",
    "net_profit": "-340200.00",
    "return_rate": "-4.80",
    "benchmark_return_rate": "3.10",
    "max_drawdown": "-9.60",
    "security": 9,
    "period_type_label": "월",
    "total_cost": 35200.0,
    "excess_return": -7.9
  },
  {
    "id": 5,
    "is_deleted": false,
    "security_detail": {
      "id": 7,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "71500.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "cost_breakdown": [
      {
        "field": "interest_cost",
        "label": "이자비용",
        "value": 0.0
      },
      {
        "field": "commission",
        "label": "수수료",
        "value": 8600.0
      },
      {
        "field": "tax",
        "label": "세금",
        "value": 64000.0
      },
      {
        "field": "etc_cost",
        "label": "기티비용",
        "value": 0.0
      }
    ],
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "period_type": "MONTH",
    "period_start": "2026-08-01",
    "period_end": "2026-08-31",
    "realized_profit": "420000.00",
    "unrealized_profit": "1180000.00",
    "dividend_income": "43000.00",
    "interest_cost": "0.00",
    "commission": "8600.00",
    "tax": "64000.00",
    "etc_cost": "0.00",
    "net_profit": "1570400.00",
    "return_rate": "6.40",
    "benchmark_return_rate": "3.10",
    "max_drawdown": "-4.20",
    "security": 7,
    "period_type_label": "월",
    "total_cost": 72600.0,
    "excess_return": 3.3
  }
];

export const aiModelRuns = [
  {
    "id": 3,
    "is_deleted": false,
    "feedback_count": 2,
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "model_name": "claude-opus-5",
    "model_version": "2026-05",
    "prompt_version": "discipline-v3",
    "started_at": "2026-08-09T08:00:00+09:00",
    "completed_at": "2026-08-09T08:00:14+09:00",
    "output_json": {
      "verdict": "plan_ok",
      "notes": 2
    },
    "status": "SUCCESS",
    "status_label": "성공",
    "duration_seconds": 14.0
  }
];

export const aiFeedback = [
  {
    "id": 6,
    "is_deleted": false,
    "model_detail": {
      "id": 3,
      "model_name": "claude-opus-5",
      "model_version": "2026-05",
      "prompt_version": "discipline-v3",
      "status": "SUCCESS",
      "started_at": "2026-08-09T08:00:00+09:00",
      "status_label": "성공"
    },
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "opinion_type": "SUGGESTION",
    "object_id": 9,
    "table_name": "weekly_investment_plan",
    "ai_decision": "손익비 약 1.29. 3분할 1차 비중을 낮추면 평균 진입가가 개선된다.",
    "score": "71.00",
    "confidence_score": "64.00",
    "reasoning_summary": "예상가 76,000 / 손절가 68,000 / 현재가 71,500 기준.",
    "risk_summary": "1차에 비중을 실으면 2·3차 여력이 줄어든다.",
    "valid_until": "2026-08-16",
    "model": 3,
    "opinion_type_label": "제안",
    "is_expired": false
  },
  {
    "id": 5,
    "is_deleted": false,
    "model_detail": {
      "id": 3,
      "model_name": "claude-opus-5",
      "model_version": "2026-05",
      "prompt_version": "discipline-v3",
      "status": "SUCCESS",
      "started_at": "2026-08-09T08:00:00+09:00",
      "status_label": "성공"
    },
    "created_at": "2026-08-09",
    "updated_at": "2026-08-09",
    "remarks": null,
    "opinion_type": "WARNING",
    "object_id": 3,
    "table_name": "quarterly_investment_plan",
    "ai_decision": "손절전략이 비어 있다. 나머지 세 전략만으로는 하락 국면에서 기준이 없다.",
    "score": "62.00",
    "confidence_score": "81.00",
    "reasoning_summary": "매수·매도·횡보 전략은 기재됐으나 손절 기준이 없다.",
    "risk_summary": "분기 손절비율 -5% 도달 시 행동 규칙이 정의돼 있지 않다.",
    "valid_until": "2026-08-23",
    "model": 3,
    "opinion_type_label": "경고",
    "is_expired": false
  }
];
