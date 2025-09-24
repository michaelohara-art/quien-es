'use client';

import { useEffect, useState } from "react";
import { useSearchParams, redirect } from "next/navigation";
import { UUID } from "crypto";
import clsx from 'clsx';
import { Game, Panel } from "Data/entities";
import { fetchGame, updateHostSeen } from "Data/data";
import Loading from "Common/loading";

export default function GameView() {
    // Could set up a wrapper around all these pages that does this validation once.
    const params = useSearchParams();

    const userName = params.get('name') as string;
    if (!userName)
        redirect(`/sign-in`);

    const gameId = params.get('id') as UUID;
    if (!gameId)
        redirect(`/lobby?name=${userName}`);

    const [game, setGame] = useState({} as Game);

    useEffect(() => {
        let shouldClear = false;
        (async () => {
            const intervalId = setInterval(async () => {
                if (shouldClear) clearInterval(intervalId);

                const fetchedGame = await fetchGame(gameId);
                setGame(fetchedGame);

                // If the user is the host, confirm they are still here.
                if (userName === fetchedGame.host) {
                    await updateHostSeen(fetchedGame.id);
                }

            }, 3500);
        })();
        return () => { shouldClear = true; };
    }, []);

    function onPanelSelect(panel: Panel) {
        if (panel.owner && panel.owner != userName)
            console.log('you win');
        else
            console.log('you do not win.');
    }

    // TODO early return if opponent offline
    // And if host leaves.

    // players select at any time, but get only one
    // game notes the other player has selected when only one selection has been made
    // highlights each selected panel when both are selected
    // notes player correctness
    // provides next button

    return (
        <div>
            <div>{game.host} VS {game.opponent}</div>
            <div className="panel-container">
                {game.panels
                    ? game.panels.map((panel, idx) => {
                        return <div
                            key={idx}
                            className={clsx('panel', { 'is-mine': panel.owner === userName })}
                            onClick={() => onPanelSelect(panel)}
                        >
                            {panel.imgurl}
                        </div>
                    })
                    : <Loading />
                }
            </div>
        </div>
    );
}