import { expect, test, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { plannedCoreRanges } from '../src/components/core/corePlan';
import { availableCoreChain, checkpointProgress, layoutCores, selectCoreFrame } from '../src/components/core/shared/sequence';

test.beforeEach(({}, info) => { test.skip(info.project.name !== 'desktop', 'Current task validates desktop/laptop only'); });

async function move(page: Page, id: string, p: number, direction: 'forward' | 'reverse', count: number) {
  await page.evaluate(progress => scrollTo(0, progress * 4 * innerHeight), p);
  const section = page.locator('#' + id + '-checkpoint');
  await expect.poll(async () => Number(await section.getAttribute('data-core-progress'))).toBeCloseTo(p, 3);
  const actual = Number(await section.getAttribute('data-core-progress'));
  const index = Math.round((direction === 'forward' ? actual : 1 - actual) * (count - 1));
  await expect(section).toHaveAttribute('data-loading', 'false');
  await expect(section).toHaveAttribute('data-frame-index', String(index));
  await expect(section).toHaveAttribute('data-target-index', String(index));
  await expect(section).toHaveAttribute('data-render-direction', direction);
  await expect(section).toHaveAttribute('data-frame-error', 'false');
  const folder = id[0].toUpperCase() + id.slice(1) + (direction === 'forward' ? '_start' : '_back');
  await expect(section.locator('img')).toHaveAttribute('data-source',
    new RegExp(folder + '/ezgif-frame-' + String(index + 1).padStart(3, '0') + '\\.jpg$'));
  await expect.poll(() => section.locator('img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
}

test('independent ranges stop the public chain before unavailable Create', () => {
  expect(availableCoreChain(plannedCoreRanges).map(range => range.id)).toEqual(['connect']);
  expect(plannedCoreRanges.map(({id,start,end,exit}) => ({id,start,end,exit}))).toEqual([
    {id:'connect',start:0,end:4,exit:4}, {id:'create',start:4,end:8,exit:9},
    {id:'learn',start:9,end:13,exit:13}, {id:'discover',start:13,end:17,exit:17},
  ]);
  const authored = layoutCores(plannedCoreRanges.map(range => ({...range,available:true})));
  expect(availableCoreChain(authored)).toHaveLength(4);
  for (const range of authored) {
    expect(checkpointProgress(range.start,range)).toBe(0);
    expect(checkpointProgress(range.end,range)).toBe(1);
    expect(checkpointProgress(range.end + 10,range)).toBe(1);
  }
  const frames = {forward:['a','b','c'],reverse:['r0','r1','r2','r3','r4'],valid:true,issue:null};
  expect(selectCoreFrame(frames,.25,'forward').index).toBe(1);
  expect(selectCoreFrame(frames,.25,'reverse').index).toBe(3);
  expect(selectCoreFrame(frames,0,'reverse').url).toBe('r4');
  expect(selectCoreFrame(frames,1,'reverse').url).toBe('r0');
});

test('invalid Create files are excluded and no future images load on the public landing', async ({page}) => {
  const requests:string[]=[];
  page.on('request',request=>{if (/\/(cores|Cores)\//.test(request.url())) requests.push(request.url());});
  await page.goto('/');
  await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
  await expect(page.locator('#connect-checkpoint')).toHaveAttribute('data-core-progress','1.000000');
  await expect(page.locator('.core-system')).toHaveAttribute('data-current-core','connect');
  await expect(page.locator('#create-checkpoint, #learn-checkpoint, #discover-checkpoint')).toHaveCount(0);
  expect(requests.every(url=>url.includes('/Connect_start/'))).toBe(true);
  expect(readdirSync('dist/cores').sort()).toEqual(['Connect_start','Discover_back','Discover_start','Learn_back','Learn_start']);
  for (const folder of ['Create_start','Create_back']) {
    const connect=folder.replace('Create','Connect');
    for (const name of readdirSync('Cores/'+folder)) expect(readFileSync('Cores/'+folder+'/'+name).equals(readFileSync('Cores/'+connect+'/'+name)), folder+'/'+name).toBe(true);
  }
});

for (const viewport of [{name:'desktop',width:1672,height:941},{name:'laptop',width:1366,height:768}]) {
  for (const id of ['learn','discover'] as const) {
    test(id + ' exact progress, dedicated reverse source, and stable endpoints on ' + viewport.name, async ({page}) => {
      test.setTimeout(60_000);
      await page.setViewportSize(viewport);
      await page.goto('http://127.0.0.1:5173/docs/core-chain/review.html?core='+id);
      const count=id==='learn'?300:120;
      const image=await page.locator('.core-sequence').elementHandle();
      await move(page,id,0,'forward',count);
      const matrices=id==='learn'
        ? [[0,1,0],[0,.4,.35,.7,.2,.8],[0,.5,.45,.8,.2,1]]
        : [[0,1,0],[0,.5,.48,.8,.6,1],[0,.6,.4,.8,.3,1]];
      let previous=0;let direction:'forward'|'reverse'='forward';
      for(const points of matrices) for(const p of points){
        direction=p>previous?'forward':p<previous?'reverse':direction;
        await move(page,id,p,direction,count);previous=p;
      }
      await page.screenshot({path:`docs/core-chain/screenshots/${id}-${viewport.name}-complete.png`});
      const src=await page.locator('.core-sequence').getAttribute('src');
      await page.waitForTimeout(300);
      expect(await page.locator('.core-sequence').getAttribute('src')).toBe(src);
      await move(page,id,.5,'reverse',count);
      await page.screenshot({path:`docs/core-chain/screenshots/${id}-${viewport.name}-reverse-half.png`});
      expect(await image!.evaluate(element=>element===document.querySelector('.core-sequence'))).toBe(true);
      await expect(page.locator('.core-sequence')).toHaveCount(1);
      await expect(page.locator('.core-sequence')).toHaveCSS('object-fit','contain');
      await expect(page.locator('canvas,video,input[type=search]')).toHaveCount(0);
      const dimensions=await page.locator('.core-sequence').evaluate((image:HTMLImageElement)=>[image.naturalWidth,image.naturalHeight]);
      expect(dimensions).toEqual(id==='learn'?[1280,720]:[1920,1080]);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    });
  }
}

test('review changes release each controller and never expose duplicate Create artwork', async ({page}) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:5173/docs/core-chain/review.html?core=learn');
  for(let cycle=0;cycle<3;cycle++){
    await move(page,'learn',1,'forward',300);
    await page.getByRole('button',{name:'Discover',exact:true}).click();
    await move(page,'discover',.8,'forward',120);
    await move(page,'discover',.3,'reverse',120);
    expect(await page.evaluate(()=> '__LEARN__' in window)).toBe(false);
    await page.getByRole('button',{name:'Create',exact:true}).click();
    await expect(page.getByRole('heading',{name:'Create is awaiting valid assets'})).toBeVisible();
    await expect(page.locator('.core-sequence, .connect-sequence')).toHaveCount(0);
    expect(await page.evaluate(()=> '__DISCOVER__' in window)).toBe(false);
    await page.getByRole('button',{name:'Learn',exact:true}).click();
  }
  expect(errors).toEqual([]);
});

test('a late Learn frame cannot overwrite a newer absolute-progress target', async({page})=>{
  let release!:()=>void;let observed!:()=>void;
  const held=new Promise<void>(resolve=>{release=resolve});
  const intercepted=new Promise<void>(resolve=>{observed=resolve});
  await page.route('**/Learn_start/ezgif-frame-210.jpg',async route=>{
    observed();await held;await route.continue().catch(()=>{});
  });
  try {
    await page.goto('http://127.0.0.1:5173/docs/core-chain/review.html?core=learn');
    await page.evaluate(()=>scrollTo(0,innerHeight*4*.7));
    await intercepted;
    await move(page,'learn',.9,'forward',300);
    release();await page.waitForTimeout(250);
    await move(page,'learn',.9,'forward',300);
  } finally {release();}
});
