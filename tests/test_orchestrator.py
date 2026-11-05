import unittest
from unittest.mock import MagicMock, patch
import orchestrator as orch

class OrchestratorTests(unittest.TestCase):
    @patch("orchestrator.client")
    def test_restricts_container_and_lets_engine_allocate_port(self, factory):
        api = factory.return_value
        network = api.networks.create.return_value
        network.name = "test-instance"
        container = api.containers.run.return_value
        container.attrs = {"NetworkSettings": {"Ports": {"5000/tcp": [{"HostPort": "32768"}]}}}
        port = orch.start("test-instance", "cti-lab/web-01", 5000, "CTF{test}")
        self.assertEqual(port, 32768)
        self.assertTrue(api.networks.create.call_args.kwargs["internal"])
        config = api.containers.run.call_args.kwargs
        self.assertEqual(config["ports"], {"5000/tcp": ("127.0.0.1", None)})
        self.assertNotIn("volumes", config)
        self.assertTrue(config["read_only"])
        self.assertEqual(config["cap_drop"], ["ALL"])
        self.assertEqual(config["user"], "10001:10001")
        self.assertEqual(config["pids_limit"], 100)
        self.assertEqual(config["mem_limit"], "128m")
        api.close.assert_called_once()

    @patch("orchestrator.client")
    def test_does_not_remove_foreign_container(self, factory):
        container = factory.return_value.containers.get.return_value
        container.labels = {}
        with self.assertRaises(orch.DockerError):
            orch.stop("foreign")
        container.remove.assert_not_called()

if __name__ == "__main__":
    unittest.main()
