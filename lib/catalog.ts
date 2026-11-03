// Single source for roles, buildings and districts. Model ids match public/models/<id>.glb (scripts/fbx2glb.py).
type Hints = [question: string, template: string, example: { weak: string; strong: string }];
type RoleDef = { label: string; icon: string; building: string; upgrade: string; challenge: string; topic: RegExp; models: [string, string]; hints: Hints };
const role = (r: RoleDef) => r;
export const ROLES = {
  urbanista: role({ label: 'Urbanista', icon: '🏠', building: 'Viviendas', upgrade: 'Bloque de apartamentos', challenge: 'Diseña viviendas para una ciudad de 20 habitantes.', topic: /vivienda\w*|casas?\b|hogar\w*|residencia\w*|apartamento\w*/, models: ['city_residential_01', 'city_apartment_block'],
    hints: ['¿Quién diseñaría mejor un hogar: una arquitecta, un urbanista…? Empieza por ahí.', 'Actúa como [especialista]. Diseña viviendas para 20 habitantes con [límite y número]. Presenta [formato].', { weak: 'Quiero casas bonitas.', strong: 'Actúa como arquitecta. Diseña viviendas para 20 habitantes con un presupuesto máximo de 1000 créditos. Presenta la propuesta en una tabla, para vecinos y en lenguaje sencillo.' }] }),
  ingeniero: role({ label: 'Ingeniero', icon: '⚡', building: 'Subestación eléctrica', upgrade: 'Central eléctrica', challenge: 'Diseña una central de energía que abastezca a 20 habitantes.', topic: /central\w*|energia\w*|electric\w*|solar\w*|subestacion\w*/, models: ['industrial_wearhouse_02', 'industrial_power_plant'],
    hints: ['¿Qué especialista sabe de energía? Pídele que responda desde ese rol.', 'Actúa como [especialista]. Diseña una central de energía para 20 habitantes con [límite y número]. Responde en [formato].', { weak: 'Haz algo con energía.', strong: 'Actúa como ingeniera eléctrica. Diseña una central solar para 20 habitantes que no supere 50 paneles. Responde en una lista de pasos; debe incluir el consumo estimado.' }] }),
  ecologista: role({ label: 'Ecologista', icon: '🌱', building: 'Huerto comunitario', upgrade: 'Granja ecológica', challenge: 'Diseña un huerto comunitario para una ciudad de 20 habitantes.', topic: /jardin\w*|huert\w*|cultivo\w*|granja\w*/, models: ['farm_land_01', 'farm_house_01'],
    hints: ['¿Quién cuida mejor un huerto: una paisajista, un agrónomo…? Define ese rol.', 'Actúa como [especialista]. Diseña un huerto comunitario para 20 habitantes con [límite y número]. Entrega [formato].', { weak: 'Un huerto para la ciudad.', strong: 'Actúa como paisajista. Diseña un huerto comunitario para 20 habitantes con un límite de 30 plantas. Entrega una tabla de especies, dirigida a familias.' }] }),
  barista: role({ label: 'Barista', icon: '☕', building: 'Cafetería', upgrade: 'Bistró', challenge: 'Diseña una cafetería de barrio para 20 habitantes.', topic: /cafeteria\w*|cafe\b|bistro\w*/, models: ['city_joes_java', 'french_bistro'],
    hints: ['¿Quién conoce mejor una cafetería: una barista, un dueño de bistró…?', 'Actúa como [especialista]. Diseña una cafetería para 20 habitantes con [límite y número]. Presenta [formato].', { weak: 'Pon un café.', strong: 'Eres una barista con experiencia. Crea una cafetería para 20 habitantes con un menú de máximo 8 bebidas. Presenta una lista con precios para estudiantes.' }] }),
  cocinero: role({ label: 'Cocinero', icon: '🍔', building: 'Puesto de comida', upgrade: 'Restaurante', challenge: 'Diseña un restaurante para alimentar a 20 habitantes.', topic: /restaurante\w*|comida\w*|menu\w*|cocina\w*|puesto\w*/, models: ['city_wiener_world', 'city_burger_barn'],
    hints: ['¿Qué especialista sabe planificar un menú? Pídele que responda como tal.', 'Actúa como [especialista]. Diseña un restaurante para 20 habitantes con [límite y número]. Entrega [formato].', { weak: 'Algo de comer.', strong: 'Actúa como chef. Planifica un restaurante para 20 habitantes con un presupuesto máximo de 300 créditos por semana. Entrega el menú en una tabla; por ejemplo, un plato vegetariano al día.' }] }),
  veterinaria: role({ label: 'Veterinaria', icon: '🐾', building: 'Clínica de mascotas', upgrade: 'Centro veterinario', challenge: 'Diseña una clínica de mascotas para las familias de 20 habitantes.', topic: /clinica\w*|veterinari\w*|mascota\w*/, models: ['city_paws_n_claws', 'city_paws_n_claws'],
    hints: ['¿Quién sabe cuidar animales? Pide que responda una veterinaria.', 'Actúa como [especialista]. Diseña una clínica de mascotas para 20 habitantes con [límite y número]. Responde en [formato].', { weak: 'Un sitio para perros.', strong: 'Actúa como veterinaria. Diseña una clínica de mascotas para 20 habitantes con un máximo de 4 salas. Responde en una lista de pasos, dirigida a familias.' }] }),
  transporte: role({ label: 'Movilidad', icon: '🚇', building: 'Estación de metro', upgrade: 'Estación central', challenge: 'Diseña el transporte público para 20 habitantes.', topic: /metro\w*|estacion\w*|transporte\w*|tren\w*|autobus\w*/, models: ['city_subway', 'city_clock_tower'],
    hints: ['¿Quién planifica cómo se mueve una ciudad? Una experta en movilidad, por ejemplo.', 'Actúa como [especialista]. Diseña una estación de metro para 20 habitantes con [límite y número]. Presenta [formato].', { weak: 'Pon un metro.', strong: 'Actúa como experta en movilidad. Diseña una estación de metro para 20 habitantes con trenes cada 10 minutos como máximo. Presenta un esquema; debe incluir accesos para sillas de ruedas.' }] }),
  hotelero: role({ label: 'Hotelera', icon: '🛎️', building: 'Pensión', upgrade: 'Hotel', challenge: 'Diseña un alojamiento para visitantes de una ciudad de 20 habitantes.', topic: /hotel\w*|pension\w*|alojamiento\w*|hostal\w*/, models: ['french_tallhouse_02', 'city_hotel'],
    hints: ['¿Quién sabe recibir viajeros? Una hotelera con experiencia, por ejemplo.', 'Actúa como [especialista]. Diseña un hotel para 20 habitantes con [límite y número]. Presenta [formato].', { weak: 'Un hotel grande.', strong: 'Actúa como hotelera. Diseña un hotel pequeño para los visitantes de 20 habitantes con un límite de 12 habitaciones. Presenta una tabla de servicios, para turistas y en tono amable.' }] }),
};
export type Role = keyof typeof ROLES;
export const ALL_ROLES = Object.keys(ROLES) as Role[];

// District overrides swap a role's models; `names` keeps the building names in step with them.
// `garden` is the tree planted around built plots, `street` props line the road verges, `corner` sits at inner crossings, `decor` fills the island rim.
type DistrictDef = { label: string; description: string; roles: Role[]; models?: Partial<Record<Role, [string, string]>>; names?: Partial<Record<Role, [string, string]>>; ground: string; decor: string[]; garden: string; street: string[]; corner: string; landmarks: Landmark[] };
/** A district's signature model at its real size: on the west strip of the island (x ≈ -95) or at the plaza entrance (GATE). `grid` repeats it (fields), `pond` draws water under it. */
type Landmark = { model: string; at: [x: number, z: number]; rotation?: number; grid?: [cols: number, rows: number]; pond?: number };
const district = (d: DistrictDef) => d;
const WEST = -95, R = Math.PI / 2;
/** Just north of the plaza block (cell 5,3), on its verge facing the main road. */
const GATE: [number, number] = [44, 8];
export const DISTRICTS = {
  centro: district({ label: 'Centro', description: 'Todos los oficios en una ciudad moderna.', roles: ALL_ROLES, ground: '#62c23e', garden: 'city_tree', decor: ['city_tree', 'city_bench', 'city_tree', 'city_lamp_post'],
    street: ['city_lamp_post', 'city_bin', 'city_sign_01', 'city_post_box', 'city_lamp_post', 'city_sign_02'], corner: 'city_traffic_light',
    landmarks: [{ model: 'city_building_01', at: [WEST, -45], rotation: R }, { model: 'city_building_03', at: [WEST, -18], rotation: R }, { model: 'city_building_04', at: [WEST, 6], rotation: R }, { model: 'city_building_02', at: [WEST, 30], rotation: R }] }),
  tokio: district({ label: 'Little Tokyo', description: 'Casas tradicionales, faroles y jardines.', roles: ['urbanista', 'barista', 'cocinero', 'hotelero', 'transporte', 'ingeniero'],
    models: { urbanista: ['japanese_house_01', 'japanese_bilboard_building_01'], hotelero: ['japanese_house_02', 'city_hotel'], barista: ['city_joes_java', 'japanese_house_01'], cocinero: ['city_wiener_world', 'city_doodle_doos'] },
    names: { urbanista: ['Casa tradicional', 'Edificio de neón'], hotelero: ['Ryokan', 'Hotel'], barista: ['Cafetería', 'Casa de té'], cocinero: ['Puesto de comida', 'Yakitori'] }, ground: '#66c443',
    garden: 'japanese_garden_tree_02', decor: ['japanese_garden_tree_01', 'japanese_garden_tree_02', 'japanese_lanterns_01'], street: ['japanese_lanterns_02', 'city_lamp_post', 'japanese_lanterns_02', 'city_bin'], corner: 'japanese_lanterns_01',
    landmarks: [{ model: 'japanese_archway', at: GATE }, { model: 'japanese_bridge', at: [WEST, 30], pond: 7 }, { model: 'japanese_garden_tree_02', at: [WEST, -10] }, { model: 'japanese_garden_tree_01', at: [WEST, -40] }] }),
  paris: district({ label: 'Barrio parisino', description: 'Bistrós, casas altas y mercados.', roles: ['urbanista', 'barista', 'cocinero', 'hotelero', 'veterinaria', 'ecologista'],
    models: { urbanista: ['french_tallhouse_02', 'french_tallhouse_01'], cocinero: ['city_pancake_palooza', 'city_burger_barn'] }, names: { urbanista: ['Casa parisina', 'Edificio de balcones'], cocinero: ['Crepería', 'Restaurante'] }, ground: '#6dc247',
    garden: 'french_tree_03', decor: ['french_tree_01', 'french_tree_02', 'french_bushes_01', 'french_tree_03', 'french_tree_04', 'french_bushes_02'], street: ['city_lamp_post', 'french_plant_pot', 'french_bushes_03', 'city_bin', 'city_post_box'], corner: 'city_lamp_post',
    landmarks: [{ model: 'french_fruitstand', at: [WEST, -24], rotation: R }, { model: 'french_barbers_shop', at: [WEST, 18], rotation: R }, { model: 'french_plant_pot', at: [GATE[0] - 5, GATE[1]] }, { model: 'french_plant_pot', at: [GATE[0] + 5, GATE[1]] }] }),
  granja: district({ label: 'Granja', description: 'Huertos, animales y vida rural.', roles: ['ecologista', 'veterinaria', 'urbanista', 'cocinero', 'ingeniero'],
    models: { urbanista: ['city_residential_02', 'city_residential_03'], ingeniero: ['farm_silo', 'industrial_power_plant'], cocinero: ['city_doodle_doos', 'city_burger_barn'] },
    names: { urbanista: ['Casa de campo', 'Casa grande de campo'], ingeniero: ['Silo de biogás', 'Central eléctrica'], cocinero: ['Pollería', 'Restaurante'] }, ground: '#74c847',
    garden: 'farm_tree_01', decor: ['farm_tree_01', 'farm_fence_01', 'farm_tree_02', 'farm_fence_02'], street: ['farm_fence_02', 'city_sign_post', 'farm_fence_01'], corner: 'city_sign_post',
    landmarks: [{ model: 'farm_silo', at: [WEST, -35] }, { model: 'farm_land_01', at: [WEST, -6], grid: [4, 3] }, { model: 'farm_land_01', at: [WEST, 26], grid: [4, 4] }] }),
  industrial: district({ label: 'Industrial', description: 'Fábricas, energía y transporte.', roles: ['ingeniero', 'transporte', 'urbanista', 'cocinero', 'ecologista'],
    models: { ingeniero: ['industrial_wearhouse_01', 'industrial_power_plant'], cocinero: ['city_wiener_world', 'city_pancake_palooza'] }, names: { cocinero: ['Puesto de comida', 'Comedor'] }, ground: '#79bb52',
    garden: 'city_tree', decor: ['industrial_silos_01', 'industrial_silos_02', 'industrial_silos_03', 'city_tree', 'industrial_silos_04', 'industrial_silos_05'], street: ['city_road_cone', 'city_fence', 'city_sign_03', 'city_sign_04', 'city_bin', 'city_fence'], corner: 'city_traffic_light',
    landmarks: [{ model: 'industrial_factory_01', at: [WEST, -30] }, { model: 'industrial_plant_chimney_01', at: [WEST, 8] }, { model: 'industrial_plant_chimney_02', at: [WEST, 32] }] }),
};
export type District = keyof typeof DISTRICTS;
export const modelFor = (district: District, role: Role, tier: number) => (DISTRICTS[district].models?.[role] ?? ROLES[role].models)[tier >= 2 ? 1 : 0];
export const buildingName = (district: District, role: Role, tier: number) => DISTRICTS[district].names?.[role]?.[tier >= 2 ? 1 : 0] ?? (tier >= 2 ? ROLES[role].upgrade : ROLES[role].building);
/** Road tiles of the pack (22 units, asphalt at height 2.0): which openings each one has before rotation. */
/** This role's level-2 building (the 48 m power plant) does not fit a plot: it is built at real size on the city's reserved block. */
export const RESERVED: Role = 'ingeniero';
/** Small ground models drawn as an n × n patch when used as a building, so a vegetable garden fills its plot. */
export const PATCHES: Record<string, number> = { farm_land_01: 2 };
export const ROADS = { cross: 'city_road_03', tee: 'city_road_04', straight: 'city_road_02', corner: 'city_road_01', end: 'city_road_06', grass: 'city_road_05' };
export const FENCE = { panels: ['city_white_picket_fence_01', 'city_white_picket_fence_02', 'city_white_picket_fence_03'], post: 'city_white_picket_fence_04' };
export const AMBIENT = { cars: ['city_car', 'city_car_blue', 'city_car_orange', 'city_school_bus'], pigeons: ['city_pigeon', 'city_brown_pigeon'], animals: ['farm_cow', 'farm_pig', 'farm_sheep', 'farm_hen', 'farm_rooster'], plaza: ['city_fountain', 'city_lamp_post', 'city_hedge'], train: ['city_train', 'city_train_track', 'city_train_track_end'] };
/** Every model the scene can request; tests check each has a converted .glb. */
export const ALL_MODELS = [...new Set([...Object.values(ROLES).flatMap(r => r.models), ...Object.values(DISTRICTS).flatMap(d => [...Object.values(d.models ?? {}).flat(), ...d.decor, d.garden, ...d.street, d.corner, ...d.landmarks.map(l => l.model)]), ...Object.values(ROADS), ...FENCE.panels, FENCE.post, ...Object.values(AMBIENT).flat()])];
