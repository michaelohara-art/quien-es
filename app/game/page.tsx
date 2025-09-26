import { Suspense } from 'react';
import UserDetails from 'Common/user-details';
import GameView from './game';
import Loading from 'Common/loading';

export default async function Game() {
  return (
    <div className="container">
      <Suspense fallback={<Loading />}>
        <UserDetails />
        <GameView />
      </Suspense>
    </div>
  );
}
