import urllib.request
import json
import os

def test_export_all_formats():
    incident_id = "IN-2026-0881"
    formats = ["pdf", "xlsx", "csv", "geojson"]

    for fmt in formats:
        url = f"http://127.0.0.1:8000/api/v1/incidents/{incident_id}/reports/generate?format={fmt}"
        req = urllib.request.Request(url, method="POST")
        with urllib.request.urlopen(req) as response:
            assert response.status == 200, f"Failed on {fmt}: {response.status}"
            data = json.loads(response.read().decode())
            filename = data["filename"]
            file_size = data["file_size_bytes"]
            print(f"Generated {fmt.upper()}: {filename} ({file_size} bytes)")
            assert file_size > 0, f"Generated file {filename} is empty!"

            # Test downloading the file
            dl_url = f"http://127.0.0.1:8000{data['download_url']}"
            with urllib.request.urlopen(dl_url) as dl_res:
                assert dl_res.status == 200
                content = dl_res.read()
                assert len(content) == file_size, f"Size mismatch for {filename}"
                print(f"  [OK] Verified download payload: {len(content)} bytes received.")

if __name__ == "__main__":
    test_export_all_formats()
    print("\nALL REPORT EXPORT TESTS PASSED SUCCESSFULLY! [SUCCESS]")
