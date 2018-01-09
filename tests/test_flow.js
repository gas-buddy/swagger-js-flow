import tap from 'tap';
import testSwagger from './pets.json';
import generateFlow from '../src/index';

tap.test('flow generation', async (t) => {
  const resolved = await generateFlow({
    spec: testSwagger,
    name: 'PetClient',
  });
  t.ok(resolved);
  t.end();
});
