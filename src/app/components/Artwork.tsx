import connect from '../../../Ideas/Connect.png';
import create from '../../../Ideas/Create.png';
import learn from '../../../Ideas/Learn.png';
import discover from '../../../Ideas/Discover.png';
import reference from '../../../Ideas/REFERENCE.png';
// Static art viewports only. Every UI control and text layout is live HTML, not a screenshot.
// These references remain unmodified; SVG viewBox exposes just their supplied artwork.
const sources = { connect: [connect,1672,941], create: [create,1672,941], learn: [learn,1672,941], discover: [discover,1672,941], reference: [reference,1536,1024] } as const;
const crops: Record<string, [keyof typeof sources, number, number, number, number]> = {
  connectHero: ['connect',980,87,657,281], createHero: ['create',831,93,435,273], learnHero: ['learn',855,87,432,280], discoverHero: ['discover',870,90,409,266],
  signup: ['reference',525,8,88,345], rover: ['reference',1123,252,166,61], river: ['reference',428,866,250,81],
  drone: ['discover',267,471,232,106], world: ['discover',528,471,232,106], urban: ['discover',788,471,232,106], balidan: ['discover',1045,471,231,106],
  satellite: ['discover',271,773,225,60], code: ['learn',269,491,188,87], ai: ['learn',477,491,185,87], product: ['learn',895,491,182,87], books: ['learn',1098,491,186,87], ocean: ['discover',1046,773,227,60], microscope: ['discover',792,773,225,60],
  aarav: ['connect',290,450,85,84], ishita: ['connect',974,450,83,84], rohan: ['connect',291,569,83,84], kavya: ['connect',291,688,83,84], meera: ['connect',974,813,83,83], arjun: ['connect',974,689,83,83], nikhil: ['connect',291,813,83,83], sara: ['connect',974,450,83,84],
};
export function Artwork({ art, className = '', label }: { art: string; className?: string; label?: string }) {
  const [source, x, y, width, height] = crops[art] ?? crops.urban;
  const [url, sourceWidth, sourceHeight] = sources[source];
  return <svg className={'reference-art ' + className} viewBox={[x,y,width,height].join(' ')} preserveAspectRatio="xMidYMid slice" role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : true}>
    <image href={url} width={sourceWidth} height={sourceHeight} /></svg>;
}
