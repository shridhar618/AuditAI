#!/usr/bin/env python3
"""Test script to import the app and list routes."""
import sys
sys.path.insert(0, '.')

try:
    from graph import app
    print("Successfully imported the app")
    # List all routes
    print("Registered routes:")
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"  {route.path}")
        elif hasattr(route, "path_regex"):
            print(f"  {route.path_regex.pattern}")
except Exception as e:
    print(f"Failed to import app: {e}")
    import traceback
    traceback.print_exc()