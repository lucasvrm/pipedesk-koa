from __future__ import annotations

import logging
import time
from typing import Any, Callable, Dict, Iterable, List

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)


class WorkerMetrics:
    def __init__(self, name: str):
        self.name = name
        self.total_time_ms: float = 0
        self.processed: int = 0
        self.errors: Dict[str, str] = {}

    def log_start(self) -> float:
        return time.time()

    def log_end(self, start: float) -> None:
        self.total_time_ms += (time.time() - start) * 1000

    def log_error(self, lead_id: str, message: str) -> None:
        self.errors[lead_id] = message

    def emit(self) -> None:
        logger.info(
            "[worker:%s] processed=%s total_time_ms=%.2f errors=%s",
            self.name,
            self.processed,
            self.total_time_ms,
            len(self.errors),
        )
        if self.errors:
            for lead_id, message in self.errors.items():
                logger.error("[worker:%s] lead=%s error=%s", self.name, lead_id, message)


def run_lead_activity_stats_worker(
    leads: Iterable[Dict[str, Any]],
    activity_fetcher: Callable[[Dict[str, Any]], Dict[str, Any]],
) -> List[Dict[str, Any]]:
    metrics = WorkerMetrics("lead_activity_stats")
    start = metrics.log_start()
    results: List[Dict[str, Any]] = []

    for lead in leads:
        try:
            stats = activity_fetcher(lead)
            results.append({"id": lead["id"], **stats})
            metrics.processed += 1
        except Exception as exc:  # pragma: no cover
            metrics.log_error(str(lead.get("id")), str(exc))
    metrics.log_end(start)
    metrics.emit()
    return results


def run_priority_score_worker(
    leads: Iterable[Dict[str, Any]],
    score_calculator: Callable[[Dict[str, Any]], float],
) -> List[Dict[str, Any]]:
    metrics = WorkerMetrics("priority_score")
    start = metrics.log_start()
    results: List[Dict[str, Any]] = []

    for lead in leads:
        try:
            score = score_calculator(lead)
            results.append({"id": lead["id"], "priority_score": score})
            metrics.processed += 1
        except Exception as exc:  # pragma: no cover
            metrics.log_error(str(lead.get("id")), str(exc))
    metrics.log_end(start)
    metrics.emit()
    return results
