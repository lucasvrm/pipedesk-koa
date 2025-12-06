from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        # FIX: Set locale to avoid 'en-US@posix' causing RangeError in Intl.Locale
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(locale='pt-BR')
        page = context.new_page()
        try:
            # Login first (mocked or real if we can)
            # Since we have a 'LoginView', maybe we can bypass or use existing credentials.
            # But we are in a dev environment.
            # Let's try to visit the admin pages directly. If protected, we might need to login.
            # Assuming we can access because of 'clean' env or we can mock auth state.
            # But the app uses Supabase Auth.

            # Let's try to hit the deals page first.
            # NOTE: Port changed to 12000 based on vite.config.ts
            page.goto("http://localhost:12000/deals")

            # Wait for loading
            page.wait_for_timeout(5000)

            # Screenshot Deals List
            page.screenshot(path="/home/jules/verification/deals_list.png")
            print("Screenshot saved to /home/jules/verification/deals_list.png")

            # Navigate to Admin Pipeline Settings if accessible
            # We need to find the link or go directly
            page.goto("http://localhost:12000/admin/pipeline")
            page.wait_for_timeout(3000)
            page.screenshot(path="/home/jules/verification/pipeline_settings.png")
            print("Screenshot saved to /home/jules/verification/pipeline_settings.png")

             # Navigate to Admin Tag Settings if accessible
            page.goto("http://localhost:12000/admin/tags")
            page.wait_for_timeout(3000)
            page.screenshot(path="/home/jules/verification/tag_settings.png")
            print("Screenshot saved to /home/jules/verification/tag_settings.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
