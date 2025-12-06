from playwright.sync_api import sync_playwright
import time

def verify_deal_features():
    with sync_playwright() as p:
        # Launch with specific locale to avoid RangeError in Intl.Locale
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(locale='pt-BR')
        page = context.new_page()

        try:
            # 1. Check if deals exist
            print("Navigating to /deals...")
            page.goto("http://localhost:12000/deals")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(3000)

            deals = page.locator("a[href^='/deals/']")
            count = deals.count()
            print(f"Found {count} deals.")

            if count == 0:
                print("No deals found. Generating synthetic data...")
                print("Navigating to /admin/gerador-dados...")
                page.goto("http://localhost:12000/admin/gerador-dados")
                page.wait_for_load_state("networkidle")

                # Verify we are on the right page
                try:
                    page.wait_for_selector("text=Admin de Dados Sintéticos", timeout=5000)
                except:
                    print("Could not verify Admin page loaded via text.")

                # Generate Users first
                print("Clicking 'Gerar Usuários'...")
                # Try multiple selector strategies
                user_btn = page.get_by_role("button", name="Gerar Usuários")
                if user_btn.count() == 0:
                    user_btn = page.locator("button").filter(has_text="Gerar Usuários")

                if user_btn.count() > 0:
                    user_btn.click()
                else:
                    print("Button 'Gerar Usuários' not found. Trying 'Gerar Dados Sintéticos' directly...")

                # Confirm Modal (if clicked)
                try:
                    page.wait_for_selector("text=Confirmar", timeout=2000)
                    page.get_by_role("button", name="Confirmar").click()
                    print("Confirmed user generation.")
                    # Wait for success toast
                    page.wait_for_selector("text=usuários criados com sucesso", timeout=30000)
                    print("Users generated.")
                except Exception as e:
                    print(f"User generation flow failed or skipped: {e}")

                # Generate CRM Data
                print("Clicking 'Gerar Dados Sintéticos'...")
                crm_btn = page.get_by_role("button", name="Gerar Dados Sintéticos")
                if crm_btn.count() == 0:
                    crm_btn = page.locator("button").filter(has_text="Gerar Dados Sintéticos")

                crm_btn.click()

                # Confirm Modal
                print("Waiting for confirmation modal...")
                page.wait_for_selector("text=Confirmar")
                page.get_by_role("button", name="Confirmar").click()

                # Wait for success toast
                print("Waiting for CRM generation success...")
                # This might take longer
                page.wait_for_selector("text=Dados CRM gerados com sucesso", timeout=60000)
                print("CRM Data generated.")

                # Go back to deals
                print("Navigating back to /deals...")
                page.goto("http://localhost:12000/deals")
                page.wait_for_load_state("networkidle")
                page.wait_for_timeout(3000)

                deals = page.locator("a[href^='/deals/']")
                count = deals.count()
                print(f"Found {count} deals after generation.")

                if count == 0:
                    print("WARNING: Still no deals found. Screenshotting...")
                    page.screenshot(path="verification_no_deals.png")
                    # Try to force navigation to a deal if we know ID (unlikely)
                    return

            # 2. Navigate to first deal
            first_deal = deals.first
            deal_href = first_deal.get_attribute("href")
            print(f"Navigating to deal: {deal_href}")
            first_deal.click()

            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(5000) # Give it plenty of time to render

            # 3. Verify Features
            # Buying Committee
            print("Checking Buying Committee...")
            # Using broader text search
            buying_committee = page.locator("text=Comitê de Compra")
            if buying_committee.count() > 0:
                print("Buying Committee Card found.")
                # buying_committee.first.scroll_into_view_if_needed()
                page.screenshot(path="verification_buying_committee.png")
            else:
                print("Buying Committee Card NOT found.")

            # Tags
            print("Checking Tags...")
            tags = page.locator("text=Tags")
            if tags.count() > 0:
                print("Tags Card found.")
                # tags.first.scroll_into_view_if_needed()
                page.screenshot(path="verification_tags.png")
            else:
                print("Tags Card NOT found.")

            # Unified Timeline
            print("Checking Unified Timeline...")
            # "Atividades" tab
            activities_tab = page.locator("button", has_text="Atividades")
            if activities_tab.count() > 0:
                print("Activities Tab found. Clicking...")
                activities_tab.first.click()
                page.wait_for_timeout(2000)
                page.screenshot(path="verification_timeline.png")
                print("Timeline verified.")
            else:
                print("Activities Tab NOT found.")

            # Full page screenshot
            page.screenshot(path="verification_deal_detail.png")
            print("Full deal detail screenshot saved.")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path="verification_error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_deal_features()
