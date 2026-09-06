import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:5173/")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Open the 'New exchange' page by navigating to the /exchange/new route so the proposal form can be filled.
        await page.goto("http://localhost:5173/exchange/new")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'network' link (labeled "network") to open the person picker so a person can be selected.
        # network link
        elem = page.get_by_role('link', name='network', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'View profile →' link for Aria Mendes to open their profile and continue the exchange proposal flow.
        # View profile → link
        elem = page.get_by_text('24 given · 19 received', exact=True).locator("xpath=ancestor-or-self::*[.//a][1]").get_by_role('link', name='View profile →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Propose an exchange →' button on Aria Mendes' profile to open the exchange proposal form.
        # Propose an exchange → button
        elem = page.get_by_role('button', name='Propose an exchange →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Sourdough' button under 'You give' to select a skill to offer.
        # Sourdough button
        elem = page.get_by_text('You give', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='Sourdough', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Sourdough' button under 'You give' to select a skill to offer.
        # Knife Skills button
        elem = page.get_by_text('They give', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='Knife Skills', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Sourdough' button under 'You give' to select a skill to offer.
        # Hi Aria, I've been wanting to learn Sourdough for... text area
        elem = page.locator('[id="t-a-short-message-(optional)"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Hi Aria \u2014 I can teach Knife Skills and would love to learn Sourdough. Would you be up for swapping an hour?")
        
        # -> Click the 'Sourdough' button under 'You give' to select a skill to offer.
        # Send proposal → button
        elem = page.get_by_role('button', name='Send proposal →', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The inbox route is shown (URL contains 'inbox').
        # Assert-outcome: passed
        # Assert: URL contains 'inbox', confirming the Inbox page is displayed.
        await expect(page).to_have_url(re.compile("inbox"), timeout=15000), "URL contains 'inbox', confirming the Inbox page is displayed."
        
        # --> A proposed trade with Aria Mendes showing 'You give Sourdough for Knife Skills' is visible in the inbox.
        # Assert-outcome: passed
        # Assert: Inbox list contains the proposed exchange text 'You give Sourdough for Knife Skills'.
        await expect(page.locator("xpath=/html/body/div[1]").nth(0)).to_contain_text("You give Sourdough  for Knife Skills", timeout=15000), "Inbox list contains the proposed exchange text 'You give Sourdough for Knife Skills'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    