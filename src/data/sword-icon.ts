import art from '../../public/assets/visual/dungeons/weapons-remake.json';
/** Crop the existing atlas in SVG: the inventory uses the exact dungeon sword without duplicating artwork. */
export function swordIcon(className='icon'):string {
 const f=art.frames.sword;
 return `<svg class="${className}" viewBox="0 0 360 360" aria-hidden="true" focusable="false"><g transform="translate(180 180) rotate(-45) translate(${-f.width/2} ${-f.height/2})"><svg width="${f.width}" height="${f.height}" viewBox="${f.x} ${f.y} ${f.width} ${f.height}" overflow="hidden"><image href="${art.file}" width="1254" height="1254"/></svg></g></svg>`;
}
