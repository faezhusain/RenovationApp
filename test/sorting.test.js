import test from 'node:test';
import assert from 'node:assert/strict';
import {sortRows} from '../public/sorting.js';

test('sorts text alphabetically and phase numbers naturally, with blanks last', () => {
  const rows=[{name:'Zebra',phase:'10'},{name:'apple',phase:''},{name:'Banana',phase:'2'},{name:'Apple',phase:'1'}];
  assert.deepEqual(sortRows(rows,r=>r.name).map(r=>r.name),['apple','Apple','Banana','Zebra']);
  assert.deepEqual(sortRows(rows,r=>r.phase).map(r=>r.phase),['1','2','10','']);
  assert.deepEqual(sortRows(rows,r=>r.phase,'desc').map(r=>r.phase),['10','2','1','']);
  assert.deepEqual(rows.map(r=>r.name),['Zebra','apple','Banana','Apple']);
});
test('sorts numeric amounts, including refunds and zero, by numeric value', () => {
  const rows=[{paid:100000},{paid:900},{paid:-500},{paid:0}];
  assert.deepEqual(sortRows(rows,r=>r.paid).map(r=>r.paid),[-500,0,900,100000]);
  assert.deepEqual(sortRows(rows,r=>r.paid,'desc').map(r=>r.paid),[100000,900,0,-500]);
});
