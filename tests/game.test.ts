import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Game, evaluate } from '../lib/game';
import { ALL_ROLES, ALL_MODELS, ROLES } from '../lib/catalog';
import { MAX_PLAYERS, MAX_PLAYERS_WORDS } from '../lib/types';
import { existsSync, readdirSync, statSync } from 'node:fs';
const good = `Actúa como arquitecta. Diseña viviendas para ${MAX_PLAYERS} habitantes con presupuesto máximo de 1000 créditos. Responde en una tabla.`;

test(`${MAX_PLAYERS} parcelas únicas, plaza ${MAX_PLAYERS + 1} rechazada, roles y nombres validados`, () => {
  const game = new Game(), host = game.create();
  const players = Array.from({ length: MAX_PLAYERS }, (_, i) => game.join(host.code, `Persona ${i}`, 'urbanista'));
  assert.equal(new Set(players.map(s => game.authorize(s).player!.plot)).size, MAX_PLAYERS);
  assert.throws(() => game.join(host.code, 'Extra', 'ingeniero'), new RegExp(`${MAX_PLAYERS} habitantes`));
  const empty = game.create();
  assert.throws(() => game.join(empty.code, 'Ana', 'toString' as never), /rol válido/);
  game.join(empty.code, 'Ana', 'urbanista');
  assert.throws(() => game.join(empty.code, 'ana', 'urbanista'), /nombre/);
});
test('rúbrica reproducible y sensible al reto', () => {
  assert.equal(evaluate(good, 'urbanista').score, 4);
  assert.equal(evaluate(good, 'ecologista').score, 3);
  assert.equal(evaluate('hola mundo', 'urbanista').score, 0);
});
test('autoridad, créditos, construcción y evento idempotentes', () => {
  const game = new Game(), host = game.create();
  const player = game.join(host.code, 'Ana', 'urbanista');
  assert.throws(() => game.act(player, 'start'), /presentador/);
  assert.throws(() => game.act(player, 'submit', good), /no está en curso/);
  game.act(host, 'start');
  assert.throws(() => game.act(player, 'build'), /3 de 4/);
  assert.throws(() => game.act(player, 'submit', 123), /2000/);
  game.act(player, 'submit', good); game.act(player, 'build'); game.act(player, 'build');
  assert.equal(game.authorize(player).player!.credits, 10);
  assert.throws(() => game.act(player, 'contribute'), /no está abierto/);
  game.act(host, 'event'); game.act(player, 'contribute'); game.act(player, 'contribute');
  assert.equal(game.authorize(player).player!.credits, 5);
  assert.equal(game.snapshot(host).room.event.progress, 5);
  assert.throws(() => game.act({ ...host, token: 'forged' }, 'finish'), /Credencial/);
  assert.throws(() => game.authorize({ ...player, playerId: 'someone-else' }), /Credencial/);
  assert.equal(game.snapshot(host).evaluation, null);
  assert.equal(game.snapshot(host).prompt, '');
  assert.equal(JSON.stringify(game.snapshot(player).room).includes(player.token), false);
  game.act(host, 'finish');
  assert.throws(() => game.act(player, 'submit', good), /no está en curso/);
});
test('eventos con meta escalada por habitantes en línea y misiones sucesivas', () => {
  const game = new Game(), host = game.create();
  const players = Array.from({ length: 20 }, (_, i) => game.join(host.code, `Jugador ${i}`, 'ingeniero'));
  players.slice(0, 18).forEach(p => game.presence(p, true));
  game.act(host, 'start'); game.act(host, 'event');
  assert.equal(game.snapshot(host).room.event.goal, 90);
  for (const player of players.slice(0, 17)) game.act(player, 'contribute');
  game.act(host, 'event');
  assert.equal(game.snapshot(host).room.event.index, 0, 'no avanza con la misión incompleta');
  game.act(players[17], 'contribute'); game.act(players[18], 'contribute');
  const done = game.snapshot(host).room.event;
  assert.equal(done.progress, 90); assert.equal(done.completed, 1);
  assert.equal(game.authorize(players[18]).player!.credits, 20);
  game.act(host, 'event');
  const second = game.snapshot(host).room.event;
  assert.deepEqual([second.index, second.progress, second.goal], [1, 0, 90]);
  game.act(players[0], 'contribute');
  assert.equal(game.authorize(players[0]).player!.credits, 10);
  for (const player of players.slice(1, 18)) game.act(player, 'contribute');
  assert.equal(game.snapshot(host).room.event.completed, 2);
  assert.throws(() => game.act(host, 'event'), /todos los eventos/);
});
test('rúbrica: sinónimos, anti-trampa, criterios avanzados y pistas válidas', () => {
  assert.equal(evaluate(`Imagina que eres urbanista. Propón viviendas para ${MAX_PLAYERS_WORDS} vecinos, en menos de 200 palabras, en viñetas.`, 'urbanista').score, 4);
  // The task must name this city's size: the old 20-inhabitant city no longer counts.
  assert.equal(evaluate(good.replace(String(MAX_PLAYERS), '20'), 'urbanista').checks[1].passed, false);
  assert.equal(evaluate(good.replace(String(MAX_PLAYERS), 'veinte'), 'urbanista').checks[1].passed, false);
  const gamed = evaluate('actua como. viviendas disena 20 presupuesto. tabla 5', 'urbanista');
  assert.equal(gamed.checks[0].passed, false); assert.equal(gamed.checks[2].passed, false);
  const rich = evaluate(good + ' Dirigida a familias; debe incluir al menos 3 salas.', 'urbanista');
  assert.deepEqual([rich.score, rich.bonus], [4, 2]);
  assert.equal(rich.checks[0].match, 'Actúa como arquitecta');
  for (const role of ALL_ROLES) {
    const strong = evaluate(ROLES[role].hints[2].strong, role), weak = evaluate(ROLES[role].hints[2].weak, role);
    assert.equal(strong.score, 4, role); assert(strong.bonus >= 1, role); assert.equal(weak.score, 0, role);
  }
});
test('historial privado, estrellas tras construir e insights sin prompts', () => {
  const game = new Game(), host = game.create();
  const ana = game.join(host.code, 'Ana', 'urbanista'), beto = game.join(host.code, 'Beto', 'ingeniero');
  game.act(host, 'start');
  for (let i = 0; i < 3; i++) game.act(beto, 'submit', `Hola ciudad, intento número ${i}`);
  game.act(ana, 'submit', 'Quiero algo bonito para la ciudad'); game.act(ana, 'submit', good); game.act(ana, 'build');
  game.act(ana, 'submit', good + ' Dirigida a familias.');
  const mine = game.snapshot(ana);
  assert.deepEqual(mine.attempts.map(a => a.score), [0, 4, 4]);
  assert.equal(mine.room.players[0].bonus, 1); assert.equal(mine.room.players[0].credits, 10);
  assert.equal(mine.insights, undefined);
  assert.equal(game.snapshot(beto).attempts.length, 3);
  for (let i = 0; i < 12; i++) game.act(beto, 'submit', `Otro intento sin criterios ${i}`);
  assert.equal(game.snapshot(beto).attempts.length, 10);
  const insights = game.snapshot(host).insights!;
  assert.deepEqual(insights.stuck, ['Beto']);
  assert.equal(insights.firstAverage, 0); assert.equal(insights.lastAverage, 2);
  assert.equal(insights.criteria[0].first, 0); assert.equal(insights.criteria[0].passed, 1);
  assert.equal(JSON.stringify(game.snapshot(host)).includes('bonito'), false);
});
test('presentador: fases, +5 minutos con tope y liberar parcela', () => {
  const game = new Game(), host = game.create();
  const ana = game.join(host.code, 'Ana', 'urbanista'), beto = game.join(host.code, 'Beto', 'ecologista');
  assert.throws(() => game.act(ana, 'stage'), /presentador/);
  game.act(host, 'stage'); assert.equal(game.snapshot(host).room.stage, 1);
  game.act(host, 'kick', ana.playerId);
  assert.throws(() => game.authorize(ana), /Credencial/);
  const carla = game.join(host.code, 'Carla', 'ingeniero');
  assert.equal(game.authorize(carla).player!.plot, 0); assert.equal(game.authorize(beto).player!.plot, 1);
  assert.throws(() => game.act(host, 'kick', 'nadie'), /ya no está/);
  const now = Date.now(); game.act(host, 'start', undefined, now);
  for (let i = 0; i < 6; i++) game.act(host, 'extend', undefined, now);
  assert.equal(game.snapshot(host).room.endsAt, now + 60 * 60_000);
  assert.throws(() => game.act(host, 'extend', undefined, now), /60 minutos/);
  for (let i = 0; i < 3; i++) game.act(host, 'stage');
  assert.throws(() => game.act(host, 'stage'), /última fase/);
});
test('reconexión conserva parcela y el reloj impide acciones tardías', () => {
  const game = new Game(), host = game.create();
  const player = game.join(host.code, 'Ana', 'urbanista');
  game.presence(player, true); game.presence(player, false); game.presence(player, true);
  assert.equal(game.snapshot(host).room.players.length, 1);
  assert.equal(game.authorize(player).player!.plot, 0);
  const now = Date.now(); game.act(host, 'start', undefined, now);
  assert.throws(() => game.join(host.code, 'Tarde', 'ingeniero'), /ya comenzó/);
  assert.throws(() => game.act(player, 'submit', good, now + 30 * 60_000), /no está en curso/);
  assert.equal(game.snapshot(host).room.phase, 'finished');
});
test('distritos: solo el presentador, antes del primer jugador y con roles del distrito', () => {
  const game = new Game(), host = game.create();
  assert.throws(() => game.act(host, 'district', 'atlantida'), /distrito válido/);
  game.act(host, 'district', 'granja');
  assert.equal(game.snapshot(host).room.district, 'granja');
  assert.throws(() => game.join(host.code, 'Ana', 'barista'), /no está disponible en Granja/);
  const ana = game.join(host.code, 'Ana', 'ecologista');
  assert.throws(() => game.act(ana, 'district', 'centro'), /presentador/);
  assert.throws(() => game.act(host, 'district', 'centro'), /antes de que entre/);
  game.act(host, 'start'); game.act(ana, 'submit', ROLES.ecologista.hints[2].strong); game.act(ana, 'build');
  assert.equal(game.authorize(ana).player!.building, 'Huerto comunitario');
  const farm = new Game(), farmHost = farm.create(); farm.act(farmHost, 'district', 'granja');
  const casa = farm.join(farmHost.code, 'Casa', 'urbanista'); farm.act(farmHost, 'start'); farm.act(casa, 'submit', good); farm.act(casa, 'build');
  assert.equal(farm.authorize(casa).player!.building, 'Casa de campo', 'el nombre sigue al modelo del distrito');
});
test('mejora a nivel 2: exige 4/4 con estrella, no cobra y es idempotente', () => {
  const game = new Game(), host = game.create();
  const ana = game.join(host.code, 'Ana', 'urbanista');
  game.act(host, 'start');
  assert.throws(() => game.act(ana, 'upgrade'), /Construye primero/);
  game.act(ana, 'submit', good); game.act(ana, 'build');
  assert.equal(game.authorize(ana).player!.tier, 1);
  assert.throws(() => game.act(ana, 'upgrade'), /4\/4 con al menos una estrella/);
  game.act(ana, 'submit', good + ' Dirigida a familias.'); game.act(ana, 'upgrade'); game.act(ana, 'upgrade');
  const player = game.authorize(ana).player!;
  assert.deepEqual([player.tier, player.building, player.credits], [2, 'Bloque de apartamentos', 10]);
});
test('cada modelo del catálogo tiene su .glb y el total cabe en 10 MB', () => {
  let total = 0;
  for (const id of ALL_MODELS) { const file = `public/models/${id}.glb`; assert(existsSync(file), `falta ${file}`); total += statSync(file).size; }
  assert(total < 10 * 1024 * 1024, `${total} bytes`);
});
test('se usan todos los modelos del pack (si assets-source/ está presente)', { skip: !existsSync('assets-source/models') }, () => {
  const used = new Set(ALL_MODELS.map(id => id.startsWith('city_car') ? 'city_car' : id));
  const unused = readdirSync('assets-source/models').filter(f => f.endsWith('.fbx')).map(f => f.slice(0, -4)).filter(id => !used.has(id));
  assert.deepEqual(unused, []);
});
test('misión: una desconexión no la bloquea y la meta no supera la inicial', () => {
  const game = new Game(), host = game.create();
  const [ana, beto, carla] = ['Ana', 'Beto', 'Carla'].map(name => game.join(host.code, name, 'urbanista'));
  for (const p of [ana, beto, carla]) game.presence(p, true);
  game.act(host, 'start'); game.act(host, 'event');
  assert.equal(game.snapshot(host).room.event.goal, 15);
  game.act(ana, 'contribute'); game.act(beto, 'contribute');
  assert.equal(game.snapshot(host).room.event.completed, 0);
  game.presence(carla, false);
  const event = game.snapshot(host).room.event;
  assert.equal(event.goal, 10); assert.equal(event.completed, 1, 'se completa con quienes siguen en línea');
  game.presence(carla, true);
  assert.equal(game.snapshot(host).room.event.completed, 1, 'volver a conectarse no reabre la misión');
});
test('misión: reconectar devuelve la meta, sin pasar de la inicial', () => {
  const game = new Game(), host = game.create();
  const players = ['Ana', 'Beto', 'Carla'].map(name => game.join(host.code, name, 'urbanista'));
  for (const p of players) game.presence(p, true);
  game.act(host, 'start'); game.act(host, 'event');
  game.presence(players[2], false); game.presence(players[1], false);
  assert.equal(game.snapshot(host).room.event.goal, 5);
  game.presence(players[1], true);
  assert.equal(game.snapshot(host).room.event.goal, 10);
  game.presence(players[2], true);
  assert.equal(game.snapshot(host).room.event.goal, 15);
});
test('actividad: las entradas seguidas se agrupan y el registro guarda 50 líneas', () => {
  const game = new Game(), host = game.create();
  for (let i = 1; i <= 10; i++) game.join(host.code, `Persona ${i}`, 'urbanista');
  let log = game.snapshot(host).room.log;
  assert.equal(log[0], 'Persona 10, Persona 9 y 8 más se unieron a la ciudad.');
  assert.equal(log.length, 2, 'una línea agrupada más el saludo inicial');
  // Any other message ends the run: the next join starts a new line.
  game.act(host, 'stage'); game.join(host.code, 'Zoe', 'urbanista');
  assert.equal(game.snapshot(host).room.log[0], 'Zoe se unió a la ciudad.');
  for (const p of game.snapshot(host).room.players) game.act(host, 'kick', p.id);
  log = game.snapshot(host).room.log;
  assert.equal(log.length, 15, 'cabe la actividad completa de la sala');
});
