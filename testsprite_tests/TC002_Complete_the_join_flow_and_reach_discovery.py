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
        
        # -> Click the 'Join' button in the top-right of the header to open the onboarding flow.
        # Join link
        elem = page.get_by_role('link', name='Join', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Your name' field and the 'Email' field, then click the 'Continue →' button to proceed to the 'What you teach' step.
        # e.g. Aria Mendes text field
        elem = page.locator('[id="f-your-name"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Aria Mendes")
        
        # -> Fill the 'Your name' field and the 'Email' field, then click the 'Continue →' button to proceed to the 'What you teach' step.
        # you@somewhere.com email field
        elem = page.locator('[id="f-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("aria.mendes@example.com")
        
        # -> Fill the 'Your name' field and the 'Email' field, then click the 'Continue →' button to proceed to the 'What you teach' step.
        # Continue → button
        elem = page.get_by_role('button', name='Continue →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select a teach skill (for example, click the 'JavaScript' chip) and then click the 'Continue →' button to proceed to the 'What you learn' step.
        # JavaScript button
        elem = page.get_by_role('button', name='JavaScript', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select a teach skill (for example, click the 'JavaScript' chip) and then click the 'Continue →' button to proceed to the 'What you learn' step.
        # Continue → button
        elem = page.get_by_role('button', name='Continue →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select a learn skill (click the 'React' chip) and then click the 'Join the network →' button to finish onboarding and navigate to Discover.
        # React button
        elem = page.get_by_role('button', name='React', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select a learn skill (click the 'React' chip) and then click the 'Join the network →' button to finish onboarding and navigate to Discover.
        # Join the network → button
        elem = page.get_by_role('button', name='Join the network →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Discover' link in the header to open the Discover page and verify profile cards are displayed.
        # Discover link
        elem = page.get_by_role('link', name='Discover', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Navigated to the Discover page (/discover).
        # Assert-outcome: passed
        # Assert: Page URL contains /discover.
        await expect(page).to_have_url(re.compile("/discover"), timeout=15000), "Page URL contains /discover."
        
        # --> Discover shows a profile card for the new user 'Aria Mendes'.
        # Assert-outcome: passed
        # Assert: Profile card displays the name 'Aria Mendes'.
        await expect(page.locator("xpath=/html/body/div/div/main/div/ul/li[2]/article/div[1]/div[2]/h3/a").nth(0)).to_have_text("Aria Mendes", timeout=15000), "Profile card displays the name 'Aria Mendes'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    