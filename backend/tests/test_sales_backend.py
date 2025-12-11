import unittest
from datetime import datetime, timedelta

from backend.sales_view import ACTION_LABELS, endpoint_metrics, get_sales_view, suggest_next_action
from backend.workers import run_lead_activity_stats_worker, run_priority_score_worker


class SuggestNextActionTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime.utcnow()

    def test_call_first_time_for_new_lead_without_interaction(self):
        lead = {"id": "l1", "created_at": self.now.isoformat()}
        stats = {"last_interaction_at": None}

        result = suggest_next_action(lead, stats)
        self.assertEqual(result["code"], "call_first_time")
        self.assertEqual(result["label"], ACTION_LABELS["call_first_time"])

    def test_send_follow_up_when_last_interaction_over_threshold(self):
        lead = {"id": "l2", "created_at": (self.now - timedelta(days=20)).isoformat()}
        stats = {"last_interaction_at": (self.now - timedelta(days=5)).isoformat()}

        result = suggest_next_action(lead, stats)
        self.assertEqual(result["code"], "send_follow_up")
        self.assertIn("5 dias", result["reason"])

    def test_prepare_for_meeting_when_future_meeting_exists(self):
        lead = {"id": "l3", "created_at": (self.now - timedelta(days=10)).isoformat()}
        stats = {
            "last_interaction_at": (self.now - timedelta(days=1)).isoformat(),
            "next_meeting_at": (self.now + timedelta(days=2)).isoformat(),
        }

        result = suggest_next_action(lead, stats)
        self.assertEqual(result["code"], "prepare_for_meeting")
        self.assertIn("Reunião", result["reason"])

    def test_qualify_to_company_for_high_engagement_without_deal(self):
        lead = {"id": "l4", "created_at": (self.now - timedelta(days=40)).isoformat(), "has_open_deal": False}
        stats = {"last_interaction_at": (self.now - timedelta(days=1)).isoformat(), "engagement_score": 90}

        result = suggest_next_action(lead, stats)
        self.assertEqual(result["code"], "qualify_to_company")

    def test_monitor_when_no_special_conditions(self):
        lead = {"id": "l5", "created_at": (self.now - timedelta(days=8)).isoformat(), "has_open_deal": True}
        stats = {"last_interaction_at": (self.now - timedelta(days=1)).isoformat(), "engagement_score": 60}

        result = suggest_next_action(lead, stats)
        self.assertEqual(result["code"], "monitor")


class WorkerTests(unittest.TestCase):
    def test_lead_activity_stats_worker_collects_metrics(self):
        leads = [
            {"id": "l1"},
            {"id": "l2"},
        ]

        def fetcher(lead):
            if lead["id"] == "l2":
                raise ValueError("missing activity")
            return {"last_interaction_at": datetime.utcnow().isoformat(), "engagement_score": 25}

        results = run_lead_activity_stats_worker(leads, fetcher)

        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["id"], "l1")

    def test_priority_score_worker(self):
        leads = [
            {"id": "l1", "engagement": 10},
            {"id": "l2", "engagement": 20},
        ]

        def scorer(lead):
            return lead["engagement"] * 1.5

        results = run_priority_score_worker(leads, scorer)
        scores = {item["id"]: item["priority_score"] for item in results}

        self.assertEqual(scores["l1"], 15)
        self.assertEqual(scores["l2"], 30)


class SalesViewEndpointTests(unittest.TestCase):
    def setUp(self):
        # reset endpoint metrics before each test
        endpoint_metrics["call_count"] = 0
        endpoint_metrics["error_count"] = 0
        endpoint_metrics["latencies_ms"] = []

    def test_sales_view_appends_next_action_and_metrics(self):
        base_time = datetime.utcnow()
        leads = [
            {"id": "l1", "created_at": base_time.isoformat()},
            {"id": "l2", "created_at": (base_time - timedelta(days=4)).isoformat()},
        ]

        def stats_provider(lead_id: str):
            if lead_id == "l1":
                return {"last_interaction_at": None, "engagement_score": 10}
            return {"last_interaction_at": (base_time - timedelta(days=5)).isoformat(), "engagement_score": 20}

        response = get_sales_view(leads, stats_provider, order_by="id")

        self.assertEqual(len(response["data"]), 2)
        self.assertEqual(response["data"][0]["next_action"]["code"], "call_first_time")
        self.assertEqual(response["data"][1]["next_action"]["code"], "send_follow_up")
        self.assertEqual(endpoint_metrics["call_count"], 1)
        self.assertEqual(endpoint_metrics["error_count"], 0)
        self.assertEqual(len(endpoint_metrics["latencies_ms"]), 1)

    def test_sales_view_filters_and_orders(self):
        base_time = datetime.utcnow()
        leads = [
            {"id": "l1", "owner": "alice", "created_at": base_time.isoformat()},
            {"id": "l2", "owner": "bob", "created_at": (base_time - timedelta(days=2)).isoformat()},
            {"id": "l3", "owner": "alice", "created_at": (base_time - timedelta(days=1)).isoformat()},
        ]

        def stats_provider(_lead_id: str):
            return {"last_interaction_at": base_time.isoformat(), "engagement_score": 10}

        response = get_sales_view(
            leads, stats_provider, filters={"owner": "alice"}, order_by="-created_at"
        )
        ordered_ids = [lead["id"] for lead in response["data"]]

        self.assertEqual(ordered_ids, ["l1", "l3"])

    def test_sales_view_paginates_and_reports_metadata(self):
        base_time = datetime.utcnow()
        leads = [
            {"id": f"l{i}", "created_at": (base_time - timedelta(days=i)).isoformat()}
            for i in range(1, 6)
        ]

        def stats_provider(_lead_id: str):
            return {"last_interaction_at": base_time.isoformat(), "engagement_score": 10}

        first_page = get_sales_view(leads, stats_provider, order_by="-created_at", page=1, page_size=2)
        second_page = get_sales_view(leads, stats_provider, order_by="-created_at", page=2, page_size=2)
        out_of_range = get_sales_view(leads, stats_provider, order_by="-created_at", page=5, page_size=2)

        self.assertEqual(first_page["pagination"], {"total": 5, "page": 1, "perPage": 2})
        self.assertEqual(len(first_page["data"]), 2)
        self.assertEqual(first_page["data"][0]["id"], "l1")
        self.assertEqual(first_page["data"][1]["id"], "l2")

        self.assertEqual(second_page["pagination"], {"total": 5, "page": 2, "perPage": 2})
        self.assertEqual([lead["id"] for lead in second_page["data"]], ["l3", "l4"])

        self.assertEqual(out_of_range["pagination"], {"total": 5, "page": 5, "perPage": 2})
        self.assertEqual(out_of_range["data"], [])


if __name__ == "__main__":
    unittest.main()
