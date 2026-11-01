import os
import unittest
import uuid
from types import SimpleNamespace
from unittest.mock import patch, AsyncMock
import main
class FakeResult:
    def __init__(self, data):
        self.data = data
class FakeSupabase:
    def __init__(
        self,
        rows=None,
        race_row=None,
        fail_first_insert=False,
        fail_tracking_updates=0,
    ):
        self.rows = rows or []
        self.race_row = race_row
        self.fail_first_insert = fail_first_insert
        self.fail_tracking_updates = fail_tracking_updates
    def table(self, name):
        if name != "video_tasks":
            raise AssertionError(f"Unexpected table: {name}")
        return FakeTable(self)
class FakeTable:
    def __init__(self, database):
        self.database = database
    def select(self, *args, **kwargs):
        return FakeQuery(self.database, "select")
    def insert(self, data):
        query = FakeQuery(self.database, "insert")
        query.data = data
        return query
    def update(self, data):
        query = FakeQuery(self.database, "update")
        query.data = data
        return query
class FakeQuery:
    def __init__(self, database, operation):
        self.database = database
        self.operation = operation
        self.filters = {}
        self.data = None
    def select(self, *args, **kwargs):
        return self
    def eq(self, key, value):
        self.filters[key] = value
        return self
    def limit(self, count):
        return self
    def execute(self):
        if self.operation == "select":
            matches = [
                row for row in self.database.rows
                if all(
                    row.get(key) == value
                    for key, value in self.filters.items()
                )
            ]
            return FakeResult(matches)
        if self.operation == "insert":
            if self.database.fail_first_insert:
                self.database.fail_first_insert = False
                # Simulate another request winning the race.
                if self.database.race_row:
                    self.database.rows.append(
                        self.database.race_row
                    )
                raise Exception("Duplicate request ID")
            self.database.rows.append(self.data)
            return FakeResult([self.data])
        if self.operation == "update":
            if (
                "replicate_prediction_id" in self.data
                and self.database.fail_tracking_updates > 0
            ):
                self.database.fail_tracking_updates -= 1
                raise Exception("Temporary tracking failure")
            updated = []
            for row in self.database.rows:
                if all(
                    row.get(key) == value
                    for key, value in self.filters.items()
                ):
                    row.update(self.data)
                    updated.append(row.copy())
            return FakeResult(updated)
        raise AssertionError(
            f"Unexpected operation: {self.operation}"
        )
class VideoSafetyTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.request_id = str(uuid.uuid4())
        self.user = SimpleNamespace(id="test-user-123")
        self.existing_task = {
            "user_id": "test-user-123",
            "request_id": self.request_id,
            "task_id": "existing-task-123",
            "status": "completed",
            "request_state": "submitted",
            "video_url": "https://example.test/video.mp4",
            "replicate_prediction_id": "rep-existing",
        }
        self.request = main.VideoRequest(
            prompt="Safe automated test prompt",
            aspect_ratio="16:9",
            duration=5,
            request_id=self.request_id,
        )
    def test_valid_request_id_is_accepted(self):
        request = main.VideoRequest(
            prompt="Test",
            request_id=str(uuid.uuid4()),
        )
        self.assertTrue(request.request_id)
    def test_invalid_request_id_is_rejected(self):
        with self.assertRaises(Exception):
            main.VideoRequest(
                prompt="Test",
                request_id="not-a-valid-uuid",
            )
    @patch.dict(
        os.environ,
        {"PUBLIC_SERVER_URL": "https://example.test"},
    )
    @patch("main.replicate.predictions.create")
    async def test_existing_request_does_not_generate_again(
        self, replicate_create
    ):
        fake_db = FakeSupabase(
            rows=[self.existing_task.copy()]
        )
        with patch.object(main, "supabase", fake_db):
            result = await main.create_video_task(
                self.request, self.user
            )
        self.assertEqual(result["task_id"], "existing-task-123")
        self.assertEqual(result["status"], "completed")
        replicate_create.assert_not_called()
    @patch.dict(
        os.environ,
        {"PUBLIC_SERVER_URL": "https://example.test"},
    )
    @patch("main.replicate.predictions.create")
    async def test_real_duplicate_insert_race_is_recovered(
        self, replicate_create
    ):
        fake_db = FakeSupabase(
            rows=[],
            race_row=self.existing_task.copy(),
            fail_first_insert=True,
        )
        with patch.object(main, "supabase", fake_db):
            result = await main.create_video_task(
                self.request, self.user
            )
        self.assertEqual(result["task_id"], "existing-task-123")
        self.assertEqual(len(fake_db.rows), 1)
        replicate_create.assert_not_called()
    @patch.dict(
        os.environ,
        {"PUBLIC_SERVER_URL": "https://example.test"},
    )
    @patch("main.replicate.predictions.create")
    async def test_provider_failure_returns_uncertain(
        self, replicate_create
    ):
        fake_db = FakeSupabase()
        replicate_create.side_effect = TimeoutError(
            "Simulated provider timeout"
        )
        with patch.object(main, "supabase", fake_db):
            result = await main.create_video_task(
                self.request, self.user
            )
        self.assertEqual(result["status"], "uncertain")
        self.assertEqual(len(fake_db.rows), 1)
        self.assertEqual(
            fake_db.rows[0]["request_state"], "uncertain"
        )
        self.assertEqual(replicate_create.call_count, 1)
    @patch.dict(
        os.environ,
        {"PUBLIC_SERVER_URL": "https://example.test"},
    )
    @patch("main.asyncio.sleep", new_callable=AsyncMock)
    @patch("main.replicate.predictions.create")
    async def test_tracking_retries_database_only(
        self, replicate_create, sleep_mock
    ):
        fake_db = FakeSupabase(fail_tracking_updates=2)
        replicate_create.return_value = SimpleNamespace(
            id="rep-test-123"
        )
        with patch.object(main, "supabase", fake_db):
            result = await main.create_video_task(
                self.request, self.user
            )
        self.assertEqual(result["status"], "queued")
        self.assertEqual(
            fake_db.rows[0]["replicate_prediction_id"],
            "rep-test-123",
        )
        self.assertEqual(replicate_create.call_count, 1)
        self.assertEqual(sleep_mock.await_count, 2)
    @patch.dict(
        os.environ,
        {"PUBLIC_SERVER_URL": "https://example.test"},
    )
    @patch("main.asyncio.sleep", new_callable=AsyncMock)
    @patch("main.replicate.predictions.create")
    async def test_tracking_failure_does_not_resubmit(
        self, replicate_create, sleep_mock
    ):
        fake_db = FakeSupabase(fail_tracking_updates=5)
        replicate_create.return_value = SimpleNamespace(
            id="rep-test-456"
        )
        with patch.object(main, "supabase", fake_db):
            result = await main.create_video_task(
                self.request, self.user
            )
        self.assertEqual(result["status"], "uncertain")
        self.assertEqual(
            fake_db.rows[0]["request_state"], "uncertain"
        )
        self.assertEqual(replicate_create.call_count, 1)
        self.assertEqual(sleep_mock.await_count, 4)
if __name__ == "__main__":
    unittest.main(verbosity=2)