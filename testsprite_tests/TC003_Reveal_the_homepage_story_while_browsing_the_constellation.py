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
        
        # -> Scroll the homepage down one full page to reveal the area below the hero (look for the constellation network or act panels).
        await page.mouse.wheel(0, 300)
        
        # -> Scroll the homepage further so the constellation canvas and the 'Act 01 — A person in the network' story panel (and subsequent act panels) are revealed.
        await page.mouse.wheel(0, 300)
        
        # -> Scroll the homepage to reveal 'Act 02 — The want' and the subsequent act panels.
        await page.mouse.wheel(0, 300)
        
        # -> Scroll the homepage down one viewport to reveal 'Act 03 — A connection' and confirm the narrative panels continue in sequence.
        await page.mouse.wheel(0, 300)
        
        # --> Assertions to verify final state
        
        # --> The homepage shows the constellation network with participant names visible.
        # Assert-outcome: passed
        # Assert: Participant name 'Aria Mendes' is visible in the network area, indicating the constellation content is displayed.
        await expect(page.locator("xpath=/html/body/div/div/main/article/div/div[1]/div").nth(0)).to_contain_text("Aria Mendes", timeout=15000), "Participant name 'Aria Mendes' is visible in the network area, indicating the constellation content is displayed."
        
        # --> The five-act narrative is present and can be revealed in order (Act 01 through Act 05).
        # Assert-outcome: passed
        # Assert: The 'Act 01' heading is present on the page.
        await expect(page.locator("xpath=/html/body/div/div/main/article/div/div[1]/div").nth(0)).to_contain_text("Act 01 \u2014 A person in the network", timeout=15000), "The 'Act 01' heading is present on the page."
        # Assert-outcome: passed
        # Assert: The Act 05 form 'Continue →' button is present, showing the final act/panel is reachable.
        await expect(page.locator("xpath=/html/body/div/div/main/article/section[2]/form/div/div[3]/button[2]").nth(0)).to_contain_text("Continue \u2192", timeout=15000), "The Act 05 form 'Continue \u2192' button is present, showing the final act/panel is reachable."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    