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
  "as_of": "2026-08-12",
  "account_id": null,
  "only_active": true,
  "tree": [
    {
      "id": 1,
      "level": "YEAR",
      "title": "코스피 12000 버티자",
      "market": "KOSPI",
      "direction": "LONG",
      "status": "ACTIVE",
      "thesis": "하이닉스, 삼전 반도체 실적 기반",
      "target_return_ratio": 100.0,
      "stop_loss_ratio": 50.0,
      "valid_from": "2026-08-11",
      "valid_until": "2026-12-31",
      "market_label": "코스피",
      "direction_label": "매수",
      "status_label": "진행중",
      "account": {
        "id": 1,
        "broker_name": "NH나무",
        "account_number": "****2514"
      },
      "children": [
        {
          "id": 1,
          "level": "QUARTER",
          "title": "코스피 7500 버티자",
          "direction": "SHORT",
          "thesis": "하이닉스, 삼전 하락에서 복구..! 주주환원 기대",
          "rebalancing_ratio": null,
          "strategy_coverage": {
            "buy": false,
            "sell": false,
            "sideways": false,
            "stop_loss": false
          },
          "strategies": {
            "buy": null,
            "sell": null,
            "sideways": null,
            "stop_loss": null
          },
          "target_return_ratio": null,
          "stop_loss_ratio": null,
          "valid_from": "2026-08-11",
          "valid_until": "2026-08-31",
          "direction_label": "매도",
          "securities": [
            {
              "id": 1,
              "symbol": "005930",
              "name": "삼성전자",
              "market": "KOSPI",
              "sector": "반도체",
              "current_price": 256000.0,
              "principle_id": 1
            },
            {
              "id": 2,
              "symbol": "000660",
              "name": "SK하이닉스",
              "market": "KOSPI",
              "sector": "반도체",
              "current_price": 1505000.0,
              "principle_id": 2
            }
          ],
          "children": [
            {
              "id": 1,
              "level": "MONTH",
              "title": "8월 버티면",
              "scenario_planning": "BASE",
              "predicted_trend": "UP",
              "confidence_score": 3,
              "allocation_ratio": null,
              "thesis": "유동성 줄고, 실적 기반 코스피",
              "valid_from": "2026-08-11",
              "valid_until": "2026-08-31",
              "scenario_planning_label": "기본",
              "predicted_trend_label": "상승",
              "securities": [
                {
                  "id": 1,
                  "symbol": "005930",
                  "name": "삼성전자",
                  "market": "KOSPI",
                  "sector": "반도체",
                  "current_price": 256000.0,
                  "principle_id": 1
                },
                {
                  "id": 2,
                  "symbol": "000660",
                  "name": "SK하이닉스",
                  "market": "KOSPI",
                  "sector": "반도체",
                  "current_price": 1505000.0,
                  "principle_id": 2
                }
              ],
              "children": [
                {
                  "id": 1,
                  "level": "WEEK",
                  "title": "관망과 대응",
                  "monthly_plan_id": 1,
                  "scenario_planning": "BASE",
                  "predicted_trend": "UP",
                  "confidence_score": 3,
                  "thesis": "환원소식, 유동성 축소, 전반적인 호재 뉴스",
                  "valid_from": "2026-08-11",
                  "valid_until": "2026-08-14",
                  "scenario_planning_label": "기본",
                  "predicted_trend_label": "상승",
                  "children": [
                    {
                      "id": 1,
                      "level": "WEEKLY_SECURITY",
                      "title": "삼전 버티기",
                      "security": {
                        "id": 1,
                        "symbol": "005930",
                        "name": "삼성전자",
                        "market": "KOSPI",
                        "sector": "반도체",
                        "current_price": 256000.0
                      },
                      "weekly_plan_id": 1,
                      "scenario_planning": "BASE",
                      "predicted_trend": "SIDEWAYS",
                      "confidence_score": 3,
                      "available_amount": 10000000.0,
                      "predicted_price": null,
                      "stop_loss_price": null,
                      "risk_reward": null,
                      "thesis": "회복, 주주환원 뉴스, 금리 동결, 전쟁 완화",
                      "scenario_planning_label": "기본",
                      "predicted_trend_label": "횡보",
                      "children": [
                        {
                          "id": 1,
                          "level": "DAY",
                          "title": "주식 상승이네(금리 동결 준비)",
                          "scenario_planning": "BASE",
                          "predicted_trend": "SIDEWAYS",
                          "confidence_score": 3,
                          "predicted_price": null,
                          "stop_loss_price": null,
                          "thesis": "다 오르고 뒤늦게 235,000 매입 시도\n다른 가격에라도 사라\n=> 오늘 저녁 9시 연준 기준금리 동결 예상(역대급 실업률)",
                          "valid_from": "2026-08-12",
                          "valid_until": "2026-08-12",
                          "scenario_planning_label": "기본",
                          "predicted_trend_label": "횡보"
                        },
                        {
                          "id": 3,
                          "level": "DAY",
                          "title": "연준 금리 동결(인상하지 않음-실업률 심각 하락)",
                          "scenario_planning": "BULL",
                          "predicted_trend": "UP",
                          "confidence_score": 4,
                          "predicted_price": 265000.0,
                          "stop_loss_price": 170000.0,
                          "thesis": "8.12 오후 9시 연준 금리 하락",
                          "valid_from": "2026-08-13",
                          "valid_until": "2026-08-13",
                          "scenario_planning_label": "낙관",
                          "predicted_trend_label": "상승"
                        }
                      ]
                    },
                    {
                      "id": 2,
                      "level": "WEEKLY_SECURITY",
                      "title": "주주환원해라 제발",
                      "security": {
                        "id": 2,
                        "symbol": "000660",
                        "name": "SK하이닉스",
                        "market": "KOSPI",
                        "sector": "반도체",
                        "current_price": 1505000.0
                      },
                      "weekly_plan_id": 1,
                      "scenario_planning": "BASE",
                      "predicted_trend": "SIDEWAYS",
                      "confidence_score": 3,
                      "available_amount": 10000000.0,
                      "predicted_price": null,
                      "stop_loss_price": null,
                      "risk_reward": null,
                      "thesis": "회복, 주주환원 뉴스, 금리 동결, 전쟁 완화",
                      "scenario_planning_label": "기본",
                      "predicted_trend_label": "횡보",
                      "children": [
                        {
                          "id": 2,
                          "level": "DAY",
                          "title": "다 오르고 시도(금리 동결 준비)",
                          "scenario_planning": "BASE",
                          "predicted_trend": "SIDEWAYS",
                          "confidence_score": 3,
                          "predicted_price": 1500000.0,
                          "stop_loss_price": null,
                          "thesis": "1,479,000 4주 매입 시도\n=> 오늘 저녁 9시 연준 기준금리 동결 예상(역대급 실업률)\n다른 가격에라도 사라 => 오늘 저녁 9시 연준 기준금리",
                          "valid_from": "2026-08-12",
                          "valid_until": "2026-08-12",
                          "scenario_planning_label": "기본",
                          "predicted_trend_label": "횡보"
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "counts": {
    "annual": 1,
    "weekly_total": 1,
    "weekly_security_total": 2
  }
};

export const homeBoard = {
  "as_of": "2026-08-12",
  "mandatory_principles": [
    {
      "id": 1,
      "priority": 1,
      "content": "주식은 의심의 연속, 근거 몇개?-행동\n본질을 보아라\n당장 급할때는 확신보다는 의심의 배반, 근거의 연속"
    },
    {
      "id": 2,
      "priority": 2,
      "content": "공포 경험을 되새기고 공포에 사지 말고, 환희 경험을 되새기고 자만하지 마라"
    },
    {
      "id": 3,
      "priority": 3,
      "content": "10시 이후에 거래를 시작한다"
    },
    {
      "id": 5,
      "priority": 5,
      "content": "금리가 최고의 방향이다. 9월 금리에 대해 민감하게 반응"
    },
    {
      "id": 4,
      "priority": null,
      "content": "코스피는 올해 최대 10,000까지 상승한다"
    }
  ],
  "plans": {
    "daily": [
      {
        "id": 1,
        "title": "주식 상승이네(금리 동결 준비)",
        "scenario_planning": "BASE",
        "predicted_trend": "SIDEWAYS",
        "confidence_score": 3,
        "predicted_price": null,
        "stop_loss_price": null,
        "thesis": "다 오르고 뒤늦게 235,000 매입 시도\n다른 가격에라도 사라\n=> 오늘 저녁 9시 연준 기준금리 동결 예상(역대급 실업률)",
        "scenario_planning_label": "기본",
        "predicted_trend_label": "횡보",
        "security": {
          "id": 1,
          "symbol": "005930",
          "name": "삼성전자",
          "current_price": 256000.0
        }
      },
      {
        "id": 2,
        "title": "다 오르고 시도(금리 동결 준비)",
        "scenario_planning": "BASE",
        "predicted_trend": "SIDEWAYS",
        "confidence_score": 3,
        "predicted_price": 1500000.0,
        "stop_loss_price": null,
        "thesis": "1,479,000 4주 매입 시도\n=> 오늘 저녁 9시 연준 기준금리 동결 예상(역대급 실업률)\n다른 가격에라도 사라 => 오늘 저녁 9시 연준 기준금리",
        "scenario_planning_label": "기본",
        "predicted_trend_label": "횡보",
        "security": {
          "id": 2,
          "symbol": "000660",
          "name": "SK하이닉스",
          "current_price": 1505000.0
        }
      }
    ],
    "weekly": [
      {
        "id": 1,
        "title": "삼전 버티기",
        "scenario_planning": "BASE",
        "predicted_trend": "SIDEWAYS",
        "confidence_score": 3,
        "predicted_price": null,
        "stop_loss_price": null,
        "available_amount": 10000000.0,
        "thesis": "회복, 주주환원 뉴스, 금리 동결, 전쟁 완화",
        "scenario_planning_label": "기본",
        "predicted_trend_label": "횡보",
        "security": {
          "id": 1,
          "symbol": "005930",
          "name": "삼성전자",
          "current_price": 256000.0
        }
      },
      {
        "id": 2,
        "title": "주주환원해라 제발",
        "scenario_planning": "BASE",
        "predicted_trend": "SIDEWAYS",
        "confidence_score": 3,
        "predicted_price": null,
        "stop_loss_price": null,
        "available_amount": 10000000.0,
        "thesis": "회복, 주주환원 뉴스, 금리 동결, 전쟁 완화",
        "scenario_planning_label": "기본",
        "predicted_trend_label": "횡보",
        "security": {
          "id": 2,
          "symbol": "000660",
          "name": "SK하이닉스",
          "current_price": 1505000.0
        }
      }
    ]
  },
  "warnings": [],
  "gaps": [
    {
      "kind": "QUARTERLY_STRATEGY_MISSING",
      "target": {
        "table": "quarterly_investment_plan",
        "id": 1,
        "title": "코스피 7500 버티자"
      },
      "message": "매수전략, 매도전략, 횡보전략, 손절전략 이 비어 있다."
    },
    {
      "kind": "WEEKLY_SECURITY_PLAN_INCOMPLETE",
      "target": {
        "table": "weekly_security_investment_plan",
        "id": 1,
        "title": "삼전 버티기"
      },
      "message": "손절가 가 비어 있다."
    },
    {
      "kind": "WEEKLY_SECURITY_PLAN_INCOMPLETE",
      "target": {
        "table": "weekly_security_investment_plan",
        "id": 2,
        "title": "주주환원해라 제발"
      },
      "message": "손절가 가 비어 있다."
    }
  ],
  "ai_feedback": [],
  "counters": {
    "daily_plan_count": 2,
    "weekly_plan_count": 2,
    "warning_count": 0,
    "gap_count": 3,
    "order_count_today": 6
  },
  "next_action": {
    "kind": "QUARTERLY_STRATEGY_MISSING",
    "message": "매수전략, 매도전략, 횡보전략, 손절전략 이 비어 있다.",
    "goto": {
      "tab": "plan",
      "focus": {
        "table": "quarterly_investment_plan",
        "id": 1,
        "title": "코스피 7500 버티자"
      }
    }
  }
};

export const securityPlans = {
  "as_of": "2026-08-12",
  "security_id": 1,
  "monthly_plans": [
    {
      "id": 1,
      "title": "8월 버티면",
      "scenario_planning": "BASE",
      "predicted_trend": "UP",
      "confidence_score": 3,
      "quarterly_plan_id": 1,
      "annual_plan_id": 1
    }
  ],
  "weekly_security_plans": [
    {
      "id": 1,
      "title": "삼전 버티기",
      "weekly_plan_id": 1,
      "predicted_price": null,
      "stop_loss_price": null,
      "valid_from": "2026-08-11",
      "valid_until": "2026-08-14",
      "daily_plans": [
        {
          "id": 1,
          "level": "DAY",
          "title": "주식 상승이네(금리 동결 준비)",
          "scenario_planning": "BASE",
          "predicted_trend": "SIDEWAYS",
          "confidence_score": 3,
          "predicted_price": null,
          "stop_loss_price": null,
          "thesis": "다 오르고 뒤늦게 235,000 매입 시도\n다른 가격에라도 사라\n=> 오늘 저녁 9시 연준 기준금리 동결 예상(역대급 실업률)",
          "valid_from": "2026-08-12",
          "valid_until": "2026-08-12",
          "scenario_planning_label": "기본",
          "predicted_trend_label": "횡보"
        },
        {
          "id": 3,
          "level": "DAY",
          "title": "연준 금리 동결(인상하지 않음-실업률 심각 하락)",
          "scenario_planning": "BULL",
          "predicted_trend": "UP",
          "confidence_score": 4,
          "predicted_price": 265000.0,
          "stop_loss_price": 170000.0,
          "thesis": "8.12 오후 9시 연준 금리 하락",
          "valid_from": "2026-08-13",
          "valid_until": "2026-08-13",
          "scenario_planning_label": "낙관",
          "predicted_trend_label": "상승"
        }
      ]
    }
  ]
};

export const executionCompare = {
  "date_from": "2026-07-13",
  "date_to": "2026-08-12",
  "security_id": null,
  "rows": [
    {
      "date": "2026-08-12",
      "order": {
        "id": 6,
        "action_type": "FILL",
        "order_type": "LIMIT",
        "side": "BUY",
        "quantity": 25,
        "limit_price": 258000.0,
        "notional": 6450000.0,
        "executed_at": "2026-08-12T10:57:00Z",
        "created_at": "2026-08-12",
        "remarks": null,
        "action_type_label": "체결",
        "order_type_label": "지정가",
        "side_label": "매수"
      },
      "security": {
        "id": 1,
        "symbol": "005930",
        "name": "삼성전자"
      },
      "matched_plans": [
        {
          "level": "DAY",
          "id": 1,
          "title": "주식 상승이네(금리 동결 준비)",
          "scenario_planning": "BASE",
          "predicted_trend": "SIDEWAYS",
          "predicted_price": null,
          "stop_loss_price": null,
          "weekly_plan_id": 1,
          "weekly_security_plan_id": 1,
          "valid_from": "2026-08-12",
          "valid_until": "2026-08-12",
          "grounded": true,
          "scenario_planning_label": "기본",
          "predicted_trend_label": "횡보"
        }
      ],
      "flags": []
    },
    {
      "date": "2026-08-12",
      "order": {
        "id": 5,
        "action_type": "FILL",
        "order_type": "LIMIT",
        "side": "BUY",
        "quantity": 3,
        "limit_price": 1523000.0,
        "notional": 4569000.0,
        "executed_at": "2026-08-12T10:57:00Z",
        "created_at": "2026-08-12",
        "remarks": null,
        "action_type_label": "체결",
        "order_type_label": "지정가",
        "side_label": "매수"
      },
      "security": {
        "id": 2,
        "symbol": "000660",
        "name": "SK하이닉스"
      },
      "matched_plans": [
        {
          "level": "DAY",
          "id": 2,
          "title": "다 오르고 시도(금리 동결 준비)",
          "scenario_planning": "BASE",
          "predicted_trend": "SIDEWAYS",
          "predicted_price": 1500000.0,
          "stop_loss_price": null,
          "weekly_plan_id": 1,
          "weekly_security_plan_id": 2,
          "valid_from": "2026-08-12",
          "valid_until": "2026-08-12",
          "grounded": true,
          "scenario_planning_label": "기본",
          "predicted_trend_label": "횡보"
        }
      ],
      "flags": []
    },
    {
      "date": "2026-08-12",
      "order": {
        "id": 4,
        "action_type": "ORDER",
        "order_type": "LIMIT",
        "side": "BUY",
        "quantity": 4,
        "limit_price": 1497000.0,
        "notional": 5988000.0,
        "executed_at": "2026-08-12T07:34:00Z",
        "created_at": "2026-08-12",
        "remarks": null,
        "action_type_label": "주문",
        "order_type_label": "지정가",
        "side_label": "매수"
      },
      "security": {
        "id": 2,
        "symbol": "000660",
        "name": "SK하이닉스"
      },
      "matched_plans": [
        {
          "level": "DAY",
          "id": 2,
          "title": "다 오르고 시도(금리 동결 준비)",
          "scenario_planning": "BASE",
          "predicted_trend": "SIDEWAYS",
          "predicted_price": 1500000.0,
          "stop_loss_price": null,
          "weekly_plan_id": 1,
          "weekly_security_plan_id": 2,
          "valid_from": "2026-08-12",
          "valid_until": "2026-08-12",
          "grounded": true,
          "scenario_planning_label": "기본",
          "predicted_trend_label": "횡보"
        }
      ],
      "flags": []
    },
    {
      "date": "2026-08-12",
      "order": {
        "id": 3,
        "action_type": "ORDER",
        "order_type": "MARKET",
        "side": "BUY",
        "quantity": 2,
        "limit_price": 1430000.0,
        "notional": 2860000.0,
        "executed_at": "2026-08-12T07:33:00Z",
        "created_at": "2026-08-12",
        "remarks": null,
        "action_type_label": "주문",
        "order_type_label": "시장가",
        "side_label": "매수"
      },
      "security": {
        "id": 2,
        "symbol": "000660",
        "name": "SK하이닉스"
      },
      "matched_plans": [
        {
          "level": "DAY",
          "id": 2,
          "title": "다 오르고 시도(금리 동결 준비)",
          "scenario_planning": "BASE",
          "predicted_trend": "SIDEWAYS",
          "predicted_price": 1500000.0,
          "stop_loss_price": null,
          "weekly_plan_id": 1,
          "weekly_security_plan_id": 2,
          "valid_from": "2026-08-12",
          "valid_until": "2026-08-12",
          "grounded": true,
          "scenario_planning_label": "기본",
          "predicted_trend_label": "횡보"
        }
      ],
      "flags": []
    },
    {
      "date": "2026-08-12",
      "order": {
        "id": 2,
        "action_type": "FILL",
        "order_type": "LIMIT",
        "side": "BUY",
        "quantity": 5,
        "limit_price": 245000.0,
        "notional": 1225000.0,
        "executed_at": "2026-08-12T07:33:00Z",
        "created_at": "2026-08-12",
        "remarks": null,
        "action_type_label": "체결",
        "order_type_label": "지정가",
        "side_label": "매수"
      },
      "security": {
        "id": 1,
        "symbol": "005930",
        "name": "삼성전자"
      },
      "matched_plans": [
        {
          "level": "DAY",
          "id": 1,
          "title": "주식 상승이네(금리 동결 준비)",
          "scenario_planning": "BASE",
          "predicted_trend": "SIDEWAYS",
          "predicted_price": null,
          "stop_loss_price": null,
          "weekly_plan_id": 1,
          "weekly_security_plan_id": 1,
          "valid_from": "2026-08-12",
          "valid_until": "2026-08-12",
          "grounded": true,
          "scenario_planning_label": "기본",
          "predicted_trend_label": "횡보"
        }
      ],
      "flags": []
    },
    {
      "date": "2026-08-12",
      "order": {
        "id": 1,
        "action_type": "ORDER",
        "order_type": "LIMIT",
        "side": "BUY",
        "quantity": 25,
        "limit_price": 235000.0,
        "notional": 5875000.0,
        "executed_at": "2026-08-12T07:31:00Z",
        "created_at": "2026-08-12",
        "remarks": null,
        "action_type_label": "주문",
        "order_type_label": "지정가",
        "side_label": "매수"
      },
      "security": {
        "id": 1,
        "symbol": "005930",
        "name": "삼성전자"
      },
      "matched_plans": [
        {
          "level": "DAY",
          "id": 1,
          "title": "주식 상승이네(금리 동결 준비)",
          "scenario_planning": "BASE",
          "predicted_trend": "SIDEWAYS",
          "predicted_price": null,
          "stop_loss_price": null,
          "weekly_plan_id": 1,
          "weekly_security_plan_id": 1,
          "valid_from": "2026-08-12",
          "valid_until": "2026-08-12",
          "grounded": true,
          "scenario_planning_label": "기본",
          "predicted_trend_label": "횡보"
        }
      ],
      "flags": []
    }
  ],
  "summary": {
    "order_count": 6,
    "flagged_count": 0,
    "discipline_rate": 100.0
  }
};

export const performanceSummary = {
  "date_from": "2025-08-12",
  "date_to": "2026-08-12",
  "period_type": null,
  "security_id": null,
  "totals": {
    "realized_profit": null,
    "unrealized_profit": null,
    "dividend_income": null,
    "interest_cost": null,
    "commission": null,
    "tax": null,
    "etc_cost": null,
    "net_profit": null,
    "cost_total": 0,
    "income_total": 0,
    "cost_bite_pct": null,
    "return_rate": null,
    "benchmark_return_rate": null,
    "excess_return": null,
    "max_drawdown": null,
    "record_count": 0
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
      "value": 0.0
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
  "by_security": []
};

export const aiDigest = {
  "as_of": "2026-08-12",
  "valid_count": 0,
  "expired_count": 0,
  "by_opinion_type": {}
};

export const aiFeedbackFor = {};

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
    "id": 1,
    "is_deleted": false,
    "masked_account_number": "****2514",
    "security_count": 2,
    "broker_name": "NH나무"
  }
];

export const securities = [
  {
    "id": 1,
    "is_deleted": false,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "market": "KOSPI",
    "symbol": "005930",
    "name": "삼성전자",
    "asset_type": "STOCK",
    "currency": "KRW",
    "holding_quantity": 400,
    "current_price": "256000.00",
    "sector": "반도체",
    "is_active": true,
    "account": 1,
    "market_label": "코스피",
    "asset_type_label": "주식",
    "currency_label": "원",
    "market_value": 102400000.0
  },
  {
    "id": 2,
    "is_deleted": false,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "market": "KOSPI",
    "symbol": "000660",
    "name": "SK하이닉스",
    "asset_type": "STOCK",
    "currency": "KRW",
    "holding_quantity": 99,
    "current_price": "1505000.00",
    "sector": "반도체",
    "is_active": true,
    "account": 1,
    "market_label": "코스피",
    "asset_type_label": "주식",
    "currency_label": "원",
    "market_value": 148995000.0
  }
];

export const loans = [];

export const priceData = [];

export const annualPlans = [
  {
    "id": 1,
    "is_deleted": false,
    "account_detail": {
      "id": 1,
      "broker_name": "NH나무",
      "masked_account_number": "****2514"
    },
    "quarterly_count": 1,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "market": "KOSPI",
    "title": "코스피 12000 버티자",
    "thesis": "하이닉스, 삼전 반도체 실적 기반",
    "direction": "LONG",
    "status": "ACTIVE",
    "valid_from": "2026-08-11",
    "valid_until": "2026-12-31",
    "target_return_ratio": "100.00",
    "stop_loss_ratio": "50.00",
    "account": 1,
    "market_label": "코스피",
    "direction_label": "매수",
    "status_label": "진행중",
    "period_label": "2026.08.11 ~ 2026.12.31",
    "is_current": true
  }
];

export const quarterlyPlans = [
  {
    "id": 1,
    "is_deleted": false,
    "annual_plan_detail": {
      "id": 1,
      "title": "코스피 12000 버티자",
      "market": "KOSPI",
      "direction": "LONG",
      "status": "ACTIVE",
      "valid_from": "2026-08-11",
      "valid_until": "2026-12-31",
      "market_label": "코스피",
      "direction_label": "매수",
      "status_label": "진행중"
    },
    "monthly_count": 1,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "title": "코스피 7500 버티자",
    "rebalancing_ratio": null,
    "rebalancing_start_date": "2026-09-21",
    "rebalancing_end_date": "2026-09-30",
    "buy_strategy": null,
    "sell_strategy": null,
    "sideways_strategy": null,
    "stop_loss_strategy": null,
    "direction": "SHORT",
    "thesis": "하이닉스, 삼전 하락에서 복구..! 주주환원 기대",
    "valid_from": "2026-08-11",
    "valid_until": "2026-08-31",
    "target_return_ratio": null,
    "stop_loss_ratio": null,
    "annual_plan": 1,
    "direction_label": "매도",
    "period_label": "2026.08.11 ~ 2026.08.31",
    "is_current": true,
    "strategy_coverage": {
      "buy": false,
      "sell": false,
      "sideways": false,
      "stop_loss": false
    }
  }
];

export const monthlyPlans = [
  {
    "id": 1,
    "is_deleted": false,
    "quarterly_plan_detail": {
      "id": 1,
      "title": "코스피 7500 버티자",
      "direction": "SHORT",
      "valid_from": "2026-08-11",
      "valid_until": "2026-08-31",
      "annual_plan": 1,
      "direction_label": "매도"
    },
    "principle_count": 2,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "title": "8월 버티면",
    "scenario_planning": "BASE",
    "predicted_trend": "UP",
    "thesis": "유동성 줄고, 실적 기반 코스피",
    "confidence_score": 3,
    "allocation_ratio": null,
    "valid_from": "2026-08-11",
    "valid_until": "2026-08-31",
    "quarterly_plan": 1,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "상승",
    "period_label": "2026.08.11 ~ 2026.08.31",
    "is_current": true
  }
];

export const weeklyPlans = [
  {
    "id": 1,
    "is_deleted": false,
    "security_plan_count": 2,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "title": "관망과 대응",
    "scenario_planning": "BASE",
    "predicted_trend": "UP",
    "thesis": "환원소식, 유동성 축소, 전반적인 호재 뉴스",
    "confidence_score": 3,
    "allocation_ratio": null,
    "valid_from": "2026-08-11",
    "valid_until": "2026-08-14",
    "monthly_plan": 1,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "상승",
    "period_label": "2026.08.11 ~ 2026.08.14",
    "is_current": true
  }
];

export const weeklySecurityPlans = [
  {
    "id": 2,
    "is_deleted": false,
    "security_detail": {
      "id": 2,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "1505000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "weekly_plan_detail": {
      "id": 1,
      "title": "관망과 대응",
      "monthly_plan": 1,
      "scenario_planning": "BASE",
      "predicted_trend": "UP",
      "confidence_score": 3,
      "valid_from": "2026-08-11",
      "valid_until": "2026-08-14",
      "scenario_planning_label": "기본",
      "predicted_trend_label": "상승"
    },
    "daily_count": 1,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "title": "주주환원해라 제발",
    "scenario_planning": "BASE",
    "available_amount": "10000000.00",
    "predicted_trend": "SIDEWAYS",
    "thesis": "회복, 주주환원 뉴스, 금리 동결, 전쟁 완화",
    "confidence_score": 3,
    "allocation_ratio": null,
    "predicted_price": null,
    "stop_loss_price": null,
    "weekly_plan": 1,
    "security": 2,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "횡보",
    "risk_reward": null
  },
  {
    "id": 1,
    "is_deleted": false,
    "security_detail": {
      "id": 1,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "256000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "weekly_plan_detail": {
      "id": 1,
      "title": "관망과 대응",
      "monthly_plan": 1,
      "scenario_planning": "BASE",
      "predicted_trend": "UP",
      "confidence_score": 3,
      "valid_from": "2026-08-11",
      "valid_until": "2026-08-14",
      "scenario_planning_label": "기본",
      "predicted_trend_label": "상승"
    },
    "daily_count": 2,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "title": "삼전 버티기",
    "scenario_planning": "BASE",
    "available_amount": "10000000.00",
    "predicted_trend": "SIDEWAYS",
    "thesis": "회복, 주주환원 뉴스, 금리 동결, 전쟁 완화",
    "confidence_score": 3,
    "allocation_ratio": null,
    "predicted_price": null,
    "stop_loss_price": null,
    "weekly_plan": 1,
    "security": 1,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "횡보",
    "risk_reward": null
  }
];

export const dailyPlans = [
  {
    "id": 3,
    "is_deleted": false,
    "weekly_security_plan_detail": {
      "id": 1,
      "title": "삼전 버티기",
      "weekly_plan": 1,
      "security": 1,
      "security_detail": {
        "id": 1,
        "symbol": "005930",
        "name": "삼성전자",
        "market": "KOSPI",
        "currency": "KRW",
        "sector": "반도체",
        "current_price": "256000.00",
        "market_label": "코스피",
        "currency_label": "원"
      },
      "scenario_planning": "BASE",
      "predicted_trend": "SIDEWAYS",
      "confidence_score": 3,
      "available_amount": "10000000.00",
      "predicted_price": null,
      "stop_loss_price": null,
      "scenario_planning_label": "기본",
      "predicted_trend_label": "횡보"
    },
    "security_detail": {
      "id": 1,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "256000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "title": "연준 금리 동결(인상하지 않음-실업률 심각 하락)",
    "scenario_planning": "BULL",
    "predicted_trend": "UP",
    "thesis": "8.12 오후 9시 연준 금리 하락",
    "confidence_score": 4,
    "allocation_ratio": null,
    "valid_from": "2026-08-13",
    "valid_until": "2026-08-13",
    "predicted_price": "265000.00",
    "stop_loss_price": "170000.00",
    "weekly_security_plan": 1,
    "scenario_planning_label": "낙관",
    "predicted_trend_label": "상승",
    "period_label": "2026.08.13 ~ 2026.08.13",
    "is_current": false
  },
  {
    "id": 2,
    "is_deleted": false,
    "weekly_security_plan_detail": {
      "id": 2,
      "title": "주주환원해라 제발",
      "weekly_plan": 1,
      "security": 2,
      "security_detail": {
        "id": 2,
        "symbol": "000660",
        "name": "SK하이닉스",
        "market": "KOSPI",
        "currency": "KRW",
        "sector": "반도체",
        "current_price": "1505000.00",
        "market_label": "코스피",
        "currency_label": "원"
      },
      "scenario_planning": "BASE",
      "predicted_trend": "SIDEWAYS",
      "confidence_score": 3,
      "available_amount": "10000000.00",
      "predicted_price": null,
      "stop_loss_price": null,
      "scenario_planning_label": "기본",
      "predicted_trend_label": "횡보"
    },
    "security_detail": {
      "id": 2,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "1505000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "title": "다 오르고 시도(금리 동결 준비)",
    "scenario_planning": "BASE",
    "predicted_trend": "SIDEWAYS",
    "thesis": "1,479,000 4주 매입 시도\n=> 오늘 저녁 9시 연준 기준금리 동결 예상(역대급 실업률)\n다른 가격에라도 사라 => 오늘 저녁 9시 연준 기준금리",
    "confidence_score": 3,
    "allocation_ratio": null,
    "valid_from": "2026-08-12",
    "valid_until": "2026-08-12",
    "predicted_price": "1500000.00",
    "stop_loss_price": null,
    "weekly_security_plan": 2,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "횡보",
    "period_label": "2026.08.12 ~ 2026.08.12",
    "is_current": true
  },
  {
    "id": 1,
    "is_deleted": false,
    "weekly_security_plan_detail": {
      "id": 1,
      "title": "삼전 버티기",
      "weekly_plan": 1,
      "security": 1,
      "security_detail": {
        "id": 1,
        "symbol": "005930",
        "name": "삼성전자",
        "market": "KOSPI",
        "currency": "KRW",
        "sector": "반도체",
        "current_price": "256000.00",
        "market_label": "코스피",
        "currency_label": "원"
      },
      "scenario_planning": "BASE",
      "predicted_trend": "SIDEWAYS",
      "confidence_score": 3,
      "available_amount": "10000000.00",
      "predicted_price": null,
      "stop_loss_price": null,
      "scenario_planning_label": "기본",
      "predicted_trend_label": "횡보"
    },
    "security_detail": {
      "id": 1,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "256000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "title": "주식 상승이네(금리 동결 준비)",
    "scenario_planning": "BASE",
    "predicted_trend": "SIDEWAYS",
    "thesis": "다 오르고 뒤늦게 235,000 매입 시도\n다른 가격에라도 사라\n=> 오늘 저녁 9시 연준 기준금리 동결 예상(역대급 실업률)",
    "confidence_score": 3,
    "allocation_ratio": null,
    "valid_from": "2026-08-12",
    "valid_until": "2026-08-12",
    "predicted_price": null,
    "stop_loss_price": null,
    "weekly_security_plan": 1,
    "scenario_planning_label": "기본",
    "predicted_trend_label": "횡보",
    "period_label": "2026.08.12 ~ 2026.08.12",
    "is_current": true
  }
];

export const mandatoryPrinciples = [
  {
    "id": 1,
    "is_deleted": false,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "priority": 1,
    "content": "주식은 의심의 연속, 근거 몇개?-행동\n본질을 보아라\n당장 급할때는 확신보다는 의심의 배반, 근거의 연속"
  },
  {
    "id": 2,
    "is_deleted": false,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "priority": 2,
    "content": "공포 경험을 되새기고 공포에 사지 말고, 환희 경험을 되새기고 자만하지 마라"
  },
  {
    "id": 3,
    "is_deleted": false,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "priority": 3,
    "content": "10시 이후에 거래를 시작한다"
  },
  {
    "id": 5,
    "is_deleted": false,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "priority": 5,
    "content": "금리가 최고의 방향이다. 9월 금리에 대해 민감하게 반응"
  },
  {
    "id": 4,
    "is_deleted": false,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "priority": null,
    "content": "코스피는 올해 최대 10,000까지 상승한다"
  }
];

export const principleSources = [];

export const investmentPrinciples = [];

export const quarterlyPrinciples = [
  {
    "id": 2,
    "is_deleted": false,
    "security_detail": {
      "id": 2,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "1505000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "metric_groups": {
      "성장성": [
        {
          "field": "revenue",
          "label": "매출액",
          "value": null
        },
        {
          "field": "revenue_growth_rate",
          "label": "매출증가율",
          "value": null
        },
        {
          "field": "new_orders_amount",
          "label": "신규 수주액",
          "value": null
        },
        {
          "field": "order_backlog",
          "label": "수주잔고",
          "value": null
        }
      ],
      "수익성": [
        {
          "field": "operating_margin",
          "label": "영업이익률",
          "value": null
        },
        {
          "field": "net_income",
          "label": "순이익",
          "value": null
        },
        {
          "field": "roe",
          "label": "ROE",
          "value": null
        },
        {
          "field": "roic",
          "label": "ROIC",
          "value": null
        }
      ],
      "현금·안정성": [
        {
          "field": "free_cash_flow",
          "label": "잉여현금흐름",
          "value": null
        },
        {
          "field": "cash_conversion_rate",
          "label": "현금전환율",
          "value": null
        },
        {
          "field": "interest_coverage_ratio",
          "label": "이자보상배율",
          "value": null
        }
      ],
      "가격": [
        {
          "field": "per",
          "label": "PER",
          "value": null
        },
        {
          "field": "pbr",
          "label": "PBR",
          "value": null
        },
        {
          "field": "ev_ebitda",
          "label": "EV/EBITDA",
          "value": null
        },
        {
          "field": "psr",
          "label": "PSR",
          "value": null
        },
        {
          "field": "fcf_yield",
          "label": "FCF수익률",
          "value": null
        }
      ]
    },
    "predicted_price": "2400000.00",
    "stop_loss_price": "1270000.00",
    "revenue": null,
    "revenue_growth_rate": null,
    "new_orders_amount": null,
    "order_backlog": null,
    "operating_margin": null,
    "net_income": null,
    "roe": null,
    "roic": null,
    "free_cash_flow": null,
    "cash_conversion_rate": null,
    "interest_coverage_ratio": null,
    "per": null,
    "pbr": null,
    "ev_ebitda": null,
    "psr": null,
    "fcf_yield": null,
    "valuation_type": null,
    "performance_summary": null,
    "quarterly_plan": 1,
    "security": 2,
    "valuation_type_label": null,
    "filled_ratio": 0.0
  },
  {
    "id": 1,
    "is_deleted": false,
    "security_detail": {
      "id": 1,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "256000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "metric_groups": {
      "성장성": [
        {
          "field": "revenue",
          "label": "매출액",
          "value": null
        },
        {
          "field": "revenue_growth_rate",
          "label": "매출증가율",
          "value": null
        },
        {
          "field": "new_orders_amount",
          "label": "신규 수주액",
          "value": null
        },
        {
          "field": "order_backlog",
          "label": "수주잔고",
          "value": null
        }
      ],
      "수익성": [
        {
          "field": "operating_margin",
          "label": "영업이익률",
          "value": null
        },
        {
          "field": "net_income",
          "label": "순이익",
          "value": null
        },
        {
          "field": "roe",
          "label": "ROE",
          "value": null
        },
        {
          "field": "roic",
          "label": "ROIC",
          "value": null
        }
      ],
      "현금·안정성": [
        {
          "field": "free_cash_flow",
          "label": "잉여현금흐름",
          "value": null
        },
        {
          "field": "cash_conversion_rate",
          "label": "현금전환율",
          "value": null
        },
        {
          "field": "interest_coverage_ratio",
          "label": "이자보상배율",
          "value": null
        }
      ],
      "가격": [
        {
          "field": "per",
          "label": "PER",
          "value": null
        },
        {
          "field": "pbr",
          "label": "PBR",
          "value": null
        },
        {
          "field": "ev_ebitda",
          "label": "EV/EBITDA",
          "value": null
        },
        {
          "field": "psr",
          "label": "PSR",
          "value": null
        },
        {
          "field": "fcf_yield",
          "label": "FCF수익률",
          "value": null
        }
      ]
    },
    "predicted_price": "290000.00",
    "stop_loss_price": "170000.00",
    "revenue": null,
    "revenue_growth_rate": null,
    "new_orders_amount": null,
    "order_backlog": null,
    "operating_margin": null,
    "net_income": null,
    "roe": null,
    "roic": null,
    "free_cash_flow": null,
    "cash_conversion_rate": null,
    "interest_coverage_ratio": null,
    "per": null,
    "pbr": null,
    "ev_ebitda": null,
    "psr": null,
    "fcf_yield": null,
    "valuation_type": null,
    "performance_summary": null,
    "quarterly_plan": 1,
    "security": 1,
    "valuation_type_label": null,
    "filled_ratio": 0.0
  }
];

export const monthlyPrinciples = [
  {
    "id": 2,
    "is_deleted": false,
    "security_detail": {
      "id": 2,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "1505000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "upside_ratio": 9.63,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "direction": "LONG",
    "rationale": "회복, 주주환원 뉴스, 금리 동결, 전쟁 완화",
    "predicted_price": "1650000.00",
    "stop_loss_price": "1270000.00",
    "monthly_plan": 1,
    "security": 2,
    "direction_label": "매수"
  },
  {
    "id": 1,
    "is_deleted": false,
    "security_detail": {
      "id": 1,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "256000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "upside_ratio": 9.38,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "direction": "LONG",
    "rationale": "회복, 주주환원 뉴스, 금리 동결, 전쟁 완화",
    "predicted_price": "280000.00",
    "stop_loss_price": "170000.00",
    "monthly_plan": 1,
    "security": 1,
    "direction_label": "매수"
  }
];

export const marketDirections = [
  {
    "id": 4,
    "is_deleted": false,
    "news_count": 1,
    "affected_count": 0,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "direction": "UP",
    "factor_type": "SENTIMENT",
    "content": "M&A , 주주",
    "rationale": "주가가 상승할만한 이유들 모음",
    "factor_value": null,
    "affected_targets": null,
    "direction_label": "상승",
    "factor_type_label": "투자심리"
  },
  {
    "id": 3,
    "is_deleted": false,
    "news_count": 0,
    "affected_count": 0,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "direction": "DOWN",
    "factor_type": "RATE",
    "content": "금리로 인한 주가 하락",
    "rationale": "26.08.21 기 준 5.26(마지노선 4.5 초과)",
    "factor_value": null,
    "affected_targets": null,
    "direction_label": "하락",
    "factor_type_label": "금리"
  },
  {
    "id": 2,
    "is_deleted": false,
    "news_count": 0,
    "affected_count": 0,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "direction": "DOWN",
    "factor_type": "GEOPOLITICS",
    "content": "트럼프 계엄 vs 탄핵",
    "rationale": "트럼프는 이성적인 사람이 아니다. 짐승적 돌발성으로 문제를 일으키는 저질인",
    "factor_value": null,
    "affected_targets": null,
    "direction_label": "하락",
    "factor_type_label": "지정학"
  },
  {
    "id": 1,
    "is_deleted": false,
    "news_count": 0,
    "affected_count": 0,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "direction": "SIDEWAYS",
    "factor_type": "GEOPOLITICS",
    "content": "전쟁 종식",
    "rationale": "11월 선거",
    "factor_value": null,
    "affected_targets": null,
    "direction_label": "횡보",
    "factor_type_label": "지정학"
  }
];

export const news = [
  {
    "id": 2,
    "is_deleted": false,
    "market_direction_detail": {
      "id": 4,
      "direction": "UP",
      "factor_type": "SENTIMENT",
      "factor_value": null,
      "content": "M&A , 주주",
      "direction_label": "상승",
      "factor_type_label": "투자심리"
    },
    "affected_count": 0,
    "created_at": "2026-08-12",
    "updated_at": "2026-08-12",
    "remarks": null,
    "direction": "UP",
    "factor_type": "SENTIMENT",
    "content": "하이닉스 키옥시아 대주주",
    "rationale": "하이닉스 키옥시아 대주주, 넨드 메모리 강함, 하이닉스 HBM메모리 + 낸드 메모리(키옥시아) + 인텔의 낸드플래시 및 SSD(저장장치)",
    "factor_value": null,
    "affected_targets": null,
    "market_direction": 4,
    "direction_label": "상승",
    "factor_type_label": "투자심리"
  }
];

export const strategies = [];

export const strategyDetail = {};

export const orders = [
  {
    "id": 6,
    "is_deleted": false,
    "security_detail": {
      "id": 1,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "256000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "action_type": "FILL",
    "order_type": "LIMIT",
    "side": "BUY",
    "quantity": 25,
    "limit_price": "258000.00",
    "executed_at": "2026-08-12T19:57:00+09:00",
    "created_at": "2026-08-12",
    "remarks": null,
    "security": 1,
    "action_type_label": "체결",
    "order_type_label": "지정가",
    "side_label": "매수",
    "notional": 6450000.0
  },
  {
    "id": 5,
    "is_deleted": false,
    "security_detail": {
      "id": 2,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "1505000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "action_type": "FILL",
    "order_type": "LIMIT",
    "side": "BUY",
    "quantity": 3,
    "limit_price": "1523000.00",
    "executed_at": "2026-08-12T19:57:00+09:00",
    "created_at": "2026-08-12",
    "remarks": null,
    "security": 2,
    "action_type_label": "체결",
    "order_type_label": "지정가",
    "side_label": "매수",
    "notional": 4569000.0
  },
  {
    "id": 4,
    "is_deleted": false,
    "security_detail": {
      "id": 2,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "1505000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "action_type": "ORDER",
    "order_type": "LIMIT",
    "side": "BUY",
    "quantity": 4,
    "limit_price": "1497000.00",
    "executed_at": "2026-08-12T16:34:00+09:00",
    "created_at": "2026-08-12",
    "remarks": null,
    "security": 2,
    "action_type_label": "주문",
    "order_type_label": "지정가",
    "side_label": "매수",
    "notional": 5988000.0
  },
  {
    "id": 3,
    "is_deleted": false,
    "security_detail": {
      "id": 2,
      "symbol": "000660",
      "name": "SK하이닉스",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "1505000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "action_type": "ORDER",
    "order_type": "MARKET",
    "side": "BUY",
    "quantity": 2,
    "limit_price": "1430000.00",
    "executed_at": "2026-08-12T16:33:00+09:00",
    "created_at": "2026-08-12",
    "remarks": null,
    "security": 2,
    "action_type_label": "주문",
    "order_type_label": "시장가",
    "side_label": "매수",
    "notional": 2860000.0
  },
  {
    "id": 2,
    "is_deleted": false,
    "security_detail": {
      "id": 1,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "256000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "action_type": "FILL",
    "order_type": "LIMIT",
    "side": "BUY",
    "quantity": 5,
    "limit_price": "245000.00",
    "executed_at": "2026-08-12T16:33:00+09:00",
    "created_at": "2026-08-12",
    "remarks": null,
    "security": 1,
    "action_type_label": "체결",
    "order_type_label": "지정가",
    "side_label": "매수",
    "notional": 1225000.0
  },
  {
    "id": 1,
    "is_deleted": false,
    "security_detail": {
      "id": 1,
      "symbol": "005930",
      "name": "삼성전자",
      "market": "KOSPI",
      "currency": "KRW",
      "sector": "반도체",
      "current_price": "256000.00",
      "market_label": "코스피",
      "currency_label": "원"
    },
    "action_type": "ORDER",
    "order_type": "LIMIT",
    "side": "BUY",
    "quantity": 25,
    "limit_price": "235000.00",
    "executed_at": "2026-08-12T16:31:00+09:00",
    "created_at": "2026-08-12",
    "remarks": null,
    "security": 1,
    "action_type_label": "주문",
    "order_type_label": "지정가",
    "side_label": "매수",
    "notional": 5875000.0
  }
];

export const performanceRecords = [];

export const aiModelRuns = [];

export const aiFeedback = [];
