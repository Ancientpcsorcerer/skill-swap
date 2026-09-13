import { expect, test, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createLocalConnectRepository } from '../src/modules/connect/repository';

test.beforeEach(({}, info) => test.skip(info.project.name !== 'desktop', 'Desktop/laptop application milestone'));
const password = 'LocalTestPass123!';
const row = (page: Page, id: string) => page.locator('.person-row[data-person-id="' + id + '"]');
const nav = (page: Page, name: string) => page.getByRole('navigation', { name: 'Application navigation' }).getByRole('link', { name, exact: true });
async function register(page: Page, destination = 'connect', email = 'mira@example.test', name = 'Mira Shah') {
  await page.goto('/#/app/' + destination);
  await page.getByRole('textbox', {name:'Name',exact:true}).fill(name);
  await page.getByRole('textbox', {name:'Email',exact:true}).fill(email);
  await page.getByLabel('Password', {exact:true}).fill(password);
  await page.getByRole('button', {name:'SIGN UP',exact:true}).click();
  await expect(page.locator('.application-shell')).toHaveAttribute('data-active-module',destination);
  if(destination==='connect') await expect(page.locator('.person-row')).toHaveCount(12);
  await page.evaluate(() => document.fonts.ready);
}
async function readyArtwork(page: Page) {
  await page.evaluate(async()=>{
    await document.fonts.ready;
    const urls=Array.from(new Set(Array.from(document.querySelectorAll('svg image')).map(image=>image.getAttribute('href')!)));
    await Promise.all(urls.map(async url=>{const image=new Image();image.src=url;await image.decode();}));
    await new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve())));
  });
}
async function logout(page: Page) {
  await page.getByRole('button',{name:'User menu',exact:true}).click();
  await page.getByRole('menuitem',{name:'Log out',exact:true}).click();
  await expect(page.getByRole('heading',{name:'WELCOME BACK'})).toBeVisible();
}
async function fillProject(page: Page, name = 'Community Art Studio') {
  const dialog=page.getByRole('dialog',{name:'Create a Project',exact:true});
  await dialog.getByLabel('Project title',{exact:true}).fill(name);
  await dialog.getByRole('textbox',{name:'Description',exact:true}).fill('A shared studio for drawing, photography and local stories.');
  await dialog.getByLabel('Vision',{exact:true}).fill('Bring neighbours together through creative practice.');
  await dialog.getByRole('combobox',{name:'Project type',exact:true}).selectOption('Art');
  await dialog.getByLabel('Required skills or roles',{exact:true}).fill('Photography, Writing');
  return dialog;
}

test('sign-up validates input, preserves the requested destination and restores a local account',async({page})=>{
  const media:string[]=[];page.on('request',r=>{if(/\/(cores|Cores)\//.test(r.url()))media.push(r.url());});
  await page.goto('/#/app/discover');
  await expect(page.getByRole('heading',{name:'CREATE YOUR ACCOUNT'})).toBeVisible();
  await expect(page.getByText(/LOCAL DEMO|A place to build together|Enter demo workspace|Back to the experience/i)).toHaveCount(0);
  await page.getByRole('button',{name:'SIGN UP',exact:true}).click();
  expect(await page.locator('input:invalid').count()).toBe(3);
  await page.getByLabel('Name',{exact:true}).fill('Mira Shah');
  await page.getByLabel('Email',{exact:true}).fill('invalid');
  await page.getByLabel('Password',{exact:true}).fill('short');
  await page.getByRole('button',{name:'SIGN UP',exact:true}).click();
  await expect(page.locator('.application-shell')).toHaveCount(0);
  await page.getByLabel('Email',{exact:true}).fill('mira@example.test');
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'SIGN UP',exact:true}).click();
  await expect(page.locator('.application-shell')).toHaveAttribute('data-active-module','discover');
  await page.reload();await expect(page.locator('.application-shell')).toHaveAttribute('data-active-module','discover');
  await nav(page,'Profile').click();await expect(page.getByRole('heading',{name:'Mira Shah',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>localStorage.getItem('skill-swap.accounts.v1'))).not.toContain(password);
  expect(media).toEqual([]);
});

test('login rejects incorrect credentials, detects duplicate accounts and isolates saved work',async({page})=>{
  await register(page);
  await row(page,'aarav').getByRole('button',{name:'Connect',exact:true}).click();
  await expect(row(page,'aarav').getByRole('button',{name:'Request Sent',exact:true})).toBeDisabled();
  await logout(page);
  await page.getByLabel('Email',{exact:true}).fill('mira@example.test');
  await page.getByLabel('Password',{exact:true}).fill('WrongPassword');
  await page.getByRole('button',{name:'LOG IN',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('does not match');
  await page.getByRole('button',{name:'Sign up',exact:true}).click();
  await page.getByLabel('Name',{exact:true}).fill('Mira Shah');
  await page.getByLabel('Email',{exact:true}).fill('mira@example.test');
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'SIGN UP',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('already exists');
  await page.getByLabel('Name',{exact:true}).fill('Alex Rao');
  await page.getByLabel('Email',{exact:true}).fill('alex@example.test');
  await page.getByRole('button',{name:'SIGN UP',exact:true}).click();
  await nav(page,'Connect').click();await expect(row(page,'aarav').getByRole('button',{name:'Connect',exact:true})).toBeEnabled();
  await logout(page);
  await page.getByLabel('Email',{exact:true}).fill('mira@example.test');
  await page.getByLabel('Password',{exact:true}).fill(password);
  await page.getByRole('button',{name:'LOG IN',exact:true}).click();
  await nav(page,'Connect').click();await expect(row(page,'aarav').getByRole('button',{name:'Request Sent',exact:true})).toBeDisabled();
});

test('one stable shell supports sidebar, all Quick Access destinations, keyboard, history and profile links',async({page})=>{
  await register(page,'profile');
  const topbar=await page.locator('.workspace-topbar').elementHandle();
  const sidebar=await page.locator('.workspace-sidebar').elementHandle();
  for(const name of ['Connect','Create','Learn','Discover','Profile']){
    await nav(page,name).click();await expect(page.locator('.application-shell')).toHaveAttribute('data-active-module',name.toLowerCase());
    await expect(nav(page,name)).toHaveAttribute('aria-current','page');
    expect(await topbar!.evaluate(element=>element===document.querySelector('.workspace-topbar'))).toBe(true);
    expect(await sidebar!.evaluate(element=>element===document.querySelector('.workspace-sidebar'))).toBe(true);
    for(const core of ['CONNECT','CREATE','LEARN','DISCOVER']){
      await page.getByRole('button',{name:'Quick Access',exact:true}).click();
      await expect(page.getByRole('menuitem')).toHaveCount(4);
      await page.getByRole('menuitem',{name:core,exact:true}).click();
      await expect(page.locator('.application-shell')).toHaveAttribute('data-active-module',core.toLowerCase());
    }
  }
  await page.getByRole('button',{name:'Quick Access',exact:true}).click();
  await expect(page.getByRole('menuitem',{name:'CONNECT',exact:true})).toBeFocused();
  await page.keyboard.press('End');await expect(page.getByRole('menuitem',{name:'DISCOVER',exact:true})).toBeFocused();
  await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Quick Access',exact:true})).toBeFocused();
  await page.getByRole('button',{name:'Quick Access',exact:true}).click();await page.locator('h1').click();await expect(page.getByRole('menu')).toHaveCount(0);
  await page.getByRole('button',{name:'Search people',exact:true}).click();await expect(page.getByRole('searchbox')).toBeFocused();
  await page.getByRole('button',{name:'User menu',exact:true}).click();await page.getByRole('menuitem',{name:'My Profile',exact:true}).click();
  for(const core of ['Connect','Create','Learn','Discover']){
    await page.locator('.profile-core-links').getByRole('button',{name:new RegExp(core)}).click();await expect(page.locator('.application-shell')).toHaveAttribute('data-active-module',core.toLowerCase());await nav(page,'Profile').click();
  }
  await nav(page,'Learn').click();await nav(page,'Discover').click();await page.goBack();await expect(page.locator('.application-shell')).toHaveAttribute('data-active-module','learn');
  for(const id of ['profile','connect','create','learn','discover']){await page.goto('/#/app/'+id);await page.reload();await expect(page.locator('.application-shell')).toHaveAttribute('data-active-module',id);}
  await expect(page.locator('main')).toHaveCount(1);
});

test('Connect searches people and skills, filters, sorts, previews and persists request responses',async({page})=>{
  await register(page);
  const search=page.getByRole('searchbox');
  for(const [query,id] of [['  AARAV  ','aarav'],['photography','kabir'],['cooking','ananya'],['mathematics','dev'],['music','leela']]){await search.fill(query);await expect(row(page,id)).toBeVisible();}
  await search.fill('no-such-person');await expect(page.getByRole('heading',{name:'No people found'})).toBeVisible();
  await page.getByRole('button',{name:'Clear search',exact:true}).last().click();await expect(page.locator('.person-row')).toHaveCount(12);
  await page.getByLabel('Filter by category',{exact:true}).selectOption('Robotics');await expect(row(page,'aarav')).toBeVisible();await expect(row(page,'kabir')).toHaveCount(0);
  await page.getByLabel('Filter by category',{exact:true}).selectOption('All');await page.getByLabel('Sort people',{exact:true}).selectOption('Name');
  const names=await page.locator('.person-name').allTextContents();if(names.length)expect(names).toEqual([...names].sort((a,b)=>a.localeCompare(b)));
  await row(page,'ishita').getByRole('button',{name:'Ishita Rao',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Ishita Rao'});await expect(dialog.getByRole('button',{name:'Close',exact:true})).toBeFocused();
  await dialog.getByRole('button',{name:'Connect',exact:true}).click();await expect(dialog.getByRole('button',{name:'Request Sent',exact:true})).toBeDisabled();await page.keyboard.press('Escape');
  await page.getByRole('tab',{name:'People',exact:true}).focus();await page.keyboard.press('ArrowRight');await expect(page.getByRole('tab',{name:'Suggested',exact:true})).toBeFocused();
  await expect(page.locator('.person-row')).toHaveCount(6);
  await page.getByRole('tab',{name:'Requests',exact:true}).click();await row(page,'rohan').getByRole('button',{name:'Accept',exact:true}).click();await row(page,'sara').getByRole('button',{name:'Decline',exact:true}).click();
  await page.getByRole('tab',{name:'People',exact:true}).click();await expect(row(page,'rohan').getByRole('button',{name:'Connected',exact:true})).toBeDisabled();await expect(row(page,'sara').getByRole('button',{name:'Connect',exact:true})).toBeEnabled();
  await page.reload();await expect(row(page,'ishita').getByRole('button',{name:'Request Sent',exact:true})).toBeDisabled();await expect(row(page,'rohan').getByRole('button',{name:'Connected',exact:true})).toBeDisabled();
});

test('Create supports templates, draft files, status management, collaborator search and profile projects',async({page})=>{
  await register(page,'create');
  await page.getByRole('button',{name:/Design Project Create visual/}).click();
  await expect(page.getByRole('dialog').getByRole('combobox',{name:'Project type',exact:true})).toHaveValue('Design');
  await page.getByRole('dialog').getByLabel('Project files').setInputFiles({name:'brief.txt',mimeType:'text/plain',buffer:Buffer.from('Project sketch')});
  await page.keyboard.press('Escape');
  await page.getByRole('button',{name:'New Project',exact:true}).click();
  let dialog=await fillProject(page);await expect(dialog.getByText('brief.txt',{exact:true})).toHaveCount(0);
  await dialog.getByLabel('Project files').setInputFiles({name:'brief.txt',mimeType:'text/plain',buffer:Buffer.from('Project sketch')});
  await dialog.getByRole('button',{name:'Save Draft',exact:true}).click();
  await expect(page.locator('.project-row')).toHaveCount(1);await expect(page.locator('.project-row .status-badge')).toHaveText('Draft');
  await page.getByRole('tab',{name:'Drafts',exact:true}).click();await expect(page.getByRole('button',{name:'Community Art Studio',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Actions for Community Art Studio',exact:true}).click();await page.getByRole('menuitem',{name:'Mark completed',exact:true}).click();
  await page.getByRole('tab',{name:'Completed',exact:true}).click();await expect(page.locator('.project-row .status-badge')).toHaveText('Completed');
  await page.reload();await expect(page.getByRole('button',{name:'Community Art Studio',exact:true})).toBeVisible();
  await page.getByRole('searchbox',{name:'Find collaborators'}).fill('photography');await page.locator('.collaborator-results').getByRole('button',{name:/Kabir/}).click();await expect(page.getByRole('dialog')).toContainText('Photography');await page.keyboard.press('Escape');
  await nav(page,'Profile').click();await expect(page.getByRole('button',{name:'Community Art Studio',exact:true})).toBeVisible();await page.getByRole('tab',{name:'Activity',exact:true}).click();await expect(page.getByRole('heading',{name:'Created Community Art Studio'})).toBeVisible();
  await nav(page,'Create').click();await page.getByLabel('Describe your project idea').fill('A community learning garden with practical workshops.');await page.locator('.quick-project').getByRole('combobox',{name:'Project type',exact:true}).selectOption('Education');await page.locator('.quick-project').getByRole('button',{name:'Create Project',exact:true}).click();
  dialog=page.getByRole('dialog',{name:'Create a Project',exact:true});await expect(dialog.getByRole('combobox',{name:'Project type',exact:true})).toHaveValue('Education');await expect(dialog.getByRole('textbox',{name:'Description',exact:true})).toHaveValue('A community learning garden with practical workshops.');
  await dialog.getByLabel('Project title',{exact:true}).fill('Learning Garden');await dialog.getByLabel('Vision',{exact:true}).fill('Share practical skills across generations.');await dialog.getByRole('button',{name:'Create Project',exact:true}).click();
  await expect(page.locator('.project-row').filter({hasText:'Learning Garden'}).locator('.status-badge')).toHaveText('Ongoing');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('skill-swap.workspace.v1.'+localStorage.getItem('skill-swap.active-account.v1'))!));
  expect(saved.projects.find((p:{title:string})=>p.title==='Community Art Studio').files).toEqual([{name:'brief.txt',size:14}]);
});

test('Learn searches across domains and saves paths, completion, goals and shared connections',async({page})=>{
  await register(page,'learn');
  const search=page.getByRole('searchbox',{name:'Learning search'});
  for(const [topic,person] of [['photography','kabir'],['mathematics','dev'],['cooking','ananya'],['music','leela'],['research','kavya']]){await search.fill(topic);await expect(page.locator('.learning-path-card').first()).toBeVisible();await expect(row(page,person)).toBeVisible();}
  await search.fill('');await page.locator('.learning-chips').getByRole('button',{name:'Photography',exact:true}).click();await expect(page.locator('.learning-path-card')).toHaveCount(1);
  await page.locator('.learning-path-card').click();let dialog=page.getByRole('dialog');await dialog.getByRole('button',{name:'Save path',exact:true}).click();await expect(dialog.getByRole('button',{name:'Saved',exact:true})).toBeVisible();await page.keyboard.press('Escape');
  await page.getByRole('tab',{name:'Saved',exact:true}).click();await expect(page.locator('.my-learning-list')).toContainText('Photography Foundations');
  await page.locator('.my-learning-list button').click();await page.getByRole('dialog').getByRole('button',{name:'Start Learning',exact:true}).click();await expect(page.getByRole('tab',{name:'In Progress',exact:true})).toHaveAttribute('aria-selected','true');
  await page.locator('.my-learning-list button').click();await page.getByRole('dialog').getByRole('button',{name:'Mark completed',exact:true}).click();await expect(page.locator('.my-learning-list')).toContainText('100%');
  await page.getByLabel('Learning goal',{exact:true}).fill('Photograph a story about my neighbourhood');await page.getByRole('button',{name:'Set Goal',exact:true}).click();await expect(page.getByRole('status')).toContainText('Learning goal saved');
  await row(page,'kabir').getByRole('button',{name:'Connect',exact:true}).click();await nav(page,'Connect').click();await expect(row(page,'kabir').getByRole('button',{name:'Request Sent',exact:true})).toBeDisabled();
  await nav(page,'Learn').click();await page.reload();await page.getByRole('tab',{name:'Completed',exact:true}).click();await expect(page.locator('.my-learning-list')).toContainText('Photography Foundations');await expect(page.getByText('Photograph a story about my neighbourhood',{exact:true})).toBeVisible();
  await page.locator('.section-header').filter({has:page.getByRole('heading',{name:'Find Mentors',exact:true})}).getByRole('button').click();await expect(page.locator('.mentor-grid .person-row')).toHaveCount(12);
});

test('Discover offers project previews, exploration tabs, filters, saved ideas and communities',async({page})=>{
  await register(page,'discover');
  await expect(page.getByRole('heading',{name:'Featured',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'More to Explore',exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Autonomous Fixed-Wing UAV',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Save project',exact:true}).click();await page.keyboard.press('Escape');
  await page.getByLabel('Filter by category',{exact:true}).selectOption('Environment');await expect(page.locator('.project-card')).toHaveCount(2);
  await page.getByRole('tab',{name:'Ideas',exact:true}).click();await page.getByRole('button',{name:'Save idea',exact:true}).first().click();
  await page.getByRole('tab',{name:'Events',exact:true}).click();await expect(page.locator('.exploration-card')).toHaveCount(2);await page.getByRole('button',{name:'Save event',exact:true}).first().click();
  await page.getByRole('tab',{name:'Skills',exact:true}).click();await page.locator('.skill-directory').getByRole('button',{name:/Photography/}).click();await expect(page.getByRole('tab',{name:'People',exact:true})).toHaveAttribute('aria-selected','true');await expect(row(page,'kabir')).toBeVisible();
  await page.getByRole('searchbox',{name:'Discover search'}).fill('');await page.getByRole('tab',{name:'Communities',exact:true}).click();await page.locator('.community-card').first().getByRole('button',{name:'Join',exact:true}).click();await expect(page.locator('.community-list').getByRole('button',{name:'Joined',exact:true})).toHaveCount(1);
  await page.reload();await page.getByRole('tab',{name:'Ideas',exact:true}).click();await expect(page.getByRole('button',{name:'Saved',exact:true})).toHaveCount(1);await expect(page.locator('.community-list').getByRole('button',{name:'Joined',exact:true})).toHaveCount(1);
  await page.locator('.discover-trending').getByRole('button',{name:/Sustainable Living/}).click();await expect(page.getByRole('searchbox',{name:'Discover search'})).toHaveValue('environment');await expect(page.locator('.project-card')).toHaveCount(2);
  await page.getByRole('searchbox',{name:'Discover search'}).fill('nothing-matches');await expect(page.getByText('No matching projects. Try another topic or clear the category filter.')).toBeVisible();
});

test('Profile edits update identity, skills, interests and learning preferences across reloads',async({page})=>{
  await register(page,'profile');await page.getByRole('button',{name:'+ Edit Profile',exact:true}).click();const dialog=page.getByRole('dialog',{name:'Edit Profile'});
  for(const [label,value] of [['Name','Mira Patel'],['Username','mira_patel'],['Short bio','A designer and photographer building with communities.'],['Location','Pune, India'],['Skills you can offer','Photography, Design'],['Interests','Environment, Music'],['Things you want to learn','Cooking, Robotics']])await dialog.getByLabel(label,{exact:true}).fill(value);
  await dialog.getByRole('button',{name:'Save Profile',exact:true}).click();await expect(page.getByRole('heading',{name:'Mira Patel',exact:true})).toBeVisible();await expect(page.getByText('@mira_patel',{exact:true})).toBeVisible();
  await expect(page.locator('.profile-skills')).toContainText('Photography');await expect(page.locator('.profile-skills')).toContainText('Music');
  await page.getByRole('tab',{name:'About',exact:true}).click();await expect(page.locator('.profile-about')).toContainText('Cooking');await page.reload();await expect(page.getByRole('heading',{name:'Mira Patel',exact:true})).toBeVisible();
});

test('six screens render at matching desktop and laptop sizes without overflow, runtime or accessibility errors',async({page})=>{
  test.setTimeout(120000);const errors:string[]=[];const missing:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
  await page.setViewportSize({width:1672,height:941});await page.goto('/#/signup');await readyArtwork(page);await page.screenshot({path:'docs/ui-foundation/screenshots/signup-1672.png'});
  expect.soft((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  await register(page,'profile');
  for(const viewport of [{width:1672,height:941},{width:1366,height:768}]){
    await page.setViewportSize(viewport);
    for(const name of ['Connect','Create','Learn','Discover','Profile']){
      await nav(page,name).click();await expect(page.locator('.application-shell')).toHaveAttribute('data-active-module',name.toLowerCase());await readyArtwork(page);
      await page.screenshot({path:'docs/ui-foundation/screenshots/'+name.toLowerCase()+'-'+viewport.width+'.png'});
      expect(await page.locator('.application-shell').boundingBox()).toEqual({x:0,y:0,...viewport});
      expect(await page.locator('.workspace-content').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight===innerHeight)).toBe(true);
      if(viewport.width===1672)expect.soft((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
    }
  }
  await page.getByRole('button',{name:'+ Edit Profile',exact:true}).click();expect.soft((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);expect(missing).toEqual([]);
});

test('existing completed cinematic entry opens sign-up and then the static UI without Core requests',async({page})=>{
  await page.goto('/');await expect(page.getByRole('button',{name:'Enter Connect'})).toHaveCount(0);
  await page.evaluate(()=>scrollTo(0,innerHeight*8));await page.getByRole('button',{name:'Enter Connect'}).click();
  await expect(page.getByRole('heading',{name:'CREATE YOUR ACCOUNT'})).toBeVisible();
  await page.getByLabel('Name',{exact:true}).fill('Mira Shah');await page.getByLabel('Email',{exact:true}).fill('mira@example.test');await page.getByLabel('Password',{exact:true}).fill(password);await page.getByRole('button',{name:'SIGN UP',exact:true}).click();
  await expect(page.locator('.application-shell')).toHaveAttribute('data-active-module','connect');await expect(page.locator('video, .connect-sequence, .core-sequence, .review-controls')).toHaveCount(0);
  const requests:string[]=[];page.on('request',r=>{if(/\/(cores|Cores)\//.test(r.url()))requests.push(r.url());});
  await nav(page,'Create').click();await nav(page,'Learn').click();await nav(page,'Discover').click();expect(requests).toEqual([]);
});

test('local repository guards duplicate requests and invalid responses',async()=>{
  const repository=createLocalConnectRepository();const[first,second]=await Promise.all([repository.sendRequest('aarav'),repository.sendRequest('aarav')]);expect(first.id).toBe(second.id);
  expect((await repository.listRequests()).filter(request=>request.personId==='aarav')).toHaveLength(1);await repository.respondToRequest('incoming-rohan','accepted');await expect(repository.respondToRequest('incoming-rohan','declined')).rejects.toThrow('no longer pending');await expect(repository.sendRequest('missing')).rejects.toThrow('no longer available');
});
