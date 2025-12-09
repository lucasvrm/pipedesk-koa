from __future__ import annotations

import logging
import time
from datetime import datetime
from typing import Any, Callable, Dict, Iterable, List, Optional

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# In-memory telemetry for the endpoint. In production this could be replaced by
# Prometheus/StatsD. Keeping it lightweight here keeps the module self-contained
# for testing while still exposing useful counters.
endpoint_metrics = {
    "call_count": 0,
    "error_count": 0,
    "latencies_ms": [],
}


ActionResult = Dict[str, str]


def _parse_datetime(value: Any) -> Optional[datetime]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value))
    except (TypeError, ValueError):
        return None


def _days_between(later: datetime, earlier: Optional[datetime]) -> Optional[int]:
    if earlier is None:
        return None
    delta = later - earlier
    return delta.days


ACTION_LABELS = {
    "call_first_time": "Ligar pela primeira vez",
    "send_follow_up": "Enviar follow-up",
    "prepare_for_meeting": "Preparar para a reunião",
    "qualify_to_company": "Qualificar para empresa",
    "monitor": "Acompanhar",
}


def suggest_next_action(lead: Dict[str, Any], stats: Dict[str, Any]) -> ActionResult:
    """Determines the next best action for a lead.

    The decision considers how long the lead has existed, the time since the
    last interaction, any upcoming meetings, and overall engagement.
    """

    now = datetime.utcnow()
    created_at = _parse_datetime(lead.get("created_at")) or now
    last_interaction_at = _parse_datetime(stats.get("last_interaction_at"))
    next_meeting_at = _parse_datetime(stats.get("next_meeting_at"))
    engagement_score = stats.get("engagement_score") or 0

    age_days = _days_between(now, created_at) or 0
    since_last_interaction = _days_between(now, last_interaction_at)
    has_future_meeting = bool(next_meeting_at and next_meeting_at > now)
    has_open_deal = bool(lead.get("has_open_deal"))

    if since_last_interaction is None and age_days <= 7:
        return {
            "code": "call_first_time",
            "label": ACTION_LABELS["call_first_time"],
            "reason": "Lead novo sem interações registradas",
        }

    if since_last_interaction is not None and since_last_interaction >= 3:
        return {
            "code": "send_follow_up",
            "label": ACTION_LABELS["send_follow_up"],
            "reason": f"Última interação há {since_last_interaction} dias",
        }

    if has_future_meeting:
        meeting_str = next_meeting_at.strftime("%Y-%m-%d") if next_meeting_at else "futura"
        return {
            "code": "prepare_for_meeting",
            "label": ACTION_LABELS["prepare_for_meeting"],
            "reason": f"Reunião agendada para {meeting_str}",
        }

    if engagement_score >= 80 and not has_open_deal:
        return {
            "code": "qualify_to_company",
            "label": ACTION_LABELS["qualify_to_company"],
            "reason": "Lead muito engajado sem deal ativo",
        }

    return {
        "code": "monitor",
        "label": ACTION_LABELS["monitor"],
        "reason": "Nenhuma ação prioritária identificada",
    }


def with_endpoint_metrics(fn: Callable[..., List[Dict[str, Any]]]) -> Callable[..., List[Dict[str, Any]]]:
    def wrapper(*args: Any, **kwargs: Any) -> List[Dict[str, Any]]:
        start = time.time()
        endpoint_metrics["call_count"] += 1
        try:
            response = fn(*args, **kwargs)
            return response
        except Exception:
            endpoint_metrics["error_count"] += 1
            raise
        finally:
            elapsed_ms = (time.time() - start) * 1000
            endpoint_metrics["latencies_ms"].append(elapsed_ms)
            avg_latency = sum(endpoint_metrics["latencies_ms"]) / len(endpoint_metrics["latencies_ms"])
            logger.info(
                "[/api/leads/sales-view] count=%s errors=%s last_latency_ms=%.2f avg_latency_ms=%.2f",
                endpoint_metrics["call_count"],
                endpoint_metrics["error_count"],
                elapsed_ms,
                avg_latency,
            )

    return wrapper


def _apply_filters(leads: Iterable[Dict[str, Any]], filters: Optional[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not filters:
        return list(leads)

    results: List[Dict[str, Any]] = []
    for lead in leads:
        include = True
        for key, value in filters.items():
            if value is None:
                continue
            if lead.get(key) != value:
                include = False
                break
        if include:
            results.append(lead)
    return results


def _apply_ordering(leads: List[Dict[str, Any]], order_by: Optional[str]) -> List[Dict[str, Any]]:
    if not order_by:
        return leads

    reverse = False
    key = order_by
    if order_by.startswith("-"):
        reverse = True
        key = order_by[1:]

    def sort_value(lead: Dict[str, Any]):
        value = lead.get(key)
        parsed = _parse_datetime(value)
        return parsed or value

    return sorted(leads, key=sort_value, reverse=reverse)


@with_endpoint_metrics
def get_sales_view(
    leads: Iterable[Dict[str, Any]],
    stats_provider: Callable[[str], Dict[str, Any]],
    filters: Optional[Dict[str, Any]] = None,
    order_by: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """Returns leads decorated with the next action suggestion."""

    raw_leads = _apply_filters(leads, filters)
    ordered_leads = _apply_ordering(raw_leads, order_by)

    response = []
    for lead in ordered_leads:
        try:
            stats = stats_provider(lead["id"])
            next_action = suggest_next_action(lead, stats)
            lead_payload = {**lead, "next_action": next_action}
            response.append(lead_payload)
        except Exception as exc:  # pragma: no cover - defensive logging
            logger.exception("Erro ao processar lead %s", lead.get("id"))
            raise exc
    return response
