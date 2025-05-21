import PuzzleGame from './components/PuzzleGame';
import { type PuzzleConfig } from './types/puzzle';
import styles from './App.module.css';


const gameConfig: PuzzleConfig = {
  gridSize: 3,
  imageUrl: '/test.jpg', 
  boardSize: 300,
  playAreaWidth: 800,
  playAreaHeight: 600,
  snapTolerance: 30,
};

function App() {

  return (
    <div className={styles['app-root']}>
      <PuzzleGame config={gameConfig} />
    </div>
  )
}

export default App
