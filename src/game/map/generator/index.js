// MapGeneratorの機能統合
import './generators/ArenaMapGenerator';
import './generators/DungeonMapGenerator';
import './generators/EntityPlacementGenerator';
import './generators/FieldMapGenerator';
import './generators/ObjectPlacementGenerator';
import './generators/TownMapGenerator';

// ベースのMapGeneratorをエクスポート
import MapGenerator from './MapGenerator';
export default MapGenerator;