import { randomBytes, randomUUID } from 'node:crypto';
import { ROLES, DISTRICTS, STAGES, EVENTS, CONTRIBUTION, MAX_PLAYERS, type Role, type Player, type Attempt, type Insights, type RoomState, type Session, type Snapshot } from './types';
import { evaluate } from './rubric';
import { buildingName } from './catalog';
export { evaluate } from './rubric';

type Draft = { prompt: string; evaluation: ReturnType<typeof evaluate>; attempts: Attempt[]; first: ReturnType<typeof evaluate> };
type Room = Omit<RoomState, 'serverNow'> & { hostToken: string; tokens: Map<string, string>; drafts: Map<string, Draft>; startedAt: number | null; touchedAt: number;
  /** Goal set when the current mission opened; the live goal only shrinks from it. */ eventGoal: number;
  /** Names of the run of joins merged into the latest log line. */ joined: string[] };
export class GameError extends Error {}
function assert(condition: unknown, message: string): asserts condition { if (!condition) throw new GameError(message); }
const token = () => randomBytes(24).toString('hex');
const SESSION = 30 * 60_000, MAX_SESSION = 60 * 60_000, MAX_ATTEMPTS = 10, LOG_SIZE = 50;
export class Game {
  rooms = new Map<string, Room>();
  create(now = Date.now()): Session {
    this.cleanup(now);
    assert(this.rooms.size < 200, 'El servidor está lleno. Intenta más tarde.');
    let code: string;
    do { code = randomBytes(3).toString('hex').toUpperCase(); } while (this.rooms.has(code));
    const hostToken = token();
    this.rooms.set(code, { code, hostToken, phase: 'lobby', district: 'centro', stage: 0, endsAt: null, startedAt: null, players: [], tokens: new Map(), drafts: new Map(), event: { index: 0, active: false, progress: 0, goal: 0, completed: 0 }, log: ['La ciudad está lista para recibir habitantes.'], touchedAt: now, eventGoal: 0, joined: [] });
    return { code, token: hostToken, kind: 'host' };
  }
  get(code: string): Room { const room = this.rooms.get(code); assert(room, 'La sala no existe o expiró.'); return room; }
  join(code: string, name: string, role: Role): Session {
    const room = this.get(code);
    assert(room.phase === 'lobby', 'La sesión ya comenzó.');
    assert(room.players.length < MAX_PLAYERS, `La ciudad ya tiene sus ${MAX_PLAYERS} habitantes.`);
    assert(name.length >= 2 && name.length <= 24, 'Usa un nombre de 2 a 24 caracteres.');
    assert(Object.hasOwn(ROLES, role), 'Selecciona un rol válido.');
    assert(DISTRICTS[room.district].roles.includes(role), `Ese rol no está disponible en ${DISTRICTS[room.district].label}.`);
    assert(!room.players.some(p => p.name.toLocaleLowerCase() === name.toLocaleLowerCase()), 'Ese nombre ya está en la sala.');
    const id = randomUUID(), secret = token();
    let plot = 0; while (room.players.some(p => p.plot === plot)) plot++;
    room.players.push({ id, name, role, plot, connected: false, credits: 20, score: 0, bonus: 0, attempts: 0, tier: 0, building: null, contributed: false });
    room.players.sort((a, b) => a.plot - b.plot);
    room.tokens.set(secret, id); room.touchedAt = Date.now();
    this.logJoin(room, name);
    return { code, token: secret, kind: 'player', playerId: id };
  }
  authorize(session: Session): { room: Room; player?: Player } {
    const room = this.get(session.code);
    if (session.kind === 'host') { assert(session.token === room.hostToken, 'Credencial inválida.'); return { room }; }
    const id = room.tokens.get(session.token);
    assert(id && id === session.playerId, 'Credencial inválida.');
    return { room, player: room.players.find(p => p.id === id)! };
  }
  snapshot(session: Session): Snapshot {
    const { room, player } = this.authorize(session);
    const draft = player ? room.drafts.get(player.id) : undefined;
    return { session, room: { code: room.code, phase: room.phase, district: room.district, stage: room.stage, endsAt: room.endsAt, players: room.players.map(p => ({ ...p })), event: { ...room.event }, log: [...room.log], serverNow: Date.now() }, prompt: draft?.prompt ?? '', evaluation: draft?.evaluation ?? null, attempts: draft?.attempts.map(a => ({ ...a })) ?? [], ...(session.kind === 'host' ? { insights: this.insights(room) } : {}) };
  }
  /** Aggregated learning data for the host: criteria and scores only, never prompt text. */
  insights(room: Room): Insights {
    const drafts = room.players.map(p => room.drafts.get(p.id)).filter((d): d is Draft => !!d);
    const average = (values: number[]) => values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length * 10) / 10 : 0;
    const labels = drafts[0]?.evaluation.checks.map(c => c.label) ?? evaluate('', 'urbanista').checks.map(c => c.label);
    return {
      criteria: labels.map((label, i) => ({ label, first: drafts.filter(d => d.first.checks[i].passed).length, passed: drafts.filter(d => d.evaluation.checks[i].passed).length })),
      scores: [0, 1, 2, 3, 4].map(score => room.players.filter(p => p.attempts && p.score === score).length),
      attempts: drafts.reduce((sum, d) => sum + d.attempts.length, 0),
      stuck: room.players.filter(p => p.attempts >= 3 && p.score < 3).map(p => p.name),
      firstAverage: average(drafts.map(d => d.first.score)), lastAverage: average(drafts.map(d => d.evaluation.score)),
    };
  }
  presence(session: Session, connected: boolean) { const { room, player } = this.authorize(session); if (player) player.connected = connected; room.touchedAt = Date.now(); this.refreshEvent(room); }
  act(session: Session, action: string, payload?: unknown, now = Date.now()) {
    const { room, player } = this.authorize(session);
    if (room.phase === 'playing' && room.endsAt! <= now) { room.phase = 'finished'; this.log(room, '¡Tiempo! La ciudad termina su primera jornada.'); }
    room.touchedAt = now;
    if (['start', 'event', 'finish', 'stage', 'extend', 'kick', 'district'].includes(action)) {
      assert(session.kind === 'host', 'Solo el presentador puede realizar esta acción.');
      if (action === 'start') {
        assert(room.phase === 'lobby' && room.players.length > 0, 'Necesitas al menos un jugador en el lobby.');
        room.phase = 'playing'; room.startedAt = now; room.endsAt = now + SESSION; this.log(room, '¡Comienza la construcción! Tienen 30 minutos.');
      } else if (action === 'district') {
        assert(room.phase === 'lobby' && room.players.length === 0, 'El distrito se elige antes de que entre el primer jugador.');
        assert(typeof payload === 'string' && Object.hasOwn(DISTRICTS, payload), 'Selecciona un distrito válido.');
        room.district = payload as keyof typeof DISTRICTS; this.log(room, `La isla será: ${DISTRICTS[room.district].label}.`);
      } else if (action === 'stage') {
        assert(room.phase !== 'finished', 'La sesión ya terminó.');
        assert(room.stage < STAGES.length - 1, 'Ya están en la última fase.');
        room.stage++; this.log(room, `Fase ${room.stage + 1}: ${STAGES[room.stage].label}.`);
      } else if (action === 'extend') {
        assert(room.phase === 'playing', 'La sesión no está en curso.');
        assert(room.endsAt! + 5 * 60_000 - room.startedAt! <= MAX_SESSION, 'La sesión no puede superar 60 minutos.');
        room.endsAt! += 5 * 60_000; this.log(room, 'El presentador añadió 5 minutos.');
      } else if (action === 'kick') {
        const target = room.players.find(p => p.id === payload);
        assert(target, 'Ese jugador ya no está en la sala.');
        assert(room.phase !== 'finished', 'La sesión ya terminó.');
        room.players = room.players.filter(p => p !== target); room.drafts.delete(target.id);
        for (const [secret, id] of room.tokens) if (id === target.id) room.tokens.delete(secret);
        this.log(room, `La parcela ${target.plot + 1} quedó libre.`);
        this.refreshEvent(room);
      } else if (action === 'event') {
        assert(room.phase === 'playing', 'Inicia la sesión primero.');
        const { event } = room;
        if (event.active && event.progress < event.goal) return;
        if (event.active) { assert(event.index < EVENTS.length - 1, 'La ciudad ya completó todos los eventos.'); event.index++; }
        // Everyone online who can still pay counts towards the goal, so nobody is left out.
        const able = room.players.filter(p => p.connected && p.credits >= CONTRIBUTION).length;
        Object.assign(event, { active: true, progress: 0, goal: Math.max(1, able) * CONTRIBUTION }); room.eventGoal = event.goal;
        for (const p of room.players) p.contributed = false;
        this.log(room, `Evento: ${EVENTS[event.index].title.toLowerCase()}. Meta: ${event.goal} créditos, un aporte por habitante.`);
      } else { assert(room.phase === 'playing', 'La sesión no está en curso.'); room.phase = 'finished'; this.log(room, 'El presentador cerró la sesión.'); }
      return;
    }
    assert(player && session.kind === 'player', 'Esta acción requiere un jugador.');
    assert(room.phase === 'playing', 'La sesión no está en curso.');
    if (action === 'submit') {
      assert(typeof payload === 'string' && payload.trim().length >= 20 && payload.length <= 2000, 'Escribe un prompt de 20 a 2000 caracteres.');
      const evaluation = evaluate(payload, player.role), draft = room.drafts.get(player.id);
      const attempts = [...(draft?.attempts ?? []), { prompt: payload, score: evaluation.score, bonus: evaluation.bonus, at: now }].slice(-MAX_ATTEMPTS);
      room.drafts.set(player.id, { prompt: payload, evaluation, attempts, first: draft?.first ?? evaluation });
      // After building, new attempts only chase the advanced criteria; the unlocking score stays.
      if (!player.building) player.score = evaluation.score;
      if (evaluation.score >= 3) player.bonus = Math.max(player.bonus, evaluation.bonus);
      player.attempts++;
    } else if (action === 'build') {
      if (player.building) return;
      assert(player.score >= 3, 'Necesitas al menos 3 de 4 criterios para construir.');
      assert(player.credits >= 10, 'Necesitas 10 créditos.');
      player.credits -= 10; player.tier = 1; player.building = buildingName(room.district, player.role, 1);
      this.log(room, `${player.name} construyó: ${player.building}.`);
    } else if (action === 'upgrade') {
      if (player.tier >= 2) return;
      const latest = room.drafts.get(player.id)?.evaluation;
      assert(player.building, 'Construye primero tu edificio.');
      assert(latest && latest.score === 4 && latest.bonus >= 1, 'Para mejorar necesitas un prompt de 4/4 con al menos una estrella.');
      player.tier = 2; player.building = buildingName(room.district, player.role, 2);
      this.log(room, `${player.name} mejoró su edificio: ${player.building}.`);
    } else if (action === 'contribute') {
      const { event } = room;
      assert(event.active, 'El evento aún no está abierto.');
      if (player.contributed || event.progress >= event.goal) return;
      assert(player.credits >= CONTRIBUTION, `Necesitas ${CONTRIBUTION} créditos.`);
      player.credits -= CONTRIBUTION; player.contributed = true; event.progress += CONTRIBUTION;
      if (event.progress >= event.goal) this.completeEvent(room);
      else this.log(room, `${player.name} aportó ${CONTRIBUTION} créditos: ${EVENTS[event.index].title.toLowerCase()}.`);
    } else throw new GameError('Acción desconocida.');
  }
  tick(now = Date.now()): string[] {
    const changed: string[] = [];
    for (const room of this.rooms.values()) if (room.phase === 'playing' && room.endsAt! <= now) { room.phase = 'finished'; this.log(room, '¡Tiempo! La ciudad termina su primera jornada.'); changed.push(room.code); }
    return changed;
  }
  cleanup(now = Date.now()) { for (const [code, room] of this.rooms) if (now - room.touchedAt > 2 * 60 * 60_000) this.rooms.delete(code); }
  private log(room: Room, message: string) { room.joined = []; room.log = [message, ...room.log].slice(0, LOG_SIZE); }
  /** Consecutive joins share one line («Ana, Beto y 5 más se unieron…»), so a full lobby does not flood the activity. */
  private logJoin(room: Room, name: string) {
    const run = [name, ...room.joined], [last, prev] = run;
    const message = run.length === 1 ? `${last} se unió a la ciudad.` : run.length === 2 ? `${last} y ${prev} se unieron a la ciudad.` : `${last}, ${prev} y ${run.length - 2} más se unieron a la ciudad.`;
    room.log = [message, ...room.log.slice(room.joined.length ? 1 : 0)].slice(0, LOG_SIZE);
    room.joined = run;
  }
  /** Shrinks the open mission's goal to what the people still online can give, so a disconnection never blocks it. */
  private refreshEvent(room: Room) {
    const { event } = room;
    if (!event.active || event.completed > event.index) return;
    const pending = room.players.filter(p => p.connected && !p.contributed && p.credits >= CONTRIBUTION).length;
    event.goal = Math.max(CONTRIBUTION, Math.min(room.eventGoal, event.progress + pending * CONTRIBUTION));
    if (event.progress >= event.goal) this.completeEvent(room);
  }
  private completeEvent(room: Room) {
    room.event.completed = room.event.index + 1;
    this.log(room, `${EVENTS[room.event.index].done} La ciudad logró la meta colectiva.`);
  }
}
