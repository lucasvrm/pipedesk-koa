"""
Playwright smoke test for the /admin/settings page.

How to run (assumes deps installed and app running locally):

python scripts/admin_settings_smoke.py \
    --base-url http://localhost:5000 \
    --email admin@example.com --password secret

The script keeps layout and functionality untouched: it only navigates, opens
modals, optionally exercises toggles, and asserts the absence of console
errors. Selectors are configurable via constants so you can adapt them if the
UI labels differ.
"""

import argparse
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence, Tuple

from playwright.sync_api import ConsoleMessage, Locator, Page, sync_playwright

# Adjustable selectors/texts to match the UI without changing the codebase
TAB_CONFIG: List[Tuple[str, Sequence[str]]] = [
    (
        "Negócios",
        (
            "Produtos",
            "Tipos de Operação",
            "Motivos de Perda",
            "Origens de Deal (Sources)",
        ),
    ),
    ("Players", ("Categorias de Players",)),
    ("Track Status", ("Track Status",)),
    ("Tarefas", ("Status de Tarefas", "Prioridades de Tarefas")),
    ("Sistema", ("Feriados & Dias Não Úteis",)),
    ("Comms", ("Templates de Mensagens",)),
    ("Permissões", ("Controle de Funções (Roles)",)),
    ("Tags", ("Gerenciador de Tags",)),
]

BUTTON_SELECTORS: Dict[str, str] = {
    "new": (
        "button:has-text('Novo'),"
        " button:has-text('Nova'),"
        " button:has-text('New'),"
        " button:has-text('Nova Função'),"
        " button:has-text('Nova Tag')"
    ),
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
    page.get_by_label("E-mail", exact=False).fill(email)
    page.get_by_label("Senha", exact=False).fill(password)
    page.get_by_role("button", name="Entrar", exact=False).click()
    page.wait_for_timeout(1500)
    page.goto(page.url.replace("/login", "/admin/settings"))


def check_console_errors(console_messages: List[ConsoleMessage], start_index: int) -> List[str]:
    errors: List[str] = []
    for msg in console_messages[start_index:]:
        if msg.type == "error":
            errors.append(f"{msg.text}")
    return errors


def open_and_close_modal(container: Locator) -> None:
    new_btn = container.locator(BUTTON_SELECTORS["new"]).first
    if new_btn and new_btn.is_visible() and new_btn.is_enabled():
        new_btn.click()
        container.page.wait_for_timeout(400)
        dialog = container.page.locator(DIALOG_SELECTOR)
        if dialog and dialog.is_visible():
            cancel_btn = container.page.locator(BUTTON_SELECTORS["cancel"]).first
            if cancel_btn and cancel_btn.is_visible():
                cancel_btn.click()
                container.page.wait_for_timeout(200)


def toggle_first_switch(container: Locator) -> None:
    switches = container.locator(TOGGLE_SELECTOR)
    if switches.count():
        first_switch = switches.first
        if first_switch.is_visible() and first_switch.is_enabled():
            first_switch.click()
            container.page.wait_for_timeout(200)
            first_switch.click()
            container.page.wait_for_timeout(200)


def exercise_card(tab_panel: Locator, card_title: str) -> None:
    heading = tab_panel.get_by_role("heading", name=card_title, exact=False)
    if not heading.count():
        return

    card_container = heading.first.locator(
        "xpath=ancestor::*[contains(@class,'card')][1]"
    )
    open_and_close_modal(card_container)
    toggle_first_switch(card_container)


def exercise_tab(
    page: Page,
    tab_label: str,
    card_titles: Sequence[str],
    console_messages: List[ConsoleMessage]
) -> Optional[str]:
    page.get_by_role("tab", name=tab_label, exact=False).click()
    page.wait_for_timeout(700)

    tab_panel = page.locator("[role='tabpanel'][data-state='active']").first
    target_container = tab_panel if tab_panel.count() else page

    start_index = len(console_messages)

    for card_title in card_titles:
        exercise_card(target_container, card_title)

    errors = check_console_errors(console_messages, start_index)
    return "; ".join(errors) if errors else None


def run_smoke(base_url: str, creds: Optional[Credentials]) -> int:
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        console_messages: List[ConsoleMessage] = []
        page.on("console", lambda msg: console_messages.append(msg))

        page.goto(f"{base_url}/admin/settings")
        page.wait_for_timeout(1500)
        if creds:
            login_if_needed(page, creds.email, creds.password)
        page.wait_for_timeout(1000)

        failures: List[str] = []
        for tab_label, card_titles in TAB_CONFIG:
            error_text = exercise_tab(page, tab_label, card_titles, console_messages)
            if error_text:
                failures.append(f"Tab '{tab_label}': {error_text}")

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
