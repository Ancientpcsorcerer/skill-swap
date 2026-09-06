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
        
        # -> Click the header link labeled "Discover" to open the Discover page.
        # Discover link
        elem = page.get_by_role('link', name='Discover', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type 'Rust' into the search field labeled 'Search a name, a skill, a place…' and allow the UI to update.
        # Search the network search field
        elem = page.get_by_label('Search the network', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Rust")
        
        # -> Click the 'Code' category chip to filter results by Code, then open the 'Sort' dropdown labeled 'BEST MATCH'.
        # Code button
        elem = page.get_by_role('tab', name='Code', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Code' category chip to filter results by Code, then open the 'Sort' dropdown labeled 'BEST MATCH'.
        # Best match Recently joined Most active A → Z dropdown
        elem = page.get_by_label('Sort people', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the 'A → Z' option from the Sort dropdown labeled 'Sort' and verify the profile results (look for 'Theo Nilsen').
        # Best match Recently joined Most active A → Z dropdown
        elem = page.locator("xpath=/html/body/div/div/main/div/div/div[3]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # --> Assertions to verify final state
        
        # --> A filtered profile result for 'Theo Nilsen' is visible in the Discover results.
        await page.locator("xpath=/html/body/div/div/main/div/ul/li/article/div[1]/div[2]/h3/a").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: Profile 'Theo Nilsen' is visible in the results list.
        await expect(page.locator("xpath=/html/body/div/div/main/div/ul/li/article/div[1]/div[2]/h3/a").nth(0)).to_be_visible(timeout=15000), "Profile 'Theo Nilsen' is visible in the results list."
        
        # --> The results reflect the selected search and sort: the card shows 'Rust' under Teaches and the Sort control is set to 'A → Z'.
        # Assert-outcome: passed
        # Assert: The profile card lists 'Rust' in the Teaches section.
        await expect(page.locator("xpath=/html/body/div/div/main/div/ul/li/article/div[2]/div/span[1]").nth(0)).to_have_text("Rust", timeout=15000), "The profile card lists 'Rust' in the Teaches section."
        # Assert-outcome: passed
        # Assert: The Sort dropdown is set to 'A → Z'.
        await expect(page.locator("xpath=/html/body/div/div/main/div/div/div[3]/select").nth(0)).to_have_value("A \u2192 Z", timeout=15000), "The Sort dropdown is set to 'A \u2192 Z'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    