
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_frontend(page: Page):
    page.goto("http://localhost:3000/auth/login")
    page.wait_for_timeout(2000)

    # Check if we are on the login page and it's visible
    print(f"Current URL: {page.url}")
    page.screenshot(path="login_page_check.png")

    # Try to fill the form
    try:
        page.fill('#email', "admin@escalafin.com")
        page.fill('#password', "admin123")
        page.click('button[type="submit"]')
        page.wait_for_timeout(5000)
    except Exception as e:
        print(f"Could not login: {e}")

    # 1. Scoring & ML
    page.goto("http://localhost:3000/admin/scoring")
    page.wait_for_timeout(2000)
    page.screenshot(path="scoring_ml.png")

    # 2. WhatsApp Center
    page.goto("http://localhost:3000/admin/whatsapp")
    page.wait_for_timeout(2000)
    page.screenshot(path="whatsapp_center.png")

    # 3. Collections
    page.goto("http://localhost:3000/admin/collections")
    page.wait_for_timeout(2000)
    page.screenshot(path="collections.png")

    # 4. KYC
    page.goto("http://localhost:3000/admin/kyc")
    page.wait_for_timeout(2000)
    page.screenshot(path="kyc.png")

    # 5. Reports
    page.goto("http://localhost:3000/admin/reports")
    page.wait_for_timeout(2000)
    page.screenshot(path="reports.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_frontend(page)
        finally:
            browser.close()
