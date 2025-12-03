"""
Playwright smoke test for the /admin/settings page.

How to run (assumes deps installed and app running locally):
    python scripts/admin_settings_smoke.py --base-url http://localhost:5000 \
        --email admin@example.com --password secret

The script keeps layout and functionality untouched: it only navigates, opens modals,
optionally exercises toggles, and asserts the absence of console errors. Selectors are
configurable via constants so you can adapt them if the UI labels differ.
"""

import argparse
from dataclasses import dataclass
from typing import Dict, List, Optional

from playwright.sync_api import Page, sync_playwright

# Adjustable selectors/texts to match the UI without changing the codebase
TAB_LABELS: List[str] = [
    "Products",
    "Deal Sources",
    "Loss Reasons",
    "Player Categories",
    "Holidays",
    "Communication Templates",
    "Track Statuses",
    "Operation Types",
    "Task Statuses",
    "Task Priorities",
    "Roles",
    "Tags",
]

BUTTON_SELECTORS: Dict[str, str] = {
    "new": "button:has-text('Novo'), button:has-text('New')",
    "cancel": "button:has-text('Cancelar'), button:has-text('Cancel')",
}

DIALOG_SELECTOR = "role=dialog"
TOGGLE_SELECTOR = "[role='switch']"


@dataclass
class Credentials:
    email: str
    password: str


def login_if_needed(page: Page, email: str, password: str) -> None:
    """Optional login step; no-op if the page is already authenticated."""
    if "login" not in page.url and "signin" not in page.url:
        return
    page.get_by_label("Email", exact=False).fill(email)
    page.get_by_label("Password", exact=False).fill(password)
    page.get_by_role("button", name="Sign in").click()
    page.wait_for_timeout(1500)


def check_console_errors(page: Page) -> List[str]:
    errors: List[str] = []
    for msg in page.console_messages():
        if msg.type == "error":
            errors.append(f"{msg.text}")
    return errors


def open_and_close_modal(page: Page) -> None:
    new_btn = page.query_selector(BUTTON_SELECTORS["new"])
    if new_btn and new_btn.is_visible():
        new_btn.click()
        page.wait_for_timeout(300)
        dialog = page.query_selector(DIALOG_SELECTOR)
        if dialog and dialog.is_visible():
            cancel_btn = page.query_selector(BUTTON_SELECTORS["cancel"])
            if cancel_btn and cancel_btn.is_visible():
                cancel_btn.click()
                page.wait_for_timeout(200)


def toggle_first_switch(page: Page) -> None:
    switches = page.query_selector_all(TOGGLE_SELECTOR)
    if switches:
        switches[0].click()
        page.wait_for_timeout(200)
        switches[0].click()
        page.wait_for_timeout(200)


def exercise_tab(page: Page, tab_label: str) -> Optional[str]:
    page.get_by_role("tab", name=tab_label, exact=False).click()
    page.wait_for_timeout(500)
    open_and_close_modal(page)
    toggle_first_switch(page)
    errors = check_console_errors(page)
    return "; ".join(errors) if errors else None


def run_smoke(base_url: str, creds: Optional[Credentials]) -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(f"{base_url}/admin/settings")
        page.wait_for_timeout(1500)
        if creds:
            login_if_needed(page, creds.email, creds.password)
        page.wait_for_timeout(800)

        failures: List[str] = []
        for tab in TAB_LABELS:
            error_text = exercise_tab(page, tab)
            if error_text:
                failures.append(f"Tab '{tab}': {error_text}")

        browser.close()

    if failures:
        print("Failures detected:")
        for fail in failures:
            print(f" - {fail}")
        return 1

    print("All tabs exercised without console errors.")
    return 0


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Smoke test for /admin/settings UI")
    parser.add_argument("--base-url", default="http://localhost:5000", help="Base URL of the app")
    parser.add_argument("--email", help="Admin email for login (if required)")
    parser.add_argument("--password", help="Admin password for login (if required)")
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()
    creds = None
    if args.email and args.password:
        creds = Credentials(email=args.email, password=args.password)
    exit_code = run_smoke(args.base_url, creds)
    raise SystemExit(exit_code)
