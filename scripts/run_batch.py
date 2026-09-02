#!/usr/bin/env python3
import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from src.agents.graph import run_batch_pipeline, run_per_call_pipeline
from src.storage import get_storage


def main():
    parser = argparse.ArgumentParser(description="Run call analysis pipeline")
    parser.add_argument("--call-id", help="Process a single call")
    parser.add_argument("--aggregate", action="store_true", help="Run batch aggregation")
    args = parser.parse_args()

    if args.aggregate:
        result = run_batch_pipeline()
        print(f"Surfaced {len(result.get('surfaced_insights', []))} insights")
        return

    if args.call_id:
        storage = get_storage()
        audio_path = storage.get_raw_audio_key(args.call_id)
        if not audio_path:
            raise SystemExit(f"No audio for {args.call_id}")
        print(run_per_call_pipeline(args.call_id, audio_path))
        return

    storage = get_storage()
    for call_id in storage.list_raw_calls():
        if storage.get_analysis(call_id):
            continue
        audio_path = storage.get_raw_audio_key(call_id)
        if audio_path:
            print(f"Processing {call_id}...")
            run_per_call_pipeline(call_id, audio_path)
    result = run_batch_pipeline()
    print(f"Done. Surfaced {len(result.get('surfaced_insights', []))} insights")


if __name__ == "__main__":
    main()
