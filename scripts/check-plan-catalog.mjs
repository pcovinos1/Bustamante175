import fs from 'node:fs';
import assert from 'node:assert/strict';
import ts from 'typescript';
const plans = JSON.parse(fs.readFileSync('src/data/bustamantePlans.json'));
const source = fs.readFileSync('src/data/migratePlans.ts', 'utf8')
  .replace('import plans from "./bustamantePlans.json";', `const plans = ${JSON.stringify(plans)};`);
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { migratePlans } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const project = JSON.parse(fs.readFileSync('public/content/project.json'));
const original = { ...project, plansRevision: 'previous', version: { version: '999' }, floorPlan: {
  ...project.floorPlan, imageSrc: 'custom-floor', hotspots: [
    { id: 'zone', typologyId: 'flat-303', x: 5, y: 6, width: 7, height: 8 }
  ]
} };
const migrated = migratePlans(original);
assert.equal(migrated.floorPlan.imageSrc, 'custom-floor');
assert.deepEqual(migrated.floorPlan.hotspots[0], { ...original.floorPlan.hotspots[0], typologyId: 'flat-203' });
assert.equal(original.floorPlan.hotspots[0].typologyId, 'flat-303');
assert.equal(migrated.version, original.version);
assert.equal(migratePlans(migrated), migrated);
assert.equal(plans.typologies.length, 36);
assert.equal(new Set(plans.typologies.map(plan => plan.id)).size, 36);
assert.equal(plans.generalPlans.length, 5);
assert.equal(plans.typologies.find(plan => plan.id === 'flat-x-08').bedrooms, 1);
assert.deepEqual(project.typologies, plans.typologies);
assert.deepEqual(project.generalPlans, plans.generalPlans);
assert.equal(project.floorPlan.imageSrc, plans.generalPlans.find(plan => plan.id === 'planta-tipica').planSrc);
assert.equal(migratePlans(project), project);
for (const plan of [...plans.typologies, ...plans.generalPlans]) {
  for (const key of ['planSrc', 'thumbnailSrc', 'floorThumbnailSrc']) {
    if (plan[key]) assert.ok(fs.existsSync('public/' + plan[key]), plan[key]);
  }
}
console.log('Plan catalogue and saved-zone migration checks passed.');
