import UserDetails from 'Common/user-details';
import GameView from './game';

export default async function Game() {
  return (
    <div className="container">
      <UserDetails />
      <GameView />
    </div>
  );
}
