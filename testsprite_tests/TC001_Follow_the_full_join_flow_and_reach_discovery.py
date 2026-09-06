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
        
        # -> Scroll down the homepage to reveal the join area and onboarding form.
        await page.mouse.wheel(0, 300)
        
        # -> Scroll further down the homepage to reveal the join area and the onboarding form so the name, email, and skill selection fields become visible.
        await page.mouse.wheel(0, 300)
        
        # -> Fill the 'Your name' field with a valid display name 'Test User' and the 'Email' field with 'test.user@example.com', then scroll down to reveal the skill selection controls.
        # e.g. Aria Mendes text field
        elem = page.locator('[id="f-your-name"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Test User")
        
        # -> Fill the 'Your name' field with a valid display name 'Test User' and the 'Email' field with 'test.user@example.com', then scroll down to reveal the skill selection controls.
        # you@somewhere.com email field
        elem = page.locator('[id="f-email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("test.user@example.com")
        
        # -> Fill the 'Your name' field with a valid display name 'Test User' and the 'Email' field with 'test.user@example.com', then scroll down to reveal the skill selection controls.
        await page.mouse.wheel(0, 300)
        
        # -> Click the 'Continue →' button to advance the onboarding flow and reveal the skill selection controls.
        # Continue → button
        elem = page.get_by_role('button', name='Continue →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '← Back' button to open the 'What you teach' skill-selection panel.
        # ← Back button
        elem = page.get_by_role('button', name='← Back', exact=True)
        await elem.click(timeout=10000)
        
        # -> Reveal the skill-selection area and locate the 'What you teach' heading by scrolling the page upward so the teach-skill chips become visible.
        await page.mouse.wheel(0, 300)
        
        # -> Reveal the 'What you teach' skill chips so at least one teach-skill button is visible.
        await page.mouse.wheel(0, 300)
        
        # -> Scroll the page upward to reveal the 'What you teach' skill-selection chips so at least one teach-skill button is visible.
        await page.mouse.wheel(0, 300)
        
        # -> Scroll the page down to reveal the 'What you teach' skill-selection chips so at least one teach-skill button is visible.
        await page.mouse.wheel(0, 300)
        
        # -> Click the 'Continue →' button to advance to the 'What you teach' skill-selection panel.
        # Continue → button
        elem = page.get_by_role('button', name='Continue →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the 'Figma' teach-skill chip, then click the 'Continue →' button to advance to the learning-selection step.
        # Figma button
        elem = page.get_by_role('button', name='Figma', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select the 'Figma' teach-skill chip, then click the 'Continue →' button to advance to the learning-selection step.
        # Continue → button
        elem = page.get_by_role('button', name='Continue →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select 'Python' as a skill to learn and click the 'Join the network →' button to submit the onboarding form.
        # Python button
        elem = page.get_by_role('button', name='Python', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select 'Python' as a skill to learn and click the 'Join the network →' button to submit the onboarding form.
        # Join the network → button
        elem = page.get_by_role('button', name='Join the network →', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Design' category filter chip on the Discover page to verify the Discover filters update results for an onboarded member.
        # Design button
        elem = page.get_by_role('tab', name='Design', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Discovery page is displayed (navigated to /discover).
        # Assert-outcome: passed
        # Assert: Current URL contains /discover.
        await expect(page).to_have_url(re.compile("/discover"), timeout=15000), "Current URL contains /discover."
        
        # --> Discover UI and filters are available (Design chip selected and profile results shown).
        await page.locator("xpath=/html/body/div/div/main/div/ul/li[1]/article/div[1]/div[2]/h3/a").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: A Discover profile card (Tomi Adekoya) is visible on the page.
        await expect(page.locator("xpath=/html/body/div/div/main/div/ul/li[1]/article/div[1]/div[2]/h3/a").nth(0)).to_be_visible(timeout=15000), "A Discover profile card (Tomi Adekoya) is visible on the page."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    