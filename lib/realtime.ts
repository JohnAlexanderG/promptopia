import type { Server, Socket } from 'socket.io';
import { Game, GameError } from './game';
import { ROLES, type Action, type Reply, type Role, type Session } from './types';

type Data = { session?: Session };
const actions = new Set<Action>(['create', 'join', 'resume', 'start', 'submit', 'build', 'event', 'contribute', 'finish', 'stage', 'extend', 'kick', 'upgrade', 'district']);
export function attachRealtime(io: Server, game = new Game()) {
  function broadcast(code: string) {
    for (const socket of io.sockets.sockets.values()) {
      const session = (socket.data as Data).session;
      if (session?.code === code) socket.emit('room:state', game.snapshot(session));
    }
  }
  // Sockets whose credential was revoked leave the room and are told why.
  function release(code: string) {
    for (const socket of io.sockets.sockets.values()) {
      const data = socket.data as Data;
      if (data.session?.code !== code) continue;
      try { game.authorize(data.session); } catch { data.session = undefined; socket.emit('room:kicked'); }
    }
  }
  io.on('connection', (socket: Socket) => {
    let requests = 0, windowStart = Date.now();
    function limit() {
      if (Date.now() - windowStart > 10_000) { requests = 0; windowStart = Date.now(); }
      if (++requests > 30) throw new GameError('Demasiadas acciones. Espera unos segundos.');
    }
    // Lets the join form show only the roles of the room's district; reveals nothing else.
    socket.on('room:peek', (code: unknown, ack: unknown) => {
      if (typeof ack !== 'function') return;
      try { limit(); ack(typeof code === 'string' && game.rooms.has(code) ? { ok: true, district: game.rooms.get(code)!.district } : { ok: false }); }
      catch { ack({ ok: false }); }
    });
    socket.on('room:action', (raw: unknown, ack: unknown) => {
      if (typeof ack !== 'function') return;
      const reply = ack as (result: Reply) => void;
      try {
        limit();
        if (!raw || typeof raw !== 'object') throw new GameError('Solicitud inválida.');
        const body = raw as Record<string, unknown>;
        if (typeof body.action !== 'string' || !actions.has(body.action as Action)) throw new GameError('Acción inválida.');
        const data = socket.data as Data;
        let session = data.session;
        if (body.action === 'create' || body.action === 'join' || body.action === 'resume') {
          if (session) throw new GameError('Ya estás en una sala.');
          if (body.action === 'create') session = game.create();
          else if (body.action === 'join') {
            if (typeof body.code !== 'string' || !/^[A-F0-9]{6}$/.test(body.code) || typeof body.name !== 'string' || typeof body.role !== 'string' || !Object.hasOwn(ROLES, body.role)) throw new GameError('Revisa código, nombre y rol.');
            session = game.join(body.code, body.name.trim(), body.role as Role);
          } else {
            const s = body.session as Partial<Session> | undefined;
            if (!s || typeof s.code !== 'string' || typeof s.token !== 'string' || !['host', 'player'].includes(s.kind ?? '')) throw new GameError('Sesión inválida.');
            session = { code: s.code, token: s.token, kind: s.kind!, playerId: s.playerId };
            game.authorize(session);
          }
          data.session = session; game.presence(session, true);
        } else {
          if (!session) throw new GameError('Entra a una sala primero.');
          game.act(session, body.action, body.action === 'kick' ? body.playerId : body.action === 'district' ? body.district : body.prompt);
          if (body.action === 'kick') release(session.code);
        }
        reply({ ok: true, data: game.snapshot(session!) }); broadcast(session!.code);
      } catch (error) {
        reply({ ok: false, error: error instanceof GameError ? error.message : 'No se pudo completar la acción.' });
        // An action arriving at the deadline may close the room before failing.
        const session = (socket.data as Data).session;
        if (session && game.rooms.has(session.code)) broadcast(session.code);
      }
    });
    socket.on('disconnect', () => {
      const session = (socket.data as Data).session;
      if (!session) return;
      const stillOnline = [...io.sockets.sockets.values()].some(s => (s.data as Data).session?.token === session.token);
      try { game.presence(session, stillOnline); broadcast(session.code); } catch { /* Expired room. */ }
    });
  });
  const timer = setInterval(() => { for (const code of game.tick()) broadcast(code); game.cleanup(); }, 1000);
  timer.unref();
  return { game, stop: () => clearInterval(timer) };
}
