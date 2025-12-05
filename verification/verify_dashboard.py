from playwright.sync_api import sync_playwright

def verify_dashboard():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need a large viewport to see the dashboard layout properly
        page = browser.new_page(viewport={'width': 1280, 'height': 800})

        try:
            # 1. Go to login page
            print("Navigating to login...")
            page.goto("http://localhost:3000/login")

            # 2. Login (using mock/test credentials if possible, or UI interaction)
            # Fill email
            page.fill('input[type="email"]', 'admin@example.com')
            page.fill('input[type="password"]', 'password123')
            page.click('button[type="submit"]')

            # Wait for navigation to dashboard (timeout might occur if auth fails)
            try:
                page.wait_for_url("**/dashboard", timeout=5000)
                print("Logged in successfully!")

                # Wait for dashboard content to load
                page.wait_for_selector("text=Olá,", timeout=5000)

                # Take screenshot of Dashboard
                page.screenshot(path="verification/dashboard_initial.png")

                # 3. Click "Personalizar"
                print("Clicking Personalizar...")
                page.click("text=Personalizar")

                # Wait for dialog
                page.wait_for_selector("text=Personalizar Dashboard")

                # Take screenshot of Dialog
                page.screenshot(path="verification/dashboard_customize.png")

            except Exception as e:
                print(f"Login failed or timeout: {e}")
                page.screenshot(path="verification/login_failed.png")

        except Exception as e:
            print(f"Global error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_dashboard()
