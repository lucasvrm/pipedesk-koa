"""
Playwright smoke test for the /admin/settings page.

How to run (assumes deps installed and app running locally):

python scripts/admin_settings_smoke.py \
    --base-url http://localhost:12000/ \
    --email lucasvaladaresroquettemaia@gmail.com --password 123456!

O script:
- Faz login se cair na tela de /login
- Clica em cada aba de /admin/settings (Negócios, Players, Track Status, etc)
- Em cada aba tenta:
  - Abrir/fechar modal (botão Novo/Nova/New)
  - Tocar no primeiro toggle [role="switch"]
- Verifica se apareceram erros no console
"""

import argparse
import re
from dataclasses import dataclass
from typing import Dict, List, Optional, Sequence, Tuple

from playwright.sync_api import (
    ConsoleMessage,
    Locator,
    Page,
    TimeoutError as PlaywrightTimeoutError,
    sync_playwright,
)

# ---------------------------------------------------------------------------
# Config: tabs e cards (se quiser, você pode ir ajustando isso aqui)
# ---------------------------------------------------------------------------

# Tabs exatamente como aparecem na UI
TAB_LABELS: List[str] = [
    "Negócios",
    "Players",
    "Track Status",
    "Tarefas",
    "Sistema",
    "Comms",
    "Permissões",
    "Tags",
]

# Se quiser exercitar cards específicos por aba, pode mapear aqui.
# Por enquanto deixei só as chaves, você pode preencher depois.
TAB_CARDS: Dict[str, Sequence[str]] = {
    "Negócios": (
        "Produtos",
        "Tipos de Operação",
        "Motivos de Perda",
        "Origens de Deal (Sources)",
    ),
    "Players": ("Categorias de Players",),
    "Track Status": ("Track Status",),
    "Tarefas": ("Status de Tarefas", "Prioridades de Tarefas"),
    "Sistema": ("Feriados & Dias Não Úteis",),
    "Comms": ("Templates de Mensagens",),
    "Permissões": ("Controle de Funções (Roles)",),
    "Tags": ("Gerenciador de Tags",),
}

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


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _find_first_existing(locators: Sequence[Locator]) -> Optional[Locator]:
    """Returns the first locator that has at least one element."""
    for loc in locators:
        try:
            if loc.count() > 0:
                return loc
        except Exception:
            continue
    return None


def login_if_needed(page: Page, email: str, password: str) -> None:
    """Optional login step; no-op if the page is already authenticated."""
    if "login" not in page.url and "signin" not in page.url:
        return

    # Campo de e-mail: focar em input mesmo, nada de get_by_label
    email_locator = _find_first_existing(
        [
            page.locator("input[type='email']"),
            page.get_by_placeholder("E-mail"),
            page.get_by_placeholder("Email"),
            page.get_by_role("textbox", name=re.compile("e-?mail|email", re.IGNORECASE)),
        ]
    )
    if email_locator:
        try:
            email_locator.first.fill(email)
        except Exception:
            pass

    # Campo de senha: idem
    password_locator = _find_first_existing(
        [
            page.locator("input[type='password']"),
            page.get_by_placeholder("Senha"),
            page.get_by_placeholder("Password"),
            page.get_by_role("textbox", name=re.compile("senha|password", re.IGNORECASE)),
        ]
    )
    if password_locator:
        try:
            password_locator.first.fill(password)
        except Exception:
            pass

    # Botão Entrar / Login
    login_button = _find_first_existing(
        [
            page.get_by_role("button", name=re.compile("Entrar", re.IGNORECASE)),
            page.get_by_role("button", name=re.compile("Login", re.IGNORECASE)),
            page.get_by_text(re.compile("Entrar|Login", re.IGNORECASE)),
        ]
    )
    if login_button:
        try:
            btn = login_button.first
            btn.scroll_into_view_if_needed(timeout=2000)
            btn.click(timeout=5000, force=True)
        except PlaywrightTimeoutError:
            pass

    page.wait_for_timeout(1500)
    page.goto(page.url.replace("/login", "/admin/settings"))
    page.wait_for_timeout(1000)


def check_console_errors(console_messages: List[ConsoleMessage], start_index: int) -> List[str]:
    errors: List[str] = []
    for msg in console_messages[start_index:]:
        if msg.type == "error":
            errors.append(f"{msg.text}")
    return errors


def open_and_close_modal(container: Locator) -> None:
    new_btn = container.locator(BUTTON_SELECTORS["new"]).first
    try:
        if new_btn.count() and new_btn.is_visible() and new_btn.is_enabled():
            new_btn.click()
            container.page.wait_for_timeout(400)
            dialog = container.page.locator(DIALOG_SELECTOR)
            if dialog.count() and dialog.first.is_visible():
                cancel_btn = container.page.locator(BUTTON_SELECTORS["cancel"]).first
                if cancel_btn.count() and cancel_btn.is_visible():
                    cancel_btn.click()
                    container.page.wait_for_timeout(200)
    except Exception:
        # Best-effort
        pass


def toggle_first_switch(container: Locator) -> None:
    switches = container.locator(TOGGLE_SELECTOR)
    try:
        if switches.count():
            first_switch = switches.first
            if first_switch.is_visible() and first_switch.is_enabled():
                first_switch.click()
                container.page.wait_for_timeout(200)
                first_switch.click()
                container.page.wait_for_timeout(200)
    except Exception:
        pass


def _find_card_heading(container: Locator, card_title: str) -> Optional[Locator]:
    """
    Procura headings com o título do card.
    Pode ser ajustado conforme for vendo os headings reais no DOM.
    """
    # Tenta por role=heading
    loc = container.get_by_role("heading", name=card_title, exact=False)
    if loc.count():
        return loc.first

    # Fallback: qualquer texto com esse conteúdo
    generic = container.get_by_text(card_title, exact=False)
    if generic.count():
        return generic.first

    return None


def exercise_card(tab_panel: Locator, card_title: str) -> None:
    heading = _find_card_heading(tab_panel, card_title)
    if not heading:
        return

    try:
        card_container = heading.locator(
            "xpath=ancestor::*[contains(@class,'card') or contains(@class,'Card')][1]"
        )
        if not card_container.count():
            card_container = tab_panel
    except Exception:
        card_container = tab_panel

    open_and_close_modal(card_container)
    toggle_first_switch(card_container)


def exercise_tab(
    page: Page,
    tab_label: str,
    card_titles: Sequence[str],
    console_messages: List[ConsoleMessage],
) -> Optional[str]:
    """
    Clica na aba pelo texto (role=tab) e exercita os cards dentro do tabpanel ativo.
    """
    # 1) Encontrar a aba, usando o DOM que você mandou:
    #    <button role="tab" data-slot="tabs-trigger"> ... Negócios </button>
    tab_locator = _find_first_existing(
        [
            page.get_by_role("tab", name=tab_label, exact=False),
            page.locator("[role='tab'][data-slot='tabs-trigger']", has_text=tab_label),
        ]
    )

    if not tab_locator:
        return f"Tab '{tab_label}' not found"

    try:
        tab = tab_locator.first
        try:
            tab.scroll_into_view_if_needed(timeout=2000)
        except Exception:
            pass
        tab.click(timeout=5000, force=True)
    except PlaywrightTimeoutError:
        return f"Tab '{tab_label}' could not be clicked (timeout)."

    page.wait_for_timeout(700)

    # Painel ativo no Radix Tabs:
    # <div role="tabpanel" data-state="active" ...>
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
        for tab_label in TAB_LABELS:
            card_titles = TAB_CARDS.get(tab_label, ())
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
    parser.add_argument(
        "--base-url",
        default="http://localhost:5000",
        help="Base URL of the app",
    )
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
