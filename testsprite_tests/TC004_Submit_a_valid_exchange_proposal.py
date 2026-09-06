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
        
        # -> Open the exchange creation page by navigating to /exchange/new (the exchange creation route).
        await page.goto("http://localhost:5173/exchange/new")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the 'network' link (the visible 'network' text) to choose a person to propose an exchange with.
        # network link
        elem = page.get_by_role('link', name='network', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open Aria Mendes' profile by clicking the 'View profile →' link to start an exchange proposal.
        # View profile → link
        elem = page.get_by_text('24 given · 19 received', exact=True).locator("xpath=ancestor-or-self::*[.//a][1]").get_by_role('link', name='View profile →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the exchange proposal form by clicking the 'Propose an exchange →' button on Aria Mendes' profile page.
        # Propose an exchange → button
        elem = page.get_by_role('button', name='Propose an exchange →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select 'Knife Skills' under 'You give', select 'Sourdough' under 'They give', enter a short message in the message field, then click the 'Send proposal →' button to submit the exchange proposal.
        # Knife Skills button
        elem = page.get_by_text('You give', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='Knife Skills', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select 'Knife Skills' under 'You give', select 'Sourdough' under 'They give', enter a short message in the message field, then click the 'Send proposal →' button to submit the exchange proposal.
        # Sourdough button
        elem = page.get_by_text('They give', exact=True).locator("xpath=ancestor-or-self::*[.//button][1]").get_by_role('button', name='Sourdough', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select 'Knife Skills' under 'You give', select 'Sourdough' under 'They give', enter a short message in the message field, then click the 'Send proposal →' button to submit the exchange proposal.
        # Hi Aria, I've been wanting to learn Sourdough for... text area
        elem = page.locator('[id="t-a-short-message-(optional)"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Hi Aria \u2014 I can teach Knife Skills and would love to learn Sourdough. Interested?")
        
        # -> Select 'Knife Skills' under 'You give', select 'Sourdough' under 'They give', enter a short message in the message field, then click the 'Send proposal →' button to submit the exchange proposal.
        # Send proposal → button
        elem = page.get_by_role('button', name='Send proposal →', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The Inbox page is displayed.
        # Assert-outcome: passed
        # Assert: URL contains 'inbox', confirming the Inbox page is shown.
        await expect(page).to_have_url(re.compile("inbox"), timeout=15000), "URL contains 'inbox', confirming the Inbox page is shown."
        
        # --> Inbox shows a proposed exchange entry for Aria Mendes reading 'You give Knife Skills for Sourdough'.
        # Assert-outcome: passed
        # Assert: The page text contains 'You give Knife Skills for Sourdough', showing the proposed trade in Inbox.
        await expect(page.locator("xpath=/html/body/div").nth(0)).to_contain_text("You give Knife Skills  for Sourdough", timeout=15000), "The page text contains 'You give Knife Skills for Sourdough', showing the proposed trade in Inbox."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    