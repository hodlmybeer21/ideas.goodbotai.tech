'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DrawingCanvas from './components/DrawingCanvas';
import StoryMachine from './components/StoryMachine';
import CodeBots from './components/CodeBots';
import AnimalMatch from './components/AnimalMatch';
import SoundLab from './components/SoundLab';
import MathLab from './components/MathLab';
import MadLibs from './components/MadLibs';
import EqualParts from './components/EqualParts';
import SyllableScooper from './components/SyllableScooper';
import ReadAlong from './components/ReadAlong';
import TellTime from './components/TellTime';
import IsTheRobotRight from './components/IsTheRobotRight';
import TrueFalse from './components/TrueFalse';
import SentenceBuilder from './components/SentenceBuilder';
import StateFinder from './components/StateFinder';
import PluralBuilder from './components/PluralBuilder';
import BasewordSorter from './components/BasewordSorter';
import PixelCanvas from './components/PixelCanvas';
import ColorLab from './components/ColorLab';
import TensOnesExplorer from './components/TensOnesExplorer';
import BossyRRacer from './components/BossyRRacer';
import CoinChallenge from './components/CoinChallenge';
import StoryQA from './components/StoryQA';
import SentenceFixer from './components/SentenceFixer';
import PlantLifeCycle from './components/PlantLifeCycle';
import BugCatcher from './components/BugCatcher';
import BunnyHop from './components/BunnyHop';
import PhotoFrameMaker from './components/PhotoFrameMaker';
import MirrorDraw from './components/MirrorDraw';
import NumberBingo from './components/NumberBingo';
import BeatComposer from './components/BeatComposer';
import DotsAndBoxes from './components/DotsAndBoxes';
import TwoDigitSprint from './components/TwoDigitSprint';
import BorrowBay from './components/BorrowBay';
import TimeToFive from './components/TimeToFive';
import EqualGroups from './components/EqualGroups';
import ContractionCoop from './components/ContractionCoop';
import CompoundForge from './components/CompoundForge';
import SkipCounter from './components/SkipCounter';
import SuffixSorter from './components/SuffixSorter';
import FeelingsMatch from './components/FeelingsMatch';
import FriendshipFixer from './components/FriendshipFixer';
import MoodWheel from './components/MoodWheel';
import ConversationStarters from './components/ConversationStarters';
import KindWordBingo from './components/KindWordBingo';
import ShapeSafari from './components/ShapeSafari';
import OddEvenOasis from './components/OddEvenOasis';
import CompareCastles from './components/CompareCastles';
import TimeTravel from './components/TimeTravel';
import TripleDigitTreasure from './components/TripleDigitTreasure';
import ArrayArchitect from './components/ArrayArchitect';
import HundredsHideSeek from './components/HundredsHideSeek';
import PrefixPals from './components/PrefixPals';
import PluralPuzzlers from './components/PluralPuzzlers';
import ContextClueCove from './components/ContextClueCove';
import CommaCrew from './components/CommaCrew';
import ConjunctionJunction from './components/ConjunctionJunction';
import PoetryPark from './components/PoetryPark';
import EarthExplorer from './components/EarthExplorer';
import MatterMixer from './components/MatterMixer';
import WordProblemWoods from './components/WordProblemWoods';
import MeasureMe from './components/MeasureMe';
import PlaceValuePirates from './components/PlaceValuePirates';
import GraphGarden from './components/GraphGarden';
import PlusMinus10And100 from './components/PlusMinus10And100';
import AdjectiveAdventure from './components/AdjectiveAdventure';
import VerbVault from './components/VerbVault';
import SymmetrySafari from './components/SymmetrySafari';
import MapSkills from './components/MapSkills';
import FiveSensesLab from './components/FiveSensesLab';
import CommunityHelpers from './components/CommunityHelpers';
import Tetris from './components/Tetris';
import Wordle from './components/Wordle';
import TicTacToe from './components/TicTacToe';
import Game2048 from './components/Game2048';
import Threes from './components/Threes';
import Match3 from './components/Match3';
import StackTower from './components/StackTower';
import FlappyBird from './components/FlappyBird';

type Track = 'g1' | 'g2' | 'feelings' | 'games';
type View =
  | 'home' | 'draw' | 'story' | 'match' | 'sound' | 'math' | 'madlib' | 'readalong' | 'time'
  | 'robot' | 'truefalse' | 'sentence' | 'equal' | 'syllable' | 'codebots' | 'statefinder'
  | 'pixelstudio' | 'colorlab' | 'tensones' | 'bossyr' | 'coin' | 'storyqa' | 'sentfix'
  | 'plantcycle' | 'pluralbuilder' | 'basewordsorter' | 'bugcatcher' | 'bunnyhop'
  | 'photoframe' | 'mirrordraw' | 'numberbingo' | 'beatcomposer' | 'dotsandboxes'
  | 'twodigit' | 'borrowbay' | 'timeto5'
  | 'equalgroups' | 'contraction' | 'compound' | 'skipcount' | 'suffixsort'
  | 'feelingsmatch' | 'friendfixer' | 'moodwheel' | 'convstarters' | 'kindwordbingo'
  | 'shapesafari' | 'oddeven' | 'comparecastles' | 'timetravel' | 'tripledigit'
  | 'arrayarchitect' | 'hundreds' | 'prefixpals' | 'pluralpuzzlers' | 'contextcluecove'
  | 'commacrew' | 'conjunctionjunction' | 'poetrypark' | 'earthexplorer' | 'mattermixer'
  | 'wordproblemwoods' | 'measureme' | 'placevaluepirates' | 'graphgarden' | 'plusminus10and100'
  | 'adjectiveadventure' | 'verbvault' | 'symmetrysafari' | 'mapskills' | 'fivesenseslab'
  | 'communityhelpers'
  | 'tictactoe'
  | 'game2048'
  | 'threes'
  | 'match3'
  | 'stacktower'
  | 'flappybird'
  | 'tetris'
  | 'wordle'
  | 'dashboard';

export default function Home() {
  const [view, setView] = useState<View>('home');
  const [kidName, setKidName] = useState('');
  const [isWelcomed, setIsWelcomed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  // Default to Grade 1 so existing users / younger siblings keep their games visible on first load.
  const [activeTrack, setActiveTrack] = useState<Track>('g1');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('goodbotkids_name');
      if (saved) {
        setKidName(saved);
        setIsWelcomed(true);
      }
      // Migrate from the old goodbotkids_grade key (kept until 2026-08-29 refactor).
      const oldGrade = localStorage.getItem('goodbotkids_grade');
      if (oldGrade) {
        const migrated: Track = oldGrade === '2' ? 'g2' : 'g1';
        localStorage.setItem('goodbotkids_track', migrated);
        localStorage.removeItem('goodbotkids_grade');
        setActiveTrack(migrated);
      } else {
        const newTrack = localStorage.getItem('goodbotkids_track');
        if (newTrack === 'g2' || newTrack === 'feelings') setActiveTrack(newTrack);
      }
    } catch {}
  }, []);

  const handleWelcome = (name: string) => {
    try { localStorage.setItem('goodbotkids_name', name); } catch {}
    setKidName(name);
    setIsWelcomed(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  };

  const handleNameReset = () => {
    try { localStorage.removeItem('goodbotkids_name'); } catch {}
    setKidName('');
    setIsWelcomed(false);
  };

  if (!isWelcomed) {
    return <WelcomeScreen onEnter={handleWelcome} />;
  }

  if (showConfetti) {
    <Confetti />;
  }

  return (
    <>
      {showConfetti && <Confetti />}
      <header className="app-header">
        <div className="app-logo">
          <span>🤖</span>
          <span>GoodBot Kids</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="app-greeting">Hi, {kidName}! 👋</span>
          <button onClick={handleNameReset} style={{ fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
            Change name
          </button>
          <Link href="/dashboard" className="parent-link">👨‍👩‍👧 Parent</Link>
        </div>
      </header>

      <main className="app-main">
        {view === 'home' && (
          <HomeScreen
            setView={setView}
            kidName={kidName}
            activeTrack={activeTrack}
            onTrackChange={setActiveTrack}
          />
        )}
        {view === 'draw' && <DrawingCanvas onBack={() => setView('home')} kidName={kidName} />}
        {view === 'story' && <StoryMachine kidName={kidName} onBack={() => setView('home')} />}
        {view === 'match' && <AnimalMatch onBack={() => setView('home')} kidName={kidName} />}
        {view === 'sound' && <SoundLab onBack={() => setView('home')} kidName={kidName} />}
        {view === 'math' && <MathLab onBack={() => setView('home')} kidName={kidName} />}
        {view === 'madlib' && <MadLibs onBack={() => setView('home')} kidName={kidName} />}
        {view === 'readalong' && <ReadAlong onBack={() => setView('home')} kidName={kidName} />}
        {view === 'time' && <TellTime onBack={() => setView('home')} kidName={kidName} />}
        {view === 'robot' && <IsTheRobotRight onBack={() => setView('home')} kidName={kidName} />}
        {view === 'truefalse' && <TrueFalse onBack={() => setView('home')} kidName={kidName} />}
        {view === 'sentence' && <SentenceBuilder onBack={() => setView('home')} kidName={kidName} />}
        {view === 'equal' && <EqualParts />}
        {view === 'syllable' && <SyllableScooper />}
        {view === 'codebots' && <CodeBots onBack={() => setView('home')} kidName={kidName} />}
        {view === 'statefinder' && <StateFinder onBack={() => setView('home')} kidName={kidName} />}
        {view === 'pixelstudio' && <PixelCanvas onBack={() => setView('home')} />}
        {view === 'colorlab' && <ColorLab onBack={() => setView('home')} />}
        {view === 'tensones' && <TensOnesExplorer onBack={() => setView('home')} />}
        {view === 'bossyr' && <BossyRRacer onBack={() => setView('home')} />}
        {view === 'coin' && <CoinChallenge onBack={() => setView('home')} />}
        {view === 'storyqa' && <StoryQA onBack={() => setView('home')} />}
        {view === 'sentfix' && <SentenceFixer onBack={() => setView('home')} />}
        {view === 'plantcycle' && <PlantLifeCycle onBack={() => setView('home')} />}
        {view === 'pluralbuilder' && <PluralBuilder onBack={() => setView('home')} kidName={kidName} />}
        {view === 'basewordsorter' && <BasewordSorter onBack={() => setView('home')} kidName={kidName} />}
        {view === 'bugcatcher' && <BugCatcher onBack={() => setView('home')} kidName={kidName} />}
        {view === 'bunnyhop' && <BunnyHop onBack={() => setView('home')} kidName={kidName} />}
        {view === 'photoframe' && <PhotoFrameMaker onBack={() => setView('home')} kidName={kidName} />}
        {view === 'mirrordraw' && <MirrorDraw onBack={() => setView('home')} kidName={kidName} />}
        {view === 'numberbingo' && <NumberBingo onBack={() => setView('home')} kidName={kidName} />}
        {view === 'beatcomposer' && <BeatComposer onBack={() => setView('home')} kidName={kidName} />}
        {view === 'dotsandboxes' && <DotsAndBoxes onBack={() => setView('home')} kidName={kidName} />}
        {view === 'twodigit' && <TwoDigitSprint onBack={() => setView('home')} kidName={kidName} />}
        {view === 'borrowbay' && <BorrowBay onBack={() => setView('home')} kidName={kidName} />}
        {view === 'timeto5' && <TimeToFive onBack={() => setView('home')} kidName={kidName} />}
        {view === 'equalgroups' && <EqualGroups onBack={() => setView('home')} kidName={kidName} />}
        {view === 'contraction' && <ContractionCoop onBack={() => setView('home')} kidName={kidName} />}
        {view === 'compound' && <CompoundForge onBack={() => setView('home')} kidName={kidName} />}
        {view === 'skipcount' && <SkipCounter onBack={() => setView('home')} kidName={kidName} />}
        {view === 'suffixsort' && <SuffixSorter onBack={() => setView('home')} kidName={kidName} />}
        {view === 'feelingsmatch' && <FeelingsMatch onBack={() => setView('home')} kidName={kidName} />}
        {view === 'friendfixer' && <FriendshipFixer onBack={() => setView('home')} kidName={kidName} />}
        {view === 'moodwheel' && <MoodWheel onBack={() => setView('home')} kidName={kidName} />}
        {view === 'convstarters' && <ConversationStarters onBack={() => setView('home')} kidName={kidName} />}
        {view === 'kindwordbingo' && <KindWordBingo onBack={() => setView('home')} kidName={kidName} />}
        {view === 'shapesafari' && <ShapeSafari onBack={() => setView('home')} kidName={kidName} />}
        {view === 'oddeven' && <OddEvenOasis onBack={() => setView('home')} kidName={kidName} />}
        {view === 'comparecastles' && <CompareCastles onBack={() => setView('home')} kidName={kidName} />}
        {view === 'timetravel' && <TimeTravel onBack={() => setView('home')} kidName={kidName} />}
        {view === 'tripledigit' && <TripleDigitTreasure onBack={() => setView('home')} kidName={kidName} />}
        {view === 'arrayarchitect' && <ArrayArchitect onBack={() => setView('home')} kidName={kidName} />}
        {view === 'hundreds' && <HundredsHideSeek onBack={() => setView('home')} kidName={kidName} />}
        {view === 'prefixpals' && <PrefixPals onBack={() => setView('home')} kidName={kidName} />}
        {view === 'pluralpuzzlers' && <PluralPuzzlers onBack={() => setView('home')} kidName={kidName} />}
        {view === 'contextcluecove' && <ContextClueCove onBack={() => setView('home')} kidName={kidName} />}
        {view === 'commacrew' && <CommaCrew onBack={() => setView('home')} kidName={kidName} />}
        {view === 'conjunctionjunction' && <ConjunctionJunction onBack={() => setView('home')} kidName={kidName} />}
        {view === 'poetrypark' && <PoetryPark onBack={() => setView('home')} kidName={kidName} />}
        {view === 'earthexplorer' && <EarthExplorer onBack={() => setView('home')} kidName={kidName} />}
        {view === 'mattermixer' && <MatterMixer onBack={() => setView('home')} kidName={kidName} />}
        {view === 'tictactoe' && <TicTacToe onBack={() => setView('home')} kidName={kidName} />}
        {view === 'game2048' && <Game2048 onBack={() => setView('home')} kidName={kidName} />}
        {view === 'threes' && <Threes onBack={() => setView('home')} kidName={kidName} />}
        {view === 'match3' && <Match3 onBack={() => setView('home')} kidName={kidName} />}
        {view === 'stacktower' && <StackTower onBack={() => setView('home')} kidName={kidName} />}
        {view === 'flappybird' && <FlappyBird onBack={() => setView('home')} kidName={kidName} />}
        {view === 'tetris' && <Tetris onBack={() => setView('home')} kidName={kidName} />}
        {view === 'wordle' && <Wordle onBack={() => setView('home')} kidName={kidName} />}
        {view === 'wordproblemwoods' && <WordProblemWoods onBack={() => setView('home')} kidName={kidName} />}
        {view === 'measureme' && <MeasureMe onBack={() => setView('home')} kidName={kidName} />}
        {view === 'placevaluepirates' && <PlaceValuePirates onBack={() => setView('home')} kidName={kidName} />}
        {view === 'graphgarden' && <GraphGarden onBack={() => setView('home')} kidName={kidName} />}
        {view === 'plusminus10and100' && <PlusMinus10And100 onBack={() => setView('home')} kidName={kidName} />}
        {view === 'adjectiveadventure' && <AdjectiveAdventure onBack={() => setView('home')} kidName={kidName} />}
        {view === 'verbvault' && <VerbVault onBack={() => setView('home')} kidName={kidName} />}
        {view === 'symmetrysafari' && <SymmetrySafari onBack={() => setView('home')} kidName={kidName} />}
        {view === 'mapskills' && <MapSkills onBack={() => setView('home')} kidName={kidName} />}
        {view === 'fivesenseslab' && <FiveSensesLab onBack={() => setView('home')} kidName={kidName} />}
        {view === 'communityhelpers' && <CommunityHelpers onBack={() => setView('home')} kidName={kidName} />}
      </main>
    </>
  );
}

function WelcomeScreen({ onEnter }: { onEnter: (name: string) => void }) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 2) onEnter(name.trim());
  };

  const emojis = ['🌈', '🚀', '🦄', '⭐', '🎨', '🎮', '🐱', '🐶', '🦊', '🐸'];

  return (
    <div className="welcome-overlay slide-up">
      <div className="welcome-mascot">🤖</div>
      <h1 className="welcome-title">Welcome to GoodBot Kids!</h1>
      <p className="welcome-subtitle">What should I call you?</p>
      <form className="welcome-form" onSubmit={handleSubmit}>
        <input
          className="welcome-input"
          type="text"
          placeholder="Your name..."
          value={name}
          onChange={e => setName(e.target.value)}
          maxLength={20}
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={name.trim().length < 2}>
          Let's go! →
        </button>
      </form>
      <div style={{ display: 'flex', gap: 12, fontSize: 32, opacity: 0.6 }}>
        {emojis.map(e => <span key={e}>{e}</span>)}
      </div>
    </div>
  );
}

interface Activity {
  id: View;
  icon: string;
  name: string;
  desc: string;
  color: 'pink' | 'yellow' | 'blue' | 'green' | 'purple' | 'orange' | 'indigo';
  track: Track;
}

const ACTIVITIES: Activity[] = [
  // 1st Grade (existing 32)
  { id: 'draw', icon: '🎨', name: 'Magic Canvas', desc: 'Draw anything you imagine!', color: 'pink', track: 'g1' },
  { id: 'story', icon: '📖', name: 'Story Machine', desc: 'Your very own bedtime story', color: 'purple', track: 'g1' },
  { id: 'match', icon: '🧩', name: 'Animal Match', desc: 'Find the matching pairs!', color: 'yellow', track: 'g1' },
  { id: 'sound', icon: '🎵', name: 'Sound Lab', desc: 'Play instruments and make music!', color: 'orange', track: 'g1' },
  { id: 'math', icon: '🧮', name: 'Math Lab', desc: 'Learn math with fun games!', color: 'pink', track: 'g1' },
  { id: 'madlib', icon: '📝', name: 'Mad Libs', desc: 'Fill in the blanks for silly stories!', color: 'yellow', track: 'g1' },
  { id: 'readalong', icon: '📖', name: 'Read Along', desc: 'Slide across words to read!', color: 'purple', track: 'g1' },
  { id: 'time', icon: '🕐', name: 'Tell Time', desc: 'Learn to read the clock!', color: 'blue', track: 'g1' },
  { id: 'robot', icon: '🤖', name: 'Is the Robot Right?', desc: 'Is the robot correct or silly?', color: 'purple', track: 'g1' },
  { id: 'truefalse', icon: '✅❌', name: 'True or False?', desc: 'Is the statement true or false?', color: 'green', track: 'g1' },
  { id: 'sentence', icon: '📝', name: 'Sentence Builder', desc: 'Fill in the missing word!', color: 'yellow', track: 'g1' },
  { id: 'equal', icon: '🔴', name: 'Equal Parts', desc: 'Learn about halves and quarters!', color: 'purple', track: 'g1' },
  { id: 'syllable', icon: '🔤', name: 'Syllable Scooper', desc: 'Practice breaking words into syllables!', color: 'indigo', track: 'g1' },
  { id: 'codebots', icon: '🤖', name: 'CodeBots', desc: 'Program your robot to reach the star!', color: 'blue', track: 'g1' },
  { id: 'statefinder', icon: '🗺️', name: 'State Finder', desc: 'Learn the US map one region at a time!', color: 'green', track: 'g1' },
  { id: 'pixelstudio', icon: '🎨', name: 'Pixel Studio', desc: 'Color pixel art templates and make masterpieces!', color: 'pink', track: 'g1' },
  { id: 'colorlab', icon: '🧪', name: 'Color Lab', desc: 'Mix primary colors and discover new ones!', color: 'blue', track: 'g1' },
  { id: 'tensones', icon: '🔢', name: 'Tens & Ones', desc: 'Explore place value with base-10 blocks!', color: 'pink', track: 'g1' },
  { id: 'bossyr', icon: '🏎️', name: 'Bossy R Racer', desc: 'Master bossy R words with a race!', color: 'orange', track: 'g1' },
  { id: 'coin', icon: '💰', name: 'Coin Challenge', desc: 'Count coins and make change!', color: 'yellow', track: 'g1' },
  { id: 'storyqa', icon: '📚', name: 'Story Q&A', desc: 'Read stories and answer questions!', color: 'purple', track: 'g1' },
  { id: 'sentfix', icon: '🔧', name: 'Sentence Fixer', desc: 'Find and fix mistakes in sentences!', color: 'green', track: 'g1' },
  { id: 'plantcycle', icon: '🌱', name: 'Plant Life Cycle', desc: 'Watch a seed grow into a plant!', color: 'green', track: 'g1' },
  { id: 'pluralbuilder', icon: '📝', name: 'Plural Builder', desc: 'Pick the right suffix -s or -es!', color: 'indigo', track: 'g1' },
  { id: 'basewordsorter', icon: '🗂️', name: 'Baseword Sorter', desc: 'Sort words into the right bucket!', color: 'blue', track: 'g1' },
  { id: 'bugcatcher', icon: '🐛', name: 'Bug Catcher', desc: 'Catch the right sight-word firefly!', color: 'blue', track: 'g1' },
  { id: 'bunnyhop', icon: '🐰', name: 'Bunny Hop Counting', desc: 'Hop the bunny to the target number!', color: 'orange', track: 'g1' },
  { id: 'photoframe', icon: '🖼️', name: 'Photo Frame Maker', desc: 'Draw, name, and frame your art!', color: 'purple', track: 'g1' },
  { id: 'mirrordraw', icon: '🪞', name: 'Mirror Draw', desc: 'Trace shapes by mirroring your strokes!', color: 'blue', track: 'g1' },
  { id: 'numberbingo', icon: '🎯', name: 'Number Bingo', desc: 'Listen, match, and call BINGO!', color: 'green', track: 'g1' },
  { id: 'beatcomposer', icon: '🎵', name: 'Beat Composer', desc: 'Build your own beats and songs!', color: 'orange', track: 'g1' },
  // 2nd Grade — added for back-to-school 2026
  { id: 'twodigit', icon: '🏃', name: 'Two-Digit Sprint', desc: 'Add big numbers with carrying!', color: 'pink', track: 'g2' },
  { id: 'borrowbay', icon: '🏴‍☠️', name: 'Borrow Bay', desc: 'Subtract and borrow pirate gold!', color: 'orange', track: 'g2' },
  { id: 'timeto5', icon: '⏰', name: 'Time to 5', desc: 'Read clocks to the nearest 5 minutes!', color: 'blue', track: 'g2' },
  { id: 'equalgroups', icon: '🍪', name: 'Equal Groups', desc: 'Count cookie trays and find missing factors!', color: 'pink', track: 'g2' },
  { id: 'contraction', icon: '🤝', name: 'Contraction Co-op', desc: 'Pair up words with an apostrophe!', color: 'purple', track: 'g2' },
  { id: 'compound', icon: '⚒️', name: 'Compound Forge', desc: 'Hammer two words into a compound!', color: 'orange', track: 'g2' },
  { id: 'skipcount', icon: '🔢', name: 'Skip Counter', desc: 'Count by 5s, 10s, and 25s!', color: 'blue', track: 'g2' },
  { id: 'suffixsort', icon: '✏️', name: 'Suffix Sorter', desc: 'Match the right suffix to the sentence!', color: 'purple', track: 'g2' },
  // Feelings track — added 2026-08-29 (social-emotional learning, separate from academics)
  { id: 'feelingsmatch', icon: '🤝', name: 'Feelings Match', desc: 'Read the situation, pick the feeling!', color: 'pink', track: 'feelings' },
  { id: 'friendfixer', icon: '🌟', name: 'Friendship Fixer', desc: 'Pick the kindest response to tricky moments!', color: 'pink', track: 'feelings' },
  { id: 'moodwheel', icon: '😊', name: 'Mood Wheel', desc: 'Spin a wheel of feelings + coping cards!', color: 'yellow', track: 'feelings' },
  { id: 'convstarters', icon: '🗣️', name: 'Conversation Starters', desc: 'Try out different ways to start a chat!', color: 'purple', track: 'feelings' },
  { id: 'kindwordbingo', icon: '💬', name: 'Kind Word Bingo', desc: 'Find kind acts on a card — solo or 2-player!', color: 'green', track: 'feelings' },
  // 2nd Grade — back-to-school 2026 expansion
  { id: 'shapesafari', icon: '🦒', name: 'Shape Safari', desc: 'Spot shapes in the savanna!', color: 'green', track: 'g2' },
  { id: 'oddeven', icon: '🐫', name: 'Odd-Even Oasis', desc: 'Sort camels into odd or even pairs!', color: 'orange', track: 'g2' },
  { id: 'comparecastles', icon: '🏰', name: 'Compare Castles', desc: 'Which castle wins the bigger number?', color: 'purple', track: 'g2' },
  { id: 'timetravel', icon: '⏳', name: 'Time Travel', desc: 'Pilot the clock through time jumps!', color: 'blue', track: 'g2' },
  { id: 'tripledigit', icon: '💎', name: 'Triple-Digit Treasure', desc: 'Add up a pile of pirate gold!', color: 'pink', track: 'g2' },
  { id: 'arrayarchitect', icon: '�️', name: 'Array Architect', desc: 'Build rectangles from rows of bricks!', color: 'orange', track: 'g2' },
  { id: 'hundreds', icon: '🔍', name: 'Hundreds Hide & Seek', desc: 'Count to find hiding animals!', color: 'purple', track: 'g2' },
  { id: 'prefixpals', icon: '🔑', name: 'Prefix Pals', desc: 'Crack the prefix code!', color: 'blue', track: 'g2' },
  { id: 'pluralpuzzlers', icon: '🧩', name: 'Plural Puzzlers', desc: 'Pick the right plural — even the tricky ones!', color: 'green', track: 'g2' },
  { id: 'contextcluecove', icon: '🔎', name: 'Context Clue Cove', desc: 'Read the sentence, find the meaning!', color: 'purple', track: 'g2' },
  { id: 'commacrew', icon: '✉️', name: 'Comma Crew', desc: 'Mail letters with commas in the right spots!', color: 'pink', track: 'g2' },
  { id: 'conjunctionjunction', icon: '🚂', name: 'Conjunction Junction', desc: 'Couple sentences with and, but, or, so, because!', color: 'blue', track: 'g2' },
  { id: 'poetrypark', icon: '🎭', name: 'Poetry Park', desc: 'Rhymes, rhythm, and poem types!', color: 'purple', track: 'g2' },
  // Cross-curricular science + social studies (2026-08-29 back-to-school)
  { id: 'earthexplorer', icon: '🌍', name: 'Earth Explorer', desc: 'Continents, oceans, and landforms!', color: 'green', track: 'g2' },
  { id: 'mattermixer', icon: '🧪', name: 'Matter Mixer', desc: 'Solids, liquids, gases + state changes!', color: 'purple', track: 'g2' },
  // 2nd Grade expansion — back-to-school 2026 (math + ELA + cross-curricular)
  { id: 'wordproblemwoods', icon: '🌲', name: 'Word Problem Woods', desc: 'Solve real-life math stories!', color: 'green', track: 'g2' },
  { id: 'measureme', icon: '📏', name: 'Measure Me', desc: 'Lengths in inches, cm, paper clips!', color: 'blue', track: 'g2' },
  { id: 'placevaluepirates', icon: '🏴‍☠️', name: 'Place Value Pirates', desc: 'Hundreds, tens, ones — count to 1000!', color: 'purple', track: 'g2' },
  { id: 'graphgarden', icon: '📊', name: 'Graph Garden', desc: 'Read & make bar graphs!', color: 'orange', track: 'g2' },
  { id: 'plusminus10and100', icon: '🚀', name: 'Plus/Minus 10 and 100', desc: 'Mental math fluency!', color: 'purple', track: 'g2' },
  { id: 'adjectiveadventure', icon: '✍️', name: 'Adjective Adventure', desc: 'Describing words for any noun!', color: 'orange', track: 'g2' },
  { id: 'verbvault', icon: '🕰️', name: 'Verb Vault', desc: 'Past tense of irregular verbs!', color: 'purple', track: 'g2' },
  { id: 'symmetrysafari', icon: '🦋', name: 'Symmetry Safari', desc: 'Lines of symmetry on shapes!', color: 'pink', track: 'g2' },
  { id: 'mapskills', icon: '🗺️', name: 'Map Skills', desc: 'Compass rose and grid maps!', color: 'blue', track: 'g2' },
  { id: 'fivesenseslab', icon: '👁️', name: 'Five Senses Lab', desc: 'Body science with senses!', color: 'green', track: 'g2' },
  { id: 'communityhelpers', icon: '👮', name: 'Community Helpers', desc: 'Who to call for what!', color: 'blue', track: 'g2' },
  // Games (pure games, cross-grade)
  { id: 'dotsandboxes', icon: '📦', name: 'Dots & Boxes', desc: 'Draw lines, claim boxes, win!', color: 'blue', track: 'games' },
  { id: 'tictactoe', icon: '⭕', name: 'Tic Tac Toe', desc: 'X vs O — three in a row wins!', color: 'orange', track: 'games' },
  { id: 'game2048', icon: '🔢', name: '2048', desc: 'Swipe to combine matching tiles!', color: 'orange', track: 'games' },
  { id: 'threes', icon: '🎲', name: 'Threes', desc: '1+1=2, 2+2=4, 3+3=6 — keep doubling!', color: 'blue', track: 'games' },
  { id: 'match3', icon: '🍬', name: 'Match-3', desc: 'Swap candies to make 3 in a row!', color: 'pink', track: 'games' },
  { id: 'stacktower', icon: '🏗️', name: 'Stack Tower', desc: 'Time your tap to stack blocks high!', color: 'orange', track: 'games' },
  { id: 'flappybird', icon: '🐦', name: 'Flappy Bird', desc: 'Tap to flap, dodge the pipes!', color: 'blue', track: 'games' },
  { id: 'tetris', icon: '🧱', name: 'Tetris', desc: 'Stack blocks, clear lines!', color: 'blue', track: 'games' },
  { id: 'wordle', icon: '🟩', name: 'Wordle', desc: 'Guess the 4-letter word!', color: 'green', track: 'games' },
];

// Maps each 2nd Grade game to its subject category for sub-tab filtering.
const G2_SUBJECT_MAP: Record<string, 'math' | 'ela' | 'science'> = {
  // Math (18)
  twodigit: 'math', borrowbay: 'math', timeto5: 'math',
  equalgroups: 'math', skipcount: 'math',
  shapesafari: 'math', oddeven: 'math', comparecastles: 'math',
  timetravel: 'math', tripledigit: 'math', arrayarchitect: 'math',
  hundreds: 'math', wordproblemwoods: 'math', measureme: 'math',
  placevaluepirates: 'math', graphgarden: 'math', plusminus10and100: 'math',
  symmetrysafari: 'math',
  // ELA (11)
  contraction: 'ela', compound: 'ela', suffixsort: 'ela',
  prefixpals: 'ela', pluralpuzzlers: 'ela', contextcluecove: 'ela',
  commacrew: 'ela', conjunctionjunction: 'ela', poetrypark: 'ela',
  adjectiveadventure: 'ela', verbvault: 'ela',
  // Science / Social Studies (5)
  earthexplorer: 'science', mattermixer: 'science',
  mapskills: 'science', fivesenseslab: 'science', communityhelpers: 'science',
};

// Maps each 1st Grade game to its subject for sub-tab filtering.
const G1_SUBJECT_MAP: Record<string, 'reading' | 'math' | 'creative'> = {
  // Reading / ELA (3)
  pluralbuilder: 'reading', basewordsorter: 'reading', bugcatcher: 'reading',
  // Math (2)
  bunnyhop: 'math', numberbingo: 'math',
  // Creative (3)
  photoframe: 'creative', mirrordraw: 'creative', beatcomposer: 'creative',
};

function TrackTabs({
  active, onChange, counts,
}: {
  active: Track; onChange: (t: Track) => void;
  counts: { g1: number; g2: number; feelings: number; games: number };
}) {
  const tabBase: React.CSSProperties = {
    flex: 1,
    fontSize: 14,
    padding: '11px 10px',
    border: 'none',
    borderRadius: 14,
    cursor: 'pointer',
    fontFamily: 'Fredoka, sans-serif',
    fontWeight: 600,
    transition: 'transform 0.1s, background 0.2s, color 0.2s',
    whiteSpace: 'nowrap',
  };
  return (
    <div
      role="tablist"
      aria-label="Activity track"
      style={{
        display: 'flex',
        gap: 6,
        marginBottom: 18,
        background: 'white',
        padding: 6,
        borderRadius: 18,
        boxShadow: 'var(--shadow)',
        border: '3px solid #E5E0D8',
      }}
    >
      <button
        role="tab"
        aria-selected={active === 'g1'}
        onClick={() => { onChange('g1'); try { localStorage.setItem('goodbotkids_track', 'g1'); } catch {} }}
        className={`activity-card ${active === 'g1' ? 'green' : ''}`}
        style={{
          ...tabBase,
          background: active === 'g1' ? 'var(--accent-green)' : 'transparent',
          color: active === 'g1' ? 'white' : 'var(--text-medium)',
          boxShadow: active === 'g1' ? '0 4px 0 #3D8B47' : 'none',
          opacity: active === 'g1' ? 1 : 0.85,
        }}
      >
        🟢 1st <span style={{ fontSize: 12, opacity: 0.85 }}>({counts.g1})</span>
      </button>
      <button
        role="tab"
        aria-selected={active === 'g2'}
        onClick={() => { onChange('g2'); try { localStorage.setItem('goodbotkids_track', 'g2'); } catch {} }}
        className={`activity-card ${active === 'g2' ? 'blue' : ''}`}
        style={{
          ...tabBase,
          background: active === 'g2' ? 'var(--accent-blue)' : 'transparent',
          color: active === 'g2' ? 'white' : 'var(--text-medium)',
          boxShadow: active === 'g2' ? '0 4px 0 #2299CC' : 'none',
          opacity: active === 'g2' ? 1 : 0.85,
        }}
      >
        🔵 2nd <span style={{ fontSize: 12, opacity: 0.85 }}>({counts.g2})</span>
      </button>
      <button
        role="tab"
        aria-selected={active === 'feelings'}
        onClick={() => { onChange('feelings'); try { localStorage.setItem('goodbotkids_track', 'feelings'); } catch {} }}
        className={`activity-card ${active === 'feelings' ? 'yellow' : ''}`}
        style={{
          ...tabBase,
          background: active === 'feelings' ? 'var(--accent-yellow)' : 'transparent',
          color: active === 'feelings' ? 'var(--text-dark)' : 'var(--text-medium)',
          boxShadow: active === 'feelings' ? '0 4px 0 #CC9900' : 'none',
          opacity: active === 'feelings' ? 1 : 0.85,
        }}
      >
        🌈 Feelings <span style={{ fontSize: 12, opacity: 0.85 }}>({counts.feelings})</span>
      </button>
      <button
        role="tab"
        aria-selected={active === 'games'}
        onClick={() => { onChange('games'); try { localStorage.setItem('goodbotkids_track', 'games'); } catch {} }}
        className={`activity-card ${active === 'games' ? 'pink' : ''}`}
        style={{
          ...tabBase,
          background: active === 'games' ? 'var(--accent-pink)' : 'transparent',
          color: active === 'games' ? 'white' : 'var(--text-medium)',
          boxShadow: active === 'games' ? '0 4px 0 #FF6B9D' : 'none',
          opacity: active === 'games' ? 1 : 0.85,
        }}
      >
        🎮 Games <span style={{ fontSize: 12, opacity: 0.85 }}>({counts.games})</span>
      </button>
    </div>
  );
}

interface SubjectTab {
  id: string | null;
  label: string;
  emoji: string;
  color: string;
  shadow: string;
  count: number;
}

function SubjectTabs({
  tabs, active, onChange,
}: {
  tabs: SubjectTab[];
  active: string | null;
  onChange: (id: string | null) => void;
}) {
  const tabBase: React.CSSProperties = {
    flex: 1,
    fontSize: 13,
    padding: '9px 6px',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontFamily: 'Fredoka, sans-serif',
    fontWeight: 600,
    transition: 'transform 0.1s, background 0.2s, color 0.2s',
    whiteSpace: 'nowrap',
  };
  return (
    <div
      role="tablist"
      aria-label="Subject filter"
      style={{
        display: 'flex',
        gap: 6,
        marginBottom: 16,
        background: 'white',
        padding: 5,
        borderRadius: 16,
        boxShadow: 'var(--shadow)',
        border: '2px solid #E5E0D8',
      }}
    >
      {tabs.map(tab => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id ?? 'all'}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className="activity-card"
            style={{
              ...tabBase,
              background: isActive ? tab.color : 'transparent',
              color: isActive ? 'white' : 'var(--text-medium)',
              boxShadow: isActive ? tab.shadow : 'none',
              opacity: isActive ? 1 : 0.85,
            }}
          >
            <span style={{ marginRight: 4 }}>{tab.emoji}</span>
            {tab.label} <span style={{ fontSize: 12, opacity: 0.85 }}>({tab.count})</span>
          </button>
        );
      })}
    </div>
  );
}

function HomeScreen({
  setView, kidName, activeTrack, onTrackChange,
}: {
  setView: (v: View) => void;
  kidName: string;
  activeTrack: Track;
  onTrackChange: (t: Track) => void;
}) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const counts = {
    g1: ACTIVITIES.filter(a => a.track === 'g1').length,
    g2: ACTIVITIES.filter(a => a.track === 'g2').length,
    feelings: ACTIVITIES.filter(a => a.track === 'feelings').length,
    games: ACTIVITIES.filter(a => a.track === 'games').length,
  };

  // Subject filter for the grade-tab sub-tabs. null = show every subject.
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  useEffect(() => {
    if (activeTrack !== 'g2' && activeTrack !== 'g1') setActiveSubject(null);
  }, [activeTrack]);

  // Counts for the active track's subjects.
  const subjectCounts: Record<string, number> = activeTrack === 'g2'
    ? {
        math: ACTIVITIES.filter(a => a.track === 'g2' && G2_SUBJECT_MAP[a.id] === 'math').length,
        ela: ACTIVITIES.filter(a => a.track === 'g2' && G2_SUBJECT_MAP[a.id] === 'ela').length,
        science: ACTIVITIES.filter(a => a.track === 'g2' && G2_SUBJECT_MAP[a.id] === 'science').length,
      }
    : activeTrack === 'g1'
    ? {
        reading: ACTIVITIES.filter(a => a.track === 'g1' && G1_SUBJECT_MAP[a.id] === 'reading').length,
        math: ACTIVITIES.filter(a => a.track === 'g1' && G1_SUBJECT_MAP[a.id] === 'math').length,
        creative: ACTIVITIES.filter(a => a.track === 'g1' && G1_SUBJECT_MAP[a.id] === 'creative').length,
      }
    : {};

  // Build the sub-tab list for the active grade track.
  const subjectTabs: SubjectTab[] = activeTrack === 'g2'
    ? [
        { id: null,     label: 'All',      emoji: '🎯', color: 'var(--accent-orange)', shadow: '0 4px 0 #CC9900' },
        { id: 'math',    label: 'Math',     emoji: '🔢', color: 'var(--accent-blue)',   shadow: '0 4px 0 #2299CC' },
        { id: 'ela',     label: 'Reading',  emoji: '📖', color: 'var(--accent-purple)', shadow: '0 4px 0 #8B5CF6' },
        { id: 'science', label: 'Science',  emoji: '🌍', color: 'var(--accent-green)',  shadow: '0 4px 0 #3D8B47' },
      ].map(t => ({ ...t, count: subjectCounts[t.id ?? '_'] ?? 0 }))
    : activeTrack === 'g1'
    ? [
        { id: null,       label: 'All',       emoji: '🎯', color: 'var(--accent-orange)', shadow: '0 4px 0 #CC9900' },
        { id: 'reading',   label: 'Reading',   emoji: '📖', color: 'var(--accent-purple)', shadow: '0 4px 0 #8B5CF6' },
        { id: 'math',      label: 'Math',      emoji: '🔢', color: 'var(--accent-blue)',   shadow: '0 4px 0 #2299CC' },
        { id: 'creative',  label: 'Creative',  emoji: '🎨', color: 'var(--accent-pink)',   shadow: '0 4px 0 #FF6B9D' },
      ].map(t => ({ ...t, count: subjectCounts[t.id ?? '_'] ?? 0 }))
    : [];

  // Build the visible cards list based on track + subject filter.
  const visible = activeTrack === 'g1' && activeSubject
    ? ACTIVITIES.filter(a => a.track === 'g1' && G1_SUBJECT_MAP[a.id] === activeSubject)
    : activeTrack === 'g2' && activeSubject
    ? ACTIVITIES.filter(a => a.track === 'g2' && G2_SUBJECT_MAP[a.id] === activeSubject)
    : ACTIVITIES.filter(a => a.track === activeTrack);

  return (
    <div className="slide-up">
      <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent-pink)' }}>
        {greeting}, {kidName}! 👋
      </h2>
      <p style={{ fontSize: 16, color: 'var(--text-medium)', marginTop: 4, marginBottom: 12 }}>
        What would you like to do today?
      </p>

      <TrackTabs active={activeTrack} onChange={onTrackChange} counts={counts} />

      {(activeTrack === 'g2' || activeTrack === 'g1') && subjectTabs.length > 0 && (
        <SubjectTabs
          tabs={subjectTabs}
          active={activeSubject}
          onChange={setActiveSubject}
        />
      )}

      <div className="activity-grid">
        {visible.map(a => (
          <button
            key={a.id}
            className={`activity-card ${a.color}`}
            onClick={() => setView(a.id)}
            data-track={a.track}
          >
            <span className="activity-icon">{a.icon}</span>
            <span className="activity-name">{a.name}</span>
            <span className="activity-desc">{a.desc}</span>
            {a.track === 'g2' && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: 'var(--accent-blue)', color: 'white',
                padding: '3px 10px', borderRadius: 999, marginTop: 4,
              }}>NEW · 2nd</span>
            )}
            {a.track === 'feelings' && (
              <span style={{
                fontSize: 11, fontWeight: 700,
                background: 'var(--accent-yellow)', color: 'var(--text-dark)',
                padding: '3px 10px', borderRadius: 999, marginTop: 4,
              }}>NEW · Feelings</span>
            )}
          </button>
        ))}
      </div>

      {activeTrack === 'g1' && counts.g2 > 0 && (
        <div style={{
          textAlign: 'center', marginTop: 28,
          padding: 16, background: 'white',
          borderRadius: 16, border: '2px dashed var(--accent-blue)',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-medium)', margin: 0 }}>
            🆕 Ready for a challenge? Try{' '}
            <button
              onClick={() => onTrackChange('g2')}
              style={{
                background: 'none', border: 'none',
                color: 'var(--accent-blue)', fontWeight: 700,
                cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit',
              }}
            >
              2nd Grade games
            </button>
            , or warm up with{' '}
            <button
              onClick={() => onTrackChange('feelings')}
              style={{
                background: 'none', border: 'none',
                color: '#CC9900', fontWeight: 700,
                cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit',
              }}
            >
              Feelings games
            </button>!
          </p>
        </div>
      )}

      {activeTrack === 'g2' && counts.feelings > 0 && (
        <div style={{
          textAlign: 'center', marginTop: 28,
          padding: 16, background: 'white',
          borderRadius: 16, border: '2px dashed var(--accent-yellow)',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-medium)', margin: 0 }}>
            💛 Need a break? Try{' '}
            <button
              onClick={() => onTrackChange('feelings')}
              style={{
                background: 'none', border: 'none',
                color: '#CC9900', fontWeight: 700,
                cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit',
              }}
            >
              Feelings games
            </button>!
          </p>
        </div>
      )}

      {activeTrack === 'feelings' && (counts.g1 > 0 || counts.g2 > 0) && (
        <div style={{
          textAlign: 'center', marginTop: 28,
          padding: 16, background: 'white',
          borderRadius: 16, border: '2px dashed #E5E0D8',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-medium)', margin: 0 }}>
            🧠 Want a brain-stretch?{' '}
            <button
              onClick={() => onTrackChange('g1')}
              style={{
                background: 'none', border: 'none',
                color: '#3D8B47', fontWeight: 700,
                cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit',
              }}
            >
              Grade 1 games
            </button>
            {' '}or{' '}
            <button
              onClick={() => onTrackChange('g2')}
              style={{
                background: 'none', border: 'none',
                color: 'var(--accent-blue)', fontWeight: 700,
                cursor: 'pointer', textDecoration: 'underline', padding: 0, fontFamily: 'inherit',
              }}
            >
              Grade 2 games
            </button>
            {' '}are still here.
          </p>
        </div>
      )}
    </div>
  );
}

function Confetti() {
  const colors = ['#FF6B9D', '#FFD93D', '#6BCBFF', '#6BCB77', '#C084FC', '#FF9F43'];
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    color: colors[Math.floor(Math.random() * colors.length)],
    delay: `${Math.random() * 2}s`,
    size: Math.random() * 8 + 8,
  }));

  return (
    <div className="confetti-container">
      {pieces.map(p => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            background: p.color,
            animationDelay: p.delay,
            width: p.size,
            height: p.size * 2,
            borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}