import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { io as connect, type Socket } from 'socket.io-client';
import { attachRealtime } from '../lib/realtime';
import { MAX_PLAYERS, type Reply, type Snapshot } from '../lib/types';

function request(client: Socket, data: Record<string, unknown>): Promise<Snapshot> {
  return new Promise((resolve, reject) => client.timeout(5000).emit('room:action', data, (err: Error | null, reply: Reply) => {
    if (err) reject(err); else if (!reply.ok) reject(new Error(reply.error)); else resolve(reply.data);
  }));
}
function waitFor(client: Socket, predicate: (s: Snapshot) => boolean): Promise<Snapshot> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { client.off('room:state', listen); reject(new Error('No llegó la actualización')); }, 5000);
    function listen(data: Snapshot) { if (predicate(data)) { clearTimeout(timer); client.off('room:state', listen); resolve(data); } }
    client.on('room:state', listen);
  });
}
test(`transporte real: ${MAX_PLAYERS} ingresos concurrentes, difusión, reconexión y permisos`, async () => {
  const server = createServer(), io = new Server(server), realtime = attachRealtime(io);
  const clients: Socket[] = [];
  try {
    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const address = server.address(); assert(address && typeof address === 'object');
    async function client() {
      const socket = connect(`http://127.0.0.1:${(address as {port:number}).port}`, { transports: ['websocket'], forceNew: true, autoConnect: false });
      clients.push(socket);
      await new Promise<void>((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); socket.connect(); });
      return socket;
    }
    const host = await client(), created = await request(host, { action: 'create' });
    const peers = await Promise.all(Array.from({ length: MAX_PLAYERS }, client));
    const full = waitFor(host, s => s.room.players.length === MAX_PLAYERS);
    const joined = await Promise.all(peers.map((peer, i) => request(peer, { action: 'join', code: created.room.code, name: `Persona ${i}`, role: 'urbanista' })));
    assert.equal(new Set((await full).room.players.map(p => p.plot)).size, MAX_PLAYERS);
    const extra = await client();
    await assert.rejects(request(extra, { action: 'join', code: created.room.code, name: 'Extra', role: 'urbanista' }), new RegExp(`${MAX_PLAYERS} habitantes`));
    await assert.rejects(request(peers[0], { action: 'start' }), /presentador/);
    const started = waitFor(peers[1], s => s.room.phase === 'playing');
    await request(host, { action: 'start' }); await started;
    await request(peers[0], { action: 'submit', prompt: 'Actúa como arquitecta. Diseña viviendas para 20 habitantes con presupuesto de 100. Responde en tabla.' });
    const visible = waitFor(peers[1], s => Boolean(s.room.players[0].building));
    await request(peers[0], { action: 'build' }); const observer = await visible;
    assert.equal(observer.room.players[0].credits, 10); assert.equal(observer.prompt, '');
    const offline = waitFor(host, s => !s.room.players[0].connected);
    peers[0].disconnect(); await offline;
    const returning = await client();
    const restored = await request(returning, { action: 'resume', session: joined[0].session });
    assert.equal(restored.room.players.length, MAX_PLAYERS); assert.equal(restored.room.players[0].plot, 0);
    assert.equal(restored.evaluation?.score, 4); assert.equal(restored.room.players[0].credits, 10);
    await request(returning, { action: 'build' });
    assert.equal(realtime.game.snapshot(joined[0].session).room.players[0].credits, 10);
    const forged = await client();
    await assert.rejects(request(forged, { action: 'resume', session: { ...created.session, token: 'fake' } }), /Credencial/);
    const kicked = new Promise<void>(resolve => peers[2].once('room:kicked', () => resolve()));
    const shrunk = waitFor(peers[3], s => s.room.players.length === MAX_PLAYERS - 1);
    await assert.rejects(request(peers[3], { action: 'kick', playerId: joined[2].session.playerId }), /presentador/);
    const hostView = await request(host, { action: 'kick', playerId: joined[2].session.playerId });
    await kicked; await shrunk;
    assert.equal(hostView.insights?.criteria[0].passed, 1); assert.equal((await shrunk).insights, undefined);
    await assert.rejects(request(peers[2], { action: 'submit', prompt: 'Sigo aquí después de salir' }), /Entra a una sala/);
    const finished = waitFor(returning, s => s.room.phase === 'finished');
    await request(host, { action: 'finish' }); await finished;
    await assert.rejects(request(returning, { action: 'submit', prompt: 'Otro intento después del cierre' }), /no está en curso/);
  } finally { for (const socket of clients) socket.disconnect(); realtime.stop(); await new Promise<void>(resolve => io.close(() => resolve())); }
});
